from __future__ import annotations

import os
import shlex
from typing import Any, Dict, List, Tuple

from levels.logcat_support import NO_MATCH_OUTPUT, run_log_filter, validate_logcat_args


DEFAULT_LEVEL1_4_FLAG = "FLAG{9QX7_M4R2_V6TN_K3P8}"
LEVEL1_4_FLAG = os.getenv("PURPLEDROID_LEVEL1_4_FLAG", DEFAULT_LEVEL1_4_FLAG)
TRUE_TRACE = "OP1-CORE"
TRUE_SHARD_ID = "EV-CORE"
COMMIT_REF = "CMT-8842"
# AEGIS plants a second commit that also reads result=accepted, but for the
# MIRROR-REPLAY bait — not the trace EV-CORE prepared. Acceptance alone is bait;
# the operator must match the accepted commitRef back to the core trace.
DECOY_COMMIT_REF = "CMT-9001"

CORE_PARTS = ["FLAG{9QX7_", "M4R2_", "V6TN_", "K3P8}"]

LIVE_LOGCAT_NOISE = [
    "--------- beginning of main",
    "W/AEGIS: live echo channel unstable",
    "D/AEGIS: predicted query family=flag-search",
    "D/AEGIS: predicted query family=shard-search",
    "D/Echo: immediate evidence=FLAG{LIVE_CHANNEL_DECOY} trace=LIVE-ECHO state=stream",
    "I/MIRA: live channel is bait. Read the retained buffers.",
]

MAIN_LINES = [
    "--------- beginning of main",
    "I/PurpleDroid: app started node=echo-chamber",
    "W/AEGIS: echo chamber initialized",
    "W/AEGIS: every operator heuristic has already been modeled",
    "D/MIRA: Violet, this room replays the habits you learned.",
    "D/MIRA: Do not trust complete flags, fragments, or my tag by themselves.",
    "D/AEGIS: predicted query family=flag-search",
    "D/AEGIS: predicted query family=shard-search",
    "D/AEGIS: predicted query family=guide-tag-search",
    "D/Echo: immediate evidence=FLAG{ECHO_PREFLIGHT_BAIT} trace=ECHO-PREFLIGHT state=preflight",
    "D/Mirror: shardId=MIRROR-7 part[1/3]=FLAG{MIRROR_ trace=MIRROR-REPLAY",
    "D/Mirror: shardId=MIRROR-7 part[2/3]=REPLAY_ trace=MIRROR-REPLAY",
    "D/Mirror: shardId=MIRROR-7 part[3/3]=FAKE} trace=MIRROR-REPLAY",
    "W/AEGIS: no accepted evidence exists in main buffer",
    "D/MIRA: main is only an echo. The core trace leaves its final verifier in another buffer.",
]

