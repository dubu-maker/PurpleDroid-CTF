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
BOSS_VAULT_TICKET = os.getenv("PURPLEDROID_LEVEL3_BOSS_VAULT_TICKET", "VTK-9a31-f1de")
BOSS_CLAIM_CODE = os.getenv("PURPLEDROID_LEVEL3_BOSS_CLAIM_CODE", "CLM-11b4")
BOSS_ATTEMPT_CAP = int(os.getenv("PURPLEDROID_LEVEL3_BOSS_ATTEMPT_CAP", "500"))


STATIC: Dict[str, Any] = {
    "id": "level3_boss",
    "level": 3,
    "title": "3-BOSS Purple Vault Heist",
    "summary": "관찰과 우회를 연결하는 취약점 체인으로 Purple Vault를 열어라.",
    "description": (
        "미션: IDOR -> Mass Assignment -> Hidden Admin API -> 과다 정보 노출 -> PIN 브루트포스 "
        "순서로 단서를 연결해 최종 Vault Claim에서 FLAG를 획득해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {
                "platform": "web",
                "text": "택배 상세 조회 요청에서 parcel_id가 어디에 붙는지 먼저 확인해.",
            },
            {
                "platform": "all",
                "text": "VIP 택배 응답에 audit 단서가 숨어있다. 내 택배에는 없을 수 있다.",
            },
            {
                "platform": "web",
                "text": "menu 응답에는 UI에 숨겨진 관리자 경로(path)가 포함될 수 있다.",
            },
            {
                "platform": "all",
                "text": "프로필 업데이트는 address 화면이지만 서버는 다른 필드도 저장할 수 있다.",
            },
            {
                "platform": "all",
                "text": "audit 응답 JSON은 끝까지 펼쳐 debug/meta/internal 구조를 확인해.",
            },
            {
                "platform": "all",
                "text": "locker PIN은 78** 형태다. 남은 경우의 수는 100개.",
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
        "enabled": False,
        "instruction": (
            "체인 공격을 끊으려면 취약점 하나가 아니라 신뢰 경계 전체를 막아야 한다. "
            "객체 권한 검사, 필드 화이트리스트, 기능 인가, 응답 최소화, 시도 제한을 동시에 적용해라."
        ),
        "code": {},
    },
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
            "note": "VIP parcels are audited.",
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


def judge_patch(_patched: list[str]) -> bool:
    return False


def get_mine_payload(session: Dict[str, Any]) -> Dict[str, Any]:
    mine = str(session.get("primaryParcelId", "PD-1004"))
    return {
        "ok": True,
        "data": {
            "mine": [mine],
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
                "title": "Courier Hub Audit Export",
                "result": "ok",
            },
            "meta": {
                "debug": {
                    "trace_id": "trc-9d1b",
                    "vault": {
                        "locker_id": BOSS_LOCKER_ID,
                        "pin_prefix": "78**",
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
            "README.txt": "Level 3 final boss: Purple Vault Heist\n",
            "ops": {"notes.txt": "Chain multiple weaknesses.\n"},
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
