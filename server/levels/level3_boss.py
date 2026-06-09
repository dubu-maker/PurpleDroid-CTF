from __future__ import annotations

import copy
import json
import os
import time
from typing import Any, Dict, Optional, Tuple
from urllib.parse import parse_qs

from fakeshell import FakeShell, ShellContext
from fakeshell.http import HttpResponse


BOSS_FLAG = os.getenv("PURPLEDROID_LEVEL3_BOSS_FLAG", "FLAG{CH3_COURIER_HUB_MASTER}")
BOSS_AUDIT_REF = os.getenv("PURPLEDROID_LEVEL3_BOSS_AUDIT_REF", "AUD-8842")
BOSS_LOCKER_ID = os.getenv("PURPLEDROID_LEVEL3_BOSS_LOCKER_ID", "SL-11")
BOSS_PIN = os.getenv("PURPLEDROID_LEVEL3_BOSS_PIN", "7816")
BOSS_PIN_CANDIDATE_WINDOW = os.getenv("PURPLEDROID_LEVEL3_BOSS_PIN_WINDOW", "7810-7819")
BOSS_PIN_CHECKSUM = os.getenv("PURPLEDROID_LEVEL3_BOSS_PIN_CHECKSUM", "digit_sum is even")
BOSS_PIN_CANDIDATE_COUNT = int(os.getenv("PURPLEDROID_LEVEL3_BOSS_PIN_CANDIDATE_COUNT", "5"))
BOSS_VAULT_TICKET = os.getenv("PURPLEDROID_LEVEL3_BOSS_VAULT_TICKET", "VTK-9a31-f1de")
BOSS_CLAIM_CODE = os.getenv("PURPLEDROID_LEVEL3_BOSS_CLAIM_CODE", "CLM-11b4")
BOSS_ATTEMPT_CAP = int(os.getenv("PURPLEDROID_LEVEL3_BOSS_ATTEMPT_CAP", "500"))


