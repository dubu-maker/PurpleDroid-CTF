from __future__ import annotations

import json
import re
import secrets
import shlex
from typing import Any, Dict, List, Tuple


LEVEL1_FLAG = "FLAG{Always_Check_The_Logs_First}"

LOGCAT_LINES = [
    "05-26 10:14:01.102 I/BootReceiver: android.intent.action.BOOT_COMPLETED",
    "05-26 10:14:01.231 I/PurpleDroid: courier runtime attached",
    "05-26 10:14:01.388 D/RouteSync: checkpoint=abandoned-device",
    "05-26 10:14:01.407 I/OtherTag: metrics batch queued",
    "05-26 10:14:01.612 D/Secret: PurpleDroid Key = " + LEVEL1_FLAG,
    "05-26 10:14:01.744 W/AEGIS: diagnostic wipe marker present",
    "05-26 10:14:01.809 D/Auth: sessionToken=debug-session-7f19",
    "05-26 10:14:02.004 I/PurpleDroid: delivery worker idle",
    "05-26 10:14:02.118 V/Perf: frameTime=16ms",
    "05-26 10:14:02.260 D/PurpleDroid: done",
]

LIVE_LOGCAT_NOISE = [
    "--------- beginning of main",
    "05-26 10:14:04.001 I/AEGIS-Monitor: live stream attached",
    "05-26 10:14:04.003 W/AEGIS-Monitor: volatile channel unstable",
    "05-26 10:14:04.006 D/AndroidRuntime: GC freed 2048 objects",
    "05-26 10:14:04.009 I/PurpleDroid: heartbeat accepted",
    "05-26 10:14:04.011 W/AEGIS-Monitor: redaction pass scheduled",
    "05-26 10:14:04.016 D/RouteSync: retry window opened",
    "05-26 10:14:04.019 I/AndroidSystem: battery stats checkpoint",
    "05-26 10:14:04.024 W/AEGIS-Monitor: live tail contains decoy frames",
    "05-26 10:14:04.028 D/PurpleDroid: noise frame id=PD-NOISE-1024",
    "05-26 10:14:04.031 D/PurpleDroid: noise frame id=PD-NOISE-1025",
    "05-26 10:14:04.034 D/PurpleDroid: noise frame id=PD-NOISE-1026",
    "05-26 10:14:04.038 W/AEGIS-Monitor: stream replay detected",
    "05-26 10:14:04.042 I/AndroidSystem: binder transaction completed",
    "05-26 10:14:04.047 D/RouteSync: checkpoint=no-secret-visible",
    "05-26 10:14:04.051 W/AEGIS-Monitor: snapshot flag missing",
    "05-26 10:14:04.056 D/PurpleDroid: noise frame id=PD-NOISE-1027",
    "05-26 10:14:04.061 D/PurpleDroid: noise frame id=PD-NOISE-1028",
    "05-26 10:14:04.064 I/AEGIS-Monitor: live stream throttled",
    "05-26 10:14:04.069 W/AEGIS-Monitor: use buffered acquisition for stable evidence",
]

DEFENSE_DEFAULT_POLICY: Dict[str, Any] = {
    "logLevel": "DEBUG",
    "redactFlagPattern": False,
    "allowDebugTag": True,
}


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
            "help": (
                '허용: adb logcat -d | grep/findstr "..."\n'
                "Defense: defense audit | defense apply <json> | defense verify"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "instruction": (
            "코드에서 민감 정보가 그대로 남는 로그 라인 2개를 선택해 봉쇄하세요. "
            "첫 미션에서는 터미널 검증 없이 코드 패치 선택만으로 완료됩니다."
        ),
        "code": {
            "language": "kotlin",
            "patchMode": "toggleComment",
            "lines": [
                {"no": 1, "text": "fun onCreate() {"},
                {"no": 2, "text": "  super.onCreate()"},
                {"no": 3, "text": "  initUI()"},
                {
                    "no": 4,
                    "text": '  Log.i("Analytics", "screen=Main")',
                    "patchableId": "d1",
                },
                {
                    "no": 5,
                    "text": '  Log.d("Secret", "Key = FLAG{...}")',
                    "patchableId": "p1",
                },
                {
                    "no": 6,
                    "text": '  Log.d("Auth", "sessionToken=$sessionToken")',
                    "patchableId": "p2",
                },
                {
                    "no": 7,
                    "text": '  Log.v("Perf", "frameTime=16ms")',
                    "patchableId": "d2",
                },
                {"no": 8, "text": "  startWorkers()"},
                {"no": 9, "text": "}"},
            ],
        },
    },
}

