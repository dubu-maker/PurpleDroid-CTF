from __future__ import annotations

import os
import shlex
from typing import List, Dict, Any, Tuple

LEVEL1_2_FLAG = os.getenv("PURPLEDROID_LEVEL1_2_FLAG", "FLAG{DEV_ONLY_LEVEL1_2}")

# 노이즈 + 여러 후보 세션 + 진짜 세션
LOGCAT_LINES = [
    "I/System: Booting...",
    "I/PurpleDroid: app started",
    "D/Network: request => /login",
    "I/AuthService: Login success! session established",
    "D/AuthService: session=FLAG{TEMP_PREV_LOGIN_2026}",
    "W/AuthService: restore candidate session=FLAG{MIGRATION_CACHE_OLD}",
    "D/AuthService: session=" + LEVEL1_2_FLAG,
    "I/AuthService: refresh queue drained",
    "D/AuthService: shadow session=FLAG{LEGACY_ROLLBACK_SLOT}",
    "I/OtherTag: idle",
    "I/System: idle",
]

STATIC: Dict[str, Any] = {
    "id": "level1_2",
    "level": 1,
    "title": "1-2 Needle in the Haystack (Decoy)",
    "summary": "로그에 FLAG가 여러 개? 진짜를 골라라.",
    "description": "미션: 로그에 FLAG가 여러 개 섞여있어. 진짜 FLAG를 찾아 제출해봐.",
    "attack": {
        "hints": [
            {"platform": "windows", "text": 'adb logcat -d | findstr "AuthService"'},
            {"platform": "unix", "text": 'adb logcat -d | grep "AuthService"'},
            {"platform": "all", "text": "힌트: 같은 태그라도 문맥이 다른 session이 섞여 있어."},
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 8000,
            "help": '허용: adb logcat -d | grep/findstr "..."',
        },
        "flagFormat": "FLAG{...}",
    },
    "status": {
        "attack": "available",
        "defense": "locked"
    },
    "defense": {
        "enabled": False,
        "instruction": "Decoy처럼 민감정보를 로그에 찍는 코드를 막아라.",
        "code": {
            "language": "kotlin",
            "patchMode": "toggleComment",
            "lines": [
                {"no": 1, "text": "fun login(token: String) {"},
                {"no": 2, "text": "  // TODO: remove sensitive logs"},
                {
                    "no": 3,
                    "text": '  Log.d("Secret", "PurpleDroid Key = $token")',
                    "patchableId": "p1",
                },
                {"no": 4, "text": "  // send token to server..."},
                {"no": 5, "text": "}"},
            ],
        },
    },
}

PATCHABLE_IDS = {"p1"}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL1_2_FLAG


def judge_patch(patched_ids: List[str]) -> bool:
    return "p1" in set(patched_ids)


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

        # adb logcat -d
        if len(parts) >= 2 and parts[0] == "adb" and parts[1] == "logcat":
            if "-d" not in parts:
                return "", "only 'adb logcat -d' is allowed", 2
            data = "\n".join(LOGCAT_LINES) + "\n"
            continue

        # grep
        if parts[0] == "grep":
            if data is None:
                return "", "grep needs input (use pipe from logcat)", 2
            if len(parts) < 2:
                return "", "grep needs a pattern", 2
            needle = parts[1]
            lines = data.splitlines()
            data = "\n".join([ln for ln in lines if needle in ln]) + "\n"
            continue

        # findstr
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