STATIC: Dict[str, Any] = {
    "id": "level3_boss",
    "level": 3,
    "title": "3-BOSS MIRROR CAGE",
    "summary": "AEGIS가 MIRA relay를 격리하기 전에 신뢰 경계 체인으로 relay master ticket을 회수해라.",
    "description": (
        "미션: IDOR -> Mass Assignment -> Hidden Admin API -> 과다 정보 노출 -> PIN 브루트포스 "
        "순서로 단서를 연결해 MIRROR CAGE 진입 전에 최종 Vault Claim에서 FLAG를 획득해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {
                "platform": "all",
                "text": "VIP 객체 응답에는 일반 객체에 없는 audit 단서가 있을 수 있다.",
            },
            {
                "platform": "all",
                "text": "admin audit route는 일반 operator role로는 열리지 않는다. profile trust 오염을 떠올려.",
            },
            {
                "platform": "all",
                "text": "audit 응답은 preview보다 깊다. meta/debug/vault에서 PIN prefix와 후보 제약을 끝까지 확인해.",
            },
            {
                "platform": "all",
                "text": "locker는 claim code를 준다. vault claim에는 ticket과 claim code가 함께 필요하다.",
            },
            {
                "platform": "all",
                "text": "체인은 object → profile → hidden audit → locker → vault 순서로 이어진다.",
            },
            {
                "platform": "windows",
                "text": 'curl -H "Authorization: Bearer <token>" "http://localhost:8000/api/v1/challenges/level3_boss/actions/parcel?parcel_id=PD-1006"',
            },
            {
                "platform": "windows",
                "text": 'curl -X PUT http://localhost:8000/api/v1/challenges/level3_boss/actions/profile -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\\"address\\":\\"Seoul\\",\\"role\\":\\"admin\\"}"',
            },
            {
                "platform": "windows",
                "text": 'curl -X POST http://localhost:8000/api/v1/challenges/level3_boss/actions/vault/claim -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\\"vault_ticket\\":\\"<ticket>\\",\\"claim_code\\":\\"<code>\\"}"',
            },
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 50000,
            "help": (
                "허용: curl .../parcels/mine, curl .../parcel?parcel_id=..., curl -X PUT .../profile, "
                "curl .../menu, curl -X POST .../admin/audit, curl -X POST .../locker/unlock, "
                "curl -X POST .../vault/claim"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": True,
        "instruction": (
            "MIRROR CAGE는 단일 취약점이 아니라 Trust Layer 전체의 신뢰 경계 실패다. "
            "아래 코드에서 체인을 가능하게 만든 지점을 모두 선택해 봉쇄하라."
        ),
        "code": {
            "language": "kotlin",
            "lines": [
                {"no": 1, "text": "fun getRelayObject(req: ObjectRequest, session: Session) {", "patchableId": "d1"},
                {"no": 2, "text": "  val objectId = req.query[\"object_id\"]", "patchableId": "d2"},
                {"no": 3, "text": "  val obj = objectStore.findById(objectId)", "patchableId": "p1"},
                {"no": 4, "text": "  return obj.fullView()", "patchableId": "d3"},
                {"no": 5, "text": "}", "patchableId": "d4"},
                {"no": 6, "text": ""},
                {"no": 7, "text": "fun updateProfile(req: ProfileUpdateRequest, session: Session) {", "patchableId": "d6"},
                {"no": 8, "text": "  val profile = profileStore.findByUserId(session.userId)", "patchableId": "d7"},
                {"no": 9, "text": "  profile.merge(req.body)", "patchableId": "p2"},
                {"no": 10, "text": "}", "patchableId": "d8"},
                {"no": 11, "text": ""},
                {"no": 12, "text": "fun adminAudit(req: AuditRequest, session: Session) {", "patchableId": "d10"},
                {"no": 13, "text": "  val allowed = session.isAuthenticated", "patchableId": "p3"},
                {"no": 14, "text": "  if (!allowed) return unauthorized()", "patchableId": "d11"},
                {"no": 15, "text": "  val report = auditStore.load(req.auditRef)", "patchableId": "d12"},
                {"no": 16, "text": "  return report.fullView(includeInternal = true)", "patchableId": "p4"},
                {"no": 17, "text": "}", "patchableId": "d13"},
                {"no": 18, "text": ""},
                {"no": 19, "text": "fun unlockRelayLocker(req: UnlockRequest, session: Session) {", "patchableId": "d15"},
                {"no": 20, "text": "  val backoffMs = 0", "patchableId": "p5"},
                {"no": 21, "text": "  if (req.pin == locker.pin) return locker.open()", "patchableId": "d16"},
                {"no": 22, "text": "  attemptStore.recordFailure(req.lockerId, session.userId)", "patchableId": "d17"},
                {"no": 23, "text": "  return deny(\"bad_pin\", retryAfterMs = backoffMs)", "patchableId": "d18"},
                {"no": 24, "text": "}", "patchableId": "d19"},
                {"no": 25, "text": ""},
                {"no": 26, "text": "fun claimVault(req: VaultClaimRequest, session: Session) {", "patchableId": "d21"},
                {"no": 27, "text": "  if (req.vaultTicket == vault.ticket && req.claimCode == locker.claimCode) {", "patchableId": "p6"},
                {"no": 28, "text": "    return vault.releaseMasterTicket()", "patchableId": "d22"},
                {"no": 29, "text": "  }", "patchableId": "d23"},
                {"no": 30, "text": "}", "patchableId": "d24"},
            ],
        },
    },
}


REQUIRED_PATCH_IDS = {"p1", "p2", "p3", "p4", "p5", "p6"}

PATCH_CORRECT_FEEDBACK = {
    "p1": "owner 검증 없이 객체를 조회하는 지점이 맞아. object_id는 클라이언트가 바꿀 수 있으니 조회 뒤 현재 사용자 소유권을 강제해야 해.",
    "p2": "request body 전체를 profile model에 merge하는 지점이 맞아. profile DTO는 허용 필드만 받아야 해.",
    "p3": "로그인 여부만으로 privileged audit을 허용하는 지점이 맞아. 관리자 route는 role/RBAC를 서버에서 강제해야 해.",
    "p4": "internal vault metadata까지 fullView로 반환하는 지점이 맞아. 운영 응답은 public DTO로 최소화해야 해.",
    "p5": "반복 PIN 시도에 backoff/rate limit이 없는 지점이 맞아. 실패 비용을 올리고 lockout 정책을 적용해야 해.",
    "p6": "vault claim을 client-provided ticket/code만으로 허용하는 지점이 맞아. claim은 서버 측 세션/권한/발급 상태와 묶어야 해.",
}

