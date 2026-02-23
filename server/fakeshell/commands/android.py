from __future__ import annotations

from typing import Any, Tuple


def run_adb(args: list[str], _stdin: str, ctx: Any) -> Tuple[str, str, int]:
    if len(args) >= 2 and args[0] == "logcat" and args[1] == "-d":
        logs = str(ctx.env.get("ADB_LOGCAT", ""))
        if logs and not logs.endswith("\n"):
            logs += "\n"
        return logs, "", 0
    return "", "adb: only 'adb logcat -d' is supported in MVP", 1

