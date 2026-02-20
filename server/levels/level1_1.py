# server/levels/level1.py
from __future__ import annotations

import os
import shlex
from typing import List, Dict, Any, Tuple


# ⚠️ 실제 운영 플래그는 환경변수로 주는 걸 추천 (레포에 박제 방지)
LEVEL1_FLAG = "FLAG{Always_Check_The_Logs_First}"

# 로그캣 샘플 (웹 터미널에서 'adb logcat -d'로 출력되는 내용)
# 힌트가 PurpleDroid grep/findstr라서, 해당 문자열이 라인에 포함되게 구성해둠
LOGCAT_LINES = [
    "I/PurpleDroid: app started",
    "D/Secret: PurpleDroid Key = " + LEVEL1_FLAG,
    "I/OtherTag: something something",
    "D/PurpleDroid: done",
]


STATIC: Dict[str, Any] = {
    "id": "level1",
    "level": 1,
    "title": "1-1 Logcat Leak",
    "summary": "로그캣(Logcat)에 숨겨진 Flag를 찾으세요.",
    "description": "미션: 로그캣(Logcat)에 숨겨진 Flag를 찾으세요.",
    "attack": {
        "hints": [
            {"platform": "windows", "text": 'adb logcat -d | findstr "PurpleDroid"'},
            {"platform": "unix", "text": 'adb logcat -d | grep "PurpleDroid"'},
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
        "instruction": "정보 유출을 일으키는 라인을 찾아 터치하여 삭제/주석처리하세요.",
        "code": {
            "language": "kotlin",
            "patchMode": "toggleComment",
            "lines": [
                {"no": 1, "text": "fun onCreate() {"},
                {"no": 2, "text": "  super.onCreate()"},
                {"no": 3, "text": "  initUI()"},
                {
                    "no": 4,
                    "text": '  Log.d("Secret", "Key = FLAG{...}")',
                    "patchableId": "p1",
                },
                {"no": 5, "text": "}"},
            ],
        },
    },
}

PATCHABLE_IDS = {"p1"}


def check_flag(flag: str) -> bool:
    # 여기서 도커 judge로 바꿔도 API는 그대로 유지 가능
    return flag.strip() == LEVEL1_FLAG


def judge_patch(patched_ids: List[str]) -> bool:
    s = set(patched_ids)
    # 최소 조건: p1 라인이 패치됨(삭제/주석처리)
    return "p1" in s


def _split_pipes(s: str) -> List[str]:
    """따옴표 안의 | 는 무시하고 파이프 기준으로 쪼개기"""
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
    """
    제한 커맨드 실행(시뮬레이션)
    - 허용:
      - adb logcat -d
      - grep "X"
      - findstr "X"
    - 파이프 지원: adb logcat -d | grep "PurpleDroid"
    """
    cmdline = command.strip()
    if not cmdline:
        return "", "", 0

    # 작은 UX: help 명령 제공
    if cmdline in ("help", "?", "h"):
        return (
            "Allowed:\n"
            '  adb logcat -d\n'
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

        # stage: adb logcat -d
        if len(parts) >= 2 and parts[0] == "adb" and parts[1] == "logcat":
            if "-d" not in parts:
                return "", "only 'adb logcat -d' is allowed", 2
            data = "\n".join(LOGCAT_LINES) + "\n"
            continue

        # stage: grep "X"
        if parts[0] == "grep":
            if data is None:
                return "", "grep needs input (use pipe from logcat)", 2
            if len(parts) < 2:
                return "", "grep needs a pattern", 2
            needle = parts[1]
            lines = data.splitlines()
            data = "\n".join([ln for ln in lines if needle in ln]) + ("\n" if lines else "")
            continue

        # stage: findstr "X"
        if parts[0].lower() == "findstr":
            if data is None:
                return "", "findstr needs input (use pipe from logcat)", 2
            if len(parts) < 2:
                return "", "findstr needs a pattern", 2
            needle = parts[1]
            lines = data.splitlines()
            data = "\n".join([ln for ln in lines if needle in ln]) + ("\n" if lines else "")
            continue

        # 그 외 전부 차단
        return "", f"command not allowed: {parts[0]}", 126

    return (data or ""), "", 0