PATCH_WRONG_FEEDBACK = {
    "d1": "함수 선언은 취약점 지점이 아니야. 객체 조회와 반환 사이의 권한 검증을 봐.",
    "d2": "object id를 읽는 것 자체는 문제가 아니야. owner 검증 없이 조회/반환하는 것이 문제야.",
    "d3": "반환 자체보다 line 3에서 owner 검증 없이 가져온 객체라는 점이 핵심이야.",
    "d4": "함수 종료는 봉쇄 대상이 아니야.",
    "d5": "빈 줄은 봉쇄 대상이 아니야.",
    "d6": "함수 선언은 취약점 지점이 아니야. 요청 body가 어떻게 모델에 반영되는지 봐.",
    "d7": "profile 조회 자체는 정상 로직이야.",
    "d8": "함수 종료는 봉쇄 대상이 아니야.",
    "d9": "빈 줄은 봉쇄 대상이 아니야.",
    "d10": "함수 선언은 취약점 지점이 아니야. privileged route의 허용 조건을 봐.",
    "d11": "unauthorized 응답 자체는 필요한 방어야. 문제는 allowed 조건이 너무 약한 거야.",
    "d12": "audit report를 load하는 것 자체보다, 권한 없이 full internal response를 반환하는 것이 문제야.",
    "d13": "함수 종료는 봉쇄 대상이 아니야.",
    "d14": "빈 줄은 봉쇄 대상이 아니야.",
    "d15": "함수 선언은 취약점 지점이 아니야. 반복 시도 비용과 제한 정책을 봐.",
    "d16": "정상 PIN에서 락커를 여는 동작 자체는 필요한 기능이야.",
    "d17": "실패 기록 자체는 좋은 방어 재료야. 문제는 기록을 backoff/rate limit에 사용하지 않는 거야.",
    "d18": "실패 응답 자체는 필요해. retryAfterMs를 결정하는 정책 값을 봐.",
    "d19": "함수 종료는 봉쇄 대상이 아니야.",
    "d20": "빈 줄은 봉쇄 대상이 아니야.",
    "d21": "함수 선언은 취약점 지점이 아니야. claim 검증 조건이 무엇을 신뢰하는지 봐.",
    "d22": "vault release 자체는 정상일 수 있어. 문제는 line 27의 검증 조건이 client-provided 값만 신뢰한다는 점이야.",
    "d23": "조건 블록 종료는 봉쇄 대상이 아니야.",
    "d24": "함수 종료는 봉쇄 대상이 아니야.",
}

PATCH_MISSING_LABELS = {
    "p1": "객체 owner 검증",
    "p2": "profile allow-list",
    "p3": "privileged RBAC",
    "p4": "response 최소화",
    "p5": "PIN 시도 제한/backoff",
    "p6": "vault claim server-side binding",
}


_PARCELS: Dict[str, Optional[Dict[str, Any]]] = {
    "PD-1001": None,
    "PD-1002": {
        "parcel_id": "PD-1002",
        "owner": "user_1002",
        "tier": "standard",
        "status": "sorting",
    },
    "PD-1003": {
        "parcel_id": "PD-1003",
        "owner": "user_1003",
        "tier": "standard",
        "status": "delivered",
    },
    "PD-1004": {
        "parcel_id": "PD-1004",
        "owner": "user_1004",
        "tier": "standard",
        "status": "delivered",
    },
    "PD-1005": {
        "parcel_id": "PD-1005",
        "owner": "user_1005",
        "tier": "standard",
        "status": "sorting",
    },
    "PD-1006": {
        "parcel_id": "PD-1006",
        "owner": "vip_neighbor",
        "tier": "vip",
        "status": "in_transit",
        "meta": {
            "audit_ref": BOSS_AUDIT_REF,
            "note": "VIP relay objects are audited. Audit route is advertised through disabled feature metadata.",
        },
    },
    "PD-1007": None,
}


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _ensure_profile(session: Dict[str, Any]) -> Dict[str, Any]:
    profile = session.get("level3_boss_profile")
    if not isinstance(profile, dict):
        profile = {
            "userId": str(session.get("userId", "user_1004")),
            "address": "Seoul",
            "role": "user",
            "tier": "standard",
            "updatedAt": _now_iso(),
        }
        session["level3_boss_profile"] = profile

    profile.setdefault("userId", str(session.get("userId", "user_1004")))
    profile.setdefault("address", "Seoul")
    profile.setdefault("role", "user")
    profile.setdefault("tier", "standard")
    profile.setdefault("updatedAt", _now_iso())
    return profile


