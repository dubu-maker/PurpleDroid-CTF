from __future__ import annotations

import shlex
from typing import Any, List, Tuple


def run_seq(args: list[str], _stdin: str, _ctx: Any) -> Tuple[str, str, int]:
    if not args:
        return "", "seq: start end [step] required", 1

    try:
        if len(args) == 1:
            start = 1
            end = int(args[0])
            step = 1
        elif len(args) == 2:
            start = int(args[0])
            end = int(args[1])
            step = 1 if end >= start else -1
        else:
            start = int(args[0])
            end = int(args[1])
            step = int(args[2])
    except ValueError:
        return "", "seq: numeric arguments required", 1

    if step == 0:
        return "", "seq: step must not be 0", 1

    values: List[str] = []
    if step > 0:
        i = start
        while i <= end:
            values.append(str(i))
            i += step
    else:
        i = start
        while i >= end:
            values.append(str(i))
            i += step

    out = "\n".join(values)
    if out:
        out += "\n"
    return out, "", 0


def run_xargs(args: list[str], stdin: str, ctx: Any) -> Tuple[str, str, int]:
    if not stdin.strip():
        return "", "xargs: stdin required", 1
    if not args:
        return "", "xargs: command required", 1

    placeholder = "{}"
    i = 0
    while i < len(args):
        if args[i] == "-I" and i + 1 < len(args):
            placeholder = args[i + 1]
            i += 2
            continue
        break

    cmd_template = args[i:]
    if not cmd_template:
        return "", "xargs: command required", 1

    exec_fn = ctx.data.get("_shell_exec")
    if not callable(exec_fn):
        return "", "xargs: internal executor unavailable", 1

    tokens = [t for t in stdin.replace("\r", "\n").split() if t]
    if not tokens:
        return "", "", 0

    out_chunks: List[str] = []
    err_chunks: List[str] = []
    last_code = 0

    for token in tokens:
        rendered_args = [part.replace(placeholder, token) for part in cmd_template]
        line = shlex.join(rendered_args)
        stdout, stderr, code = exec_fn(line, ctx)
        if stdout:
            out_chunks.append(stdout)
        if stderr:
            err_chunks.append(stderr)
        last_code = int(code)

    return "".join(out_chunks), "".join(err_chunks), last_code

