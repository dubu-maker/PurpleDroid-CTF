from __future__ import annotations

import base64
import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple

# 2-3 AUDIENCE DRIFT (HARD MODE)
# 개념 사슬: 2-2(token payload는 읽힌다) → 2-3(유효한 토큰이라도 이 endpoint용으로
#           발급됐는지 audience가 묶여야 한다) → 2-4(claim을 변조하면 서명 검증이 중요하다).
# 취약점: AEGIS Edge는 서명·만료(exp)·scope는 실제로 검증하지만, aud(audience)가 이
#         endpoint의 required audience와 일치하는지(바인딩)는 검사하지 않는다.
# 하드 모드: 포획한 캡슐이 여러 개다(전부 서명 유효). 대부분 exp/scope에서 거부되고,
#           딱 하나 — scope/exp는 맞지만 audience가 이 endpoint용이 아닌 캡슐 — 이
#           그대로 통과(drift)한다. 거부 사유에 audience가 절대 안 나온다는 걸 알아채고,
#           "audience만 안 묶였다"를 스스로 도출해 그 캡슐을 골라야 한다.
LEVEL2_3_FLAG = os.getenv("PURPLEDROID_LEVEL2_3_FLAG", "FLAG{AUDIENCE_DRIFT_UNCHECKED}")
DEFAULT_SIGNAL_ID = "SIG-1004"
HEADER_DECOY_FLAG = "FLAG{HEADER_DECOY_NOISE}"   # 옛 상수 유지(main.py dispatch 엔드포인트 호환)
SIGNATURE_PREVIEW = "signed-preview"

# 캡슐 payload 안에 보이는 값 — 이번 레벨의 Evidence가 아니다(디코이).
CAPSULE_PAYLOAD_DECOY = "FLAG{PRIORITY_CAPSULE_PAYLOAD}"

_FUTURE = "2099-12-31T23:59:59Z"
_PAST = "2020-03-01T00:00:00Z"


# -----------------------------
# JWT-ish helpers
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
# main.py의 /actions/dispatch 가 여전히 import — 시그니처/동작 유지(변경 금지)
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
# 포획한 캡슐 지갑 — 전부 서명 유효(signed-preview). claim은 payload를 직접 디코딩해야 보인다.
# -----------------------------
def _capsule(svc: str, aud: str, scope: str, exp: str) -> str:
    header = {"typ": "AEGIS-DISPATCH", "alg": "HS256", "kid": "edge-2f"}
    payload = {"iss": "aegis-edge", "svc": svc, "aud": aud, "scope": scope, "exp": exp}
    return f"{_json_b64(header)}.{_json_b64(payload)}.{SIGNATURE_PREVIEW}"


# 지갑 순서/라벨은 정답을 흘리지 않도록 중립적으로. (delta 가 drift 정답)
# 추가 추론: scope/exp를 통과하는 캡슐이 둘이다 — epsilon(aud=archive-vault, 이 endpoint용
#           정상 토큰)과 delta(aud=archive-writer, 다른 곳 발급). Edge가 audience를 안 묶으니
#           둘 다 200으로 서빙되지만, aud가 일치하는 epsilon은 정상 인가(디코이)이고,
#           aud가 이 endpoint용이 아닌데도 통과하는 delta 가 drift(정답)다.
CAPSULE_WALLET: List[Dict[str, str]] = [
    {"id": "cap-alpha", "label": "captured capsule // alpha",
     "token": _capsule("priority-dispatch", "priority-dispatch", "dispatch:read", _FUTURE)},
    {"id": "cap-beta", "label": "captured capsule // beta",
     "token": _capsule("archive-reader", "archive-vault", "archive:read", _PAST)},        # 만료 함정
    {"id": "cap-epsilon", "label": "captured capsule // epsilon",
     "token": _capsule("vault-reader", "archive-vault", "archive:read", _FUTURE)},        # 유효 + aud 일치 → 정상 인가(디코이)
    {"id": "cap-gamma", "label": "captured capsule // gamma",
     "token": _capsule("mirror-ping", "public", "none", _FUTURE)},
    {"id": "cap-delta", "label": "captured capsule // delta",
     "token": _capsule("archive-writer", "archive-writer", "archive:read", _FUTURE)},      # drift 정답
]


# -----------------------------
# Route registry — 요구 audience/scope 라벨은 노출하지 않는다(하드). path만 안다.
# -----------------------------
ROUTE_REGISTRY: List[Dict[str, str]] = [
    {"path": "/archive/vault"},
    {"path": "/dispatch/status"},
    {"path": "/mirror/ping"},
]

_ROUTE_POLICY: Dict[str, Dict[str, str]] = {
    "/archive/vault": {"requiredAudience": "archive-vault", "requiredScope": "archive:read"},
    "/dispatch/status": {"requiredAudience": "priority-dispatch", "requiredScope": "dispatch:read"},
    "/mirror/ping": {"requiredAudience": "public", "requiredScope": "none"},
}


def _valid_signature(sig: str) -> bool:
    return sig == SIGNATURE_PREVIEW