PATCHABLE_IDS = {"p1", "p2", "d1", "d2"}
REQUIRED_PATCH_IDS = {"p1", "p2"}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL1_FLAG


def judge_patch(patched_ids: List[str]) -> bool:
    return REQUIRED_PATCH_IDS.issubset(set(patched_ids))


def judge_patch_with_session(patched_ids: List[str], session: Dict[str, Any]) -> bool:
    return REQUIRED_PATCH_IDS.issubset(set(patched_ids))


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


def _run_attack_terminal(command: str) -> Tuple[str, str, int]:
    cmdline = command.strip()
    if not cmdline:
        return "", "", 0

    if cmdline in ("help", "?", "h"):
        return (
            "Allowed:\n"
            '  adb logcat -d\n'
            '  adb logcat -d | grep "TEXT"\n'
            '  adb logcat -d | findstr "TEXT"\n'
            "Defense:\n"
            "  defense audit\n"
            '  defense apply {"logLevel":"INFO","redactFlagPattern":true,"allowDebugTag":false}\n'
            "  defense verify\n",
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
                return (
                    "\n".join(LIVE_LOGCAT_NOISE) + "\n",
                    "AEGIS: live log stream is polluted; buffered snapshot acquisition required\n",
                    2,
                )
            data = "\n".join(LOGCAT_LINES) + "\n"
            continue

        if parts[0] == "grep":
            if data is None:
                return "", "grep needs input (use pipe from logcat)", 2
            if len(parts) < 2:
                return "", "grep needs a pattern", 2
            needle = parts[1]
            lines = data.splitlines()
            data = "\n".join([ln for ln in lines if needle in ln]) + ("\n" if lines else "")
            continue

        if parts[0].lower() == "findstr":
            if data is None:
                return "", "findstr needs input (use pipe from logcat)", 2
            if len(parts) < 2:
                return "", "findstr needs a pattern", 2
            needle = parts[1]
            lines = data.splitlines()
            data = "\n".join([ln for ln in lines if needle in ln]) + ("\n" if lines else "")
            continue

        return "", f"command not allowed: {parts[0]}", 126

    return (data or ""), "", 0


def _defense_state(session: Dict[str, Any]) -> Dict[str, Any]:
    defense_all = session.setdefault("defenseState", {})
    state = defense_all.setdefault("level1", {})
    if "policy" not in state:
        state["policy"] = dict(DEFENSE_DEFAULT_POLICY)
    state.setdefault("verified", False)
    state.setdefault("patchProof", "")
    return state


def _mask_flag_patterns(text: str) -> str:
    return re.sub(r"FLAG\s*\{[^}\n]*\}", "FLAG{REDACTED}", text, flags=re.IGNORECASE)


def _render_logs_with_policy(policy: Dict[str, Any]) -> str:
    out: List[str] = []
    for ln in LOGCAT_LINES:
        if str(policy.get("logLevel", "DEBUG")).upper() == "INFO" and ln.startswith("D/"):
            continue
        if not bool(policy.get("allowDebugTag", True)) and ln.startswith("D/Secret:"):
            continue
        out.append(ln)

    text = "\n".join(out)
    if bool(policy.get("redactFlagPattern")):
        text = _mask_flag_patterns(text)
    return text + ("\n" if text else "")


def _defense_audit_payload(state: Dict[str, Any]) -> Dict[str, Any]:
    policy = state["policy"]
    risk: List[str] = []
    if str(policy.get("logLevel", "DEBUG")).upper() == "DEBUG":
        risk.append("DEBUG_LOGGING_ENABLED")
    if not bool(policy.get("redactFlagPattern")):
        risk.append("FLAG_PATTERN_NOT_REDACTED")
    if bool(policy.get("allowDebugTag", True)):
        risk.append("SECRET_TAG_ALLOWED")
    return {
        "ok": True,
        "data": {
            "logLevel": str(policy.get("logLevel", "DEBUG")).upper(),
            "redactFlagPattern": bool(policy.get("redactFlagPattern")),
            "allowDebugTag": bool(policy.get("allowDebugTag")),
            "risk": risk,
        },
    }


def _defense_apply_payload(state: Dict[str, Any], updates: Dict[str, Any]) -> Dict[str, Any]:
    policy = state["policy"]

    if "logLevel" in updates:
        level = str(updates["logLevel"]).upper().strip()
        if level not in {"DEBUG", "INFO", "WARN", "ERROR"}:
            return {"ok": False, "error": {"code": "BAD_INPUT", "message": "logLevel must be DEBUG/INFO/WARN/ERROR"}}
        policy["logLevel"] = level

    if "redactFlagPattern" in updates:
        if not isinstance(updates["redactFlagPattern"], bool):
            return {"ok": False, "error": {"code": "BAD_INPUT", "message": "redactFlagPattern must be boolean"}}
        policy["redactFlagPattern"] = bool(updates["redactFlagPattern"])

    if "allowDebugTag" in updates:
        if not isinstance(updates["allowDebugTag"], bool):
            return {"ok": False, "error": {"code": "BAD_INPUT", "message": "allowDebugTag must be boolean"}}
        policy["allowDebugTag"] = bool(updates["allowDebugTag"])

    state["verified"] = False
    state["patchProof"] = ""
    changed_count = sum(1 for k, v in DEFENSE_DEFAULT_POLICY.items() if policy.get(k) != v)
    return {"ok": True, "data": {"applied": True, "policy": policy, "changedCount": changed_count}}


def _defense_verify_payload(state: Dict[str, Any]) -> Dict[str, Any]:
    policy = state["policy"]
    changed_count = sum(1 for k, v in DEFENSE_DEFAULT_POLICY.items() if policy.get(k) != v)
    rendered = _render_logs_with_policy(policy)

    checks = {
        "logLevelNotDebug": str(policy.get("logLevel", "DEBUG")).upper() != "DEBUG",
        "redactionEnabled": bool(policy.get("redactFlagPattern")),
        "minimumPolicyChanges": changed_count >= 2,
        "noFlagPatternInLogs": re.search(r"FLAG\s*\{", rendered, flags=re.IGNORECASE) is None,
    }
    verified = all(checks.values())

    if verified and not state.get("patchProof"):
        state["patchProof"] = f"P1-1-{secrets.token_hex(3).upper()}"
    state["verified"] = verified

    return {
        "ok": True,
        "data": {
            "verified": verified,
            "checks": checks,
            "changedCount": changed_count,
            "patchProof": state.get("patchProof", ""),
            "message": (
                "Logging policy updated. No FLAG patterns leak in logs."
                if verified
                else "검증 실패: 정책 2개 이상 변경 + DEBUG 비활성 + FLAG 패턴 마스킹을 만족해야 해."
            ),
        },
    }


def _run_defense_command(command: str, session: Dict[str, Any]) -> Tuple[str, str, int]:
    cmdline = command.strip()
    if not cmdline.startswith("defense"):
        return "", "invalid defense command", 2

    state = _defense_state(session)
    parts = shlex.split(cmdline)
    if len(parts) == 1 or (len(parts) >= 2 and parts[1] in {"help", "h", "?"}):
        return (
            "Defense commands:\n"
            "  defense audit\n"
            '  defense apply {"logLevel":"INFO","redactFlagPattern":true,"allowDebugTag":false}\n'
            "  defense verify\n",
            "",
            0,
        )

    action = parts[1].lower()
    if action == "audit":
        return json.dumps(_defense_audit_payload(state), ensure_ascii=False) + "\n", "", 0

    if action == "apply":
        payload_text = cmdline.split("defense apply", 1)[1].strip()
        if not payload_text:
            return "", "defense apply requires JSON body", 2
        try:
            updates = json.loads(payload_text)
        except Exception as exc:
            return "", f"invalid JSON: {exc}", 2
        result = _defense_apply_payload(state, updates if isinstance(updates, dict) else {})
        if not result.get("ok"):
            return "", result["error"]["message"], 2
        return json.dumps(result, ensure_ascii=False) + "\n", "", 0

    if action == "verify":
        result = _defense_verify_payload(state)
        return json.dumps(result, ensure_ascii=False) + "\n", "", 0

    return "", f"unknown defense action: {action}", 2


def terminal_exec_with_session(command: str, session: Dict[str, Any]) -> Tuple[str, str, int]:
    cmdline = command.strip()
    if cmdline.startswith("defense"):
        return _run_defense_command(cmdline, session)
    return _run_attack_terminal(cmdline)


def terminal_exec(command: str) -> Tuple[str, str, int]:
    cmdline = command.strip()
    if cmdline.startswith("defense"):
        return _run_defense_command(cmdline, {})
    return _run_attack_terminal(cmdline)
