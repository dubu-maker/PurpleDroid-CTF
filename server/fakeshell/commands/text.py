from __future__ import annotations

from typing import Any, List, Tuple


def _read_input(args: list[str], stdin: str, ctx: Any, offset: int = 0) -> Tuple[str, str]:
    if len(args) > offset and ctx.fs:
        path = args[offset]
        try:
            return ctx.fs.read_file(path, ctx.cwd), ""
        except FileNotFoundError:
            return "", f"file not found: {path}"
    return stdin or "", ""


def _split_lines(text: str) -> List[str]:
    if not text:
        return []
    return text.splitlines()


def run_grep(args: list[str], stdin: str, ctx: Any) -> Tuple[str, str, int]:
    if not args:
        return "", "grep: pattern required", 1
    ignore_case = False
    i = 0
    while i < len(args) and args[i].startswith("-"):
        if args[i] == "-i":
            ignore_case = True
        i += 1
    if i >= len(args):
        return "", "grep: pattern required", 1
    pattern = args[i]
    text, err = _read_input(args, stdin, ctx, offset=i + 1)
    if err:
        return "", f"grep: {err}", 1
    if ignore_case:
        pattern_cmp = pattern.lower()
        lines = [line for line in _split_lines(text) if pattern_cmp in line.lower()]
    else:
        lines = [line for line in _split_lines(text) if pattern in line]
    out = "\n".join(lines)
    if out:
        out += "\n"
    return out, "", 0


def run_findstr(args: list[str], stdin: str, ctx: Any) -> Tuple[str, str, int]:
    return run_grep(args, stdin, ctx)


def _parse_n(args: list[str], default: int = 10) -> tuple[int, list[str]]:
    if len(args) >= 2 and args[0] == "-n":
        try:
            return max(0, int(args[1])), args[2:]
        except ValueError:
            return default, args
    return default, args


def run_head(args: list[str], stdin: str, ctx: Any) -> Tuple[str, str, int]:
    n, rest = _parse_n(args, 10)
    text, err = _read_input(rest, stdin, ctx, offset=0)
    if err:
        return "", f"head: {err}", 1
    lines = _split_lines(text)[:n]
    out = "\n".join(lines)
    if out:
        out += "\n"
    return out, "", 0


def run_tail(args: list[str], stdin: str, ctx: Any) -> Tuple[str, str, int]:
    n, rest = _parse_n(args, 10)
    text, err = _read_input(rest, stdin, ctx, offset=0)
    if err:
        return "", f"tail: {err}", 1
    lines = _split_lines(text)[-n:] if n > 0 else []
    out = "\n".join(lines)
    if out:
        out += "\n"
    return out, "", 0


def run_wc(args: list[str], stdin: str, ctx: Any) -> Tuple[str, str, int]:
    line_mode = "-l" in args or not args
    rest = [a for a in args if a != "-l"]
    text, err = _read_input(rest, stdin, ctx, offset=0)
    if err:
        return "", f"wc: {err}", 1
    if line_mode:
        count = len(_split_lines(text))
        return f"{count}\n", "", 0
    return "", "wc: only -l is supported in MVP", 1

