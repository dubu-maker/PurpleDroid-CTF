from __future__ import annotations

import json
import os
import re
import secrets
import shlex
from typing import Any, Dict, List, Tuple

from levels.logcat_support import NO_MATCH_OUTPUT, run_log_filter, validate_logcat_args

DEFAULT_LEVEL1_3_FLAG = "FLAG{SPLIT_AND_STITCH}"
LEVEL1_3_FLAG = os.getenv("PURPLEDROID_LEVEL1_3_FLAG", DEFAULT_LEVEL1_3_FLAG)
TRUE_SHARD_ID = "EV-031"


def _split_flag(flag: str, n: int = 4) -> List[str]:
    size = (len(flag) + n - 1) // n
    return [flag[i * size : (i + 1) * size] for i in range(n)]


def _build_true_parts(flag: str) -> List[str]:
    if flag == DEFAULT_LEVEL1_3_FLAG:
        return ["FLAG{SP", "LIT_AN", "D_STIT", "CH}"]
    parts = _split_flag(flag, 4)
    return parts + [""] * (4 - len(parts))


PARTS = _build_true_parts(LEVEL1_3_FLAG)

# Storage/crypto-flavored Android spam. Different axis from 1-2: here the dump shows
# every fragment, but it is flooded + truncates so print order is unreadable by eye.
# None of these contain the grep keywords (shardId / part / FLAG / EV-031 / runtime),
# so a sane filter isolates a group cleanly; the skill is grouping + reordering, not
# scope (1-1) or decoy-vs-live correlation (1-2).
NOISE_LINES = [
    "I/Keystore2: keystore unlocked alias=evidence-kek",
    "D/StorageManager: mounted volume emulated/0 state=mounted",
    "I/Vold: Disk created /dev/block/vold",
    "D/FuseDaemon: node lookup cache hit ratio=0.92",
    "I/art: Compiler allocated 12MB to compile void main()",
    "D/Zip: extracted assets/manifest.bin",
    "W/FileUtils: fsync took 31ms",
    "I/SQLiteConnection: prepare statement pool size=8",
    "D/JobScheduler: ready jobs reevaluated count=3",
    "I/PackageManager: dexopt complete pkg=com.purpledroid",
    "D/NetworkSecurityConfig: using platform default trust anchors",
    "I/KeyStore: grant alias to uid=10044",
    "D/EGL_emulation: eglMakeCurrent context=0x7f",
    "W/MemoryLeakMonitor: watched object retained 1",
    "I/BatteryStatsService: noteEvent collect",
    "D/Telephony: SIM state LOADED",
    "I/AlarmManager: rescheduling 2 alarms",
    "D/AudioFlinger: mixer thread standby",
    "I/WindowManager: addWindow Window{c3d4}",
    "V/SensorService: flush accelerometer",
    "I/DropBoxManager: add tag=event_data",
    "D/ConnectivityService: reporting NetworkCapabilities",
    "I/UsageStats: flush to disk pending=4",
    "W/ResourcesCompat: Failed to inflate drawable cached",
    "I/InputReader: device added id=5",
    "D/GnssLocationProvider: report location batch=0",
]

