# server/main.py
from __future__ import annotations

import copy
import secrets
import time
from typing import Any, Dict, Optional, List, Tuple

from fastapi import Body, FastAPI, Header, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field

from levels import LEVELS, LEVEL_ORDER


# -----------------------------
# App setup
# -----------------------------
app = FastAPI(title="PurpleDroid-CTF API", version="0.1.0")

# 개발 편의: 기본은 전체 허용. 운영 시엔 VITE 도메인만 넣는 걸 추천
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSION_TTL_SEC = 7 * 24 * 3600  # 7일
CMD_RATE_WINDOW_SEC = 5
CMD_RATE_MAX = 25  # 5초에 25번 이상이면 제한
PARCEL_RATE_WINDOW_SEC = 60
PARCEL_RATE_MAX = 60  # 분당 60회


# -----------------------------
# Error handling (envelope)
# -----------------------------
class APIError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}


@app.exception_handler(APIError)
async def api_error_handler(_, exc: APIError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "ok": False,
            "error": {"code": exc.code, "message": exc.message, "details": exc.details},
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "ok": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "요청 형식이 올바르지 않습니다.",
                "details": {"errors": exc.errors()},
            },
        },
    )


def ok(data: Any):
    return {"ok": True, "data": data}


# -----------------------------
# In-memory session store
# -----------------------------
# token -> session dict
_sessions: Dict[str, Dict[str, Any]] = {}


def _now() -> float:
    return time.time()


def _new_token() -> str:
    return secrets.token_urlsafe(32)


def _init_progress() -> Dict[str, Dict[str, bool]]:
    return {
        level_id: {"attackSolved": False, "defenseSolved": False}
        for level_id in LEVEL_ORDER
    }


def _get_session(authorization: Optional[str]) -> Tuple[str, Dict[str, Any]]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise APIError("UNAUTHORIZED", "Authorization: Bearer <token> 이 필요해.", 401)

    token = authorization.split(" ", 1)[1].strip()
    s = _sessions.get(token)
    if not s:
        raise APIError("UNAUTHORIZED", "세션이 없거나 만료됐어. /session 다시 호출해줘.", 401)

    if s["expiresAt"] < _now():
        _sessions.pop(token, None)
        raise APIError("UNAUTHORIZED", "세션이 만료됐어. /session 다시 호출해줘.", 401)

    s["lastSeenAt"] = _now()
    return token, s


def _is_level_unlocked(session: Dict[str, Any], level_id: str) -> bool:
    if level_id not in LEVEL_ORDER:
        return False
    idx = LEVEL_ORDER.index(level_id)
    if idx == 0:
        return True
    prev_id = LEVEL_ORDER[idx - 1]
    return session["progress"][prev_id]["defenseSolved"] is True


def _status_for(session: Dict[str, Any], level_id: str) -> Dict[str, str]:
    prog = session["progress"].get(level_id)
    if not prog:
        return {"attack": "locked", "defense": "locked"}

    boss_prereqs = ("level2_1", "level2_2", "level2_3", "level2_4")
    level3_boss_prereqs = ("level3_1", "level3_2", "level3_3", "level3_4", "level3_5")
    if level_id == "level2_5":
        unlocked_attack = all(session["progress"].get(x, {}).get("attackSolved") is True for x in boss_prereqs)
        attack = "solved" if prog["attackSolved"] else ("available" if unlocked_attack else "locked")
    elif level_id == "level3_boss":
        unlocked_attack = all(
            session["progress"].get(x, {}).get("attackSolved") is True for x in level3_boss_prereqs
        )
        attack = "solved" if prog["attackSolved"] else ("available" if unlocked_attack else "locked")
    else:
        # 기본 레벨은 Attack 항상 접근 가능
        attack = "solved" if prog["attackSolved"] else "available"

    unlocked_for_defense = _is_level_unlocked(session, level_id)
    defense = (
        "solved"
        if prog["defenseSolved"]
        else ("available" if (prog["attackSolved"] and unlocked_for_defense) else "locked")
    )
    return {"attack": attack, "defense": defense}


def _next_level_id(level_id: str) -> Optional[str]:
    if level_id not in LEVEL_ORDER:
        return None
    idx = LEVEL_ORDER.index(level_id)
    if idx + 1 >= len(LEVEL_ORDER):
        return None
    return LEVEL_ORDER[idx + 1]


