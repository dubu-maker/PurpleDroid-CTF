from __future__ import annotations

import os
import shlex
from typing import List, Dict, Any, Tuple

LEVEL1_3_FLAG = os.getenv("PURPLEDROID_LEVEL1_3_FLAG", "FLAG{DEV_ONLY_LEVEL1_3}")

def _split_flag(flag: str, n: int = 3) -> List[str]:
    size = (len(flag) + n - 1) // n
    return [flag[i * size : (i + 1) * size] for i in range(n)]

PARTS = _split_flag(LEVEL1_3_FLAG, 3)

LOGCAT_LINES = [
    "I/PurpleDroid: app started",
    "D/PurpleDroid: part[1]=" + PARTS[0],
    "D/PurpleDroid: part[2]=" + PARTS[1],
    "D/PurpleDroid: part[3]=" + PARTS[2],
    "I/PurpleDroid: (hint) stitch the parts in order",
]

STATIC: Dict[str, Any] = {
    "id": "level1_3",
    "level": 1,
    "title": "1-3 Split & Stitch (Parts)",
    "summary": "플래그가 조각으로 흩어져 있다. 이어 붙여라.",
    "description": "미션: 로그에 찍힌 part[1..]를 순서대로 이어붙여 FLAG를 완성해봐.",
    "attack": {
        "hints": [
            {"platform": "windows", "text": 'adb logcat -d | findstr "part["'},
            {"platform": "unix", "text": 'adb logcat -d | grep "part["'},
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 8000,
            "help": '허용: adb logcat -d | grep/findstr "..."',
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": "플래그 조각이라도 로그에 찍히면 유출이다. 전부 막아라.",
        "code": {
            "language": "kotlin",
            "patchMode": "toggleComment",
            "lines": [
                {"no": 1, "text": "fun debugParts(p1: String, p2: String, p3: String) {"},
                {
                    "no": 2,
                    "text": '  Log.d("PurpleDroid", "part[1]=$p1")',
                    "patchableId": "p1",
                },
                {
                    "no": 3,
                    "text": '  Log.d("PurpleDroid", "part[2]=$p2")',
                    "patchableId": "p2",
                },
                {
                    "no": 4,
                    "text": '  Log.d("PurpleDroid", "part[3]=$p3")',
                    "patchableId": "p3",
                },
                {"no": 5, "text": "}"},
            ],
        },
    },
}

PATCHABLE_IDS = {"p1", "p2", "p3"}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL1_3_FLAG


def judge_patch(patched_ids: List[str]) -> bool:
    return PATCHABLE_IDS.issubset(set(patched_ids))


def _split_pipes(s: str) -> List[str]:
    out: List[str] = []
    cur = ""
    quote = None
    for ch in s:
        if quote:
            cur += ch
            if ch == quote:
                quote = None
            continue
        if ch in ("'", '"'):
            quote = ch
            cur += ch
            continue
        if ch == "|":
            out.append(cur.strip())
            cur = ""
            continue
        cur += ch
    if cur.strip():
        out.append(cur.strip())
    return out


def terminal_exec(command: str) -> Tuple[str, str, int]:
    cmdline = command.strip()
    if not cmdline:
        return "", "", 0

    if cmdline in ("help", "?", "h"):
        return (
            "Allowed:\n"
            "  adb logcat -d\n"
            '  adb logcat -d | grep "TEXT"\n'
            '  adb logcat -d | findstr "TEXT"\n',
            "",
            0,
        )

    stages = _split_pipes(cmdline)
    data: str | None = None

    for stage in stages:
        parts = shlex.split(stage)
        if not parts:
            return "", "empty command", 2

        if len(parts) >= 2 and parts[0] == "adb" and parts[1] == "logcat":
            if "-d" not in parts:
                return "", "only 'adb logcat -d' is allowed", 2
            data = "\n".join(LOGCAT_LINES) + "\n"
            continue

        if parts[0] == "grep":
            if data is None:
                return "", "grep needs input (use pipe from logcat)", 2
            if len(parts) < 2:
                return "", "grep needs a pattern", 2
            needle = parts[1]
            lines = data.splitlines()
            data = "\n".join([ln for ln in lines if needle in ln]) + "\n"
            continue

        if parts[0].lower() == "findstr":
            if data is None:
                return "", "findstr needs input (use pipe from logcat)", 2
            if len(parts) < 2:
                return "", "findstr needs a pattern", 2
            needle = parts[1]
            lines = data.splitlines()
            data = "\n".join([ln for ln in lines if needle in ln]) + "\n"
            continue

        return "", f"command not allowed: {parts[0]}", 126

    return (data or ""), "", 0
