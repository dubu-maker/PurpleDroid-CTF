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
        raw_cmd = tokens[0]
        cmd = raw_cmd
        if raw_cmd.lower().endswith(".exe"):
            cmd = raw_cmd[:-4]
        args = tokens[1:]
        if cmd not in ctx.allowed:
            return "", f"command not allowed: {raw_cmd}", 126
        runner = COMMANDS.get(cmd)
        if not runner:
            return "", f"command not found: {raw_cmd}", 127
        started = time.monotonic()
        stdout, stderr, code = runner(args, stdin, ctx)
        elapsed = time.monotonic() - started
        if elapsed > MAX_COMMAND_SECONDS:
            return "", f"command timeout: {cmd}", 124
        return stdout or "", stderr or "", int(code)

    def _execute_simple_for_loop(self, command: str, ctx: ShellContext) -> tuple[str, str, int] | None:
        text = command or ""
        values: list[str] | None = None
        m = re.match(
            r"^\s*for\s+([A-Za-z_]\w*)\s+in\s+\$\(\s*seq\s+(-?\d+)\s+(-?\d+)(?:\s+(-?\d+))?\s*\)\s*;\s*do\s+(.+?)\s*;\s*done\s*$",
            text,
            flags=re.DOTALL,
        )
        if m:
            var_name, start_s, end_s, step_s, body = m.groups()
            start = int(start_s)
            end = int(end_s)
            step = int(step_s) if step_s is not None else (1 if end >= start else -1)
            if step == 0:
                return "", "for: seq step must not be 0", 1

            values = []
            i = start
            while (i <= end and step > 0) or (i >= end and step < 0):
                values.append(str(i))
                i += step
        else:
            m = re.match(
                r"^\s*for\s+([A-Za-z_]\w*)\s+in\s+\{\s*(-?\d+)\s*\.\.\s*(-?\d+)\s*\}\s*;\s*do\s+(.+?)\s*;\s*done\s*$",
                text,
                flags=re.DOTALL,
            )
            if m:
                var_name, start_s, end_s, body = m.groups()
                start = int(start_s)
                end = int(end_s)
                step = 1 if end >= start else -1
                values = [str(i) for i in range(start, end + step, step)]
            else:
                m = re.match(
                    r"^\s*for\s+([A-Za-z_]\w*)\s+in\s+([-A-Za-z0-9_.:@/]+(?:\s+[-A-Za-z0-9_.:@/]+)*)\s*;\s*do\s+(.+?)\s*;\s*done\s*$",
                    text,
                    flags=re.DOTALL,
                )
                if not m:
                    return None
                var_name, raw_values, body = m.groups()
                values = raw_values.split()

        if re.search(r"\\\s", body):
            return (
                "",
                "for 본문에 줄 연속(\\) 문법이 있어. Mission Console은 한 줄 입력만 지원해. "
                "역슬래시와 줄바꿈을 제거하고 curl 명령 하나를 이어서 입력해.",
                2,
            )

        try:
            body_chains = parse_command_line(body)
        except ValueError as exc:
            return "", str(exc), 1

        if len(body_chains) != 1:
            return (
                "",
                "for 본문에는 반복할 명령 하나만 넣어줘. 진행 표시용 echo는 빼고 curl 요청만 남기면 돼.",
                2,
            )

        embedded_commands: list[str] = []
        for pipeline in body_chains:
            for stage in pipeline:
                for token in stage[1:]:
                    candidate = token[:-4] if token.lower().endswith(".exe") else token
                    if candidate in ctx.allowed:
                        embedded_commands.append(token)
        if embedded_commands:
            return (
                "",
                "for 본문에서 구분자 없이 이어진 추가 명령을 찾았어: "
                + ", ".join(embedded_commands)
                + ". Mission Console에서는 진행 표시용 echo를 빼고 반복할 curl 하나만 남겨줘.",
                2,
            )

        out_chunks: list[str] = []
        err_chunks: list[str] = []
        last_code = 0

        for value in values:
            rendered = body.replace(f"${{{var_name}}}", value).replace(f"${var_name}", value)
            stdout, stderr, code = self.execute(rendered, ctx)
            if stdout:
                out_chunks.append(stdout if stdout.endswith("\n") else stdout + "\n")
            if stderr:
                err_chunks.append(stderr if stderr.endswith("\n") else stderr + "\n")
            last_code = code

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
            if re.match(r"^\s*for\b", command or ""):
                return (
                    "",
                    "지원하지 않는 for 문법이야. Mission Console은 한 줄 반복만 지원해. "
                    "형식: for item in value1 value2; do <item을 사용하는 명령 하나>; done",
                    2,
                )
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
