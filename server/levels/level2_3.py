from __future__ import annotations

import base64
import json
import os
from typing import Any, Dict, List, Tuple

# 2-3 AUDIENCE DRIFT
# 개념 사슬: 2-2(token payload는 읽힌다) → 2-3(유효한 토큰이라도 아무 endpoint에서나
#           쓰면 안 된다) → 2-4(claim을 변조하면 signature 검증이 중요하다).
# 재사용: 2-2 PRIORITY CAPSULE에서 넘어온 dispatch capsule(유효 서명, aud=priority-dispatch).
# 취약점: AEGIS Edge가 토큰 서명(유효성)만 확인하고, aud(audience)가 이 endpoint용으로
#         발급됐는지 바인딩을 검증하지 않는다. priority-dispatch 캡슐이 archive-vault로
#         "drift"해서 Evidence를 꺼낸다.
LEVEL2_3_FLAG = os.getenv("PURPLEDROID_LEVEL2_3_FLAG", "FLAG{AUDIENCE_DRIFT_UNCHECKED}")
DEFAULT_SIGNAL_ID = "SIG-1004"
HEADER_DECOY_FLAG = "FLAG{HEADER_DECOY_NOISE}"   # 옛 상수 유지(2-4가 issue_dispatch_token 경유로 의존)
SIGNATURE_PREVIEW = "signed-preview"

# 캡슐 payload 안에 보이는 값 — 이번 레벨의 Evidence가 아니다(디코이).
CAPSULE_PAYLOAD_DECOY = "FLAG{PRIORITY_CAPSULE_PAYLOAD}"


# -----------------------------
# JWT-ish helpers (2-4가 issue_dispatch_token 경유로 의존)
# -----------------------------
def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _b64url_decode(raw: str) -> bytes:
    padded = raw + ("=" * ((4 - (len(raw) % 4)) % 4))
    return base64.urlsafe_b64decode(padded.encode("utf-8"))


def _json_b64(data: Dict[str, Any]) -> str:
    return _b64url_encode(json.dumps(data, separators=(",", ":")).encode("utf-8"))


def _decode_token(token: str) -> Tuple[Dict[str, Any], Dict[str, Any], str]:
    chunks = token.split(".")
    if len(chunks) != 3:
        raise ValueError("token format error: header.payload.signature 형식이어야 해.")
    header = json.loads(_b64url_decode(chunks[0]).decode("utf-8"))
    payload = json.loads(_b64url_decode(chunks[1]).decode("utf-8"))
    return header, payload, chunks[2]


# -----------------------------
# 2-4가 import하는 dispatch token issuer — 시그니처/동작 그대로 유지(변경 금지)
# -----------------------------
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
                "evidenceShard": CAPSULE_PAYLOAD_DECOY,
                "note": "payload_is_visible_not_encrypted",
            }
        )
    else:
        payload["note"] = "express_gate_probe"
    return f"{_json_b64(header)}.{_json_b64(payload)}.{SIGNATURE_PREVIEW}"


# -----------------------------
# 2-3 priority capsule (2-2에서 넘어온 캡슐). aud/scope claim을 담는다.
# -----------------------------
def issue_priority_capsule() -> str:
    header = {"typ": "AEGIS-DISPATCH", "alg": "HS256", "kid": "priority-edge-2f"}
    payload = {
        "tier": "vip",
        "aud": "priority-dispatch",
        "scope": "dispatch:read",
        "route": "priority-edge",
        "exp": "2099-12-31T23:59:59Z",
    }
    return f"{_json_b64(header)}.{_json_b64(payload)}.{SIGNATURE_PREVIEW}"


CAPSULE_TOKEN = issue_priority_capsule()


def _capsule_payload() -> Dict[str, Any]:
    _, payload, _ = _decode_token(CAPSULE_TOKEN)
    return payload


# -----------------------------
# Route registry
# -----------------------------
ROUTE_REGISTRY: List[Dict[str, str]] = [
    {"path": "/dispatch/status", "audience": "priority-dispatch", "scope": "dispatch:read"},
    {"path": "/archive/vault", "audience": "archive-vault", "scope": "archive:read"},
    {"path": "/mirror/ping", "audience": "public", "scope": "none"},
]
_ROUTE_BY_PATH = {r["path"]: r for r in ROUTE_REGISTRY}