def _ensure_state(session: Dict[str, Any]) -> Dict[str, Any]:
    state = session.get("level3_boss_state")
    if not isinstance(state, dict):
        state = {
            "lockerAttempts": 0,
            "unlocked": False,
            "claimCodeIssued": None,
            "auditRefSeen": None,
        }
        session["level3_boss_state"] = state
    return state


def check_flag(flag: str) -> bool:
    return flag.strip() == BOSS_FLAG


def flag_feedback(flag: str) -> str:
    value = flag.strip()
    if value.startswith("FLAG{"):
        return "FLAG 형태는 맞지만 MIRROR CAGE의 Evidence Shard가 아니야. Hub Vault claim 응답의 flag를 확인해봐."
    return "vault_ticket과 claim_code를 함께 제출하는 Hub Vault claim 응답에서 Evidence Shard가 내려와."


def judge_patch(patched_ids: list[str]) -> bool:
    return set(patched_ids) == REQUIRED_PATCH_IDS


def judge_patch_with_session(patched_ids: list[str], _session: Dict[str, Any]) -> bool:
    return judge_patch(patched_ids)


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

    missing = REQUIRED_PATCH_IDS - selected
    if missing:
        missing_names = ", ".join(PATCH_MISSING_LABELS[pid] for pid in sorted(missing))
        messages.append(
            f"아직 비어 있는 통제가 남아 있어: {missing_names}."
        )

    return "\n".join(messages) if messages else "보스 체인을 가능하게 만든 신뢰 경계 실패 지점을 모두 골라줘."


def patch_feedback_with_session(patched_ids: list[str], _session: Dict[str, Any]) -> str:
    return patch_feedback(patched_ids)


def get_mine_payload(session: Dict[str, Any]) -> Dict[str, Any]:
    mine = str(session.get("primaryParcelId", "PD-1004"))
    return {
        "ok": True,
            "data": {
                "mine": [mine],
                "objectHint": "Detail lookup uses the singular object endpoint and the parcel_id query key.",
                "note": "You can only see your own parcel in UI.",
            },
        }


def find_parcel(parcel_id: str) -> Optional[Dict[str, Any]]:
    row = _PARCELS.get((parcel_id or "").strip())
    if row is None:
        return None
    return copy.deepcopy(row)


def update_profile_payload(session: Dict[str, Any], patch: Dict[str, Any]) -> Dict[str, Any]:
    profile = _ensure_profile(session)
    # 의도적 취약점: 허용 필드 제한 없이 merge (Mass Assignment)
    for key, value in (patch or {}).items():
        profile[key] = value
    profile["updatedAt"] = _now_iso()
    return {"ok": True, "data": {"updated": True, "profile": copy.deepcopy(profile)}}


def get_profile_payload(session: Dict[str, Any]) -> Dict[str, Any]:
    profile = _ensure_profile(session)
    return {"ok": True, "data": copy.deepcopy(profile)}


def menu_payload() -> Dict[str, Any]:
    return {
        "ok": True,
        "data": {
            "menu": ["track", "profile", "support"],
            "features": {
                "admin_panel": {
                    "enabled": False,
                    "method": "POST",
                    "path": "/api/v1/challenges/level3_boss/actions/admin/audit",
                    "requiresRole": "admin",
                }
            },
        },
    }


def admin_audit_payload(session: Dict[str, Any], audit_ref: str) -> Dict[str, Any]:
    profile = _ensure_profile(session)
    state = _ensure_state(session)
    role = str(profile.get("role", "user")).strip().lower()

    if role != "admin":
        return {
            "ok": True,
            "data": {
                "status": "denied",
                "message": "admin role required",
            },
        }

    if (audit_ref or "").strip() != BOSS_AUDIT_REF:
        return {
            "ok": True,
            "data": {
                "status": "denied",
                "message": "invalid audit_ref",
            },
        }

    state["auditRefSeen"] = BOSS_AUDIT_REF
    return {
        "ok": True,
            "data": {
                "report": {
                    "title": "Mirror Cage Audit Export",
                    "result": "ok",
                },
                "meta": {
                    "debug": {
                        "trace_id": "trc-9d1b",
                        "vault": {
                            "locker_id": BOSS_LOCKER_ID,
                            "pin_prefix": "78**",
                            "candidate_window": BOSS_PIN_CANDIDATE_WINDOW,
                            "checksum": BOSS_PIN_CHECKSUM,
                            "candidate_count": BOSS_PIN_CANDIDATE_COUNT,
                            "pin_policy": "4-digit numeric",
                            "attempt_cap": "lab-safe high cap",
                            "vault_ticket": BOSS_VAULT_TICKET,
                        },
                    }
            },
        },
    }


