from __future__ import annotations

import json
import os
import re
import secrets
import shlex
from typing import Any, Dict, List, Tuple

LEVEL1_3_FLAG = os.getenv("PURPLEDROID_LEVEL1_3_FLAG", "FLAG{DEV_ONLY_LEVEL1_3}")


def _split_flag(flag: str, n: int = 3) -> List[str]:
    size = (len(flag) + n - 1) // n
    return [flag[i * size : (i + 1) * size] for i in range(n)]


def _strip_flag_wrapper(flag: str) -> str:
    if flag.startswith("FLAG{") and flag.endswith("}"):
        return flag[5:-1]
    return flag


BODY = _strip_flag_wrapper(LEVEL1_3_FLAG)
PARTS = _split_flag(BODY, 3)

LOGCAT_LINES = [
    "I/PurpleDroid: app started",
    "D/CryptoProvider: part[2]=" + PARTS[1],
    "D/CryptoProvider: part[3]=" + PARTS[2],
    "D/CryptoProvider: part[1]=" + PARTS[0],
    "I/CryptoProvider: chunk write complete",
]

DEFENSE_DEFAULT_POLICY: Dict[str, Any] = {
    "logParts": True,
    "logRecombined": True,
    "redactFlagPattern": False,
    "showStitchHint": True,
}