def _valid_signature(sig: str) -> bool:
    return sig == SIGNATURE_PREVIEW


def route_request(path: str, authorization: str) -> Tuple[Dict[str, Any], int]:
    """Postman 폼의 Send 처리. audience 미검증(drift) 버그가 여기 있다."""
    path = (path or "").strip()
    auth = (authorization or "").strip()

    if not auth.lower().startswith("bearer "):
        return {"ok": False, "error": "Authorization: Bearer <token> header required. Put the capsule token after Bearer."}, 401
    token = auth[len("bearer "):].strip()
    if not token:
        return {"ok": False, "error": "Empty Bearer token. Paste the dispatch capsule token."}, 401

    # AEGIS Edge가 하는 유일한 검사: 서명(유효성) 확인.
    try:
        _header, payload, sig = _decode_token(token)
    except Exception:
        return {"ok": False, "error": "token format error -- send the issued capsule as-is (header.payload.signature)."}, 401
    if not _valid_signature(sig):
        return {"ok": False, "error": "invalid signature -- forged or altered tokens are rejected. Send the issued capsule unchanged."}, 401

    route = _ROUTE_BY_PATH.get(path)
    if route is None:
        return {"ok": False, "error": f"unknown route: {path or '(empty)'}. Pick a path from the ROUTE REGISTRY."}, 404

    tok_aud = payload.get("aud")
    tok_scope = payload.get("scope")

    # === 취약점 ===
    # Edge는 "토큰이 유효하고 aud claim이 존재하면" 통과시킨다. aud가 이 endpoint의
    # required audience와 일치하는지(endpoint 바인딩)를 확인하지 않는다 → audience drift.
    if not tok_aud:
        return {"ok": False, "error": "no audience claim in token"}, 403  # noqa: E501 (English API response)

    if path == "/archive/vault":
        # 올바르게 구현했다면 tok_aud == 'archive-vault' 를 요구해야 하지만 그 검사가 없다.
        return {
            "ok": True,
            "route": path,
            "servedTo": tok_aud,
            "requiredAudience": route["audience"],
            "warning": "audience claim was present but NOT bound to this endpoint",
            "evidenceShard": LEVEL2_3_FLAG,
        }, 200

    if path == "/dispatch/status":
        return {
            "ok": True,
            "route": path,
            "servedTo": tok_aud,
            "status": "nominal",
            "note": "this capsule's audience matches here — nothing sensitive to recover",
        }, 200

    if path == "/mirror/ping":
        return {"ok": True, "route": path, "audience": "public", "pong": True}, 200

    return {"ok": False, "error": "not served"}, 403


# -----------------------------
# flag
# -----------------------------
def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL2_3_FLAG


def flag_feedback(flag: str) -> str:
    submitted = flag.strip()
    if submitted in (CAPSULE_PAYLOAD_DECOY, HEADER_DECOY_FLAG):
        return "MIRA: 그건 캡슐 payload/header 안에 보이던 값이야 — 이번 Evidence가 아니야. 캡슐을 archive-vault로 보내서 나온 응답의 evidenceShard를 제출해."
    if submitted.startswith("FLAG{") and submitted != LEVEL2_3_FLAG:
        return "MIRA: 그 값이 아니야. 유효한 캡슐을 audience가 안 맞는 endpoint(archive-vault)로 보내 — Edge가 audience를 검증 안 하면 그대로 통과돼."
    return "MIRA: 캡슐을 ROUTE REGISTRY의 endpoint로 보내봐. audience가 맞는 dispatch/status 말고, Evidence가 있는 archive-vault로 drift시켜."


