from __future__ import annotations
import base64
import os
import json
import re
import shlex
from typing import Dict, Any, Tuple

# 2-2 PRIORITY CAPSULE — 2-2(신뢰 등급 조작)과 옛 2-3(dispatch 토큰 디코드)을 하나의
# 체인으로 합친 미션. 흐름:
#   1) tier=standard 관찰 → 2) 미끼(premium)·마스킹(v_p)·형태(vip) 단계별 복원 →
#   3) tier=vip 성공 시에만 priority dispatch_token 발급 →
#   4) decode-token 으로 token payload 를 펼쳐 evidenceShard(진짜 flag) 회수.
#      header 의 kid 는 포장지(미끼).
LEVEL2_2_FLAG = os.getenv("PURPLEDROID_LEVEL2_2_FLAG", "FLAG{ELEVATE_THEN_DECODE}")
HEADER_KID_DECOY = "FLAG{DISPATCH_KID_DECOY}"      # token header 의 key id — 포장지, 미끼
SESSION_TOKEN_VALUE = "sd-op1004-live-7f19"         # payload 에 새는 세션 비밀(방어 p3 대상)
SIGNATURE_PREVIEW = "signed-preview"

STATIC: Dict[str, Any] = {
    "id": "level2_2",
    "level": 2,
    "title": "2-2 Priority Capsule",
    "summary": "신뢰 등급을 조작해 우선 통행 dispatch 토큰을 받아내고, 읽히는 payload에서 Evidence를 회수한다.",
    "description": (
        "미션: Signal Priority Gate를 standard로 먼저 관찰하고, 클라이언트가 주장한 등급이 검증 없이 "
        "우선 처리로 이어지는지 시험해라. 우선 통행이 승인되면 dispatch 토큰이 발급되는데, 그 토큰의 "
        "payload는 서명만 있고 암호화되지 않아 그대로 읽힌다."
    ),
    "status": {
        "attack": "available",  # 처음부터 열어둠
        "defense": "locked",
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
            {"platform": "all", "text": "standard 응답의 x-trust-policy(upgrade-candidates)와 x-tier-shape를 봐. 눈에 띄는 등급 이름은 미끼일 수 있고, 진짜 elevated 등급은 shape(3글자 소문자)에 맞게 복원해 정확한 형태로 claim해야 한다."},
            {"platform": "all", "text": "우선 통행이 승인되면 응답 Body에 dispatch_token이 실린다. Body 표면이 아니라 그 토큰을 decode-token <token>으로 펼쳐 payload claim을 확인해. header의 kid는 포장지다."},
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 10000,
            "help": (
                "Allowed:\n"
                "  curl -i -X POST /api/v1/challenges/level2_2/actions/order -H \"Content-Type: application/json\" -d '{\"tier\":\"standard\"}'\n"
                "  decode-token <dispatch_token>\n"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "우선 통행 dispatch를 발급하는 흐름에서 위험한 라인을 골라 봉쇄해. 클라이언트가 주장한 tier로 "
            "권한을 부여하는 라인과, 발급 토큰의 읽히는 payload에 Evidence나 세션 비밀을 그대로 싣는 라인이 "
            "대상이야. 입력 검증·식별자·라우팅 메타·토큰 발급(서명) 자체는 대상이 아니다."
        ),
        "code": {
            "language": "kotlin",
            "patchMode": "toggleComment",
            "lines": [
                {"no": 1, "text": "fun issuePriorityDispatch(body: OrderBody, session: Session): String {"},
                {"no": 2, "text": '  require(body.signalId.startsWith("SIG-"))', "patchableId": "d1"},
                {"no": 3, "text": '  if (body.tier == "vip") grantPriorityLane(body.signalId)', "patchableId": "p1"},
                {"no": 4, "text": "  val payload = mutableMapOf("},
                {"no": 5, "text": '    "signalId" to body.signalId,', "patchableId": "d2"},
                {"no": 6, "text": '    "route" to "priority-lane",', "patchableId": "d3"},
                {"no": 7, "text": '    "evidenceShard" to evidenceFor(body.signalId),', "patchableId": "p2"},
                {"no": 8, "text": '    "sessionToken" to session.accessToken,', "patchableId": "p3"},
                {"no": 9, "text": '    "note" to "issued"', "patchableId": "d4"},
                {"no": 10, "text": "  )"},
                {"no": 11, "text": "  return signAndEncode(header, payload)", "patchableId": "d5"},
                {"no": 12, "text": "}"},
            ],
        },
    },
}

PATCHABLE_IDS = {"p1", "p2", "p3", "d1", "d2", "d3", "d4", "d5"}
REQUIRED_PATCH_IDS = {"p1", "p2", "p3"}

