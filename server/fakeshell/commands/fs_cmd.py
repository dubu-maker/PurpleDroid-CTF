from __future__ import annotations

from typing import Any, Tuple


def run_ls(args: list[str], _stdin: str, ctx: Any) -> Tuple[str, str, int]:
    if not ctx.fs:
        return "", "filesystem unavailable", 1
    target = args[0] if args else "."
    try:
        names = ctx.fs.list_dir(target, ctx.cwd)
    except FileNotFoundError:
        return "", f"ls: cannot access '{target}': No such file or directory", 1
    return ("\n".join(names) + "\n") if names else "", "", 0


def run_cat(args: list[str], stdin: str, ctx: Any) -> Tuple[str, str, int]:
    if not args:
        return stdin or "", "", 0
    if not ctx.fs:
        return "", "filesystem unavailable", 1
    chunks = []
    for path in args:
        try:
            chunks.append(ctx.fs.read_file(path, ctx.cwd))
        except FileNotFoundError:
            return "", f"cat: {path}: No such file or directory", 1
    out = "\n".join(chunks)
    if out and not out.endswith("\n"):
        out += "\n"
    return out, "", 0


def run_find(args: list[str], _stdin: str, ctx: Any) -> Tuple[str, str, int]:
    if not ctx.fs:
        return "", "filesystem unavailable", 1
    start = "."
    name_contains = ""
    i = 0
    while i < len(args):
        token = args[i]
        if token == "-name" and i + 1 < len(args):
            name_contains = args[i + 1].replace("*", "")
            i += 2
            continue
        if not token.startswith("-"):
            start = token
        i += 1
    results = ctx.fs.find(start, ctx.cwd, name_contains=name_contains)
    return ("\n".join(results) + "\n") if results else "", "", 0

