from __future__ import annotations

import json
import os
import re
import secrets
import shlex
from typing import Any, Dict, List, Tuple

from levels.logcat_support import NO_MATCH_OUTPUT, run_log_filter


LEVEL1_FLAG = os.getenv("PURPLEDROID_LEVEL1_1_FLAG", "FLAG{Always_Check_The_Logs_First}")

LIVE_LOGCAT_LINES = [
    "--------- beginning of main",
    "05-26 10:14:04.001 I/AEGIS-Monitor: live stream attached",
    "05-26 10:14:04.003 W/AEGIS-Monitor: volatile channel unstable",
    "05-26 10:14:04.006 D/AndroidRuntime: GC freed 2048 objects",
    "05-26 10:14:04.009 I/PurpleDroid: diagnostic shell heartbeat",
    "05-26 10:14:04.011 D/MIRA: ...Violet... signal weak... can you hear me?",
    "05-26 10:14:04.016 D/RouteSync: checkpoint=abandoned-node-17 live=false",
    "05-26 10:14:04.019 I/AndroidSystem: battery stats checkpoint",
    "05-26 10:14:04.024 W/AEGIS-Monitor: live tail contains normalized frames",
    "05-26 10:14:04.028 D/PurpleDroid: noise frame id=PD-NOISE-1024",
    "05-26 10:14:04.031 D/MIRA: ...live stream... distorted... retained...",
    "05-26 10:14:04.038 W/AEGIS-Monitor: stream replay detected",
    "05-26 10:14:04.047 D/RouteSync: checkpoint=no-secret-visible",
    "05-26 10:14:04.051 W/AEGIS-Monitor: snapshot evidence missing",
    "05-26 10:14:04.064 I/AEGIS-Monitor: live stream throttled",
]

MAIN_BUFFER_LINES = [
    "--------- beginning of main",
    "05-26 10:14:01.102 I/BootReceiver: android.intent.action.BOOT_COMPLETED",
    "05-26 10:14:01.231 I/PurpleDroid: diagnostic shell attached",
    "05-26 10:14:01.388 D/RouteSync: node=abandoned-17 retained_buffer=main",
    "05-26 10:14:01.407 I/Analytics: screen=GhostLog event=briefing_opened",
    "05-26 10:14:01.533 D/MIRA: Violet, AEGIS is bending the live stream.",
    "05-26 10:14:01.612 W/AEGIS: purge report accepted for main buffer",
    "05-26 10:14:01.704 D/MIRA: main is clearer, but one frame is still missing.",
    "05-26 10:14:01.809 D/Auth: sessionToken=debug-session-7f19",
    "05-26 10:14:02.004 I/PurpleDroid: delivery worker idle",
    "05-26 10:14:02.118 V/Perf: frameTime=16ms",
    "05-26 10:14:02.260 D/MIRA: residue handoff unresolved.",
]

ALL_BUFFER_LINES = [
    "--------- beginning of main",
    "05-26 10:14:01.102 I/BootReceiver: android.intent.action.BOOT_COMPLETED",
    "05-26 10:14:01.231 I/PurpleDroid: diagnostic shell attached",
    "05-26 10:14:01.388 D/RouteSync: node=abandoned-17 retained_buffer=main",
    "05-26 10:14:01.407 I/Analytics: screen=GhostLog event=briefing_opened",
    "05-26 10:14:01.533 D/MIRA: Violet, AEGIS is bending the live stream.",
    "05-26 10:14:01.612 W/AEGIS: purge report accepted for main buffer",
    "05-26 10:14:01.704 D/MIRA: main is clearer, but one frame is still missing.",
    "05-26 10:14:01.809 D/Auth: sessionToken=debug-session-7f19",
    "05-26 10:14:02.004 I/PurpleDroid: delivery worker idle",
    "--------- beginning of system",
    "05-26 10:14:02.211 I/SystemServer: buffer handoff complete",
    "05-26 10:14:02.230 W/AEGIS: secondary buffer inventory masked",
    "05-26 10:14:02.244 D/MIRA: system remembers the path. events remembers the reason.",
    "05-26 10:14:02.281 D/RouteSync: buffer_chain=main/system/events/crash",
    "05-26 10:14:02.319 I/PackageManager: stale diagnostic package ignored",
    "--------- beginning of events",
    "05-26 10:14:02.401 I/auditd: purge claim accepted actor=AEGIS",
    "05-26 10:14:02.433 D/MemoryResidue: shard_origin=abandoned-node-17",
    "05-26 10:14:02.452 W/AEGIS: contradiction window=0.3ms",
    "05-26 10:14:02.489 D/MIRA: do not isolate my tag. Read the context around it.",
    "05-26 10:14:02.531 I/EventLog: residue index forwarded to crash mirror",
    "--------- beginning of crash",
    "05-26 10:14:03.002 E/CrashMirror: recovered diagnostic fragment",
    "05-26 10:14:03.031 W/MIRA: VIOLET, the missing frame is adjacent.",
    "05-26 10:14:03.044 D/CrashMirror: recovered_evidence=" + LEVEL1_FLAG,
    "05-26 10:14:03.088 W/AEGIS: residue disclosure classified as impossible",
]