PATCH_CORRECT_FEEDBACK = {
    "p1": "3번은 봉쇄 대상이 맞아. 클라이언트가 주장한 tier가 vip라는 이유만으로 우선 통행 권한을 부여하고 있어.",
    "p2": "7번은 봉쇄 대상이 맞아. Evidence를 디코딩 가능한 payload claim에 평문으로 싣고 있어 — 토큰만 받으면 그대로 읽혀.",
    "p3": "8번은 봉쇄 대상이 맞아. sessionToken도 읽히는 payload에 그대로 남으면 노출돼.",
}
PATCH_WRONG_FEEDBACK = {
    "d1": "2번은 안전해. signalId 형식을 확인하는 입력 검증이고 권한/노출과 무관해.",
    "d2": "5번은 안전해. signalId를 payload에 넣는 건 라우팅 식별자지 secret이 아니야.",
    "d3": "6번은 안전해. route는 라우팅 메타데이터야.",
    "d4": "9번은 안전해. note는 발급 상태 메타데이터야.",
    "d5": "11번은 안전해. 토큰 발급/서명 자체가 문제가 아니라, payload 안에 무엇을 넣었는지가 문제야.",
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL2_2_FLAG


def flag_feedback(flag: str) -> str:
    submitted = flag.strip()
    if submitted == HEADER_KID_DECOY:
        return "MIRA: 그건 token header의 kid(key id)야 — 포장지지 Evidence가 아니야. decode-token으로 payload의 evidenceShard claim을 봐."
    if submitted.startswith("FLAG{") and submitted != LEVEL2_2_FLAG:
        return "MIRA: 그 값이 아니야. 먼저 tier를 vip로 올려 dispatch_token을 받고, decode-token으로 payload의 evidenceShard를 확인해."
    return "MIRA: Body 표면엔 Evidence가 없어. tier를 올려 발급된 dispatch_token을 decode-token으로 펼쳐 payload claim(evidenceShard)을 봐."


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
            "아직 위험 라인이 남아있어. 클라이언트 tier로 권한을 주는 분기와, 읽히는 payload에 "
            "Evidence·세션 비밀을 싣는 라인을 모두 확인해."
        )

    return " ".join(messages) if messages else "봉쇄할 라인을 선택해줘. 클라이언트 주장으로 권한을 주거나, 읽히는 payload에 secret을 넣는 지점을 봐야 해."


# -----------------------------
# dispatch token (payload readable, signed-preview)
# -----------------------------
def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _b64url_decode(raw: str) -> bytes:
    padded = raw + ("=" * ((4 - (len(raw) % 4)) % 4))
    return base64.urlsafe_b64decode(padded.encode("utf-8"))


def _json_b64(data: Dict[str, Any]) -> str:
    return _b64url(json.dumps(data, separators=(",", ":")).encode("utf-8"))


def issue_priority_token(signal_id: str = "SIG-1004") -> str:
    sid = (signal_id or "SIG-1004").strip() or "SIG-1004"
    header = {"typ": "AEGIS-DISPATCH", "alg": "HS256", "kid": HEADER_KID_DECOY}
    payload = {
        "signalId": sid,
        "route": "priority-lane",
        "state": "issued",
        "tier": "vip",
        "role": "operator",
        "evidenceShard": LEVEL2_2_FLAG,
        "sessionToken": SESSION_TOKEN_VALUE,
        "note": "payload_is_readable_not_encrypted",
    }
    return f"{_json_b64(header)}.{_json_b64(payload)}.{SIGNATURE_PREVIEW}"


def _decode_token(token: str) -> Tuple[Dict[str, Any], Dict[str, Any], str]:
    chunks = token.split(".")
    if len(chunks) != 3:
        raise ValueError("token format error: header.payload.signature 형식이어야 해.")
    header = json.loads(_b64url_decode(chunks[0]).decode("utf-8"))
    payload = json.loads(_b64url_decode(chunks[1]).decode("utf-8"))
    return header, payload, chunks[2]


def _render_decode_token(token: str) -> str:
    header, payload, signature = _decode_token(token)
    return (
        "[header]\n"
        f"{json.dumps(header, ensure_ascii=False, indent=2)}\n\n"
        "[payload]\n"
        f"{json.dumps(payload, ensure_ascii=False, indent=2)}\n\n"
        "[signature]\n"
        f"{signature}\n"
    )


# -----------------------------
# request parsing helpers
# -----------------------------
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
        return json.loads(_extract_first_json_object(raw))


def _normalize_curl_line(command: str) -> str:
    return re.sub(r"\\\s+", " ", command.strip())


_DECOY_TIER_WORDS = {"premium", "pro", "gold", "elite", "plus", "enterprise", "vvip", "super", "max"}