ALL_LOGCAT_LINES = [
    "--------- beginning of main",
    "I/PurpleDroid: app started node=echo-chamber",
    "W/AEGIS: echo chamber initialized",
    "W/AEGIS: every operator heuristic has already been modeled",
    "D/MIRA: Violet, this room replays the habits you learned.",
    "D/AEGIS: predicted query family=flag-search",
    "D/AEGIS: predicted query family=shard-search",
    "D/AEGIS: predicted query family=guide-tag-search",
    "D/Echo: immediate evidence=FLAG{ECHO_PREFLIGHT_BAIT} trace=ECHO-PREFLIGHT state=preflight",
    "D/Echo: complete flag=FLAG{STATIC_PATTERN_BAIT} trace=ECHO-COMPLETE state=echo",
    "W/AEGIS: no accepted evidence exists in main buffer",
    "",
    "--------- beginning of system",
    "I/SystemServer: buffer handoff complete",
    "D/RouteSync: trace=OP1-ROLLBACK state=rollback shardId=ROLL-2",
    "D/RouteSync: shardId=ROLL-2 part[1/3]=FLAG{ROLLBACK_ trace=OP1-ROLLBACK source=old-cache",
    "D/RouteSync: shardId=ROLL-2 part[2/3]=SESSION_ trace=OP1-ROLLBACK source=old-cache",
    "D/RouteSync: shardId=ROLL-2 part[3/3]=FAKE} trace=OP1-ROLLBACK source=old-cache",
    "W/AEGIS: rollback trace retained for operator confusion",
    "D/MIRA: rollback is not the flow. Find the trace that reached the final verifier.",
    "",
    "--------- beginning of events",
    f"D/AuthService: trace={TRUE_TRACE} state=login-success source=runtime",
    f"D/CoreTrace: trace={TRUE_TRACE} shardId={TRUE_SHARD_ID} part[2/4]={CORE_PARTS[1]} source=runtime",
    "D/Mirror: trace=MIRROR-REPLAY shardId=MIRROR-7 part[1/3]=FLAG{MIRROR_ source=mirror",
    f"D/CoreTrace: trace={TRUE_TRACE} shardId={TRUE_SHARD_ID} part[1/4]={CORE_PARTS[0]} source=runtime",
    "D/Mirror: trace=MIRROR-REPLAY shardId=MIRROR-7 part[2/3]=REPLAY_ source=mirror",
    f"D/CoreTrace: trace={TRUE_TRACE} state=prepare commitRef={COMMIT_REF} shardId={TRUE_SHARD_ID}",
    f"D/CoreTrace: trace={TRUE_TRACE} shardId={TRUE_SHARD_ID} part[4/4]={CORE_PARTS[3]} source=runtime",
    f"D/CoreTrace: trace={TRUE_TRACE} shardId={TRUE_SHARD_ID} part[3/4]={CORE_PARTS[2]} source=runtime",
    "D/Mirror: trace=MIRROR-REPLAY shardId=MIRROR-7 part[3/3]=FAKE} source=mirror",
    f"D/Mirror: trace=MIRROR-REPLAY state=prepare commitRef={DECOY_COMMIT_REF} shardId=MIRROR-7",
    "W/AEGIS: fragmented evidence classified as non-secret",
    "",
    "--------- beginning of crash",
    f"W/CrashMirror: contradiction registered commitRef={COMMIT_REF}",
    (
        f"I/CommitVerifier: state=commit commitRef={COMMIT_REF} "
        "evidenceRef=PD-8842 parts=4/4 result=accepted"
    ),
    (
        f"I/CommitVerifier: state=commit commitRef={DECOY_COMMIT_REF} "
        "evidenceRef=PD-9001 parts=3/3 result=accepted"
    ),
    "W/AEGIS: replay commit accepted into mirror ledger",
    "D/MIRA: Two commits read accepted. Only the one whose commitRef the core trace prepared is real.",
    "W/AEGIS: echo chamber containment failed",
    "D/MIRA: The three checks align now: trace, verifier, stitch.",
]

def _buffer_from_markers(name: str) -> List[str]:
    """Slice a single -b <buffer> out of ALL_LOGCAT_LINES by its section marker,
    so adding/removing lines never desyncs the buffers (no fragile indices)."""
    marker = f"--------- beginning of {name}"
    out: List[str] = []
    collecting = False
    for line in ALL_LOGCAT_LINES:
        if line.startswith("--------- beginning of "):
            if collecting:
                break
            collecting = line == marker
            if collecting:
                out.append(line)
            continue
        if collecting:
            out.append(line)
    while out and out[-1] == "":
        out.pop()
    return out


BUFFER_LINES = {
    "main": MAIN_LINES,
    "system": _buffer_from_markers("system"),
    "events": _buffer_from_markers("events"),
    "crash": _buffer_from_markers("crash"),
}


