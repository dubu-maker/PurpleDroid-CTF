from __future__ import annotations

import re
from typing import List, Tuple


NO_MATCH_OUTPUT = (
    "[no matches]\n"
    "마지막 필터에서 일치하는 로그가 없어.\n"
    "여러 grep을 연결하면 각 필터가 같은 줄에서 차례로 일치해야 해.\n"
)


def validate_logcat_args(parts: List[str]) -> str:
    """Validate the small, documented adb logcat subset used by Level 1."""
    i = 2
    while i < len(parts):
        arg = parts[i]
        if arg in {"-c", "--clear"}:
            return (
                "adb logcat: 버퍼 삭제(-c)는 훈련 콘솔에서 비활성화되어 있어. "
                "로그는 변경되지 않았어. 저장된 버퍼는 -d로 읽어봐."
            )
        if arg == "-d":
            i += 1
            continue
        if arg in {"-b", "-v"}:
            if i + 1 >= len(parts):
                return f"adb logcat: {arg} 뒤에 값이 필요해."
            i += 2
            continue
        if arg.startswith("--buffer=") or arg.startswith("--format="):
            i += 1
            continue
        return (
            f"adb logcat: 지원하지 않는 옵션 또는 인자 '{arg}'. "
            "지원: -d, -b <buffer>, -v <format>"
        )
    return ""


def _grep_options(args: List[str]) -> Tuple[dict, List[str], str]:
    options = {
        "ignore_case": False,
        "extended": False,
        "fixed": False,
        "invert": False,
        "line_number": False,
    }
    patterns: List[str] = []
    remaining: List[str] = []
    i = 0

    long_options = {
        "--ignore-case": "ignore_case",
        "--extended-regexp": "extended",
        "--fixed-strings": "fixed",
        "--invert-match": "invert",
        "--line-number": "line_number",
    }
    short_options = {
        "i": "ignore_case",
        "E": "extended",
        "F": "fixed",
        "v": "invert",
        "n": "line_number",
    }

    while i < len(args):
        arg = args[i]
        if arg == "--":
            remaining.extend(args[i + 1 :])
            break
        if arg == "-e":
            if i + 1 >= len(args):
                return options, [], "grep: -e 뒤에 pattern이 필요해."
            patterns.append(args[i + 1])
            i += 2
            continue
        if arg in long_options:
            options[long_options[arg]] = True
            i += 1
            continue
        if arg.startswith("--"):
            return options, [], (
                f"grep: 지원하지 않는 옵션 '{arg}'. "
                "지원: -i, -E, -F, -v, -n, -e"
            )
        if arg.startswith("-") and arg != "-":
            for flag in arg[1:]:
                key = short_options.get(flag)
                if not key:
                    return options, [], (
                        f"grep: 지원하지 않는 옵션 '-{flag}'. "
                        "지원: -i, -E, -F, -v, -n, -e"
                    )
                options[key] = True
            i += 1
            continue
        remaining.extend(args[i:])
        break

    if not patterns:
        if not remaining:
            return options, [], "grep: pattern required"
        patterns.append(remaining.pop(0))

    if remaining:
        return options, [], "grep: Level 1에서는 pipe 입력만 지원해. 파일 경로는 사용할 수 없어."
    return options, patterns, ""


def _compile_grep_patterns(patterns: List[str], options: dict) -> Tuple[List[re.Pattern], str]:
    flags = re.IGNORECASE if options["ignore_case"] else 0
    compiled: List[re.Pattern] = []
    for pattern in patterns:
        expression = re.escape(pattern) if options["fixed"] else pattern.replace(r"\|", "|")
        try:
            compiled.append(re.compile(expression, flags))
        except re.error as exc:
            return [], f"grep: invalid pattern: {exc}"
    return compiled, ""


def _run_grep(args: List[str], data: str) -> Tuple[str, str, int]:
    options, patterns, error = _grep_options(args)
    if error:
        return "", error, 2
    compiled, error = _compile_grep_patterns(patterns, options)
    if error:
        return "", error, 2

    matched: List[str] = []
    for line_no, line in enumerate(data.splitlines(), start=1):
        is_match = any(pattern.search(line) for pattern in compiled)
        if options["invert"]:
            is_match = not is_match
        if is_match:
            matched.append(f"{line_no}:{line}" if options["line_number"] else line)

    if not matched:
        return "", "", 1
    return "\n".join(matched) + "\n", "", 0


def _findstr_options(args: List[str]) -> Tuple[dict, List[str], str]:
    options = {"ignore_case": False, "regex": False, "line_number": False}
    patterns: List[str] = []
    i = 0

    while i < len(args):
        arg = args[i]
        lowered = arg.lower()
        if lowered == "/i":
            options["ignore_case"] = True
        elif lowered == "/r":
            options["regex"] = True
        elif lowered == "/l":
            options["regex"] = False
        elif lowered == "/n":
            options["line_number"] = True
        elif lowered.startswith("/c:"):
            patterns.append(arg[3:])
        elif arg.startswith("/"):
            return options, [], (
                f"findstr: 지원하지 않는 옵션 '{arg}'. 지원: /I, /R, /L, /N, /C:"
            )
        else:
            patterns.extend(arg.split())
        i += 1

    if not patterns:
        return options, [], "findstr: pattern required"
    return options, patterns, ""


def _run_findstr(args: List[str], data: str) -> Tuple[str, str, int]:
    options, patterns, error = _findstr_options(args)
    if error:
        return "", error, 2

    flags = re.IGNORECASE if options["ignore_case"] else 0
    compiled: List[re.Pattern] = []
    for pattern in patterns:
        expression = pattern if options["regex"] else re.escape(pattern)
        try:
            compiled.append(re.compile(expression, flags))
        except re.error as exc:
            return "", f"findstr: invalid pattern: {exc}", 2

    matched: List[str] = []
    for line_no, line in enumerate(data.splitlines(), start=1):
        if any(pattern.search(line) for pattern in compiled):
            matched.append(f"{line_no}:{line}" if options["line_number"] else line)

    if not matched:
        return "", "", 1
    return "\n".join(matched) + "\n", "", 0


def run_log_filter(parts: List[str], data: str | None) -> Tuple[str, str, int]:
    command = parts[0].lower() if parts else ""
    if data is None:
        return "", f"{command} needs input (use pipe from logcat)", 2
    if command == "grep":
        return _run_grep(parts[1:], data)
    if command == "findstr":
        return _run_findstr(parts[1:], data)
    return "", f"unsupported filter: {command}", 2