LOGCAT_LINES = (
    [
        "I/PurpleDroid: app started node=split-stitch",
        "W/AEGIS: fragmentation protocol active",
        "D/MIRA: No complete string does not mean no evidence. The channel is flooded; group related fragments.",
    ]
    + NOISE_LINES[0:5]
    + [
        "D/Noise: shardId=DECOY-7 part[1/4]=FLAG{BR source=decoy",
        f"D/CryptoProvider: shardId={TRUE_SHARD_ID} part[2/4]=" + PARTS[1] + " trace=FRG-8842 source=runtime",
        "D/StagingCache: shardId=TMP-3 part[3/4]=FT_ON source=staging-draft",
    ]
    + NOISE_LINES[5:10]
    + [
        "D/CacheWarmup: shardId=OLD-2 part[3/4]=OLLBAC source=old-cache",
        "D/AuthService: checkpoint=login-success trace=FRG-8842",
        f"D/RouteSync: shardId={TRUE_SHARD_ID} part[1/4]=" + PARTS[0] + " trace=FRG-8842 source=runtime",
        "D/Telemetry: sample flag=FLAG{METRICS_CANARY} source=metrics",
        "D/StagingCache: shardId=TMP-3 part[1/4]=FLAG{TM source=staging-draft",
    ]
    + NOISE_LINES[10:15]
    + [
        "D/CacheWarmup: shardId=OLD-2 part[2/4]=GACY_R source=old-cache",
        "D/Noise: shardId=DECOY-7 part[3/4]=TITCH_ source=decoy",
        "W/AEGIS: no complete secret exists in this channel",
        "D/MIRA: Do not chase a complete secret line. Compare grouping and part index.",
        "D/StagingCache: shardId=TMP-3 part[2/4]=P_DRA source=staging-draft",
    ]
    + NOISE_LINES[15:19]
    + [
        f"D/CryptoProvider: shardId={TRUE_SHARD_ID} part[4/4]=" + PARTS[3] + " trace=FRG-8842 source=runtime",
        "D/Noise: shardId=DECOY-7 part[2/4]=OKEN_S source=decoy",
        "D/CacheWarmup: shardId=OLD-2 part[1/4]=FLAG{LE source=old-cache",
        f"D/RouteSync: shardId={TRUE_SHARD_ID} part[3/4]=" + PARTS[2] + " trace=FRG-8842 source=runtime",
    ]
    + NOISE_LINES[19:23]
    + [
        "D/Noise: shardId=DECOY-7 part[4/4]=FAKE} source=decoy",
        "D/StagingCache: shardId=TMP-3 part[4/4]=LY} source=staging-draft",
        "D/CacheWarmup: shardId=OLD-2 part[4/4]=K_STALE} source=old-cache",
    ]
    + NOISE_LINES[23:26]
    + [
        f"I/CryptoProvider: chunk write complete shardId={TRUE_SHARD_ID} parts=4/4",
        "W/AEGIS: fragmented evidence classified as non-secret",
    ]
)

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
    "summary": "Reconstruct a secret that survived as indexed log fragments.",
    "description": "Mission: group related fragments by shardId, then stitch them by part index.",
    "attack": {
        "hints": [
            {"platform": "all", "text": 'The dump is flooded and truncates, and no single line is complete. Filter to one shardId; do not scroll.'},
            {"platform": "all", "text": 'Several shards look similar (DECOY-7, OLD-2, TMP-3, EV-031). Fragments with the same shardId belong together; log order is not part order.'},
            {"platform": "all", "text": f'Isolate {TRUE_SHARD_ID} (the runtime shard), then reorder part[1/4]..part[4/4] yourself.'},
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 1500,
            "help": (
                'Allowed: adb logcat -d | grep [-i] [-E|-F] [-v] [-n] "..." | grep "..."\n'
                'Windows: adb logcat -d | findstr [/I] [/R] [/N] "..."\n'
                "Tip: the raw dump is too big to read (it truncates). Group by shardId\n"
                "     (e.g. adb logcat -d | grep EV-031), then rebuild by part[n/m], not print order.\n"
                "Defense: defense audit | defense apply <json> | defense verify"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "Select every log statement that emits a recoverable Evidence fragment. "
            "A fragment is still sensitive if related log lines can reconstruct the full value."
        ),
        "code": {
            "language": "kotlin",
            "patchMode": "toggleComment",
            "lines": [
                {"no": 1, "text": "fun writeFragments(evidence: String, shardId: String) {"},
                {"no": 2, "text": "  val parts = evidence.chunked(8)"},
                {
                    "no": 3,
                    "text": '  Log.d("CryptoProvider", "shardId=$shardId part[2/4]=${parts[1]}")',
                    "patchableId": "p2",
                },
                {
                    "no": 4,
                    "text": '  Log.d("RouteSync", "shardId=$shardId part[1/4]=${parts[0]}")',
                    "patchableId": "p1",
                },
                {
                    "no": 5,
                    "text": '  Log.d("Telemetry", "sample flag=FLAG{METRICS_CANARY}")',
                    "patchableId": "d1",
                },
                {
                    "no": 6,
                    "text": '  Log.d("CryptoProvider", "shardId=$shardId part[4/4]=${parts[3]}")',
                    "patchableId": "p4",
                },
                {
                    "no": 7,
                    "text": '  Log.d("RouteSync", "shardId=$shardId part[3/4]=${parts[2]}")',
                    "patchableId": "p3",
                },
                {
                    "no": 8,
                    "text": '  Log.i("CryptoProvider", "chunk write complete shardId=$shardId parts=4/4")',
                    "patchableId": "d2",
                },
                {"no": 9, "text": "}"},
            ],
        },
    },
}