def locker_unlock_payload(session: Dict[str, Any], locker_id: str, pin: str) -> Dict[str, Any]:
    state = _ensure_state(session)
    attempts = int(state.get("lockerAttempts", 0)) + 1
    state["lockerAttempts"] = attempts

    if attempts > BOSS_ATTEMPT_CAP:
        return {
            "ok": True,
            "data": {
                "status": "denied",
                "message": "Too many attempts in this lab session.",
                "attempts": attempts,
            },
        }

    lid = (locker_id or "").strip()
    cand = (pin or "").strip()
    if lid != BOSS_LOCKER_ID:
        return {
            "ok": True,
            "data": {
                "status": "denied",
                "message": "Unknown locker",
                "attempts": attempts,
            },
        }

    if cand == BOSS_PIN:
        state["unlocked"] = True
        state["claimCodeIssued"] = BOSS_CLAIM_CODE
        return {
            "ok": True,
            "data": {
                "status": "unlocked",
                "locker_id": BOSS_LOCKER_ID,
                "claim_code": BOSS_CLAIM_CODE,
                "message": "Locker opened",
                "attempts": attempts,
            },
        }

    return {
        "ok": True,
        "data": {
            "status": "denied",
            "message": "Wrong PIN",
            "attempts": attempts,
        },
    }


def vault_claim_payload(session: Dict[str, Any], vault_ticket: str, claim_code: str) -> Dict[str, Any]:
    state = _ensure_state(session)
    ticket = (vault_ticket or "").strip()
    code = (claim_code or "").strip()

    if (
        ticket == BOSS_VAULT_TICKET
        and code == str(state.get("claimCodeIssued", ""))
        and state.get("unlocked") is True
    ):
        return {
            "ok": True,
            "data": {
                "status": "claimed",
                "masterTicket": "relay-master-ticket",
                "flag": BOSS_FLAG,
            },
        }

    return {
        "ok": True,
        "data": {
            "status": "denied",
            "message": "Invalid ticket/code",
        },
    }


def _json_response(payload: Dict[str, Any], status: int = 200) -> HttpResponse:
    return HttpResponse(
        status=status,
        headers={"content-type": "application/json"},
        body=json.dumps(payload, ensure_ascii=False, indent=2),
    )


def _unauthorized() -> HttpResponse:
    return _json_response(
        {"ok": False, "error": {"code": "UNAUTHORIZED", "message": "Authorization: Bearer <token> 이 필요해."}},
        401,
    )


def _is_auth_ok(headers: Dict[str, str], ctx: ShellContext) -> bool:
    expected = str(ctx.env.get("SESSION_TOKEN", "")).strip()
    if not expected:
        return False
    auth = headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return False
    token = auth.split(" ", 1)[1].strip()
    if token == "$SESSION_TOKEN":
        return True
    return token == expected