def _rate_limit_terminal(session: Dict[str, Any]):
    now = _now()
    window = session.setdefault("terminalRate", [])
    # window: timestamps
    window[:] = [t for t in window if now - t <= CMD_RATE_WINDOW_SEC]
    if len(window) >= CMD_RATE_MAX:
        raise APIError("RATE_LIMITED", "터미널 요청이 너무 빨라. 잠깐만 천천히!", 429)
    window.append(now)


def _rate_limit_parcel_lookup(session: Dict[str, Any]):
    now = _now()
    window = session.setdefault("parcelLookupRate", [])
    window[:] = [t for t in window if now - t <= PARCEL_RATE_WINDOW_SEC]
    if len(window) >= PARCEL_RATE_MAX:
        raise APIError("RATE_LIMITED", "택배 조회 요청이 너무 빨라. 잠깐 후 다시 시도해.", 429)
    window.append(now)


# -----------------------------
# Request models
# -----------------------------
class SessionCreateReq(BaseModel):
    client: Optional[Dict[str, Any]] = None


class TerminalExecReq(BaseModel):
    command: str = Field(..., min_length=1, max_length=300)


class SubmitFlagReq(BaseModel):
    flag: str = Field(..., min_length=1, max_length=200)


class SubmitPatchReq(BaseModel):
    patched: List[str] = Field(default_factory=list)


# -----------------------------
# Routes
# -----------------------------
@app.get("/")
def root():
    return ok(
        {
            "service": "PurpleDroid-CTF API",
            "docs": "/docs",
            "openapi": "/openapi.json",
            "health": "/api/v1/health",
        }
    )


@app.get("/api/v1/health")
def health():
    return ok({"status": "ok"})


@app.post("/api/v1/session")
def create_session(req: SessionCreateReq = SessionCreateReq()):
    token = _new_token()
    user_id = "user_1004"
    s = {
        "token": token,
        "createdAt": _now(),
        "lastSeenAt": _now(),
        "expiresAt": _now() + SESSION_TTL_SEC,
        "client": req.client or {},
        "userId": user_id,
        "primaryParcelId": "PD-1004",
        "progress": _init_progress(),
        "terminalRate": [],
        "parcelLookupRate": [],
    }
    _sessions[token] = s
    return ok({"sessionToken": token, "expiresInSec": SESSION_TTL_SEC})


@app.get("/api/v1/challenges")
def list_challenges(authorization: Optional[str] = Header(None)):
    _, session = _get_session(authorization)

    challenges = []
    for level_id in LEVEL_ORDER:
        mod = LEVELS[level_id]
        st = _status_for(session, level_id)
        challenges.append(
            {
                "id": mod.STATIC["id"],
                "level": mod.STATIC["level"],
                "title": mod.STATIC["title"],
                "summary": mod.STATIC["summary"],
                "status": st,
            }
        )
    return ok({"challenges": challenges})


@app.get("/api/v1/challenges/{challenge_id}")
def get_challenge_detail(challenge_id: str, authorization: Optional[str] = Header(None)):
    _, session = _get_session(authorization)

    mod = LEVELS.get(challenge_id)
    if not mod:
        raise APIError("NOT_FOUND", "없는 레벨이야.", 404)

    st = _status_for(session, challenge_id)
    detail = copy.deepcopy(mod.STATIC)

    detail["status"] = st

    # defense enable/disable은 세션 상태에 맞춰 서버가 결정
    defense_enabled = st["defense"] in ("available", "solved")
    detail["defense"]["enabled"] = defense_enabled

    # attack도 마찬가지로(locked면 클라에서 입력 막기)
    detail["attack"]["enabled"] = st["attack"] in ("available", "solved")

    detail["next"] = {"id": _next_level_id(challenge_id)}
    return ok(detail)