LOGCAT_LINES = ALL_BUFFER_LINES

DEFENSE_DEFAULT_POLICY: Dict[str, Any] = {
    "logLevel": "DEBUG",
    "redactFlagPattern": False,
    "allowDebugTag": True,
}


STATIC: Dict[str, Any] = {
    "id": "level1",
    "level": 1,
    "title": "1-1 Logcat Leak",
    "summary": "Follow the weak MIRA signal and recover Evidence from retained Android buffers.",
    "description": "Mission: follow the weak MIRA signal and recover Evidence from retained Android buffers.",
    "attack": {
        "hints": [
            {"platform": "all", "text": "Compare the live log stream with a retained dump."},
            {"platform": "all", "text": "MIRA is a guide signal; tag filters may clip context."},
            {"platform": "all", "text": "If main is incomplete, inspect a wider buffer scope."},
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 8000,
            "help": (
                'Allowed: adb logcat [-d] [-b <buffer>] [-s <tag>] | grep [-i] [-E|-F] "..." | grep "..."\n'
                'Windows: adb logcat -d | findstr [/I] [/R] "..."\n'
                "Note: tag filters narrow context; use them carefully.\n"
                "Defense: defense audit | defense apply <json> | defense verify"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "instruction": (
            "Select the two log statements that emit recovered evidence or a session token in plaintext. "
            "This first mission uses code-line containment only."
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
                    "text": '  Log.i("Analytics", "screen=GhostLog")',
                    "patchableId": "d1",
                },
                {
                    "no": 5,
                    "text": '  Log.w("MIRA", "missing frame is adjacent")',
                    "patchableId": "d2",
                },
                {
                    "no": 6,
                    "text": '  Log.d("CrashMirror", "recovered_evidence=$evidenceShard")',
                    "patchableId": "p1",
                },
                {
                    "no": 7,
                    "text": '  Log.d("Auth", "sessionToken=$sessionToken")',
                    "patchableId": "p2",
                },
                {
                    "no": 8,
                    "text": '  Log.v("Perf", "frameTime=16ms")',
                    "patchableId": "d3",
                },
                {"no": 9, "text": "  startWorkers()"},
                {"no": 10, "text": "}"},
            ],
        },
    },
}

PATCHABLE_IDS = {"p1", "p2", "d1", "d2", "d3"}
REQUIRED_PATCH_IDS = {"p1", "p2"}
PATCH_CORRECT_FEEDBACK = {
    "p1": "Line 6 is a real containment target: CrashMirror emits recovered evidence directly.",
    "p2": "Line 7 is a real containment target: sessionToken is an authentication secret.",
}
PATCH_WRONG_FEEDBACK = {
    "d1": "Line 4 is ordinary analytics metadata. It does not emit a secret value.",
    "d2": "Line 5 is guidance from MIRA. It does not emit evidence or an authentication token.",
    "d3": "Line 8 is performance telemetry. It does not expose evidence or sessionToken.",
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL1_FLAG


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
            "A sensitive log path remains. Block both the recovered evidence emission and the sessionToken emission."
        )

    return " ".join(messages) if messages else "Select the lines that emit secrets, not guidance or telemetry."


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


LOG_TAG_RE = re.compile(r"(?:^|\s)[VDIWEF]/([^:]+):")


def _parse_logcat_options(parts: List[str]) -> Tuple[Dict[str, Any], str]:
    options: Dict[str, Any] = {"dump": False, "buffers": [], "tags": []}
    i = 2
    while i < len(parts):
        arg = parts[i]
        if arg in {"-c", "--clear"}:
            return options, (
                "adb logcat: buffer clearing (-c) is disabled in the training console. "
                "Logs were not changed. Use -d to read a retained dump."
            )
        if arg == "-d":
            options["dump"] = True
            i += 1
            continue
        if arg == "-b":
            if i + 1 >= len(parts):
                return options, "adb logcat: -b requires a buffer name."
            options["buffers"].append(parts[i + 1].strip().lower())
            i += 2
            continue
        if arg.startswith("--buffer="):
            options["buffers"].append(arg.split("=", 1)[1].strip().lower())
            i += 1
            continue
        if arg == "-s":
            if i + 1 >= len(parts):
                return options, "adb logcat: -s requires a tag name."
            options["tags"].append(parts[i + 1].split(":", 1)[0].strip())
            i += 2
            continue
        if arg == "-v":
            if i + 1 >= len(parts):
                return options, "adb logcat: -v requires a format name."
            i += 2
            continue
        if arg.startswith("--format="):
            i += 1
            continue
        return (
            options,
            f"adb logcat: unsupported option or argument '{arg}'. Supported: -d, -b <buffer>, -s <tag>, -v <format>",
        )
    return options, ""


