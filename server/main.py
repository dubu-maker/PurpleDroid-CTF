# server/main.py
from __future__ import annotations

import copy
import json
import os
import secrets
import time
from pathlib import Path
from typing import Any, Dict, Optional, List, Tuple

from fastapi import Body, FastAPI, Header, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field

from levels import LEVELS, LEVEL_ORDER


# -----------------------------
# App setup
# -----------------------------
app = FastAPI(title="PurpleDroid-CTF API", version="0.1.0")

def _env_list(name: str, default: str) -> List[str]:
    raw = os.getenv(name, default)
    values = [item.strip() for item in raw.split(",") if item.strip()]
    return values or [default]


cors_origins = _env_list("PURPLEDROID_CORS_ORIGINS", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials="*" not in cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSION_TTL_SEC = 90 * 24 * 3600  # 마지막 활동부터 90일
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
SESSION_STORE_PATH = Path(
    os.getenv(
        "PURPLEDROID_SESSION_STORE",
        str(Path(__file__).with_name(".purpledroid_sessions.json")),
    )
)


def _now() -> float:
    return time.time()


def _new_token() -> str:
    return secrets.token_urlsafe(32)


def _new_progress_key() -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    while True:
        groups = ["".join(secrets.choice(alphabet) for _ in range(5)) for _ in range(4)]
        key = f"PD-SAVE-{'-'.join(groups)}"
        if not any(session.get("progressKey") == key for session in _sessions.values()):
            return key


def _init_progress() -> Dict[str, Dict[str, bool]]:
    return _apply_test_unlock_until(
        {
            level_id: {"attackSolved": False, "defenseSolved": False}
            for level_id in LEVEL_ORDER
        }
    )


def _test_unlock_until_index() -> Optional[int]:
    target = os.getenv("PURPLEDROID_UNLOCK_UNTIL", "").strip()
    if not target:
        return None
    if target in LEVEL_ORDER:
        return LEVEL_ORDER.index(target)
    return None


def _apply_test_unlock_until(progress: Dict[str, Dict[str, bool]]) -> Dict[str, Dict[str, bool]]:
    target_idx = _test_unlock_until_index()
    if target_idx is None:
        return progress

    for idx, level_id in enumerate(LEVEL_ORDER):
        if idx >= target_idx:
            break
        item = progress.setdefault(level_id, {"attackSolved": False, "defenseSolved": False})
        item["attackSolved"] = True
        item["defenseSolved"] = True
    return progress


def _session_persistence_enabled() -> bool:
    return os.getenv("PURPLEDROID_SESSION_PERSIST", "1").strip().lower() not in {
        "0",
        "false",
        "no",
        "off",
    }


def _normalize_progress(raw: Any) -> Dict[str, Dict[str, bool]]:
    progress = _init_progress()
    if not isinstance(raw, dict):
        return progress

    for level_id in LEVEL_ORDER:
        item = raw.get(level_id)
        if not isinstance(item, dict):
            continue
        progress[level_id] = {
            "attackSolved": bool(item.get("attackSolved")),
            "defenseSolved": bool(item.get("defenseSolved")),
        }
    return _apply_test_unlock_until(progress)


def _normalize_session(token: str, raw: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(raw, dict):
        return None

    now = _now()
    session = dict(raw)
    session["token"] = str(session.get("token") or token)
    session.setdefault("createdAt", now)
    session.setdefault("lastSeenAt", now)
    session.setdefault("expiresAt", now + SESSION_TTL_SEC)
    session.setdefault("progressKey", _new_progress_key())
    session.setdefault("client", {})
    session.setdefault("userId", "user_1004")
    session.setdefault("primaryParcelId", "PD-1004")
    session["progress"] = _normalize_progress(session.get("progress"))
    session.setdefault("terminalRate", [])
    session.setdefault("parcelLookupRate", [])
    return session


def _load_sessions() -> None:
    if not _session_persistence_enabled() or not SESSION_STORE_PATH.exists():
        return

    try:
        raw = json.loads(SESSION_STORE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return

    raw_sessions = raw.get("sessions") if isinstance(raw, dict) else raw
    if not isinstance(raw_sessions, dict):
        return

    now = _now()
    restored: Dict[str, Dict[str, Any]] = {}
    for token, session_raw in raw_sessions.items():
        session = _normalize_session(str(token), session_raw)
        if not session or float(session.get("expiresAt", 0)) < now:
            continue
        restored[str(token)] = session

    _sessions.update(restored)


def _save_sessions() -> None:
    if not _session_persistence_enabled():
        return

    try:
        SESSION_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = SESSION_STORE_PATH.with_suffix(f"{SESSION_STORE_PATH.suffix}.tmp")
        payload = {
            "version": 1,
            "savedAt": _now(),
            "sessions": _sessions,
        }
        tmp_path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True, default=str),
            encoding="utf-8",
        )
        tmp_path.replace(SESSION_STORE_PATH)
    except Exception:
        # 개발 편의 기능이라 저장 실패가 게임 진행 요청을 깨면 안 된다.
        return


_load_sessions()


@app.middleware("http")
async def persist_sessions_middleware(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/v1/"):
        _save_sessions()
    return response


def _get_session(authorization: Optional[str]) -> Tuple[str, Dict[str, Any]]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise APIError("UNAUTHORIZED", "Authorization: Bearer <token> 이 필요해.", 401)

    token = authorization.split(" ", 1)[1].strip()
    if token.startswith("<") and token.endswith(">"):
        inner = token[1:-1].strip() or "SESSION_TOKEN"
        raise APIError(
            "PLACEHOLDER_TOKEN",
            f"꺾쇠(< >)는 placeholder 표시야. Authorization 값은 실제 Bearer token으로 바꿔줘. 지금 값: {inner}",
            400,
        )

    s = _sessions.get(token)
    if not s:
        raise APIError("UNAUTHORIZED", "세션이 없거나 만료됐어. /session 다시 호출해줘.", 401)

    if s["expiresAt"] < _now():
        _sessions.pop(token, None)
        raise APIError("UNAUTHORIZED", "세션이 만료됐어. /session 다시 호출해줘.", 401)

    now = _now()
    s["lastSeenAt"] = now
    s["expiresAt"] = now + SESSION_TTL_SEC
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

    unlock_until_idx = _test_unlock_until_index()
    if unlock_until_idx is not None and level_id in LEVEL_ORDER and LEVEL_ORDER.index(level_id) > unlock_until_idx:
        attack = "solved" if prog["attackSolved"] else "locked"
        defense = "solved" if prog["defenseSolved"] else "locked"
        return {"attack": attack, "defense": defense}

    unlock_all = os.getenv("PURPLEDROID_UNLOCK_ALL", "").strip().lower() in {"1", "true", "yes", "on"}
    if unlock_all:
        attack = "solved" if prog["attackSolved"] else "available"
        unlocked_for_defense = _is_level_unlocked(session, level_id)
        defense = (
            "solved"
            if prog["defenseSolved"]
            else ("available" if (prog["attackSolved"] and unlocked_for_defense) else "locked")
        )
        return {"attack": attack, "defense": defense}

    boss_prereqs = ("level2_1", "level2_2", "level2_3", "level2_4")
    level3_boss_prereqs = ("level3_1", "level3_2", "level3_3", "level3_4", "level3_5")
    level4_prereqs = ("level3_boss",)
    level4_2_prereqs = ("level4_1",)
    level4_3_prereqs = ("level4_2",)
    level4_4_prereqs = ("level4_3",)
    level4_5_prereqs = ("level4_4",)
    level4_boss_prereqs = ("level4_5",)
    if level_id == "level2_5":
        unlocked_attack = all(session["progress"].get(x, {}).get("attackSolved") is True for x in boss_prereqs)
        attack = "solved" if prog["attackSolved"] else ("available" if unlocked_attack else "locked")
    elif level_id == "level3_boss":
        unlocked_attack = all(
            session["progress"].get(x, {}).get("attackSolved") is True for x in level3_boss_prereqs
        )
        attack = "solved" if prog["attackSolved"] else ("available" if unlocked_attack else "locked")
    elif level_id == "level4_1":
        unlocked_attack = all(session["progress"].get(x, {}).get("attackSolved") is True for x in level4_prereqs)
        attack = "solved" if prog["attackSolved"] else ("available" if unlocked_attack else "locked")
    elif level_id == "level4_2":
        unlocked_attack = all(session["progress"].get(x, {}).get("attackSolved") is True for x in level4_2_prereqs)
        attack = "solved" if prog["attackSolved"] else ("available" if unlocked_attack else "locked")
    elif level_id == "level4_3":
        unlocked_attack = all(session["progress"].get(x, {}).get("attackSolved") is True for x in level4_3_prereqs)
        attack = "solved" if prog["attackSolved"] else ("available" if unlocked_attack else "locked")
    elif level_id == "level4_4":
        unlocked_attack = all(session["progress"].get(x, {}).get("attackSolved") is True for x in level4_4_prereqs)
        attack = "solved" if prog["attackSolved"] else ("available" if unlocked_attack else "locked")
    elif level_id == "level4_5":
        unlocked_attack = all(session["progress"].get(x, {}).get("attackSolved") is True for x in level4_5_prereqs)
        attack = "solved" if prog["attackSolved"] else ("available" if unlocked_attack else "locked")
    elif level_id == "level4_boss":
        unlocked_attack = all(session["progress"].get(x, {}).get("attackSolved") is True for x in level4_boss_prereqs)
        attack = "solved" if prog["attackSolved"] else ("available" if unlocked_attack else "locked")
    elif level_id == "level1_4":
        unlocked_attack = session["progress"].get("level1_3", {}).get("defenseSolved") is True
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


class SessionRestoreReq(BaseModel):
    progressKey: str = Field(..., min_length=12, max_length=80)
    client: Optional[Dict[str, Any]] = None


class TerminalExecReq(BaseModel):
    command: str = Field(..., min_length=1, max_length=1250)


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
    progress_key = _new_progress_key()
    user_id = "user_1004"
    s = {
        "token": token,
        "progressKey": progress_key,
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
    return ok(
        {
            "sessionToken": token,
            "progressKey": progress_key,
            "expiresInSec": SESSION_TTL_SEC,
        }
    )


@app.post("/api/v1/session/restore")
def restore_session(req: SessionRestoreReq):
    progress_key = req.progressKey.strip().upper()
    now = _now()

    for token, session in list(_sessions.items()):
        stored_key = str(session.get("progressKey", "")).strip().upper()
        if not stored_key or not secrets.compare_digest(stored_key, progress_key):
            continue
        if float(session.get("expiresAt", 0)) < now:
            _sessions.pop(token, None)
            raise APIError("PROGRESS_EXPIRED", "진행 키가 만료됐어.", 401)

        session["lastSeenAt"] = now
        session["expiresAt"] = now + SESSION_TTL_SEC
        if req.client:
            session["client"] = {**session.get("client", {}), **req.client}
        return ok(
            {
                "sessionToken": token,
                "progressKey": session["progressKey"],
                "expiresInSec": SESSION_TTL_SEC,
            }
        )

    raise APIError("PROGRESS_NOT_FOUND", "진행 키를 찾을 수 없어.", 404)


@app.get("/api/v1/session/progress-key")
def get_progress_key(authorization: Optional[str] = Header(None)):
    _, session = _get_session(authorization)
    return ok(
        {
            "progressKey": session["progressKey"],
            "expiresInSec": SESSION_TTL_SEC,
        }
    )


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

    st = _status_for(session, challenge_id)
    if st["attack"] == "locked":
        raise APIError("CHALLENGE_LOCKED", "아직 잠긴 레벨이야.", 403)

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


def _default_flag_feedback(flag: str) -> str:
    value = (flag or "").strip()
    if not value:
        return "입력값이 비어 있어. 공격 응답이나 로그에서 Evidence Shard를 먼저 회수해봐."
    if not (value.startswith("FLAG{") and value.endswith("}")):
        return "형식부터 확인해봐. 정답 Evidence는 보통 FLAG{...} 형태로 제출해야 해."
    if len(value) <= len("FLAG{}") + 4:
        return "FLAG 형태는 맞지만 너무 짧아 보여. 일부 조각이나 preview marker만 제출한 건 아닌지 확인해봐."
    return "FLAG 형태는 맞지만 이번 Evidence Shard가 아니야. decoy/canary/preview marker가 아니라 공격 성공 응답의 최종 값을 찾아봐."


def _consistent_patch_feedback(mod: Any, patched: List[str]) -> Optional[str]:
    required_raw = getattr(mod, "REQUIRED_PATCH_IDS", None)
    if required_raw is None:
        return None

    aliases = getattr(mod, "PATCH_ID_ALIASES", {}) or {}
    required = set(required_raw)
    bonus = set(getattr(mod, "BONUS_PATCH_IDS", set()) or set())
    wrong_feedback = getattr(mod, "PATCH_WRONG_FEEDBACK", {}) or {}

    normalized = [aliases.get(pid, pid) for pid in patched]
    selected = set(normalized)
    messages: List[str] = []
    seen: set[str] = set()

    for original_pid, pid in zip(patched, normalized):
        if pid in seen:
            continue
        seen.add(pid)
        if pid in required or pid in bonus:
            continue
        messages.append(
            wrong_feedback.get(original_pid)
            or wrong_feedback.get(pid)
            or "선택한 항목 중 핵심 통제가 아닌 후보가 섞여 있어."
        )

    missing_count = len(required - selected)
    if missing_count:
        messages.append(
            f"아직 닫히지 않은 핵심 통제가 {missing_count}개 남아 있어. "
            "완료 전에는 선택한 정답 후보의 개별 정오는 숨겨둘게."
        )

    if messages:
        return "\n".join(messages)
    return "패치 조합이 아직 완성되지 않았어. decoy를 빼고 핵심 신뢰 경계를 다시 비교해봐."


@app.post("/api/v1/challenges/{challenge_id}/submit-flag")
def submit_flag(challenge_id: str, req: SubmitFlagReq, authorization: Optional[str] = Header(None)):
    _, session = _get_session(authorization)

    mod = LEVELS.get(challenge_id)
    if not mod:
        raise APIError("NOT_FOUND", "없는 레벨이야.", 404)

    st = _status_for(session, challenge_id)
    if st["attack"] == "locked":
        raise APIError("CHALLENGE_LOCKED", "아직 잠긴 레벨이야.", 403)

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

    message = _default_flag_feedback(req.flag)
    if hasattr(mod, "flag_feedback"):
        message = mod.flag_feedback(req.flag) or message
    return ok({"correct": False, "message": message})


@app.post("/api/v1/challenges/{challenge_id}/submit-patch")
def submit_patch(challenge_id: str, req: SubmitPatchReq, authorization: Optional[str] = Header(None)):
    _, session = _get_session(authorization)

    mod = LEVELS.get(challenge_id)
    if not mod:
        raise APIError("NOT_FOUND", "없는 레벨이야.", 404)

    st = _status_for(session, challenge_id)
    if st["defense"] == "locked":
        raise APIError("DEFENSE_LOCKED", "먼저 Attack을 성공해야 Defense를 할 수 있어.", 409)

    if hasattr(mod, "judge_patch_with_session"):
        correct = mod.judge_patch_with_session(req.patched, session)
    else:
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

    message = _consistent_patch_feedback(mod, req.patched) or "패치가 충분하지 않습니다."
    if message == "패치가 충분하지 않습니다." and hasattr(mod, "patch_feedback_with_session"):
        message = mod.patch_feedback_with_session(req.patched, session) or message
    elif message == "패치가 충분하지 않습니다." and hasattr(mod, "patch_feedback"):
        message = mod.patch_feedback(req.patched) or message
    return ok({"correct": False, "message": message})


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
    session.pop(challenge_id, None)
    return ok({"message": "reset ok", "status": _status_for(session, challenge_id)})


@app.post("/api/v1/challenges/level2_1/actions/track")
def signal_trace(response: Response):
    """2-1 Signal Trace API (응답 헤더에 라우팅 티켓 숨김)"""
    from levels.level2_1 import (
        LEVEL2_1_FLAG,
        rotating_preview_decoy,
        rotating_cached_decoy,
        rotating_trace_id,
    )

    # Signal Edge의 라우팅 티켓이 Body가 아니라 Header에 새어 나가는 상황.
    # 요청마다 바뀌는 것: X-Trace-Id(요청별 추적 id) + preview/cached 미끼(통째로 회전).
    # 진짜 X-Courier-Ticket은 매 요청 동일 → 두 번 찍어서 안 바뀌는 값이 정답.
    # X-Internal-Route/Server-Timing은 평범한 메타.
    response.headers["X-Trace-Id"] = rotating_trace_id()
    response.headers["X-Courier-Preview"] = rotating_preview_decoy()
    response.headers["X-Courier-Ticket"] = LEVEL2_1_FLAG
    response.headers["X-Internal-Route"] = "edge-node-07"
    response.headers["X-Courier-Cached"] = rotating_cached_decoy()
    response.headers["Server-Timing"] = "edge;dur=12"

    # Body는 아주 평범하게 줘서 스포일러 방지
    return {"ok": True, "message": "routed"}

class OrderRequest(BaseModel):
    orderId: Optional[str] = None
    signalId: Optional[str] = None
    tier: str
    fastTrack: Optional[bool] = False

class DispatchRequest(BaseModel):
    signalId: Optional[str] = Field(default=None, min_length=3, max_length=64)
    parcel_id: Optional[str] = Field(default=None, min_length=3, max_length=64)

class BossDispatchRequest(BaseModel):
    parcel_id: str = Field(default="PD-2026-0001", min_length=3, max_length=64)

class BossOpenRequest(BaseModel):
    warehouse_path: str = Field(..., min_length=3, max_length=120)
    tier: Optional[str] = Field(default=None, max_length=30)


class AdminAuditReq(BaseModel):
    range: str = Field(default="last_24h", max_length=40)
    auditRef: Optional[str] = Field(default=None, max_length=80)
    scope: Optional[str] = Field(default=None, max_length=40)


class LockerUnlockReq(BaseModel):
    locker_id: str = Field(default="RL-MIRA-07", min_length=3, max_length=32)
    pin: str = Field(..., min_length=1, max_length=16)


class BossAuditReq(BaseModel):
    audit_ref: str = Field(..., min_length=3, max_length=30)


class BossLockerUnlockReq(BaseModel):
    locker_id: str = Field(..., min_length=3, max_length=20)
    pin: str = Field(..., min_length=1, max_length=16)


class BossVaultClaimReq(BaseModel):
    vault_ticket: str = Field(..., min_length=3, max_length=80)
    claim_code: str = Field(..., min_length=3, max_length=40)


class DeliveryEventReq(BaseModel):
    event_id: str = Field(..., min_length=3, max_length=64)
    parcel_id: str = Field(..., min_length=3, max_length=40)
    status: str = Field(default="delivered", min_length=3, max_length=20)
    via: Optional[str] = Field(default=None, max_length=40)

@app.post("/api/v1/challenges/level2_2/actions/order")
def order_parcel(req: OrderRequest, response: Response):
    """2-2 Signal Priority 요청 변조 전용 API"""
    from levels.level2_2 import LEVEL2_2_FLAG
    
    # 클라이언트가 보낸 tier를 그대로 신뢰하는 취약한 흐름.
    # elevated는 정확한 형태(소문자 vip)로만 통과 — premium 같은 등급은 미끼, fastTrack 프리패스 제거.
    if req.tier.strip() == "vip":
        response.headers["X-Trust-Policy"] = "tier-claim=accepted; elevated=vip"
        response.headers["X-Priority-Label"] = LEVEL2_2_FLAG
        return {"ok": True, "message": "Privileged signal accepted", "route": "priority"}

    response.headers["X-Trust-Policy"] = "tier-claim=accepted; upgrade-candidates=premium, v_p"
    response.headers["X-Tier-Shape"] = "elevated class = 3-letter lowercase legacy code"
    return {"ok": True, "message": "Standard signal accepted", "tier": "standard"}

@app.post("/api/v1/challenges/level2_3/actions/dispatch")
def dispatch_parcel(response: Response, req: DispatchRequest = DispatchRequest()):
    """2-3 토큰 관찰/디코딩 전용 API"""
    from levels.level2_3 import issue_dispatch_token

    token = issue_dispatch_token(req.signalId or req.parcel_id)
    response.headers["X-Dispatch-Trace"] = "capsule-issued"
    return {"ok": True, "dispatch_token": token}

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
    from levels.level3_1 import get_parcel, placeholder_id_feedback, render_capsule_view

    parcel = get_parcel(parcel_id)
    if not parcel:
        placeholder_message = placeholder_id_feedback(parcel_id)
        if placeholder_message:
            raise APIError("PLACEHOLDER_ID", placeholder_message, 400)
        raise APIError("NOT_FOUND", "parcel not found", 404)

    # 의도적 취약점: owner == current_user 검증 없음 (BOLA)
    return {"ok": True, "data": render_capsule_view(parcel)}


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
    used_audit_ref = (req.auditRef if req else "") or ""
    used_scope = (req.scope if req else "") or ""
    return audit_payload(used_range, used_audit_ref, used_scope)


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
    locker_id: str = Query(default="RL-MIRA-07", min_length=3, max_length=32),
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


@app.get("/api/v1/challenges/level4_1/actions/public/bundle-hint")
def level4_1_bundle_hint():
    from levels.level4_1 import bundle_hint_payload

    return bundle_hint_payload()


@app.get("/api/v1/challenges/level4_1/actions/public/assets/{filename}")
def level4_1_public_asset(filename: str):
    from levels.level4_1 import ASSET_FILENAME, ASSET_MAP_FILENAME, build_artifact_source, build_artifact_sourcemap

    if filename == ASSET_FILENAME:
        return Response(content=build_artifact_source(), media_type="application/javascript")
    if filename == ASSET_MAP_FILENAME:
        return Response(content=build_artifact_sourcemap(), media_type="application/json")
    raise APIError("NOT_FOUND", "asset not found", 404)


@app.post("/api/v1/challenges/level4_1/actions/partner/handshake")
def level4_1_partner_handshake(
    authorization: Optional[str] = Header(None),
    x_partner_key: Optional[str] = Header(None, alias="X-Partner-Key"),
):
    _get_session(authorization)
    from levels.level4_1 import is_partner_key_valid, partner_handshake_payload

    if not is_partner_key_valid(x_partner_key or ""):
        raise APIError("PARTNER_DENIED", "Partner key invalid.", 403)
    return partner_handshake_payload()


@app.get("/api/v1/challenges/level4_2/actions/pass/issue")
def level4_2_issue_pass(authorization: Optional[str] = Header(None)):
    _, session = _get_session(authorization)
    from levels.level4_2 import issue_pass_payload

    return issue_pass_payload(str(session.get("userId", "user_1004")))


@app.get("/api/v1/challenges/level4_2/actions/keys/jwks")
def level4_2_jwks(authorization: Optional[str] = Header(None)):
    _get_session(authorization)
    from levels.level4_2 import jwks_payload

    return jwks_payload()


@app.post("/api/v1/challenges/level4_2/actions/admin/audit")
def level4_2_admin_audit(
    authorization: Optional[str] = Header(None),
    x_partner_pass: Optional[str] = Header(None, alias="X-Partner-Pass"),
):
    _get_session(authorization)
    from levels.level4_2 import admin_audit_payload

    ok_result, payload = admin_audit_payload(x_partner_pass or "")
    if not ok_result:
        raise APIError(payload["code"], payload["message"], int(payload.get("status", 403)))
    return payload


@app.post("/api/v1/challenges/level4_3/actions/event/delivered")
def level4_3_event_delivered(
    authorization: Optional[str] = Header(None),
    req: DeliveryEventReq = Body(...),
):
    _, session = _get_session(authorization)
    from levels.level4_3 import delivered_event_payload

    payload = delivered_event_payload(session, req.event_id, req.parcel_id, req.status, req.via or "")
    if payload.get("ok") is False:
        raise APIError("VALIDATION_ERROR", payload.get("error", {}).get("message", "invalid payload"), 422)
    return payload


@app.get("/api/v1/challenges/level4_3/actions/stamps")
def level4_3_get_stamps(authorization: Optional[str] = Header(None)):
    _, session = _get_session(authorization)
    from levels.level4_3 import stamps_payload

    return stamps_payload(session)


@app.get("/api/v1/challenges/level4_4/actions/public/gateway-status")
def level4_4_gateway_status(response: Response):
    from levels.level4_4 import PARTNER_GATEWAY_IP, gateway_status_payload

    response.headers["X-Gateway-IP"] = PARTNER_GATEWAY_IP
    return gateway_status_payload()


@app.get("/api/v1/challenges/level4_4/actions/whoami")
def level4_4_whoami(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_forwarded_for: Optional[str] = Header(None, alias="X-Forwarded-For"),
):
    _get_session(authorization)
    from levels.level4_4 import whoami_payload

    remote_addr = request.client.host if request.client else "unknown"
    return whoami_payload(remote_addr, x_forwarded_for)


@app.post("/api/v1/challenges/level4_4/actions/partner/settlement")
def level4_4_partner_settlement(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_forwarded_for: Optional[str] = Header(None, alias="X-Forwarded-For"),
    _req: Dict[str, Any] = Body(default={}),
):
    _get_session(authorization)
    from levels.level4_4 import settlement_payload

    remote_addr = request.client.host if request.client else "unknown"
    ok_result, payload = settlement_payload(remote_addr, x_forwarded_for)
    if not ok_result:
        err = payload.get("error", {})
        raise APIError(
            err.get("code", "PARTNER_NETWORK_ONLY"),
            err.get("message", "Only partner gateway can call this."),
            403,
            err.get("details", {}),
        )
    return payload


@app.get("/api/v1/challenges/level4_5/actions/webhook/spec")
def level4_5_webhook_spec():
    from levels.level4_5 import webhook_spec_payload

    return webhook_spec_payload()


@app.post("/api/v1/challenges/level4_5/actions/webhook/receive")
async def level4_5_webhook_receive(
    request: Request,
    x_webhook_timestamp: Optional[str] = Header(None, alias="X-Webhook-Timestamp"),
    x_webhook_event_id: Optional[str] = Header(None, alias="X-Webhook-Event-Id"),
    x_webhook_signature: Optional[str] = Header(None, alias="X-Webhook-Signature"),
):
    from levels.level4_5 import receive_webhook_payload

    raw_body = (await request.body()).decode("utf-8", errors="replace")
    status, payload = receive_webhook_payload(
        x_webhook_timestamp,
        x_webhook_event_id,
        x_webhook_signature,
        raw_body,
        int(_now()),
    )
    return JSONResponse(status_code=status, content=payload)


@app.get("/api/v1/challenges/level4_5/actions/track")
def level4_5_track(
    authorization: Optional[str] = Header(None),
    parcel_id: str = Query(default="PD-1004", min_length=3, max_length=40),
):
    _get_session(authorization)
    from levels.level4_5 import track_payload

    return track_payload(parcel_id)


@app.get("/api/v1/challenges/level4_boss/actions/public/status")
def level4_boss_public_status():
    from levels.level4_boss import public_status_payload

    return public_status_payload()


@app.get("/api/v1/challenges/level4_boss/actions/public/assets/{filename}")
def level4_boss_public_asset(filename: str):
    from levels.level4_boss import ASSET_FILENAME, public_asset_source

    if filename != ASSET_FILENAME:
        raise APIError("NOT_FOUND", "asset not found", 404)
    return Response(content=public_asset_source(), media_type="application/javascript")


@app.get("/api/v1/challenges/level4_boss/actions/keys/jwks")
def level4_boss_jwks(authorization: Optional[str] = Header(None)):
    _get_session(authorization)
    from levels.level4_boss import jwks_payload

    return jwks_payload()


@app.get("/api/v1/challenges/level4_boss/actions/pass/issue")
def level4_boss_pass_issue(authorization: Optional[str] = Header(None)):
    _, session = _get_session(authorization)
    from levels.level4_boss import issue_pass_payload

    return issue_pass_payload(str(session.get("userId", "user_1004")))


@app.get("/api/v1/challenges/level4_boss/actions/admin/config")
def level4_boss_admin_config(
    authorization: Optional[str] = Header(None),
    x_partner_pass: Optional[str] = Header(None, alias="X-Partner-Pass"),
):
    _get_session(authorization)
    from levels.level4_boss import admin_config_payload

    ok_result, payload = admin_config_payload(x_partner_pass or "")
    if not ok_result:
        err = payload.get("error", {})
        raise APIError(err.get("code", "BAD_PARTNER_PASS"), err.get("message", "partner pass invalid"), int(payload.get("_status", 401)))
    return payload


@app.post("/api/v1/challenges/level4_boss/actions/webhook/receive")
async def level4_boss_webhook_receive(
    request: Request,
    x_webhook_timestamp: Optional[str] = Header(None, alias="X-Webhook-Timestamp"),
    x_webhook_event_id: Optional[str] = Header(None, alias="X-Webhook-Event-Id"),
    x_webhook_signature: Optional[str] = Header(None, alias="X-Webhook-Signature"),
):
    from levels.level4_boss import webhook_receive_payload

    raw_body = (await request.body()).decode("utf-8", errors="replace")
    status, payload = webhook_receive_payload(
        x_webhook_timestamp,
        x_webhook_event_id,
        x_webhook_signature,
        raw_body,
        int(_now()),
    )
    return JSONResponse(status_code=status, content=payload)


@app.get("/api/v1/challenges/level4_boss/actions/vault/status")
def level4_boss_vault_status(
    authorization: Optional[str] = Header(None),
    ticket: str = Query(..., min_length=3, max_length=80),
):
    _get_session(authorization)
    from levels.level4_boss import vault_status_payload

    ok_result, payload = vault_status_payload(ticket)
    if not ok_result:
        err = payload.get("error", {})
        raise APIError(err.get("code", "BAD_TICKET"), err.get("message", "unknown ticket"), int(payload.get("_status", 404)))
    return payload


@app.post("/api/v1/challenges/level4_boss/actions/vault/claim")
def level4_boss_vault_claim(
    authorization: Optional[str] = Header(None),
    req: Dict[str, Any] = Body(default={}),
):
    _get_session(authorization)
    from levels.level4_boss import vault_claim_payload

    ok_result, payload = vault_claim_payload(str(req.get("ticket", "")))
    if not ok_result:
        err = payload.get("error", {})
        raise APIError(err.get("code", "NOT_READY"), err.get("message", "claim failed"), int(payload.get("_status", 409)))
    return payload
