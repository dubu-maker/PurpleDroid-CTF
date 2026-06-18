from __future__ import annotations
import os
import json
import re
import shlex
from typing import Dict, Any, Tuple

# 정답 플래그 설정
LEVEL2_2_FLAG = os.getenv("PURPLEDROID_LEVEL2_2_FLAG", "FLAG{TRUST_TIER_TAMPERED}")

STATIC: Dict[str, Any] = {
    "id": "level2_2",
    "level": 2,
    "title": "2-2 Trust Tamper",
    "summary": "요청 Body의 신뢰 등급 주장을 바꾸면 Signal Edge의 우선 처리 흐름이 흔들린다.",
    "description": "미션: Signal Priority 요청을 standard tier로 먼저 관찰한 뒤, 클라이언트가 주장한 등급이 검증 없이 우선 처리로 이어지는지 시험해라.",
    "status": {
        "attack": "available", # 처음부터 열어둠
        "defense": "locked"
    },
    "attack": {
        "hints": [
            {
                "platform": "windows",
                "text": 'curl.exe -i -X POST /api/v1/challenges/level2_2/actions/order -H "Content-Type: application/json" -d "{\\"tier\\":\\"standard\\"}"',
            },
            {
                "platform": "unix",
                "text": 'curl -i -X POST /api/v1/challenges/level2_2/actions/order -H "Content-Type: application/json" -d \'{"tier":"standard"}\'',
            },
            {"platform": "all", "text": "standard 응답의 trust policy를 보고, Body의 claim을 더 높은 등급으로 바꿔서 다시 실행해 봐. 정확한 등급명은 AEGIS가 숨긴다."},
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 8000,
            "help": "예시: curl -i -X POST /api/v1/challenges/level2_2/actions/order -H \"Content-Type: application/json\" -d '{\"tier\":\"standard\"}' (trust policy를 보고 Body claim을 바꿔 다시 실행)"
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "클라이언트가 보낸 주장으로 Signal 우선 처리를 부여하는 라인을 선택해 봉쇄하세요. "
            "요청 형식 검증, 값 읽기, 감사 로그와 실제 권한 결정은 별개입니다."
        ),
        "code": {
            "language": "kotlin",
            "patchMode": "toggleComment",
            "lines": [
                {"no": 1, "text": "fun routeSignal(req: SignalRequest, session: Session) {"},
                {
                    "no": 2,
                    "text": '  require(req.signalId.startsWith("SIG-"))',
                    "patchableId": "d1",
                },
                {
                    "no": 3,
                    "text": "  val clientTier = req.body.tier",
                    "patchableId": "d2",
                },
                {
                    "no": 4,
                    "text": "  val verifiedTier = trustRegistry.lookupTier(session.operatorId)",
                    "patchableId": "d3",
                },
                {
                    "no": 5,
                    "text": '  if (clientTier == "vip") grantPriorityRoute(req.signalId)',
                    "patchableId": "p1",
                },
                {
                    "no": 6,
                    "text": "  if (req.body.fastTrack) bypassStandardQueue(req.signalId)",
                    "patchableId": "p2",
                },
                {
                    "no": 7,
                    "text": '  audit.log("signal route evaluated")',
                    "patchableId": "d4",
                },
                {"no": 8, "text": "}"},
            ],
        },
    }
}

PATCHABLE_IDS = {"p1", "p2", "d1", "d2", "d3", "d4"}
REQUIRED_PATCH_IDS = {"p1", "p2"}

PATCH_CORRECT_FEEDBACK = {
    "p1": "5번은 봉쇄 대상이 맞아. 클라이언트가 보낸 tier가 vip라는 이유만으로 우선 라우팅을 부여하고 있어.",
    "p2": "6번은 봉쇄 대상이 맞아. fastTrack도 클라이언트 Body의 주장인데, 참이면 표준 대기열을 우회시켜 버려.",
}
PATCH_WRONG_FEEDBACK = {
    "d1": "2번은 안전해. signalId 형식을 확인하는 입력 검증이고 신뢰 등급을 결정하지 않아.",
    "d2": "3번은 안전해. tier 값을 읽는 것 자체가 취약점은 아니야. 문제는 그 값을 검증 없이 권한 결정에 쓰는 분기야.",
    "d3": "4번은 안전해. trustRegistry에서 세션 기준 등급을 조회하는 서버 측 판단 경로라 봉쇄 대상이 아니야.",
    "d4": "7번은 안전해. 평가가 끝났다는 감사 로그만 남기고 클라이언트 tier를 신뢰하지 않아.",
}
def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL2_2_FLAG


def judge_patch(patched_ids: list[str]) -> bool:
    return set(patched_ids) == REQUIRED_PATCH_IDS


