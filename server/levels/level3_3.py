from __future__ import annotations

import copy
import json
import os
import time
from typing import Any, Dict, Tuple

from fakeshell import FakeShell, ShellContext
from fakeshell.http import HttpResponse


LEVEL3_3_FLAG = os.getenv("PURPLEDROID_LEVEL3_3_FLAG", "FLAG{DONT_TRUST_CLIENT_FIELDS}")


STATIC: Dict[str, Any] = {
    "id": "level3_3",
    "level": 3,
    "title": "3-3 Greedy Profile Update",
    "summary": "UI에 없는 필드를 주입하면 서버가 과잉 저장(Mass Assignment)할 수 있다.",
    "description": (
        "미션: 프로필 업데이트 요청을 관찰하고 body를 변조해 role/is_admin을 주입한 뒤, "
        "/actions/perks 응답에서 FLAG를 찾아 제출해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {
                "platform": "web",
                "text": "F12 Network에서 프로필 저장 요청의 Request Payload를 확인해.",
            },
            {
                "platform": "all",
                "text": "UI에 없는 JSON 키를 추가해도 전송은 가능하다. 서버가 저장하는지 확인해봐.",
            },
            {
                "platform": "all",
                "text": "목표는 address 변경이 아니라 권한 필드(role/is_admin) 주입이다. 변경 후 /actions/perks를 다시 조회해.",
            },
            {
                "platform": "windows",
                "text": 'curl -v -X PUT http://localhost:8000/api/v1/challenges/level3_3/actions/profile -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\\"address\\":\\"Busan\\",\\"role\\":\\"admin\\"}"',
            },
            {
                "platform": "windows",
                "text": 'curl -v http://localhost:8000/api/v1/challenges/level3_3/actions/perks -H "Authorization: Bearer <token>"',
            },
            {
                "platform": "unix",
                "text": "curl -v -X PUT http://localhost:8000/api/v1/challenges/level3_3/actions/profile -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{\"address\":\"Busan\",\"role\":\"admin\"}'",
            },
            {
                "platform": "unix",
                "text": "curl -v http://localhost:8000/api/v1/challenges/level3_3/actions/perks -H 'Authorization: Bearer <token>'",
            },
            {
                "platform": "all",
                "text": "DevTools Request Headers에서 Authorization 값을 확인해 재사용해.",
            },
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 10000,
            "help": (
                "허용: curl -v .../actions/profile, "
                "curl -v -X PUT .../actions/profile -H 'Content-Type: application/json' -d '{...}', "
                "curl -v .../actions/perks"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "입력 DTO를 화이트리스트로 고정하고, 요청 JSON 전체를 DB 모델에 직접 merge 하지 마라. "
            "권한/등급 필드는 서버 정책으로만 변경해야 한다."
        ),
        "code": {},
    },
}


def _ts() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _default_profile(user_id: str) -> Dict[str, Any]:
    return {
        "userId": user_id,
        "address": "Seoul",
        "account_info": {"tier": "standard", "is_admin": False},
        "role": "user",
        "updatedAt": _ts(),
    }


def _ensure_profile(session: Dict[str, Any]) -> Dict[str, Any]:
    user_id = str(session.get("userId", "user_1004"))
    current = session.get("level3_3_profile")
    if not isinstance(current, dict):
        current = _default_profile(user_id)
        session["level3_3_profile"] = current

    current.setdefault("userId", user_id)
    current.setdefault("address", "Seoul")
    current.setdefault("role", "user")
    current.setdefault("updatedAt", _ts())
    if not isinstance(current.get("account_info"), dict):
        current["account_info"] = {"tier": "standard", "is_admin": False}
    return current


def _is_admin_like(profile: Dict[str, Any]) -> bool:
    role = str(profile.get("role", "user")).strip().lower()
    if role in ("admin", "operator_admin"):
        return True
    account_info = profile.get("account_info")
    if isinstance(account_info, dict):
        is_admin = account_info.get("is_admin")
        if isinstance(is_admin, bool) and is_admin:
            return True
        if str(is_admin).strip().lower() in ("1", "true", "yes"):
            return True
    return False


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL3_3_FLAG


def judge_patch(_patched: list[str]) -> bool:
    return False


def get_profile_payload(session: Dict[str, Any]) -> Dict[str, Any]:
    profile = _ensure_profile(session)
    return {"ok": True, "data": copy.deepcopy(profile)}


def update_profile_payload(session: Dict[str, Any], patch: Dict[str, Any]) -> Dict[str, Any]:
    profile = _ensure_profile(session)
    # 의도적 취약점(Mass Assignment): 클라이언트 JSON을 그대로 merge
    for key, value in (patch or {}).items():
        profile[key] = value
    profile["updatedAt"] = _ts()
    return {
        "ok": True,
        "data": {
            "updated": True,
            "profile": copy.deepcopy(profile),
            "message": "Profile updated",
        },
    }


def perks_payload(session: Dict[str, Any]) -> Dict[str, Any]:
    profile = _ensure_profile(session)
    if _is_admin_like(profile):
        return {
            "ok": True,
            "data": {
                "role": str(profile.get("role", "admin")),
                "access": "elevated",
                "perks": ["admin dashboard", "override support queue", "audit preview"],
                "flag": LEVEL3_3_FLAG,
            },
        }

    return {
        "ok": True,
        "data": {
            "role": str(profile.get("role", "user")),
            "access": "standard",
            "perks": ["basic tracking", "standard support"],
            "note": "Admin features are locked.",
        },
    }


def _json_response(payload: Dict[str, Any], status: int = 200) -> HttpResponse:
    return HttpResponse(
        status=status,
        headers={"content-type": "application/json"},
        body=json.dumps(payload, separators=(",", ":")),
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


def _validation_error(message: str) -> HttpResponse:
    return _json_response({"ok": False, "error": {"code": "VALIDATION_ERROR", "message": message}}, 422)


def _shell_http_router(
    method: str,
    path: str,
    _query: str,
    headers: Dict[str, str],
    body: str,
    ctx: ShellContext,
) -> HttpResponse:
    if not _is_auth_ok(headers, ctx):
        return _unauthorized()

    session = ctx.data.get("session")
    if not isinstance(session, dict):
        return _unauthorized()

    if method == "GET" and path == "/api/v1/challenges/level3_3/actions/profile":
        return _json_response(get_profile_payload(session))

    if method == "PUT" and path == "/api/v1/challenges/level3_3/actions/profile":
        if not body:
            payload: Dict[str, Any] = {}
        else:
            try:
                parsed = json.loads(body)
            except Exception:
                return _validation_error("JSON body is invalid")
            if not isinstance(parsed, dict):
                return _validation_error("JSON object body required")
            payload = parsed
        return _json_response(update_profile_payload(session, payload))

    if method == "GET" and path == "/api/v1/challenges/level3_3/actions/perks":
        return _json_response(perks_payload(session))

    return _json_response({"ok": False, "error": {"code": "NOT_FOUND", "message": "route not found"}}, 404)


_SHELL = FakeShell(
    fs_tree={
        "/workspace": {
            "README.txt": "Level 3-3 mass assignment lab\n",
            "profile": {"notes.txt": "Address is editable in UI.\n"},
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
    level_state = shell_state.setdefault("level3_3", {"cwd": "/workspace"})
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
    return _SHELL.execute(command, ShellContext(env={"USER": "guest", "HOME": "/workspace"}, cwd="/workspace"))
