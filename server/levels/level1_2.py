from __future__ import annotations

import json
import os
import re
import secrets
import shlex
from typing import Any, Dict, List, Tuple

LEVEL1_2_FLAG = os.getenv("PURPLEDROID_LEVEL1_2_FLAG", "FLAG{DEV_ONLY_LEVEL1_2}")

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

DEFENSE_DEFAULT_POLICY: Dict[str, Any] = {
    "logLevel": "DEBUG",
    "allowAuthServiceVerbose": True,
    "redactSessionTokens": False,
}


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
            "help": (
                '허용: adb logcat -d | grep/findstr "..."\n'
                "Defense: defense audit | defense apply <json> | defense verify"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "status": {"attack": "available", "defense": "locked"},
    "defense": {
        "enabled": False,
        "instruction": (
            "AuthService 로그 정책을 조정해 민감 session 노출과 과다 노이즈를 줄이세요.\n"
            "1) defense audit\n"
            "2) defense apply {\"logLevel\":\"INFO\",\"allowAuthServiceVerbose\":false,\"redactSessionTokens\":true}\n"
            "3) defense verify\n"
            "그 다음 기존 패치 제출로 완료하세요."
        ),
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


def judge_patch_with_session(patched_ids: List[str], session: Dict[str, Any]) -> bool:
    state = _defense_state(session)
    return ("p1" in set(patched_ids)) and bool(state.get("verified"))


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
            "  adb logcat -d\n"
            '  adb logcat -d | grep "TEXT"\n'
            '  adb logcat -d | findstr "TEXT"\n'
            "Defense:\n"
            "  defense audit\n"
            '  defense apply {"logLevel":"INFO","allowAuthServiceVerbose":false,"redactSessionTokens":true}\n'
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


def _defense_state(session: Dict[str, Any]) -> Dict[str, Any]:
    defense_all = session.setdefault("defenseState", {})
    state = defense_all.setdefault("level1_2", {})
    if "policy" not in state:
        state["policy"] = dict(DEFENSE_DEFAULT_POLICY)
    state.setdefault("verified", False)
    state.setdefault("patchProof", "")
    return state


def _mask_session_tokens(text: str) -> str:
    return re.sub(r"(session=)FLAG\s*\{[^}\n]*\}", r"\1FLAG{REDACTED}", text, flags=re.IGNORECASE)


def _render_logs_with_policy(policy: Dict[str, Any]) -> str:
    lines: List[str] = []
    for ln in LOGCAT_LINES:
        if str(policy.get("logLevel", "DEBUG")).upper() == "INFO" and ln.startswith("D/"):
            continue
        if not bool(policy.get("allowAuthServiceVerbose", True)) and "AuthService" in ln and ln.startswith("D/"):
            continue
        lines.append(ln)
    text = "\n".join(lines)
    if bool(policy.get("redactSessionTokens")):
        text = _mask_session_tokens(text)
    return text + ("\n" if text else "")


def _defense_audit_payload(state: Dict[str, Any]) -> Dict[str, Any]:
    policy = state["policy"]
    risk: List[str] = []
    if str(policy.get("logLevel", "DEBUG")).upper() == "DEBUG":
        risk.append("DEBUG_LOGGING_ENABLED")
    if bool(policy.get("allowAuthServiceVerbose", True)):
        risk.append("AUTH_VERBOSE_ENABLED")
    if not bool(policy.get("redactSessionTokens")):
        risk.append("SESSION_TOKENS_NOT_REDACTED")

    return {
        "ok": True,
        "data": {
            "logLevel": str(policy.get("logLevel", "DEBUG")).upper(),
            "allowAuthServiceVerbose": bool(policy.get("allowAuthServiceVerbose")),
            "redactSessionTokens": bool(policy.get("redactSessionTokens")),
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

    if "allowAuthServiceVerbose" in updates:
        if not isinstance(updates["allowAuthServiceVerbose"], bool):
            return {"ok": False, "error": {"code": "BAD_INPUT", "message": "allowAuthServiceVerbose must be boolean"}}
        policy["allowAuthServiceVerbose"] = bool(updates["allowAuthServiceVerbose"])

    if "redactSessionTokens" in updates:
        if not isinstance(updates["redactSessionTokens"], bool):
            return {"ok": False, "error": {"code": "BAD_INPUT", "message": "redactSessionTokens must be boolean"}}
        policy["redactSessionTokens"] = bool(updates["redactSessionTokens"])

    state["verified"] = False
    state["patchProof"] = ""
    changed_count = sum(1 for k, v in DEFENSE_DEFAULT_POLICY.items() if policy.get(k) != v)
    return {"ok": True, "data": {"applied": True, "policy": policy, "changedCount": changed_count}}


def _defense_verify_payload(state: Dict[str, Any]) -> Dict[str, Any]:
    policy = state["policy"]
    changed_count = sum(1 for k, v in DEFENSE_DEFAULT_POLICY.items() if policy.get(k) != v)
    rendered = _render_logs_with_policy(policy)

    decoy_count = len(re.findall(r"TEMP_PREV_LOGIN|MIGRATION_CACHE|LEGACY_ROLLBACK", rendered))
    checks = {
        "redactionEnabled": bool(policy.get("redactSessionTokens")),
        "minimumPolicyChanges": changed_count >= 2,
        "noSessionFlagLeak": re.search(r"session=FLAG\s*\{", rendered, flags=re.IGNORECASE) is None,
        "decoyNoiseReduced": decoy_count <= 1,
    }
    verified = all(checks.values())

    if verified and not state.get("patchProof"):
        state["patchProof"] = f"P1-2-{secrets.token_hex(3).upper()}"
    state["verified"] = verified

    return {
        "ok": True,
        "data": {
            "verified": verified,
            "checks": checks,
            "changedCount": changed_count,
            "patchProof": state.get("patchProof", ""),
            "message": (
                "Auth logging policy hardened. Sensitive sessions are redacted and noise reduced."
                if verified
                else "검증 실패: 세션 마스킹 + 정책 2개 이상 변경 + 노이즈 감소 조건을 만족해야 해."
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
            '  defense apply {"logLevel":"INFO","allowAuthServiceVerbose":false,"redactSessionTokens":true}\n'
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
