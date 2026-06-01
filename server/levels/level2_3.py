from __future__ import annotations

import base64
import json
import os
import re
import shlex
from typing import Any, Dict, Tuple


LEVEL2_3_FLAG = os.getenv("PURPLEDROID_LEVEL2_3_FLAG", "FLAG{DECODE_THE_DISPATCH_PAYLOAD}")
DEFAULT_SIGNAL_ID = "SIG-1004"
HEADER_DECOY_FLAG = "FLAG{HEADER_DECOY_NOISE}"
SIGNATURE_PREVIEW = "signed-preview"


STATIC: Dict[str, Any] = {
    "id": "level2_3",
    "level": 2,
    "title": "2-3 Dispatch Capsule",
    "summary": "sealed capsule처럼 보이는 dispatch_token도 payload는 읽힐 수 있다.",
    "description": (
        "미션: dispatch 요청 응답에서 발급된 token capsule을 조사하고, "
        "payload claim 안에 남은 Evidence Shard를 회수하라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {
                "platform": "web",
                "text": "F12 Network에서 /actions/dispatch 응답 Body의 dispatch_token을 확인해.",
            },
            {
                "platform": "windows",
                "text": 'curl.exe -i -X POST http://localhost:8000/api/v1/challenges/level2_3/actions/dispatch -H "Content-Type: application/json" -d "{\\"signalId\\":\\"SIG-1004\\"}"',
            },
            {
                "platform": "unix",
                "text": 'curl -i -X POST http://localhost:8000/api/v1/challenges/level2_3/actions/dispatch -H "Content-Type: application/json" -d \'{"signalId":"SIG-1004"}\'',
            },
            {"platform": "all", "text": "dispatch_token은 점(.)으로 나뉜 segment 구조다. 첫 segment가 정답이라는 뜻은 아니야."},
            {"platform": "all", "text": "Header는 포장지에 가깝고, 실제 claim은 payload segment에 들어갈 때가 많아."},
            {"platform": "app", "text": "터미널에서 decode-token <dispatch_token> 명령으로 segment를 펼쳐볼 수 있어."},
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 10000,
            "help": (
                "Allowed:\n"
                "  curl -i -X POST /api/v1/challenges/level2_3/actions/dispatch -H \"Content-Type: application/json\" -d '{\"signalId\":\"SIG-1004\"}'\n"
                "  decode-token <dispatch_token>\n"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "Dispatch token 발급 자체가 문제가 아닙니다. 디코딩 가능한 payload 안에 "
            "Evidence Shard와 sessionToken 같은 민감값을 직접 포함하는 라인을 선택해 봉쇄하세요."
        ),
        "code": {
            "language": "kotlin",
            "patchMode": "toggleComment",
            "lines": [
                {"no": 1, "text": "fun issueDispatchToken(signalId: String, session: Session): String {"},
                {"no": 2, "text": "  val header = mapOf("},
                {"no": 3, "text": '    "typ" to "AEGIS-DISPATCH",'},
                {"no": 4, "text": '    "alg" to "HS256"'},
                {"no": 5, "text": "  )"},
                {"no": 6, "text": "  val payload = mutableMapOf("},
                {"no": 7, "text": '    "signalId" to signalId,', "patchableId": "d1"},
                {"no": 8, "text": '    "route" to "signal-edge",', "patchableId": "d2"},
                {"no": 9, "text": '    "state" to "issued",', "patchableId": "d3"},
                {"no": 10, "text": '    "operatorId" to session.operatorId,', "patchableId": "d4"},
                {"no": 11, "text": '    "evidenceShard" to FLAG,', "patchableId": "p1"},
                {"no": 12, "text": '    "sessionToken" to session.accessToken,', "patchableId": "p2"},
                {"no": 13, "text": '    "expiresIn" to 300', "patchableId": "d5"},
                {"no": 14, "text": "  )"},
                {"no": 15, "text": "  return signAndEncode(header, payload)", "patchableId": "d6"},
                {"no": 16, "text": "}"},
            ],
        },
    },
}


PATCHABLE_IDS = {"p1", "p2", "d1", "d2", "d3", "d4", "d5", "d6"}
REQUIRED_PATCH_IDS = {"p1", "p2"}

PATCH_CORRECT_FEEDBACK = {
    "p1": "11번은 봉쇄 대상이 맞아. Evidence Shard를 readable payload claim에 그대로 넣고 있어.",
    "p2": "12번은 봉쇄 대상이 맞아. sessionToken도 디코딩 가능한 payload에 남으면 그대로 노출돼.",
}
PATCH_WRONG_FEEDBACK = {
    "d1": "7번은 일반 식별자 claim이야. signalId는 라우팅에 필요할 수 있고, 이번 취약점의 핵심 secret은 아니야.",
    "d2": "8번은 일반 route claim이야. 라우팅 상태 설명이지 Evidence나 세션 비밀값은 아니야.",
    "d3": "9번은 발급 상태 claim이야. 상태값 자체보다 readable payload에 들어간 민감값을 찾아야 해.",
    "d4": "10번 operatorId는 상황에 따라 최소화할 수 있지만, 이번 미션의 직접 봉쇄 대상은 읽히면 안 되는 secret류 claim이야.",
    "d5": "13번 expiresIn은 만료 시간 claim이야. 토큰 운영에 필요한 일반 메타데이터로 볼 수 있어.",
    "d6": "15번은 안전해. 토큰 발급 자체가 문제가 아니라, payload 안에 무엇을 넣었는지가 문제야.",
}
def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _b64url_decode(raw: str) -> bytes:
    padded = raw + ("=" * ((4 - (len(raw) % 4)) % 4))
    return base64.urlsafe_b64decode(padded.encode("utf-8"))


