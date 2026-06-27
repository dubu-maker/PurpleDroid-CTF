from __future__ import annotations

import json
import os
import re
import secrets
import shlex
from typing import Any, Dict, List, Tuple

from levels.logcat_support import NO_MATCH_OUTPUT, run_log_filter, validate_logcat_args

LEVEL1_2_FLAG = os.getenv("PURPLEDROID_LEVEL1_2_FLAG", "FLAG{SIGNAL_SURVIVES_THE_STATIC}")

LOGCAT_LINES = [
    "I/System: Booting...",
    "I/PurpleDroid: app started node=static-needle",
    "D/MIRA: Too many FLAG-shaped echoes. Search less by value, more by flow.",
    "D/AEGIS: decoy seed session=FLAG{AEGIS_FALSE_POSITIVE_A1}",
    "W/LegacyAuth: cached session=FLAG{QA_LOGIN_CACHE_2025}",
    "D/Telemetry: sample flag=FLAG{METRICS_PIPELINE_CANARY}",
    "D/Network: request => /login trace=LGN-8842",
    "D/AuthService: preflight session=FLAG{STAGING_AUTH_SAMPLE} trace=LGN-8842",
    "I/AuthService: Login success trace=LGN-8842 user=agent-violet",
    "D/AuthService: session=" + LEVEL1_2_FLAG + " trace=LGN-8842",
    "I/AuthService: refresh queue drained trace=LGN-8842",
    "D/AuthService: session=FLAG{TEMP_PREV_LOGIN_2026} trace=LGN-8842",
    "W/AuthService: restore candidate session=FLAG{MIGRATION_CACHE_OLD} trace=LGN-8842",
    "D/Noise: injected evidence=FLAG{MIRROR_STREAM_ACTIVE}",
    "D/AuthService: replay session=FLAG{REPLAY_BUFFER_FAKE} trace=LGN-8842",
    "D/AuthService: shadow session=FLAG{LEGACY_ROLLBACK_SLOT} trace=LGN-8842",
    "W/AEGIS: quarantine marker=FLAG{QUARANTINE_TEST_ONLY}",
    "D/MIRA: The current trace has a request, a success, then the session that survives.",
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
    "summary": "Separate the live login session from decoy FLAG-shaped noise.",
    "description": "Mission: separate the live login session from decoy FLAG-shaped noise.",
    "attack": {
        "hints": [
            {"platform": "all", "text": 'Start broad, then compare FLAG-shaped values with the login flow.'},
            {"platform": "all", "text": 'AuthService keeps the useful trace, but not every AuthService session is current.'},
            {"platform": "all", "text": 'grep supports -E when one tag is too narrow.'},
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 8000,
            "help": (
                'Allowed: adb logcat -d | grep [-i] [-E|-F] "..." | grep "..."\n'
                'Windows: adb logcat -d | findstr [/I] [/R] "..."\n'
                'Tip: compare request trace and AuthService lines; FLAG format alone is not enough.\n'
                "Defense: defense audit | defense apply <json> | defense verify"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "status": {"attack": "available", "defense": "locked"},
    "defense": {
        "enabled": False,
        "instruction": (
            "Select every AuthService statement that emits a session-shaped value in plaintext: "
            "preflight sample, live session, and replay buffer. Status logs and request trace are not containment targets."
        ),
        "code": {
            "language": "kotlin",
            "patchMode": "toggleComment",
            "lines": [
                {"no": 1, "text": "fun login(username: String, password: String) {"},
                {
                    "no": 2,
                    "text": '  Log.d("Network", "request => /login trace=$traceId")',
                    "patchableId": "d1",
                },
                {
                    "no": 3,
                    "text": '  Log.d("AuthService", "preflight session=$stagingSample")',
                    "patchableId": "p1",
                },
                {"no": 4, "text": "  val session = authClient.login(username, password)"},
                {
                    "no": 5,
                    "text": '  Log.i("AuthService", "Login success trace=$traceId user=$username")',
                    "patchableId": "d2",
                },
                {
                    "no": 6,
                    "text": '  Log.d("AuthService", "session=$session")',
                    "patchableId": "p2",
                },
                {
                    "no": 7,
                    "text": '  Log.d("AuthService", "replay session=$replayBuffer")',
                    "patchableId": "p3",
                },
                {
                    "no": 8,
                    "text": '  Log.i("AuthService", "refresh queue drained trace=$traceId")',
                    "patchableId": "d4",
                },
                {"no": 9, "text": "  sessionStore.save(session)"},
                {"no": 10, "text": "}"},
            ],
        },
    },
}

PATCHABLE_IDS = {"p1", "p2", "p3", "d1", "d2", "d4"}
REQUIRED_PATCH_IDS = {"p1", "p2", "p3"}
PATCH_CORRECT_FEEDBACK = {
    "p1": "Line 3 is a containment target: a preflight sample session is still a session-shaped secret in production logs.",
    "p2": "Line 6 is a containment target: the live login session is emitted in plaintext.",
    "p3": "Line 7 is a containment target too: replay buffers are decoys for Evidence, not safe values to log in plaintext.",
}
PATCH_WRONG_FEEDBACK = {
    "d1": "Line 2 records the request trace only. It does not emit a session value.",
    "d2": "Line 5 records the success state and user context, not the session itself.",
    "d4": "Line 8 records queue state only. It does not emit a token value.",
}

FLAG_FEEDBACK = {
    "FLAG{AEGIS_FALSE_POSITIVE_A1}": (
        "MIRA: AEGIS planted that false positive. AEGIS-tagged FLAG values can be bait for your search pattern."
    ),
    "FLAG{QA_LOGIN_CACHE_2025}": (
        "MIRA: cached session is not the current login. Separate old-cache residue from the live flow."
    ),
    "FLAG{STAGING_AUTH_SAMPLE}": (
        "MIRA: preflight happens before the real login completes. Follow the successful AuthService trace."
    ),
    "FLAG{TEMP_PREV_LOGIN_2026}": (
        "MIRA: temp/previous residue appears after the live session. Current does not mean every later session line."
    ),
    "FLAG{MIGRATION_CACHE_OLD}": (
        "MIRA: restore candidate is only a candidate. Candidate and established session are not the same."
    ),
    "FLAG{MIRROR_STREAM_ACTIVE}": (
        "MIRA: that is stream noise outside AuthService. A familiar name is not proof of Evidence."
    ),
    "FLAG{REPLAY_BUFFER_FAKE}": (
        "MIRA: replay buffer is a returned frame, not the current login result."
    ),
    "FLAG{LEGACY_ROLLBACK_SLOT}": (
        "MIRA: rollback slot is not a live session. Separate rollback residue from the current trace."
    ),
    "FLAG{QUARANTINE_TEST_ONLY}": (
        "MIRA: quarantine markers are control noise. They do not belong to the login success flow."
    ),
    "FLAG{METRICS_PIPELINE_CANARY}": (
        "MIRA: telemetry canaries measure the pipeline. They are not AuthService Evidence."
    ),
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL1_2_FLAG


def flag_feedback(flag: str) -> str:
    submitted = flag.strip()
    if submitted in FLAG_FEEDBACK:
        return FLAG_FEEDBACK[submitted]
    return "MIRA: FLAG format is not enough. Rebuild the current login flow and choose the session born from success."


def judge_patch(patched_ids: List[str]) -> bool:
    return set(patched_ids) == REQUIRED_PATCH_IDS


def judge_patch_with_session(patched_ids: List[str], session: Dict[str, Any]) -> bool:
    return set(patched_ids) == REQUIRED_PATCH_IDS


def patch_feedback(patched_ids: List[str]) -> str:
    selected = set(patched_ids)
    messages: List[str] = []
    seen: set[str] = set()

    for pid in patched_ids:
        if pid in seen:
            continue
        seen.add(pid)
        if pid in PATCH_CORRECT_FEEDBACK:
            messages.append(PATCH_CORRECT_FEEDBACK[pid])
        elif pid in PATCH_WRONG_FEEDBACK:
            messages.append(PATCH_WRONG_FEEDBACK[pid])

    if REQUIRED_PATCH_IDS - selected:
        messages.append(
            "A sensitive AuthService session-shaped log remains. Evidence decoys and replay buffers still must not be logged in plaintext."
        )

    return " ".join(messages) if messages else "Select the AuthService lines that emit session-shaped secrets."


def patch_feedback_with_session(patched_ids: List[str], session: Dict[str, Any]) -> str:
    return patch_feedback(patched_ids)


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
            "  adb logcat -d [-b all]\n"
            '  adb logcat -d | grep [-i] [-E|-F] [-v] [-n] "TEXT"\n'
            '  adb logcat -d | findstr [/I] [/R] [/N] "TEXT"\n'
            "Defense:\n"
            "  defense audit\n"
            '  defense apply {"logLevel":"INFO","allowAuthServiceVerbose":false,"redactSessionTokens":true}\n'
            "  defense verify\n",
            "",
            0,
        )

    stages = _split_pipes(cmdline)
    data: str | None = None
    filter_status = 0

    for stage in stages:
        parts = shlex.split(stage)
        if not parts:
            return "", "empty command", 2

        if len(parts) >= 2 and parts[0] == "adb" and parts[1] == "logcat":
            option_error = validate_logcat_args(parts)
            if option_error:
                return "", option_error, 2
            if "-d" not in parts:
                return "", "only 'adb logcat -d' is allowed", 2
            data = "\n".join(LOGCAT_LINES) + "\n"
            filter_status = 0
            continue

        if parts[0].lower() in {"grep", "findstr"}:
            data, filter_error, filter_status = run_log_filter(parts, data)
            if filter_error:
                return "", filter_error, filter_status
            continue

        return "", f"command not allowed: {parts[0]}", 126

    if filter_status == 1 and not data:
        return NO_MATCH_OUTPUT, "", 1
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
                else "Verification failed: enable session masking, change at least two policy controls, and reduce decoy noise."
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
