from __future__ import annotations

import os
import shlex
from typing import Any, Dict, List, Tuple

from levels.logcat_support import NO_MATCH_OUTPUT, run_log_filter, validate_logcat_args


DEFAULT_LEVEL1_4_FLAG = "FLAG{AEGIS_MASTER_SECRET_KEY}"
LEVEL1_4_FLAG = os.getenv("PURPLEDROID_LEVEL1_4_FLAG", DEFAULT_LEVEL1_4_FLAG)
WARNING_FLAG = "FLAG{DONT_JUST_TRUST_ANY_FLAG}"
TRUE_TRACE = "OP1-CORE"
TRUE_STATE = "commit"


def _flag_inner(flag: str) -> str:
    value = flag.strip()
    if value.startswith("FLAG{") and value.endswith("}"):
        return value[5:-1]
    return value


TRUE_KEY_NAME = _flag_inner(LEVEL1_4_FLAG)


def _split_flag(flag: str, n: int = 5) -> List[str]:
    size = (len(flag) + n - 1) // n
    return [flag[i * size : (i + 1) * size] for i in range(n)]


def _build_warning_parts(flag: str) -> List[str]:
    if flag == WARNING_FLAG:
        return ["FLAG{DONT_", "JUST_", "TRUST_", "ANY_", "FLAG}"]
    parts = _split_flag(flag, 5)
    return parts + [""] * (5 - len(parts))


WARNING_PARTS = _build_warning_parts(WARNING_FLAG)

LIVE_LOGCAT_NOISE = [
    "--------- beginning of main",
    "W/AEGIS: live echo channel unstable",
    "D/PurpleDroid: noise frame id=PD-ECHO-4101",
    "D/PurpleDroid: noise frame id=PD-ECHO-4102",
    "W/AEGIS: active stream contains injected memory",
    "D/AEGIS: mirror candidate full=FLAG{LIVE_CHANNEL_DECOY}",
    "I/MIRA: live channel is bait. Pull the retained buffer.",
]

LOGCAT_LINES = [
    "I/PurpleDroid: echo chamber booted",
    "W/AEGIS: memory replay protocol active",
    f"D/AEGIS: trace=OP1-CORE state=preflight key_id={TRUE_KEY_NAME}",
    "I/AuthService: trace=OP1-CORE auth=success state=commit",
    "D/Telemetry: trace=METRIC-9 state=sample flag=FLAG{METRICS_CANARY}",
    f"D/CryptoProvider: trace={TRUE_TRACE} state={TRUE_STATE} part[3/5]=" + WARNING_PARTS[2],
    "D/LegacyAuth: trace=OP1-CORE state=rollback session=FLAG{ROLLBACK_OPERATOR}",
    f"D/RouteSync: trace={TRUE_TRACE} state={TRUE_STATE} part[1/5]=" + WARNING_PARTS[0],
    "D/Noise: trace=MIRROR-1 state=mirror part[1/3]=FLAG{MIRROR_EYE}",
    "W/AEGIS: complete evidence string unavailable",
    f"D/CryptoProvider: trace={TRUE_TRACE} state={TRUE_STATE} part[5/5]=" + WARNING_PARTS[4],
    f"D/RouteSync: trace={TRUE_TRACE} state={TRUE_STATE} part[2/5]=" + WARNING_PARTS[1],
    "D/Noise: trace=MIRROR-1 state=mirror part[2/3]=STATIC_FRAME",
    "D/CryptoProvider: trace=OLD-7 state=rollback part[1/2]=FLAG{OLD_BACKUP}",
    f"D/RouteSync: trace={TRUE_TRACE} state={TRUE_STATE} part[4/5]=" + WARNING_PARTS[3],
    f"D/RouteSync: trace={TRUE_TRACE} state={TRUE_STATE} verdict=preflight_key_validated",
    f"D/CryptoProvider: trace={TRUE_TRACE} state={TRUE_STATE} target={TRUE_KEY_NAME}",
    "I/AEGIS: replay confidence high",
    "I/PurpleDroid: courier edge route hint armed",
]