@app.post("/api/v1/challenges/{challenge_id}/terminal/exec")
def terminal_exec(challenge_id: str, req: TerminalExecReq, authorization: Optional[str] = Header(None)):
    _, session = _get_session(authorization)

    mod = LEVELS.get(challenge_id)
    if not mod:
        raise APIError("NOT_FOUND", "없는 레벨이야.", 404)

    # st = _status_for(session, challenge_id)
    # if st["attack"] == "locked":
    #     raise APIError("CHALLENGE_LOCKED", "아직 잠긴 레벨이야.", 403)

    _rate_limit_terminal(session)

    cmd = req.command.strip()
    if hasattr(mod, "terminal_exec_with_session"):
        stdout, stderr, exit_code = mod.terminal_exec_with_session(cmd, session)
    else:
        stdout, stderr, exit_code = mod.terminal_exec(cmd)

    # output 제한(서버 과부하 방지)
    max_bytes = int(mod.STATIC["attack"]["terminal"].get("maxOutputBytes", 8000))
    truncated = False
    if len(stdout.encode("utf-8")) > max_bytes:
        # 너무 길면 잘라내기 (문자 기준으로 대충 자름)
        stdout = stdout[:max_bytes] + "\n...(truncated)\n"
        truncated = True

    return ok(
        {
            "stdout": stdout,
            "stderr": stderr,
            "exitCode": exit_code,
            "truncated": truncated,
        }
    )


@app.post("/api/v1/challenges/{challenge_id}/submit-flag")
def submit_flag(challenge_id: str, req: SubmitFlagReq, authorization: Optional[str] = Header(None)):
    _, session = _get_session(authorization)

    mod = LEVELS.get(challenge_id)
    if not mod:
        raise APIError("NOT_FOUND", "없는 레벨이야.", 404)

    # st = _status_for(session, challenge_id)
    # if st["attack"] == "locked":
    #     raise APIError("CHALLENGE_LOCKED", "아직 잠긴 레벨이야.", 403)

    correct = mod.check_flag(req.flag)
    if correct:
        session["progress"][challenge_id]["attackSolved"] = True
        new_status = _status_for(session, challenge_id)
        return ok(
            {
                "correct": True,
                "message": "공격 성공! 이제 코드를 수정하세요.",
                "unlockDefense": True,
                "status": new_status,
            }
        )

    return ok({"correct": False, "message": "오답입니다."})


@app.post("/api/v1/challenges/{challenge_id}/submit-patch")
def submit_patch(challenge_id: str, req: SubmitPatchReq, authorization: Optional[str] = Header(None)):
    _, session = _get_session(authorization)

    mod = LEVELS.get(challenge_id)
    if not mod:
        raise APIError("NOT_FOUND", "없는 레벨이야.", 404)

    st = _status_for(session, challenge_id)
    if st["defense"] == "locked":
        raise APIError("DEFENSE_LOCKED", "먼저 Attack을 성공해야 Defense를 할 수 있어.", 409)

    correct = mod.judge_patch(req.patched)
    if correct:
        session["progress"][challenge_id]["defenseSolved"] = True
        new_status = _status_for(session, challenge_id)
        return ok(
            {
                "correct": True,
                "message": "[PATCHED]",
                "unlockNext": True,
                "status": new_status,
                "next": {"id": _next_level_id(challenge_id)},
            }
        )

    return ok({"correct": False, "message": "패치가 충분하지 않습니다."})


@app.get("/api/v1/me")
def me(authorization: Optional[str] = Header(None)):
    _, session = _get_session(authorization)

    completed = [lid for lid in LEVEL_ORDER if session["progress"][lid]["defenseSolved"]]
    score = 100 * len(completed)

    # current: 해금됐는데 아직 defenseSolved 아닌 첫 레벨
    current = None
    for lid in LEVEL_ORDER:
        if _is_level_unlocked(session, lid) and not session["progress"][lid]["defenseSolved"]:
            current = lid
            break

    return ok(
        {
            "completed": completed,
            "current": current,
            "score": score,
            "userId": session.get("userId"),
            "primaryParcelId": session.get("primaryParcelId"),
        }
    )


@app.post("/api/v1/challenges/{challenge_id}/reset")
def reset_level(challenge_id: str, authorization: Optional[str] = Header(None)):
    _, session = _get_session(authorization)

    if challenge_id not in session["progress"]:
        raise APIError("NOT_FOUND", "없는 레벨이야.", 404)

    session["progress"][challenge_id] = {"attackSolved": False, "defenseSolved": False}
    return ok({"message": "reset ok", "status": _status_for(session, challenge_id)})