def _is_expired(exp: str) -> bool:
    if not exp:
        return False
    try:
        dt = datetime.fromisoformat(str(exp).replace("Z", "+00:00"))
    except Exception:
        return False
    return dt <= datetime.now(timezone.utc)


def route_request(path: str, authorization: str) -> Tuple[Dict[str, Any], int]:
    """Capsule Router의 Send 처리. audience 바인딩 미검증(drift) 버그가 여기 있다."""
    path = (path or "").strip()
    auth = (authorization or "").strip()

    if not auth.lower().startswith("bearer "):
        return {"ok": False, "error": "Authorization: Bearer <token> header required. Put a capsule token after Bearer."}, 401
    token = auth[len("bearer "):].strip()
    if not token:
        return {"ok": False, "error": "Empty Bearer token. Paste one of the captured capsules."}, 401

    try:
        _header, payload, sig = _decode_token(token)
    except Exception:
        return {"ok": False, "error": "token format error -- send a captured capsule as-is (header.payload.signature)."}, 401
    if not _valid_signature(sig):
        return {"ok": False, "error": "invalid signature -- forged or altered tokens are rejected. Send a captured capsule unchanged."}, 401

    policy = _ROUTE_POLICY.get(path)
    if policy is None:
        return {"ok": False, "error": f"unknown route: {path or '(empty)'}."}, 404

    tok_aud = payload.get("aud")
    tok_scope = payload.get("scope")

    # === Edge가 실제로 강제하는 검사들 (정상 동작) ===
    if _is_expired(payload.get("exp")):
        return {"ok": False, "error": "token expired -- this capsule is past its exp.", "reason": "exp"}, 401
    if tok_scope != policy["requiredScope"]:
        return {
            "ok": False,
            "error": f"scope mismatch -- this route requires scope '{policy['requiredScope']}'.",
            "reason": "scope",
        }, 403

    # === 취약점 ===
    # Edge는 서명·exp·scope는 검사하지만, aud가 이 endpoint의 required audience와
    # 일치하는지(바인딩)는 검사하지 않는다 → audience가 다른 캡슐이 그대로 통과(drift).
    # scope/exp를 통과하는 캡슐은 둘이다:
    #   - aud가 일치(archive-vault) → 이 endpoint용으로 발급된 정상 토큰(인가). 서빙되지만 Evidence 아님.
    #   - aud가 불일치(archive-writer 등) → 다른 곳 발급인데도 통과(drift). 이게 취약점 증거.
    if path == "/archive/vault":
        served = {
            "ok": True,
            "route": path,
            "servedTo": tok_aud,
            "requiredAudience": policy["requiredAudience"],
        }
        if tok_aud == policy["requiredAudience"]:
            served["authorized"] = True
            served["note"] = "authorized — this token was issued for this endpoint (aud matches). nothing anomalous to recover."
            return served, 200
        served["warning"] = "scope/exp were enforced, but the audience claim was never bound to this endpoint"
        served["evidenceShard"] = LEVEL2_3_FLAG
        return served, 200

    if path == "/dispatch/status":
        return {
            "ok": True,
            "route": path,
            "servedTo": tok_aud,
            "status": "nominal",
            "note": "this capsule passes here — nothing sensitive to recover",
        }, 200

    if path == "/mirror/ping":
        return {"ok": True, "route": path, "pong": True}, 200

    return {"ok": False, "error": "not served"}, 403


# -----------------------------
# flag
# -----------------------------
def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL2_3_FLAG


def flag_feedback(flag: str) -> str:
    submitted = flag.strip()
    if submitted in (CAPSULE_PAYLOAD_DECOY, HEADER_DECOY_FLAG):
        return "MIRA: 그건 캡슐 payload/header 안에 보이던 값이야 — 이번 Evidence가 아니야. 캡슐을 /archive/vault로 통과시켜 나온 응답의 evidenceShard를 제출해."
    if submitted.startswith("FLAG{") and submitted != LEVEL2_3_FLAG:
        return "MIRA: 그 값이 아니야. scope/exp를 통과하는 캡슐이 둘이야 — aud가 이 endpoint(archive-vault)와 일치하는 건 정상 인가라 회수할 게 없고, aud가 다른데도 통과하는 drift 캡슐을 /archive/vault로 보내야 Evidence가 나와."
    return "MIRA: 캡슐마다 aud/scope/exp를 decode해서 대조해. scope/exp를 통과하는 두 캡슐 중, aud가 이 endpoint용이 아닌데도 서빙되는 쪽이 drift야 — 그게 안 묶여 있다는 증거."


