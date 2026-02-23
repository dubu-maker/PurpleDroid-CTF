from __future__ import annotations

from typing import Any, Tuple


def run_echo(args: list[str], stdin: str, _ctx: Any) -> Tuple[str, str, int]:
    if args:
        return " ".join(args) + "\n", "", 0
    return (stdin or "") + ("\n" if stdin and not stdin.endswith("\n") else ""), "", 0


def run_help(_args: list[str], _stdin: str, ctx: Any) -> Tuple[str, str, int]:
    allowed = sorted(ctx.allowed or [])
    lines = ["Available commands:"] + [f"  - {name}" for name in allowed]
    return "\n".join(lines) + "\n", "", 0


def run_whoami(_args: list[str], _stdin: str, ctx: Any) -> Tuple[str, str, int]:
    return f"{ctx.env.get('USER', 'guest')}\n", "", 0


def run_pwd(_args: list[str], _stdin: str, ctx: Any) -> Tuple[str, str, int]:
    return f"{ctx.cwd}\n", "", 0


def run_cd(args: list[str], _stdin: str, ctx: Any) -> Tuple[str, str, int]:
    target = args[0] if args else ctx.env.get("HOME", "/")
    if not ctx.fs:
        return "", "filesystem unavailable", 1
    resolved = ctx.fs.resolve(target, ctx.cwd)
    if not ctx.fs.is_dir(resolved):
        return "", f"cd: no such directory: {target}", 1
    ctx.cwd = resolved
    return "", "", 0