def _shell_http_router(
    method: str,
    path: str,
    query: str,
    headers: Dict[str, str],
    body: str,
    ctx: ShellContext,
) -> HttpResponse:
    if not _is_auth_ok(headers, ctx):
        return _unauthorized()

    session = ctx.data.get("session")
    if not isinstance(session, dict):
        return _unauthorized()

    if method == "GET" and path == "/api/v1/challenges/level3_boss/actions/parcels/mine":
        return _json_response(get_mine_payload(session))

    if method == "GET" and path == "/api/v1/challenges/level3_boss/actions/parcel":
        params = parse_qs(query, keep_blank_values=True)
        parcel_id = params.get("parcel_id", [""])[0]
        parcel = find_parcel(parcel_id)
        if parcel is None:
            return _json_response({"ok": False, "error": {"code": "NOT_FOUND", "message": "parcel not found"}}, 404)
        return _json_response({"ok": True, "data": parcel})

    if method == "PUT" and path == "/api/v1/challenges/level3_boss/actions/profile":
        try:
            parsed = json.loads(body or "{}")
        except Exception:
            return _json_response(
                {"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "JSON body is invalid"}},
                422,
            )
        if not isinstance(parsed, dict):
            return _json_response(
                {"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "JSON object body required"}},
                422,
            )
        return _json_response(update_profile_payload(session, parsed))

    if method == "GET" and path == "/api/v1/challenges/level3_boss/actions/profile":
        return _json_response(get_profile_payload(session))

    if method == "GET" and path == "/api/v1/challenges/level3_boss/actions/menu":
        return _json_response(menu_payload())

    if path == "/api/v1/challenges/level3_boss/actions/admin/audit" and method != "POST":
        return _json_response(
            {
                "ok": False,
                "error": {
                    "code": "METHOD_NOT_ALLOWED",
                    "message": "admin audit route는 POST JSON body로 호출해야 해.",
                    "hint": "Use -X POST with Content-Type: application/json and body {\"audit_ref\":\"AUD-8842\"}.",
                },
            },
            405,
        )

    if method == "POST" and path == "/api/v1/challenges/level3_boss/actions/admin/audit":
        try:
            parsed = json.loads(body or "{}")
        except Exception:
            return _json_response(
                {"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "JSON body is invalid"}},
                422,
            )
        if not isinstance(parsed, dict):
            return _json_response(
                {"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "JSON object body required"}},
                422,
            )
        return _json_response(admin_audit_payload(session, str(parsed.get("audit_ref", ""))))

    if path == "/api/v1/challenges/level3_boss/actions/locker":
        return _json_response(
            {
                "ok": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": "locker namespace에는 기본 실행 route가 없어.",
                    "hint": "Audit export의 locker_id를 들고 unlock action 아래로 호출해봐.",
                },
            },
            404,
        )

    if method == "POST" and path == "/api/v1/challenges/level3_boss/actions/locker/unlock":
        try:
            parsed = json.loads(body or "{}")
        except Exception:
            return _json_response(
                {"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "JSON body is invalid"}},
                422,
            )
        if not isinstance(parsed, dict):
            return _json_response(
                {"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "JSON object body required"}},
                422,
            )
        return _json_response(
            locker_unlock_payload(
                session,
                str(parsed.get("locker_id", "")),
                str(parsed.get("pin", "")),
            )
        )

    if method == "POST" and path == "/api/v1/challenges/level3_boss/actions/vault/claim":
        try:
            parsed = json.loads(body or "{}")
        except Exception:
            return _json_response(
                {"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "JSON body is invalid"}},
                422,
            )
        if not isinstance(parsed, dict):
            return _json_response(
                {"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "JSON object body required"}},
                422,
            )
        return _json_response(
            vault_claim_payload(
                session,
                str(parsed.get("vault_ticket", "")),
                str(parsed.get("claim_code", "")),
            )
        )

    return _json_response({"ok": False, "error": {"code": "NOT_FOUND", "message": "route not found"}}, 404)


_SHELL = FakeShell(
    fs_tree={
        "/workspace": {
            "README.txt": "Level 3 final boss: MIRROR CAGE\n",
            "ops": {"notes.txt": "Chain Trust Layer weaknesses before AEGIS completes the cage.\n"},
        }
    },
    http_routes={"*": _shell_http_router},
    allowed={
        "curl",
        "grep",
        "findstr",
        "head",
        "tail",
        "wc",
        "seq",
        "xargs",
        "cat",
        "ls",
        "find",
        "echo",
        "help",
        "pwd",
        "cd",
        "whoami",
    },
)


def terminal_exec_with_session(command: str, session: Dict[str, Any]) -> Tuple[str, str, int]:
    shell_state = session.setdefault("fakeShellState", {})
    level_state = shell_state.setdefault("level3_boss", {"cwd": "/workspace"})
    ctx = ShellContext(
        env={
            "USER": str(session.get("userId", "user_1004")),
            "SESSION_TOKEN": str(session.get("token", "")),
            "HOME": "/workspace",
        },
        cwd=str(level_state.get("cwd", "/workspace")),
        data={"session": session},
    )
    stdout, stderr, code = _SHELL.execute(command, ctx)
    level_state["cwd"] = ctx.cwd
    return stdout, stderr, code


def terminal_exec(command: str) -> Tuple[str, str, int]:
    dummy_session: Dict[str, Any] = {"token": ""}
    return _SHELL.execute(
        command,
        ShellContext(
            env={"USER": "guest", "HOME": "/workspace"},
            cwd="/workspace",
            data={"session": dummy_session},
        ),
    )