@app.post("/api/v1/challenges/level2_1/actions/track")
def track_parcel(response: Response):
    """2-1 배송 조회 전용 API (응답 헤더에 플래그 숨김)"""
    from levels.level2_1 import LEVEL2_1_FLAG
    
    # 여기서 마법이 일어남: 헤더에 X-Courier-Ticket 추가
    response.headers["X-Courier-Ticket"] = LEVEL2_1_FLAG
    
    # Body는 아주 평범하게 줘서 스포일러 방지
    return {"ok": True, "message": "delivered"}

class OrderRequest(BaseModel):
    orderId: str
    tier: str

class DispatchRequest(BaseModel):
    parcel_id: str = Field(default="PD-2026-0001", min_length=3, max_length=64)

class BossDispatchRequest(BaseModel):
    parcel_id: str = Field(default="PD-2026-0001", min_length=3, max_length=64)

class BossOpenRequest(BaseModel):
    warehouse_path: str = Field(..., min_length=3, max_length=120)
    tier: Optional[str] = Field(default=None, max_length=30)


class AdminAuditReq(BaseModel):
    range: str = Field(default="last_24h", max_length=40)


class LockerUnlockReq(BaseModel):
    locker_id: str = Field(default="SL-01", min_length=3, max_length=20)
    pin: str = Field(..., min_length=1, max_length=16)


class BossAuditReq(BaseModel):
    audit_ref: str = Field(..., min_length=3, max_length=30)


class BossLockerUnlockReq(BaseModel):
    locker_id: str = Field(..., min_length=3, max_length=20)
    pin: str = Field(..., min_length=1, max_length=16)


class BossVaultClaimReq(BaseModel):
    vault_ticket: str = Field(..., min_length=3, max_length=80)
    claim_code: str = Field(..., min_length=3, max_length=40)

@app.post("/api/v1/challenges/level2_2/actions/order")
def order_parcel(req: OrderRequest, response: Response):
    """2-2 요청 변조 전용 API"""
    from levels.level2_2 import LEVEL2_2_FLAG
    
    # 해커가 tier를 vip로 보냈을 때만 플래그 제공!
    if req.tier.lower() == "vip":
        response.headers["X-VIP-Label"] = LEVEL2_2_FLAG
        return {"ok": True, "message": "VIP package confirmed"}
        
    return {"ok": True, "message": "Standard package confirmed"}

@app.post("/api/v1/challenges/level2_3/actions/dispatch")
def dispatch_parcel(response: Response, req: DispatchRequest = DispatchRequest()):
    """2-3 토큰 관찰/디코딩 전용 API"""
    from levels.level2_3 import issue_dispatch_token

    token = issue_dispatch_token(req.parcel_id)
    response.headers["X-Dispatch-Trace"] = "token-issued"
    return {"status": "ok", "dispatch_token": token}

@app.post("/api/v1/challenges/level2_5/actions/dispatch")
def boss_dispatch(req: BossDispatchRequest = BossDispatchRequest()):
    from levels.level2_5 import issue_boss_token

    token = issue_boss_token(req.parcel_id)
    return {"status": "ok", "message": "sealed token issued", "dispatch_token": token}

@app.post("/api/v1/challenges/level2_4/actions/express")
def enter_express_lane(authorization: Optional[str] = Header(None)):
    """2-4 JWT 위조 취약점 실습 API (의도적으로 서명 검증 누락)"""
    from levels.level2_4 import LEVEL2_4_FLAG, evaluate_express_access

    if not authorization or not authorization.lower().startswith("bearer "):
        return {"status": "denied", "lane": "standard", "message": "Authorization: Bearer <token> required"}

    token = authorization.split(" ", 1)[1].strip()
    try:
        allowed, detail = evaluate_express_access(token)
    except Exception as exc:
        return {"status": "denied", "lane": "standard", "message": f"token parse error: {exc}"}

    if allowed:
        return {
            "status": "ok",
            "lane": "express",
            "flag": LEVEL2_4_FLAG,
            "claims": detail["payload"],
        }

    return {
        "status": "denied",
        "lane": "standard",
        "message": "VIP token required",
        "claims": detail["payload"],
    }

