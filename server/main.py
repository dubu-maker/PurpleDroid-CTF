# server/main.py
from __future__ import annotations

import copy
import secrets
import time
from typing import Any, Dict, Optional, List, Tuple

from fastapi import FastAPI, Header, Response
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

    # Attack은 전체 레벨에서 항상 접근 가능하게 유지
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
    s = {
        "token": token,
        "createdAt": _now(),
        "lastSeenAt": _now(),
        "expiresAt": _now() + SESSION_TTL_SEC,
        "client": req.client or {},
        "progress": _init_progress(),
        "terminalRate": [],
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

    return ok({"completed": completed, "current": current, "score": score})


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

@app.post("/api/v1/challenges/level2_2/actions/order")
def order_parcel(req: OrderRequest, response: Response):
    """2-2 요청 변조 전용 API"""
    from levels.level2_2 import LEVEL2_2_FLAG
    
    # 해커가 tier를 vip로 보냈을 때만 플래그 제공!
    if req.tier.lower() == "vip":
        response.headers["X-VIP-Label"] = LEVEL2_2_FLAG
        return {"ok": True, "message": "VIP package confirmed"}
        
    return {"ok": True, "message": "Standard package confirmed"}