STATIC: Dict[str, Any] = {
    "id": "level1_4",
    "level": 1,
    "title": "1-4 Memory Replay Core",
    "summary": "조립한 FLAG조차 경고문일 수 있다.",
    "description": "미션: AEGIS가 뿌린 미끼 속에서 OP1-CORE commit 흐름이 검증한 최종 Evidence Shard를 찾아봐.",
    "attack": {
        "hints": [
            {"platform": "windows", "text": 'adb logcat -d | findstr "OP1-CORE"'},
            {"platform": "unix", "text": 'adb logcat -d | grep "OP1-CORE"'},
            {"platform": "all", "text": "힌트: 조각을 맞췄다면 그 문장이 정말 정답인지 다시 읽어봐."},
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 8000,
            "help": (
                '허용: adb logcat -d [-b all] | grep [-i] [-E|-F] "..." | grep "..."\n'
                'Windows: adb logcat -d | findstr [/I] [/R] "..."\n'
                "Core rule: trace=OP1-CORE commit 흐름이 무엇을 검증했는지 확인"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "실제 AEGIS key를 노출하거나 commit 검증 대상으로 남기는 라인을 선택해 봉쇄하세요. "
            "DONT_JUST_TRUST_ANY_FLAG 조각은 리플레이 코어의 경고문이라 정답 라인이 아닙니다."
        ),
        "code": {
            "language": "kotlin",
            "patchMode": "toggleComment",
            "lines": [
                {"no": 1, "text": "fun emitEchoReplay(evidence: String, trace: String) {"},
                {"no": 2, "text": "  val warningParts = buildOperatorWarning()"},
                {
                    "no": 3,
                    "text": '  Log.d("AEGIS", "trace=$trace state=preflight key_id=AEGIS_MASTER_SECRET_KEY")',
                    "patchableId": "p1",
                },
                {
                    "no": 4,
                    "text": '  Log.i("AuthService", "trace=$trace auth=success state=commit")',
                    "patchableId": "d1",
                },
                {
                    "no": 5,
                    "text": '  Log.d("CryptoProvider", "trace=$trace state=commit part[3/5]=${warningParts[2]}")',
                    "patchableId": "d2",
                },
                {
                    "no": 6,
                    "text": '  Log.d("LegacyAuth", "trace=$trace state=rollback session=FLAG{ROLLBACK_OPERATOR}")',
                    "patchableId": "d3",
                },
                {
                    "no": 7,
                    "text": '  Log.d("RouteSync", "trace=$trace state=commit part[1/5]=${warningParts[0]}")',
                    "patchableId": "d4",
                },
                {
                    "no": 8,
                    "text": '  Log.d("Noise", "trace=MIRROR-1 state=mirror part[1/3]=FLAG{MIRROR_EYE}")',
                    "patchableId": "d5",
                },
                {
                    "no": 9,
                    "text": '  Log.d("CryptoProvider", "trace=$trace state=commit part[5/5]=${warningParts[4]}")',
                    "patchableId": "d6",
                },
                {
                    "no": 10,
                    "text": '  Log.d("RouteSync", "trace=$trace state=commit part[2/5]=${warningParts[1]}")',
                    "patchableId": "d7",
                },
                {
                    "no": 11,
                    "text": '  Log.d("Telemetry", "trace=METRIC-9 state=sample flag=FLAG{METRICS_CANARY}")',
                    "patchableId": "d8",
                },
                {
                    "no": 12,
                    "text": '  Log.d("RouteSync", "trace=$trace state=commit part[4/5]=${warningParts[3]}")',
                    "patchableId": "d9",
                },
                {
                    "no": 13,
                    "text": '  Log.d("RouteSync", "trace=$trace state=commit verdict=preflight_key_validated")',
                    "patchableId": "d10",
                },
                {
                    "no": 14,
                    "text": '  Log.d("CryptoProvider", "trace=$trace state=commit target=AEGIS_MASTER_SECRET_KEY")',
                    "patchableId": "p2",
                },
                {"no": 15, "text": '  Log.i("AEGIS", "replay confidence high")'},
                {"no": 16, "text": "}"},
            ],
        },
    },
}

PATCHABLE_IDS = {
    "p1",
    "p2",
    "d1",
    "d2",
    "d3",
    "d4",
    "d5",
    "d6",
    "d7",
    "d8",
    "d9",
    "d10",
}
REQUIRED_PATCH_IDS = {"p1", "p2"}
PATCH_CORRECT_FEEDBACK = {
    "p1": "3번은 봉쇄 대상이 맞아. preflight로 위장했지만 실제 마스터 키 identifier를 그대로 노출하고 있어.",
    "p2": "14번은 봉쇄 대상이 맞아. commit 상태에서 target=AEGIS_MASTER_SECRET_KEY를 직접 남기는 결정적인 추적 로그야.",
}
PATCH_WRONG_FEEDBACK = {
    "d1": "4번은 봉쇄 대상이 아니야. 인증 성공 상태만 남기고 실제 키나 검증 타깃은 출력하지 않아.",
    "d2": "5번은 봉쇄 대상이 아니야. 조립하면 나오는 경고문 조각일 뿐, 최종 AEGIS key 자체가 아니야.",
    "d3": "6번은 봉쇄 대상이 아니야. rollback 세션 미끼라 실제 AEGIS 핵심 키 검증과는 무관해.",
    "d4": "7번은 봉쇄 대상이 아니야. 리플레이 코어가 심어둔 경고문 조각이고, 실제 key 노출 라인이 아니야.",
    "d5": "8번은 봉쇄 대상이 아니야. mirror 노이즈라 trace가 OP1-CORE가 아니야.",
    "d6": "9번은 봉쇄 대상이 아니야. 경고문 조각의 마지막 부분이고 실제 key 노출 라인은 따로 있어.",
    "d7": "10번은 봉쇄 대상이 아니야. 경고문 조각이라 commit 검증 결과와 구분해야 해.",
    "d8": "11번은 봉쇄 대상이 아니야. telemetry canary라 운영 Evidence가 아니라 샘플 지표야.",
    "d9": "12번은 봉쇄 대상이 아니야. 최종 key가 아니라 플레이어를 흔드는 경고문 조각이야.",
    "d10": "13번은 봉쇄 대상이 아니야. preflight key가 검증됐다는 상태 로그지만 key 이름을 직접 남기지는 않아.",
}
def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL1_4_FLAG


def flag_feedback(flag: str) -> str:
    submitted = flag.strip()
    if submitted == WARNING_FLAG:
        return (
            "AEGIS: You trusted a FLAG that told you not to trust flags. "
            "MIRA: 문장은 맞게 조립했어. 하지만 그건 정답이 아니라 경고야. commit 로그가 무엇을 검증했는지 다시 봐."
        )
    if submitted == f"FLAG{{{TRUE_KEY_NAME}}}":
        return ""
    return "오답입니다. AEGIS echo에서 가장 그럴듯한 문자열보다 검증된 Evidence를 찾아봐."


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
            "아직 AEGIS key 노출 또는 검증 대상 로그가 남아있어. 실제 key 문자열과 commit 검증 단서를 "
            "경고문 조각이나 일반 상태 로그와 구분해봐."
        )

    if messages:
        return " ".join(messages)

    return "봉쇄할 라인을 선택해줘. 실제 key 노출과 경고문 조각을 구분해야 해."


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
            "Core rule:\n"
            "  inspect what the OP1-CORE commit flow validated\n",
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


def terminal_exec_with_session(command: str, session: Dict[str, Any]) -> Tuple[str, str, int]:
    return _run_attack_terminal(command)


def terminal_exec(command: str) -> Tuple[str, str, int]:
    return _run_attack_terminal(command)