STATIC: Dict[str, Any] = {
    "id": "level1_3",
    "level": 1,
    "title": "1-3 Split & Stitch (Parts)",
    "summary": "플래그가 조각으로 흩어져 있다. 이어 붙여라.",
    "description": "미션: 로그에 찍힌 part[1..]를 순서대로 이어붙여 FLAG를 완성해봐.",
    "attack": {
        "hints": [
            {"platform": "windows", "text": 'adb logcat -d | findstr "CryptoProvider"'},
            {"platform": "unix", "text": 'adb logcat -d | grep "CryptoProvider"'},
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
        "enabled": False,
        "instruction": (
            "조각(part)/재결합 로그/친절 힌트를 운영 정책으로 차단하세요.\n"
            "1) defense audit\n"
            "2) defense apply {\"logParts\":false,\"logRecombined\":false,\"redactFlagPattern\":true,\"showStitchHint\":false}\n"
            "3) defense verify\n"
            "그 다음 기존 패치 제출로 완료하세요."
        ),
        "code": {
            "language": "kotlin",
            "patchMode": "toggleComment",
            "lines": [
                {"no": 1, "text": "fun debugParts(p1: String, p2: String, p3: String) {"},
                {"no": 2, "text": '  Log.d("PurpleDroid", "part[1]=$p1")', "patchableId": "p1"},
                {"no": 3, "text": '  Log.d("PurpleDroid", "part[2]=$p2")', "patchableId": "p2"},
                {"no": 4, "text": '  Log.d("PurpleDroid", "part[3]=$p3")', "patchableId": "p3"},
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


def judge_patch_with_session(patched_ids: List[str], session: Dict[str, Any]) -> bool:
    state = _defense_state(session)
    return PATCHABLE_IDS.issubset(set(patched_ids)) and bool(state.get("verified"))


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
            '  defense apply {"logParts":false,"logRecombined":false,"redactFlagPattern":true}\n'
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
    state = defense_all.setdefault("level1_3", {})
    if "policy" not in state:
        state["policy"] = dict(DEFENSE_DEFAULT_POLICY)
    state.setdefault("verified", False)
    state.setdefault("patchProof", "")
    return state


def _mask_flag_patterns(text: str) -> str:
    return re.sub(r"FLAG\s*\{[^}\n]*\}", "FLAG{REDACTED}", text, flags=re.IGNORECASE)


def _render_logs_with_policy(policy: Dict[str, Any]) -> str:
    lines: List[str] = ["I/PurpleDroid: app started"]
    if bool(policy.get("logParts", True)):
        lines.extend(
            [
                "D/CryptoProvider: part[2]=" + PARTS[1],
                "D/CryptoProvider: part[3]=" + PARTS[2],
                "D/CryptoProvider: part[1]=" + PARTS[0],
            ]
        )
    if bool(policy.get("logRecombined", True)):
        lines.append("D/CryptoProvider: recombined=FLAG{" + BODY + "}")
    if bool(policy.get("showStitchHint", True)):
        lines.append("I/CryptoProvider: (hint) stitch the parts in order")
    lines.append("I/CryptoProvider: chunk write complete")

    text = "\n".join(lines)
    if bool(policy.get("redactFlagPattern")):
        text = _mask_flag_patterns(text)
    return text + "\n"


def _defense_audit_payload(state: Dict[str, Any]) -> Dict[str, Any]:
    policy = state["policy"]
    risk: List[str] = []
    if bool(policy.get("logParts", True)):
        risk.append("PARTS_LEAK")
    if bool(policy.get("logRecombined", True)):
        risk.append("RECOMBINATION_TRACE")
    if bool(policy.get("showStitchHint", True)):
        risk.append("GUIDED_HINT_IN_PROD")
    if not bool(policy.get("redactFlagPattern")):
        risk.append("FLAG_PATTERN_NOT_REDACTED")
    return {
        "ok": True,
        "data": {
            "logParts": bool(policy.get("logParts")),
            "logRecombined": bool(policy.get("logRecombined")),
            "redactFlagPattern": bool(policy.get("redactFlagPattern")),
            "showStitchHint": bool(policy.get("showStitchHint")),
            "risk": risk,
        },
    }


def _defense_apply_payload(state: Dict[str, Any], updates: Dict[str, Any]) -> Dict[str, Any]:
    policy = state["policy"]
    for key in ("logParts", "logRecombined", "redactFlagPattern", "showStitchHint"):
        if key in updates:
            if not isinstance(updates[key], bool):
                return {"ok": False, "error": {"code": "BAD_INPUT", "message": f"{key} must be boolean"}}
            policy[key] = bool(updates[key])

    state["verified"] = False
    state["patchProof"] = ""
    changed_count = sum(1 for k, v in DEFENSE_DEFAULT_POLICY.items() if policy.get(k) != v)
    return {"ok": True, "data": {"applied": True, "policy": policy, "changedCount": changed_count}}


def _defense_verify_payload(state: Dict[str, Any]) -> Dict[str, Any]:
    policy = state["policy"]
    changed_count = sum(1 for k, v in DEFENSE_DEFAULT_POLICY.items() if policy.get(k) != v)
    rendered = _render_logs_with_policy(policy)

    part_fragment_leak = any(part and (part in rendered) for part in PARTS)
    checks = {
        "partsLoggingDisabled": not bool(policy.get("logParts", True)),
        "recombinedLoggingDisabled": not bool(policy.get("logRecombined", True)),
        "redactionEnabled": bool(policy.get("redactFlagPattern")),
        "minimumPolicyChanges": changed_count >= 2,
        "noPartPatternInLogs": "part[" not in rendered,
        "noPartFragmentsInLogs": not part_fragment_leak,
        "noFlagPatternInLogs": re.search(r"FLAG\s*\{", rendered, flags=re.IGNORECASE) is None,
    }
    verified = all(checks.values())

    if verified and not state.get("patchProof"):
        state["patchProof"] = f"P1-3-{secrets.token_hex(3).upper()}"
    state["verified"] = verified

    return {
        "ok": True,
        "data": {
            "verified": verified,
            "checks": checks,
            "changedCount": changed_count,
            "patchProof": state.get("patchProof", ""),
            "message": (
                "Parts/recombination logs are blocked and no fragment leakage remains."
                if verified
                else "검증 실패: part/recombined 차단 + 마스킹 + 최소 2개 정책 변경 조건을 만족해야 해."
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
            '  defense apply {"logParts":false,"logRecombined":false,"redactFlagPattern":true,"showStitchHint":false}\n'
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