PATCHABLE_IDS = {"p1", "p2", "p3", "p4", "d1", "d2"}
REQUIRED_PATCH_IDS = {"p1", "p2", "p3", "p4"}
PATCH_WRONG_FEEDBACK = {
    "d1": "5번은 telemetry canary야. 프로덕션에 있으면 안 되는 건 맞지만, 여기서 봉쇄해야 할 회수 가능한 Evidence 조각 경로는 아니야.",
    "d2": "8번은 완료 메타데이터를 기록해. 조각 값 자체를 내보내지 않아.",
}

FLAG_FEEDBACK = {
    "FLAG{BROKEN_STITCH_FAKE}": (
        "MIRA: that is the DECOY-7 shard. It looks complete, but source=decoy and it is outside the runtime evidence flow."
    ),
    "FLAG{LEGACY_ROLLBACK_STALE}": (
        "MIRA: that is the OLD-2 cache shard. Rollback and old-cache fragments are not current Evidence."
    ),
    "FLAG{METRICS_CANARY}": (
        "MIRA: telemetry canary is not Evidence. Separate measurement markers from secret fragments."
    ),
    "FLAG{TMP_DRAFT_ONLY}": (
        "MIRA: that is the TMP-3 staging draft shard (source=staging-draft). A draft is not the runtime evidence flow."
    ),
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL1_3_FLAG


def flag_feedback(flag: str) -> str:
    submitted = flag.strip()
    if submitted in FLAG_FEEDBACK:
        return FLAG_FEEDBACK[submitted]
    if submitted.startswith("FLAG{") and submitted != LEVEL1_3_FLAG:
        return "MIRA: the fragments are not stitched correctly yet. Group one shardId, then order by part[1/4] through part[4/4]."
    return "MIRA: submit the fully reconstructed FLAG after stitching the fragment parts."


def judge_patch(patched_ids: List[str]) -> bool:
    return set(patched_ids) == REQUIRED_PATCH_IDS


def judge_patch_with_session(patched_ids: List[str], session: Dict[str, Any]) -> bool:
    return set(patched_ids) == REQUIRED_PATCH_IDS


def patch_feedback(patched_ids: List[str]) -> str:
    selected = set(patched_ids)
    extra = [pid for pid in patched_ids if pid in PATCH_WRONG_FEEDBACK]
    if extra:
        return " ".join(PATCH_WRONG_FEEDBACK[pid] for pid in extra)

    if REQUIRED_PATCH_IDS - selected:
        return (
            "A recoverable Evidence fragment log remains. Different tags do not make shardId/part fragments safe."
        )

    return "Select only lines that emit recoverable Evidence fragments. Completion metadata can remain."


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
            '  adb logcat -d | grep [-i] [-E|-F] [-v] [-n] "TEXT"\n'
            '  adb logcat -d | findstr [/I] [/R] [/N] "TEXT"\n'
            "Tip:\n"
            "  FLAG lines can be decoys. Use shardId and part index to stitch fragments.\n"
            "Defense:\n"
            "  defense audit\n"
            '  defense apply {"logParts":false,"logRecombined":false,"redactFlagPattern":true}\n'
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
    lowered = cmdline.lower()
    if data and re.search(r"\|\s*(grep|findstr)\s+['\"]?flag['\"]?$", lowered):
        data += (
            "\nMIRA: FLAG-starting fragments can mislead you. This Evidence is not complete on one line.\n"
            "MIRA: Compare shardId and part index together.\n"
        )
    elif data and re.search(r"\|\s*(grep|findstr)\s+['\"]?shardid['\"]?$", lowered):
        data += (
            "\nMIRA: Good. The fragments are visible now, but shardIds are mixed.\n"
            "MIRA: Find the complete runtime shard, then sort by part index.\n"
        )
    elif data and TRUE_SHARD_ID.lower() in lowered and re.search(r"\|\s*(grep|findstr)\s+", lowered):
        data += (
            "\nMIRA: Same shard collected. Print order is not the answer order.\n"
            "MIRA: Stitch part[1/4], part[2/4], part[3/4], part[4/4].\n"
        )
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
                f"D/RouteSync: shardId={TRUE_SHARD_ID} part[1/4]=" + PARTS[0],
                f"D/CryptoProvider: shardId={TRUE_SHARD_ID} part[2/4]=" + PARTS[1],
                f"D/RouteSync: shardId={TRUE_SHARD_ID} part[3/4]=" + PARTS[2],
                f"D/CryptoProvider: shardId={TRUE_SHARD_ID} part[4/4]=" + PARTS[3],
            ]
        )
    if bool(policy.get("logRecombined", True)):
        lines.append("D/CryptoProvider: recombined=" + LEVEL1_3_FLAG)
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
                else "Verification failed: block part/recombined output, enable masking, and change at least two policy controls."
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