# -----------------------------
# defense
# -----------------------------
STATIC: Dict[str, Any] = {
    "id": "level2_3",
    "level": 2,
    "title": "2-3 Audience Drift",
    "summary": "유효한 dispatch capsule을 audience가 맞지 않는 endpoint로 흘려보내 Evidence를 회수한다.",
    "description": (
        "미션: Priority Capsule에서 넘어온 dispatch capsule은 서명이 유효하지만 aud는 "
        "priority-dispatch용이다. ROUTE REGISTRY를 보고, 캡슐을 audience가 다른 endpoint로 "
        "보냈을 때 AEGIS Edge가 audience를 검증하는지 시험해라. 유효 ≠ 인가."
    ),
    "status": {
        "attack": "available",
        "defense": "locked",
    },
    "attack": {
        "uiMode": "requestForge",
        "capsuleToken": CAPSULE_TOKEN,
        "capsulePayload": _capsule_payload(),
        "routeRegistry": ROUTE_REGISTRY,
        "requestPath": "/api/v1/challenges/level2_3/actions/request",
        "hints": [
            {"platform": "all", "text": "캡슐 payload의 aud=priority-dispatch야. ROUTE REGISTRY에서 이 audience와 맞는 endpoint(/dispatch/status)엔 민감한 게 없어."},
            {"platform": "all", "text": "Evidence는 /archive/vault에 있어. 그건 archive-vault audience를 요구하지만, Edge가 그 바인딩을 검증하는지 캡슐을 그대로 보내서 확인해."},
        ],
        "terminal": {"enabled": False},
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "capsule을 endpoint로 라우팅하는 흐름에서, audience 바인딩 없이 접근을 허용하는 라인을 "
            "모두 골라 봉쇄해. 서명 검증·registry 조회·정확한 audience 일치 검사·기본 거부는 대상이 "
            "아니다. '유효하기만 하면/aud가 있기만 하면/등급만 맞으면' 통과시키는 라인이 대상이야."
        ),
        "code": {
            "language": "kotlin",
            "patchMode": "toggleComment",
            "lines": [
                {"no": 1, "text": "fun serveRoute(path: String, token: DecodedToken): Response {"},
                {"no": 2, "text": "  if (!verifySignature(token)) return unauthorized()", "patchableId": "d1"},
                {"no": 3, "text": "  val required = routeRegistry[path] ?: return notFound()", "patchableId": "d2"},
                {"no": 4, "text": "  if (token.aud == required.audience) return serve(path, token)", "patchableId": "d3"},
                {"no": 5, "text": "  if (token.isValid) return serve(path, token)", "patchableId": "p1"},
                {"no": 6, "text": "  if (token.aud != null) return serve(path, token)", "patchableId": "p2"},
                {"no": 7, "text": '  if (token.tier == "vip") return serve(path, token)', "patchableId": "p3"},
                {"no": 8, "text": "  return forbidden()", "patchableId": "d4"},
                {"no": 9, "text": "}"},
            ],
        },
    },
}

PATCHABLE_IDS = {"p1", "p2", "p3", "d1", "d2", "d3", "d4"}
REQUIRED_PATCH_IDS = {"p1", "p2", "p3"}

PATCH_CORRECT_FEEDBACK = {
    "p1": "5번은 봉쇄 대상이 맞아. 서명이 유효하다는 이유만으로(valid) 접근을 허용하고 있어 — 유효 ≠ 인가야.",
    "p2": "6번은 봉쇄 대상이 맞아. aud claim이 있기만 하면 통과시켜 — endpoint별 audience 바인딩이 없어서 drift가 생겨.",
    "p3": "7번은 봉쇄 대상이 맞아. tier=vip는 audience가 아니야 — 등급으로 vault 접근을 허용하면 안 돼.",
}
PATCH_WRONG_FEEDBACK = {
    "d1": "2번은 안전해. signature 검증은 올바른 게이트야 — 오히려 필요해.",
    "d2": "3번은 안전해. route registry 조회일 뿐이야.",
    "d3": "4번은 안전해 — 지우면 안 돼. token.aud가 이 endpoint의 required audience와 정확히 일치할 때만 통과시키는 올바른 검사야.",
    "d4": "8번은 안전해. 기본 거부(forbidden) 폴백이야.",
}


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
            "아직 위험 라인이 남아있어. audience를 endpoint에 바인딩하지 않고 "
            "'유효하기만 하면/aud가 있기만 하면/등급만 맞으면' 통과시키는 라인을 모두 확인해."
        )
    return " ".join(messages) if messages else "봉쇄할 라인을 선택해줘. audience 바인딩 없이 접근을 허용하는 지점을 봐야 해."


def terminal_exec(command: str) -> Tuple[str, str, int]:
    # 이 노드는 Capsule Router(폼)를 쓴다. 터미널은 비활성.
    return "", "이 노드는 Capsule Router 폼을 사용해. 터미널 명령은 없어.", 2