@app.post("/api/v1/challenges/level2_5/actions/open")
def boss_open(
    response: Response,
    req: BossOpenRequest,
    authorization: Optional[str] = Header(None),
    x_integrity_bypass: Optional[str] = Header(None, alias="X-Integrity-Bypass"),
):
    from levels.level2_5 import LEVEL2_5_FLAG, evaluate_open_request

    if not authorization or not authorization.lower().startswith("bearer "):
        return {"status": "denied", "message": "Authorization: Bearer <token> required"}

    token = authorization.split(" ", 1)[1].strip()
    try:
        allowed, detail = evaluate_open_request(token, req.warehouse_path, req.tier, x_integrity_bypass)
    except Exception as exc:
        return {"status": "denied", "message": f"token parse error: {exc}"}

    if not allowed:
        return {"status": "denied", "message": detail["reason"]}

    response.headers["X-Warehouse-Flag"] = LEVEL2_5_FLAG
    return {"status": "ok", "lane": "sealed-warehouse-opened"}

@app.get("/api/v1/challenges/level3_1/actions/parcels/mine")
def level3_1_get_mine(authorization: Optional[str] = Header(None)):
    """3-1 정상 사용자 흐름: 내 택배 목록 조회"""
    _, session = _get_session(authorization)
    _rate_limit_parcel_lookup(session)
    from levels.level3_1 import get_mine_view

    return {"ok": True, "data": get_mine_view(session.get("userId", "user_1004"))}


def _level3_1_lookup_parcel(authorization: Optional[str], parcel_id: str):
    _, session = _get_session(authorization)
    _rate_limit_parcel_lookup(session)
    from levels.level3_1 import get_parcel

    parcel = get_parcel(parcel_id)
    if not parcel:
        raise APIError("NOT_FOUND", "parcel not found", 404)

    # 의도적 취약점: owner == current_user 검증 없음 (BOLA)
    return {"ok": True, "data": parcel}


@app.get("/api/v1/challenges/level3_1/actions/parcel")
def level3_1_get_parcel_by_query(
    parcel_id: str = Query(..., min_length=3, max_length=20),
    authorization: Optional[str] = Header(None),
):
    """3-1 취약 조회 API (query 기반)"""
    return _level3_1_lookup_parcel(authorization, parcel_id)


@app.get("/api/v1/challenges/level3_1/actions/parcels/{parcel_id}")
def level3_1_get_parcel_compat(parcel_id: str, authorization: Optional[str] = Header(None)):
    """3-1 호환 경로 (기존 path 기반 호출 유지)"""
    return _level3_1_lookup_parcel(authorization, parcel_id)


@app.get("/api/v1/challenges/level3_2/actions/menu")
def level3_2_menu(authorization: Optional[str] = Header(None)):
    _get_session(authorization)
    from levels.level3_2 import menu_payload

    return menu_payload()


@app.post("/api/v1/challenges/level3_2/actions/admin/stats")
def level3_2_admin_stats(authorization: Optional[str] = Header(None)):
    """3-2 BFLA 함정 API (FLAG 없는 통계 엔드포인트)"""
    _get_session(authorization)
    from levels.level3_2 import stats_payload

    return stats_payload()


@app.post("/api/v1/challenges/level3_2/actions/admin/audit")
def level3_2_admin_audit(
    authorization: Optional[str] = Header(None),
    req: Optional[AdminAuditReq] = None,
):
    """3-2 BFLA 실습 API (의도적으로 admin 권한 검사 누락)"""
    _get_session(authorization)
    from levels.level3_2 import audit_payload

    used_range = (req.range if req else "last_24h") or "last_24h"
    return audit_payload(used_range)


@app.post("/api/v1/challenges/level3_2/actions/export")
@app.get("/api/v1/challenges/level3_2/actions/export")
def level3_2_export(authorization: Optional[str] = Header(None)):
    """3-2 deprecated 함정 엔드포인트"""
    _get_session(authorization)
    from levels.level3_2 import export_payload

    return export_payload()


@app.get("/api/v1/challenges/level3_3/actions/profile")
def level3_3_get_profile(authorization: Optional[str] = Header(None)):
    _, session = _get_session(authorization)
    from levels.level3_3 import get_profile_payload

    return get_profile_payload(session)


@app.put("/api/v1/challenges/level3_3/actions/profile")
def level3_3_update_profile(
    authorization: Optional[str] = Header(None),
    req: Dict[str, Any] = Body(default={}),
):
    _, session = _get_session(authorization)
    from levels.level3_3 import update_profile_payload

    return update_profile_payload(session, req)