def _line_tag(line: str) -> str:
    match = LOG_TAG_RE.search(line)
    return match.group(1) if match else ""


def _filter_logcat_tags(lines: List[str], tags: List[str]) -> List[str]:
    if not tags:
        return list(lines)

    wanted = {tag.upper() for tag in tags if tag}
    filtered: List[str] = []
    pending_header = ""
    for line in lines:
        if line.startswith("--------- beginning of "):
            pending_header = line
            continue

        if _line_tag(line).upper() not in wanted:
            continue

        if pending_header:
            filtered.append(pending_header)
            pending_header = ""
        filtered.append(line)
    return filtered


def _select_logcat_lines(options: Dict[str, Any]) -> Tuple[List[str], str, int]:
    buffers = set(options.get("buffers") or [])
    tags = options.get("tags") or []
    uses_all_buffers = "all" in buffers

    if not options.get("dump"):
        lines = _filter_logcat_tags(LIVE_LOGCAT_LINES, tags)
        return (
            lines,
            "AEGIS: live log stream is polluted; buffered snapshot acquisition required\n",
            2,
        )

    if uses_all_buffers:
        lines = _filter_logcat_tags(ALL_BUFFER_LINES, tags)
        if any(str(tag).upper() == "MIRA" for tag in tags):
            lines.append(
                "05-26 10:14:03.112 D/MIRA: tag isolation clipped the evidence line. Keep the wider dump; loosen the filter."
            )
        return lines, "", 0

    lines = _filter_logcat_tags(MAIN_BUFFER_LINES, tags)
    if any(str(tag).upper() == "MIRA" for tag in tags):
        lines.append("05-26 10:14:02.311 D/MIRA: my voice is clearer, but evidence is context. Tag filters cut too tightly.")
    else:
        lines.append("05-26 10:14:02.333 W/MIRA: main dump recovered. Residue index unresolved.")
    return lines, "", 0


def _run_attack_terminal(command: str) -> Tuple[str, str, int]:
    cmdline = command.strip()
    if not cmdline:
        return "", "", 0

    if cmdline in ("help", "?", "h"):
        return (
            "Allowed:\n"
            "  adb logcat\n"
            "  adb logcat -d\n"
            "  adb logcat -d -b <buffer>\n"
            "  adb logcat -d -s <tag>\n"
            '  adb logcat -d -b <buffer> | grep [-i] [-E|-F] [-v] [-n] "TEXT"\n'
            '  adb logcat -d -b <buffer> | findstr [/I] [/R] [/N] "TEXT"\n'
            "Note:\n"
            "  Tag filters narrow context. A cleaner signal can still hide adjacent evidence.\n"
            "Defense:\n"
            "  defense audit\n"
            '  defense apply {"logLevel":"INFO","redactFlagPattern":true,"allowDebugTag":false}\n'
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
            options, option_error = _parse_logcat_options(parts)
            if option_error:
                return "", option_error, 2
            lines, stderr, exit_code = _select_logcat_lines(options)
            data = "\n".join(lines) + ("\n" if lines else "")
            filter_status = exit_code
            if stderr and len(stages) == 1:
                return data, stderr, exit_code
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
    state = defense_all.setdefault("level1", {})
    if "policy" not in state:
        state["policy"] = dict(DEFENSE_DEFAULT_POLICY)
    state.setdefault("verified", False)
    state.setdefault("patchProof", "")
    return state


def _mask_flag_patterns(text: str) -> str:
    return re.sub(r"FLAG\s*\{[^}\n]*\}", "FLAG{REDACTED}", text, flags=re.IGNORECASE)


def _log_priority(line: str) -> str:
    match = re.search(r"(?:^|\s)([VDIWEF])/", line)
    return match.group(1) if match else ""


def _render_logs_with_policy(policy: Dict[str, Any]) -> str:
    out: List[str] = []
    for ln in LOGCAT_LINES:
        if str(policy.get("logLevel", "DEBUG")).upper() == "INFO" and _log_priority(ln) in {"V", "D"}:
            continue
        if not bool(policy.get("allowDebugTag", True)) and "/CrashMirror:" in ln:
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
        risk.append("CRASH_MIRROR_EVIDENCE_ALLOWED")
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
                else "Verification failed: change at least two policy controls, disable DEBUG-level emission, and redact FLAG patterns."
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