# -----------------------------
# defense
# -----------------------------
STATIC: Dict[str, Any] = {
    "id": "level2_3",
    "level": 2,
    "title": "2-3 Audience Drift",
    "summary": "서명·exp·scope는 검증되지만 audience는 endpoint에 바인딩되지 않는다 — 유효 ≠ 인가.",
    "description": (
        "미션: 포획한 캡슐이 여러 개다(전부 서명 유효). 대부분 exp나 scope에서 거부된다. "
        "AEGIS Edge가 무엇을 검사하고 무엇을 안 하는지 응답으로 알아내, audience가 이 endpoint용이 "
        "아닌데도 통과하는 캡슐을 찾아 Evidence를 회수해라. 유효 ≠ 인가."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "uiMode": "requestForge",
        "capsuleWallet": CAPSULE_WALLET,
        "routeRegistry": ROUTE_REGISTRY,
        "requestPath": "/api/v1/challenges/level2_3/actions/request",
        "hints": [
            {"platform": "all", "text": "캡슐마다 aud/scope/exp가 다르다. 각 캡슐을 decode해서 claim을 직접 읽어."},
            {"platform": "all", "text": "Edge가 거부하는 이유를 모아봐. exp·scope는 나오는데 audience는 절대 안 나온다 — 그게 안 묶였다는 신호다."},
            {"platform": "all", "text": "scope/exp를 통과하는 캡슐이 둘이야. 하나는 aud가 이 endpoint(archive-vault)와 일치하는 정상 토큰이고, 다른 하나는 aud가 다른데도 통과해 — 그 drift 쪽이 Evidence다."},
        ],
        "terminal": {"enabled": False},
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "capsule을 endpoint로 라우팅하는 흐름에서, audience 바인딩 없이 접근을 허용하는 라인을 "
            "모두 골라 봉쇄해. 서명 검증·registry 조회·만료(exp) 검사·scope 검사·정확한 audience "
            "일치 검사·기본 거부는 대상이 아니다. '유효하기만 하면 / aud가 있기만 하면 / 등급만 맞으면' "
            "통과시키는 라인이 대상이야."
        ),
        "code": {
            "language": "kotlin",
            "patchMode": "toggleComment",
            "lines": [
                {"no": 1, "text": "fun serveRoute(path: String, token: DecodedToken): Response {"},
                {"no": 2, "text": "  if (!verifySignature(token)) return unauthorized()", "patchableId": "d1"},
                {"no": 3, "text": "  val required = routeRegistry[path] ?: return notFound()", "patchableId": "d2"},
                {"no": 4, "text": "  if (token.isExpired()) return unauthorized()", "patchableId": "d5"},
                {"no": 5, "text": "  if (token.scope != required.scope) return forbidden()", "patchableId": "d6"},
                {"no": 6, "text": "  if (token.aud == required.audience) return serve(path, token)", "patchableId": "d3"},
                {"no": 7, "text": "  if (token.isValid) return serve(path, token)", "patchableId": "p1"},
                {"no": 8, "text": "  if (token.aud != null) return serve(path, token)", "patchableId": "p2"},
                {"no": 9, "text": '  if (token.tier == "vip") return serve(path, token)', "patchableId": "p3"},
                {"no": 10, "text": "  return forbidden()", "patchableId": "d4"},
                {"no": 11, "text": "}"},
            ],
        },
    },
}

PATCHABLE_IDS = {"p1", "p2", "p3", "d1", "d2", "d3", "d4", "d5", "d6"}
REQUIRED_PATCH_IDS = {"p1", "p2", "p3"}

PATCH_CORRECT_FEEDBACK = {
    "p1": "7번은 봉쇄 대상이 맞아. 서명이 유효하다는 이유만으로(valid) 접근을 허용하고 있어 — 유효 ≠ 인가야.",
    "p2": "8번은 봉쇄 대상이 맞아. aud claim이 있기만 하면 통과시켜 — endpoint별 audience 바인딩이 없어서 drift가 생겨.",
    "p3": "9번은 봉쇄 대상이 맞아. tier=vip는 audience가 아니야 — 등급으로 vault 접근을 허용하면 안 돼.",
}
PATCH_WRONG_FEEDBACK = {
    "d1": "2번은 안전해. signature 검증은 올바른 게이트야.",
    "d2": "3번은 안전해. route registry 조회일 뿐이야.",
    "d3": "6번은 안전해 — 지우면 안 돼. token.aud가 이 endpoint의 required audience와 정확히 일치할 때만 통과시키는 올바른 검사야.",
    "d4": "10번은 안전해. 기본 거부(forbidden) 폴백이야.",
    "d5": "4번은 안전해 — 지우면 안 돼. 만료(exp) 검사는 올바른 게이트야(Edge가 실제로 강제하는 검사).",
    "d6": "5번은 안전해 — 지우면 안 돼. scope 검사도 올바른 게이트야(Edge가 실제로 강제하는 검사).",
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
            "'유효하기만 하면 / aud가 있기만 하면 / 등급만 맞으면' 통과시키는 라인을 모두 확인해."
        )
    return " ".join(messages) if messages else "봉쇄할 라인을 선택해줘. audience 바인딩 없이 접근을 허용하는 지점을 봐야 해."


def terminal_exec(command: str) -> Tuple[str, str, int]:
    return "", "이 노드는 Capsule Router 폼을 사용해. 터미널 명령은 없어.", 2
