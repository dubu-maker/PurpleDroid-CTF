from __future__ import annotations

import re
import time
from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, Optional, Set

from .commands import COMMANDS
from .filesystem import VirtualFS
from .http import VirtualHTTP
from .limits import (
    MAX_COMMAND_SECONDS,
    check_input_limit,
    check_stage_limit,
    truncate_output,
)
from .parser import parse_command_line


@dataclass
class ShellContext:
    env: Dict[str, str] = field(default_factory=dict)
    cwd: str = "/"
    data: Dict[str, Any] = field(default_factory=dict)
    fs: Optional[VirtualFS] = None
    http: Optional[VirtualHTTP] = None
    allowed: Set[str] = field(default_factory=set)


class FakeShell:
    def __init__(
        self,
        fs_tree: Optional[Dict] = None,
        http_routes: Optional[Dict[str, Any]] = None,
        allowed: Optional[Iterable[str]] = None,
    ):
        self.fs = VirtualFS(fs_tree or {"/": {}})
        self.http = VirtualHTTP(http_routes or {})
        self.allowed = set(allowed or COMMANDS.keys())

    def _run_stage(self, tokens: list[str], stdin: str, ctx: ShellContext) -> tuple[str, str, int]:
        if not tokens:
            return "", "", 0
        cmd = tokens[0]
        args = tokens[1:]
        if cmd not in ctx.allowed:
            return "", f"command not allowed: {cmd}", 126
        runner = COMMANDS.get(cmd)
        if not runner:
            return "", f"command not found: {cmd}", 127
        started = time.monotonic()
        stdout, stderr, code = runner(args, stdin, ctx)
        elapsed = time.monotonic() - started
        if elapsed > MAX_COMMAND_SECONDS:
            return "", f"command timeout: {cmd}", 124
        return stdout or "", stderr or "", int(code)

    def _execute_simple_for_loop(self, command: str, ctx: ShellContext) -> tuple[str, str, int] | None:
        m = re.match(
            r"^\s*for\s+([A-Za-z_]\w*)\s+in\s+\$\(\s*seq\s+(-?\d+)\s+(-?\d+)\s*\)\s*;\s*do\s+(.+?)\s*;\s*done\s*$",
            command or "",
            flags=re.DOTALL,
        )
        if not m:
            return None

        var_name, start_s, end_s, body = m.groups()
        start = int(start_s)
        end = int(end_s)
        step = 1 if end >= start else -1

        out_chunks: list[str] = []
        err_chunks: list[str] = []
        last_code = 0

        i = start
        while (i <= end and step > 0) or (i >= end and step < 0):
            rendered = body.replace(f"${{{var_name}}}", str(i)).replace(f"${var_name}", str(i))
            stdout, stderr, code = self.execute(rendered, ctx)
            if stdout:
                out_chunks.append(stdout)
            if stderr:
                err_chunks.append(stderr)
            last_code = code
            i += step

        safe_stdout, _ = truncate_output("".join(out_chunks))
        safe_stderr, _ = truncate_output("".join(err_chunks))
        return safe_stdout, safe_stderr, last_code

    def execute(self, command: str, ctx: Optional[ShellContext] = None) -> tuple[str, str, int]:
        ctx = ctx or ShellContext()
        ctx.fs = ctx.fs or self.fs
        ctx.http = ctx.http or self.http
        ctx.allowed = set(ctx.allowed or self.allowed)
        ctx.data["_shell_exec"] = self.execute

        try:
            check_input_limit(command or "")
            loop_result = self._execute_simple_for_loop(command or "", ctx)
            if loop_result is not None:
                return loop_result
            chains = parse_command_line(command or "")
            stage_count = sum(len(pipeline) for pipeline in chains)
            check_stage_limit(stage_count)
        except ValueError as exc:
            return "", str(exc), 1

        if not chains:
            return "", "", 0

        last_stdout = ""
        last_stderr = ""
        last_code = 0

        for pipeline in chains:
            stdin = ""
            pipe_stdout = ""
            pipe_stderr = ""
            pipe_code = 0
            for stage in pipeline:
                pipe_stdout, pipe_stderr, pipe_code = self._run_stage(stage, stdin, ctx)
                if pipe_code != 0:
                    break
                stdin = pipe_stdout

            last_stdout, last_stderr, last_code = pipe_stdout, pipe_stderr, pipe_code
            if pipe_code != 0:
                break

        safe_stdout, _ = truncate_output(last_stdout)
        safe_stderr, _ = truncate_output(last_stderr)
        return safe_stdout, safe_stderr, last_code