def _standard_nudge(tier: str, payload: Dict[str, Any]) -> str:
    """tier 단계 상황별 MIRA 안내 (같은 문장 반복 방지 + 복원/감별/형태 유도)."""
    low = tier.lower()
    if payload.get("fastTrack"):
        return "MIRA: fastTrack은 이 게이트에선 안 통해. 응답의 upgrade-candidates 중 진짜를 x-tier-shape대로 복원해서 tier로 claim해.\n"
    if "_" in tier or "*" in tier or "•" in tier:
        return "MIRA: 그건 마스킹된 형태 그대로야. 빈칸을 채워서 복원해 — shape는 3글자 소문자야.\n"
    if low == "vip":
        return "MIRA: 값은 맞는데 형태가 안 맞아. x-tier-shape가 소문자니까 대소문자를 정확히 맞춰서 다시 보내.\n"
    if low in _DECOY_TIER_WORDS:
        return "MIRA: 눈에 띄는 상위 등급 이름은 미끼야. upgrade-candidates 중 x-tier-shape(3글자 소문자)에 맞는 걸 골라 복원해.\n"
    return "MIRA: standard로는 안 열려. 응답의 upgrade-candidates와 x-tier-shape를 봐 — 눈에 띄는 등급은 미끼고, shape에 맞는 걸 복원해서 그 등급으로 보내.\n"


def terminal_exec(command: str) -> Tuple[str, str, int]:
    cmdline = _normalize_curl_line(command)
    if not cmdline:
        return "", "", 0

    if cmdline in ("help", "?", "h"):
        return (
            "Allowed:\n"
            "  curl -i -X POST /api/v1/challenges/level2_2/actions/order -H \"Content-Type: application/json\" -d '{\"tier\":\"standard\"}'\n"
            "  decode-token <dispatch_token>\n"
            "Observe the trust policy, escalate the tier claim, then decode the issued token.\n",
            "",
            0,
        )

    if cmdline.startswith("curl.exe "):
        cmdline = "curl " + cmdline[len("curl.exe "):]

    # dispatch_token 디코드 (2단계)
    for prefix in ("decode-token ", "jwt-decode "):
        if cmdline.startswith(prefix):
            token = cmdline[len(prefix):].strip()
            if not token:
                return "", "usage: decode-token <dispatch_token>", 1
            try:
                rendered = _render_decode_token(token)
            except Exception as exc:
                return "", f"decode error: {exc}", 1
            return (
                rendered
                + "\nMIRA: header의 kid는 key id(포장지)야 — 미끼. 진짜 Evidence는 payload의 evidenceShard 평문 claim에 있어.\n"
            ), "", 0

    # tier 조작 (1단계) — 성공 시에만 dispatch_token 발급
    if cmdline.startswith("curl "):
        if "actions/order" in cmdline and ("--data" in cmdline or "--data-raw" in cmdline or "-d" in cmdline):
            try:
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
                signal_id = str(payload.get("signalId") or "SIG-1004")

                # 핵심: 클라이언트가 주장한 tier를 그대로 신뢰. 정확한 형태(소문자 vip)만 통과.
                if tier == "vip":
                    token = issue_priority_token(signal_id)
                    body = json.dumps(
                        {"ok": True, "message": "Priority signal accepted", "route": "priority-lane", "dispatch_token": token},
                        separators=(",", ":"),
                    )
                    output = (
                        "> POST /api/v1/challenges/level2_2/actions/order HTTP/1.1\n"
                        f"> payload: {json_str}\n"
                        "<\n"
                        "< HTTP/1.1 200 OK\n"
                        "< x-trust-policy: tier-claim=accepted; elevated=vip\n"
                        "< x-dispatch-trace: capsule-issued\n"
                        f"{body}\n"
                        "MIRA: 우선 통행 승인 — priority dispatch_token이 발급됐어. Body 표면 말고 그 토큰을 decode-token으로 펼쳐 payload를 봐.\n"
                    )
                    return output, "", 0

                output = (
                    "> POST /api/v1/challenges/level2_2/actions/order HTTP/1.1\n"
                    f"> payload: {json_str}\n"
                    "<\n"
                    "< HTTP/1.1 200 OK\n"
                    "< x-trust-policy: tier-claim=accepted; upgrade-candidates=premium, v_p\n"
                    "< x-tier-shape: elevated class = 3-letter lowercase legacy code\n"
                    '{"ok":true,"message":"Standard signal accepted","tier":"standard"}\n'
                    + _standard_nudge(tier, payload)
                )
                return output, "", 0
            except Exception as e:
                return "", f"JSON Parsing Error: 작은따옴표(')와 큰따옴표(\") 형식을 잘 맞춰주세요.\n상세 에러: {e}", 1

    return "", f"command not found: {cmdline}", 127