@app.get("/api/v1/challenges/level3_3/actions/perks")
def level3_3_get_perks(authorization: Optional[str] = Header(None)):
    _, session = _get_session(authorization)
    from levels.level3_3 import perks_payload

    return perks_payload(session)


@app.get("/api/v1/challenges/level3_4/actions/ticket")
def level3_4_get_ticket(
    authorization: Optional[str] = Header(None),
    ticket_id: str = Query(default="SUP-1004", alias="id", min_length=3, max_length=40),
):
    _get_session(authorization)
    from levels.level3_4 import ticket_payload

    return ticket_payload(ticket_id)


@app.get("/api/v1/challenges/level3_5/actions/locker/hint")
def level3_5_locker_hint(
    authorization: Optional[str] = Header(None),
    locker_id: str = Query(default="SL-01", min_length=3, max_length=20),
):
    _, session = _get_session(authorization)
    from levels.level3_5 import get_locker_hint_payload

    return get_locker_hint_payload(session, locker_id)


@app.post("/api/v1/challenges/level3_5/actions/locker/unlock")
def level3_5_locker_unlock(
    authorization: Optional[str] = Header(None),
    req: LockerUnlockReq = Body(...),
):
    _, session = _get_session(authorization)
    from levels.level3_5 import unlock_locker_payload

    return unlock_locker_payload(session, req.locker_id, req.pin)


@app.get("/api/v1/challenges/level3_boss/actions/parcels/mine")
def level3_boss_get_mine(authorization: Optional[str] = Header(None)):
    _, session = _get_session(authorization)
    _rate_limit_parcel_lookup(session)
    from levels.level3_boss import get_mine_payload

    return get_mine_payload(session)


@app.get("/api/v1/challenges/level3_boss/actions/parcel")
def level3_boss_get_parcel(
    authorization: Optional[str] = Header(None),
    parcel_id: str = Query(..., min_length=3, max_length=20),
):
    _, session = _get_session(authorization)
    _rate_limit_parcel_lookup(session)
    from levels.level3_boss import find_parcel

    parcel = find_parcel(parcel_id)
    if not parcel:
        raise APIError("NOT_FOUND", "parcel not found", 404)
    # 의도적 취약점: owner == current_user 검증 누락 (IDOR/BOLA)
    return {"ok": True, "data": parcel}


@app.put("/api/v1/challenges/level3_boss/actions/profile")
def level3_boss_update_profile(
    authorization: Optional[str] = Header(None),
    req: Dict[str, Any] = Body(default={}),
):
    _, session = _get_session(authorization)
    from levels.level3_boss import update_profile_payload

    return update_profile_payload(session, req)


@app.get("/api/v1/challenges/level3_boss/actions/profile")
def level3_boss_get_profile(authorization: Optional[str] = Header(None)):
    _, session = _get_session(authorization)
    from levels.level3_boss import get_profile_payload

    return get_profile_payload(session)


@app.get("/api/v1/challenges/level3_boss/actions/menu")
def level3_boss_menu(authorization: Optional[str] = Header(None)):
    _get_session(authorization)
    from levels.level3_boss import menu_payload

    return menu_payload()


@app.post("/api/v1/challenges/level3_boss/actions/admin/audit")
def level3_boss_admin_audit(
    authorization: Optional[str] = Header(None),
    req: BossAuditReq = Body(...),
):
    _, session = _get_session(authorization)
    from levels.level3_boss import admin_audit_payload

    return admin_audit_payload(session, req.audit_ref)


@app.post("/api/v1/challenges/level3_boss/actions/locker/unlock")
def level3_boss_locker_unlock(
    authorization: Optional[str] = Header(None),
    req: BossLockerUnlockReq = Body(...),
):
    _, session = _get_session(authorization)
    from levels.level3_boss import locker_unlock_payload

    return locker_unlock_payload(session, req.locker_id, req.pin)


@app.post("/api/v1/challenges/level3_boss/actions/vault/claim")
def level3_boss_vault_claim(
    authorization: Optional[str] = Header(None),
    req: BossVaultClaimReq = Body(...),
):
    _, session = _get_session(authorization)
    from levels.level3_boss import vault_claim_payload

    return vault_claim_payload(session, req.vault_ticket, req.claim_code)