def judge_patch_with_session(patched_ids: list[str], session: Dict[str, Any]) -> bool:
    return set(patched_ids) == REQUIRED_PATCH_IDS


def patch_feedback(patched_ids: list[str]) -> str:
    selected = set(patched_ids)
    messages: list[str] = []
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
            "아직 클라이언트 주장으로 우선 처리되는 경로가 남아있어. tier 문자열뿐 아니라 "
            "Body의 다른 claim이 권한 분기로 이어지는지도 확인해."
        )

    return " ".join(messages) if messages else "봉쇄할 라인을 선택해줘. 클라이언트가 주장한 값이 어디서 우선 처리 권한으로 바뀌는지 봐야 해."

def _extract_first_json_object(text: str) -> str:
    start = text.find("{")
    if start < 0:
        raise ValueError("JSON object not found")

    depth = 0
    in_string = False
    escaped = False

    for idx in range(start, len(text)):
        ch = text[idx]
        if escaped:
            escaped = False
            continue
        if ch == "\\":
            escaped = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : idx + 1]

    raise ValueError("Unclosed JSON object")

def _parse_payload(raw: str) -> Dict[str, Any]:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # 사용자 입력에서 끝부분 잔여 문자(따옴표/공백 등)가 섞인 경우 복구 시도
        candidate = _extract_first_json_object(raw)
        return json.loads(candidate)

def _normalize_curl_line(command: str) -> str:
    # 사용자가 여러 줄 curl의 백슬래시를 한 줄에 붙여 넣은 경우를 흡수한다.
    return re.sub(r"\\\s+", " ", command.strip())

def terminal_exec(command: str) -> Tuple[str, str, int]:
    cmdline = _normalize_curl_line(command)
    if not cmdline:
        return "", "", 0

    if cmdline in ("help", "?", "h"):
        return (
            "Available investigation command:\n"
            "  curl -i -X POST /api/v1/challenges/level2_2/actions/order -H \"Content-Type: application/json\" -d '{\"tier\":\"standard\"}'\n"
            "Observe the redacted trust policy, then resend a modified JSON Body.\n"
        ), "", 0

    # Windows 스타일 curl.exe 허용
    if cmdline.startswith("curl.exe "):
        cmdline = "curl " + cmdline[len("curl.exe "):]

    # curl 명령어 데이터 변조 시뮬레이션
    if cmdline.startswith("curl "):
        if "actions/order" in cmdline and ("--data" in cmdline or "--data-raw" in cmdline or "-d" in cmdline):
            try:
                # --data 뒤에 오는 JSON 문자열 파싱 (해커가 입력한 값 추출)
                parts = shlex.split(cmdline)
                if "--data" in parts:
                    data_key = "--data"
                elif "--data-raw" in parts:
                    data_key = "--data-raw"
                else:
                    data_key = "-d"
                data_idx = parts.index(data_key)
                if data_idx + 1 >= len(parts):
                    return "", "JSON Parsing Error: --data 뒤에 JSON 본문이 필요해요.", 1
                json_str = parts[data_idx + 1]
                payload = _parse_payload(json_str)
                
                tier = str(payload.get("tier", "standard")).strip()
                fast_track_raw = payload.get("fastTrack", False)
                fast_track = fast_track_raw is True or str(fast_track_raw).lower() == "true"
                
                # 핵심 해킹 포인트: 클라이언트가 보낸 tier를 그대로 신뢰한다.
                if tier.lower() == "vip" or fast_track:
                    output = (
                        "> POST /api/v1/challenges/level2_2/actions/order HTTP/1.1\n"
                        f"> payload: {json_str}\n"
                        "<\n"
                        "< HTTP/1.1 200 OK\n"
                        "< x-trust-policy: tier-claim=accepted; elevated=redacted\n"
                        "< x-tier-shape: lowercase-legacy-access-class\n"
                        f"< x-priority-label: {LEVEL2_2_FLAG}\n"
                        '{"ok":true,"message":"Privileged signal accepted","route":"priority"}\n'
                    )
                    return output, "", 0
                else:
                    output = (
                        "> POST /api/v1/challenges/level2_2/actions/order HTTP/1.1\n"
                        f"> payload: {json_str}\n"
                        "<\n"
                        "< HTTP/1.1 200 OK\n"
                        "< x-trust-policy: tier-claim=accepted; elevated=redacted\n"
                        "< x-tier-shape: lowercase-legacy-access-class\n"
                        '{"ok":true,"message":"Standard signal accepted","tier":"standard","elevatedCandidate":"redacted"}\n'
                    )
                    return output, "", 0
            except Exception as e:
                return "", f"JSON Parsing Error: 작은따옴표(')와 큰따옴표(\") 형식을 잘 맞춰주세요.\n상세 에러: {e}", 1

    return "", f"command not found: {cmdline}", 127