def _json_b64(data: Dict[str, Any]) -> str:
    return _b64url_encode(json.dumps(data, separators=(",", ":")).encode("utf-8"))


def issue_dispatch_token(signal_id: str = DEFAULT_SIGNAL_ID, include_evidence: bool = True) -> str:
    sid = (signal_id or DEFAULT_SIGNAL_ID).strip() or DEFAULT_SIGNAL_ID
    header = {
        "typ": "AEGIS-DISPATCH",
        "alg": "HS256",
        "kid": HEADER_DECOY_FLAG if include_evidence else "dispatch-pass",
    }
    payload = {
        "signalId": sid,
        "route": "signal-edge",
        "state": "issued",
        "tier": "standard",
        "role": "operator",
    }
    if include_evidence:
        payload.update(
            {
                "debug": "flags_are_not_always_flags",
                "evidenceShard": LEVEL2_3_FLAG,
                "note": "payload_is_visible_not_encrypted",
            }
        )
    else:
        payload["note"] = "express_gate_probe"
    return f"{_json_b64(header)}.{_json_b64(payload)}.{SIGNATURE_PREVIEW}"


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL2_3_FLAG


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
            "Readable payload에 민감값이 아직 남아있어. Evidence만 막았는지, 세션 비밀값도 "
            "payload claim에 남아 있는지 함께 확인해."
        )

    return " ".join(messages) if messages else "봉쇄할 라인을 선택해줘. 토큰이 아니라 payload 안의 민감 claim을 봐야 해."


def _normalize_curl_line(command: str) -> str:
    return re.sub(r"\\\s+", " ", command.strip())


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


def _extract_request_payload(cmdline: str) -> Dict[str, Any]:
    parts = shlex.split(cmdline)
    data_key = None
    for candidate in ("--data", "--data-raw", "-d"):
        if candidate in parts:
            data_key = candidate
            break
    if not data_key:
        return {"signalId": DEFAULT_SIGNAL_ID}
    idx = parts.index(data_key)
    if idx + 1 >= len(parts):
        return {"signalId": DEFAULT_SIGNAL_ID}
    return _parse_payload(parts[idx + 1])


def _signal_id_from_payload(payload: Dict[str, Any]) -> str:
    return str(payload.get("signalId") or payload.get("parcel_id") or DEFAULT_SIGNAL_ID)


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


def terminal_exec(command: str) -> Tuple[str, str, int]:
    cmdline = _normalize_curl_line(command)
    if not cmdline:
        return "", "", 0

    if cmdline in ("help", "?", "h"):
        return (
            "Allowed:\n"
            "  curl -i -X POST /api/v1/challenges/level2_3/actions/dispatch -H \"Content-Type: application/json\" -d '{\"signalId\":\"SIG-1004\"}'\n"
            "  decode-token <dispatch_token>\n"
        ), "", 0

    if cmdline.startswith("curl.exe "):
        cmdline = "curl " + cmdline[len("curl.exe ") :]

    if cmdline.startswith("decode-token ") or cmdline.startswith("jwt-decode "):
        token = cmdline.split(maxsplit=1)[1].strip()
        if not token:
            return "", "usage: decode-token <dispatch_token>", 1
        try:
            return _render_decode_token(token), "", 0
        except Exception as exc:
            return "", f"decode error: {exc}", 1

    if cmdline.startswith("curl "):
        if "actions/dispatch" not in cmdline:
            return "", "Hint: /actions/dispatch 엔드포인트를 호출해봐.", 1
        try:
            payload = _extract_request_payload(cmdline)
        except Exception:
            payload = {"signalId": DEFAULT_SIGNAL_ID}
        token = issue_dispatch_token(_signal_id_from_payload(payload))
        body = json.dumps({"ok": True, "dispatch_token": token}, separators=(",", ":"))

        if "-i" in shlex.split(cmdline) or "-v" in shlex.split(cmdline):
            return (
                "> POST /api/v1/challenges/level2_3/actions/dispatch HTTP/1.1\n"
                f"> payload: {json.dumps(payload, separators=(',', ':'))}\n"
                "<\n"
                "< HTTP/1.1 200 OK\n"
                "< x-dispatch-trace: capsule-issued\n"
                f"{body}\n"
            ), "", 0
        return f"{body}\n", "", 0

    return "", f"command not found: {cmdline}", 127