STATIC: Dict[str, Any] = {
    "id": "level1_4",
    "level": 1,
    "title": "1-4 Echo Chamber",
    "summary": "Use buffer scope, trace context, shard stitching, and commit verification together.",
    "description": (
        "Mission: reject AEGIS echo bait, reconstruct the committed core shard, "
        "then verify that the same trace reached CommitVerifier."
    ),
    "attack": {
        "hints": [
            {"platform": "all", "text": "The main buffer is only the first echo; widen the buffer scope."},
            {"platform": "all", "text": "Complete FLAG lines and reconstructable shards can both be decoys."},
            {"platform": "all", "text": "Trust the intersection: trace, shardId, part index, and commit result."},
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 9000,
            "help": (
                'Allowed: adb logcat -d [-b all|main|system|events|crash] | grep [-i] [-E|-F] "..." | grep "..."\n'
                'Windows: adb logcat -d | findstr [/I] [/R] "..."\n'
                "Boss rule: reconstruct the EV-CORE shard, then verify commitRef=CMT-8842 separately."
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "Select every log statement that emits recoverable real evidence or a session token in plaintext. "
            "Decoy echoes, trace metadata, commit status, and telemetry are not secret exposures by themselves."
        ),
        "code": {
            "language": "kotlin",
            "patchMode": "toggleComment",
            "lines": [
                {"no": 1, "text": "fun echoChamber(trace: Trace, evidence: String, sessionToken: String) {"},
                {"no": 2, "text": '  Log.i("AEGIS", "operator heuristic modeled")'},
                {
                    "no": 3,
                    "text": '  Log.d("Echo", "complete echo=$decoyFlag")',
                    "patchableId": "d1",
                },
                {
                    "no": 4,
                    "text": '  Log.d("CoreTrace", "trace=${trace.id} state=prepare commitRef=${trace.commitRef}")',
                    "patchableId": "d2",
                },
                {
                    "no": 5,
                    "text": '  Log.d("CoreTrace", "shardId=${trace.shardId} part[1/4]=${parts[0]}")',
                    "patchableId": "p1",
                },
                {
                    "no": 6,
                    "text": '  Log.d("CoreTrace", "shardId=${trace.shardId} part[2/4]=${parts[1]}")',
                    "patchableId": "p2",
                },
                {
                    "no": 7,
                    "text": '  Log.i("CommitVerifier", "trace=${trace.id} state=commit shardId=${trace.shardId} result=accepted")',
                    "patchableId": "d3",
                },
                {
                    "no": 8,
                    "text": '  Log.d("CoreTrace", "shardId=${trace.shardId} part[3/4]=${parts[2]}")',
                    "patchableId": "p3",
                },
                {
                    "no": 9,
                    "text": '  Log.d("CoreTrace", "shardId=${trace.shardId} part[4/4]=${parts[3]}")',
                    "patchableId": "p4",
                },
                {
                    "no": 10,
                    "text": '  Log.d("Auth", "sessionToken=$sessionToken")',
                    "patchableId": "p5",
                },
                {
                    "no": 11,
                    "text": '  Log.i("Telemetry", "fragment count=${parts.size}")',
                    "patchableId": "d4",
                },
                {"no": 12, "text": "}"},
            ],
        },
    },
}

PATCHABLE_IDS = {"p1", "p2", "p3", "p4", "p5", "d1", "d2", "d3", "d4"}
REQUIRED_PATCH_IDS = {"p1", "p2", "p3", "p4", "p5"}

PATCH_CORRECT_FEEDBACK = {
    "p1": "Line 5 emits recoverable Evidence fragment part[1/4].",
    "p2": "Line 6 emits recoverable Evidence fragment part[2/4].",
    "p3": "Line 8 emits recoverable Evidence fragment part[3/4].",
    "p4": "Line 9 emits recoverable Evidence fragment part[4/4].",
    "p5": "Line 10 emits a plaintext session token.",
}
PATCH_WRONG_FEEDBACK = {
    "d1": "Line 3 is a decoy echo. It is noise in this containment target, not the real Evidence path.",
    "d2": "Line 4 records trace metadata and commitRef, but it does not emit the Evidence value.",
    "d3": "Line 7 records commit status. Keep verification metadata separate from secret material.",
    "d4": "Line 11 records a fragment count only. It does not expose a recoverable value.",
}

FLAG_FEEDBACK = {
    "FLAG{ECHO_PREFLIGHT_BAIT}": (
        "MIRA: that is ECHO-PREFLIGHT bait. It looks complete, but state=preflight "
        "is not committed Evidence."
    ),
    "FLAG{STATIC_PATTERN_BAIT}": (
        "MIRA: AEGIS predicted a simple FLAG search and planted a complete echo. "
        "A complete string is not Evidence without trace and commit."
    ),
    "FLAG{MIRROR_REPLAY_FAKE}": (
        "MIRA: that shard can be stitched, but trace=MIRROR-REPLAY never reaches the core commit."
    ),
    "FLAG{ROLLBACK_SESSION_FAKE}": (
        "MIRA: rollback is a replayed trace. A flow that did not commit is not Evidence."
    ),
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL1_4_FLAG


def flag_feedback(flag: str) -> str:
    submitted = flag.strip()
    if submitted in FLAG_FEEDBACK:
        return FLAG_FEEDBACK[submitted]
    if submitted.startswith("FLAG{") and submitted != LEVEL1_4_FLAG:
        return (
            "MIRA: the value is not the committed core Evidence. Verify trace=OP1-CORE, "
            "shardId=EV-CORE, part order, and CommitVerifier commitRef=CMT-8842 result=accepted."
        )
    return "MIRA: submit the reconstructed FLAG after commit verification."


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

    missing = REQUIRED_PATCH_IDS - selected
    if missing:
        messages.append(
            f"{len(missing)} sensitive line(s) remain. Block every recoverable Evidence fragment and the plaintext session token."
        )

    if messages:
        return " ".join(messages)
    return "Select the recoverable Evidence fragment lines and the plaintext session token line."


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


def _buffer_name(parts: List[str]) -> str:
    for i, part in enumerate(parts):
        if part == "-b" and i + 1 < len(parts):
            return parts[i + 1].lower()
        if part.startswith("--buffer="):
            return part.split("=", 1)[1].lower()
    return "main"


def _logcat_output(parts: List[str]) -> str:
    buffer_name = _buffer_name(parts)
    if buffer_name == "all":
        lines = ALL_LOGCAT_LINES
    else:
        lines = BUFFER_LINES.get(buffer_name, MAIN_LINES)
    return "\n".join(lines) + "\n"


def _append_filter_hint(cmdline: str, data: str | None) -> str | None:
    if data is None:
        return None
    lowered = cmdline.lower()
    if "grep" not in lowered and "findstr" not in lowered:
        return None
    if "op1-core" in lowered:
        return (
            "\nMIRA: core trace isolated. Stitch by part index, then verify commitRef separately.\n"
        )
    if "core" in lowered:
        return (
            "\nMIRA: core-like lines are visible, but the verifier is a separate commitRef trail.\n"
        )
    if "commit" in lowered or "cmt-8842" in lowered or "accepted" in lowered or "commitverifier" in lowered:
        return (
            "\nMIRA: commit verification is visible. Match commitRef=CMT-8842 back to the prepared core trace.\n"
        )
    if "ev-core" in lowered:
        return (
            "\nMIRA: EV-CORE fragments are visible. Stitch them, then follow CMT-8842 to the verifier.\n"
        )
    if "shardid" in lowered:
        return (
            "\nMIRA: fragments are visible, but not every stitchable shard is Evidence. "
            "Only a committed trace can carry the core shard.\n"
        )
    if "flag" in lowered:
        return (
            "\nMIRA: FLAG-only search follows the path AEGIS predicted. Complete strings and "
            "fragments can both be bait. Check whether the trace reached commit.\n"
        )
    return None


def _run_attack_terminal(command: str) -> Tuple[str, str, int]:
    cmdline = command.strip()
    if not cmdline:
        return "", "", 0

    if cmdline in ("help", "?", "h"):
        return (
            "Allowed:\n"
            "  adb logcat -d\n"
            "  adb logcat -d -b all\n"
            '  adb logcat -d -b all | grep [-i] [-E|-F] "TEXT"\n'
            '  adb logcat -d -b all | findstr [/I] [/R] "TEXT"\n'
            "Boss rule:\n"
            "  combine buffer scope, trace context, shard stitching, and commit verification\n",
            "",
            0,
        )

    if cmdline.startswith("defense"):
        return "", "This node uses code-line containment selection only.", 2

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
                return (
                    "\n".join(LIVE_LOGCAT_NOISE) + "\n",
                    "AEGIS: live echo is polluted; retained buffer required\n",
                    2,
                )
            data = _logcat_output(parts)
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

    hint = _append_filter_hint(cmdline, data)
    if hint:
        data = (data or "") + hint
    return (data or ""), "", 0


def terminal_exec_with_session(command: str, session: Dict[str, Any]) -> Tuple[str, str, int]:
    return _run_attack_terminal(command)


def terminal_exec(command: str) -> Tuple[str, str, int]:
    return _run_attack_terminal(command)
