from __future__ import annotations

import json
import os
from typing import Any, Dict, Tuple
from urllib.parse import parse_qs

from fakeshell import FakeShell, ShellContext
from fakeshell.http import HttpResponse


LEVEL3_5_FLAG = os.getenv("PURPLEDROID_LEVEL3_5_FLAG", "FLAG{RATE_LIMIT_EXISTS_FOR_A_REASON}")
LOCKER_ID = "SL-01"
LOCKER_PIN = os.getenv("PURPLEDROID_LEVEL3_5_PIN", "7742")


STATIC: Dict[str, Any] = {
    "id": "level3_5",
    "level": 3,
    "title": "3-5 Brute-force the Smart Locker",
    "summary": "짧은 PIN은 시도 제한이 없으면 결국 시간 문제다.",
    "description": (
        "미션: Smart Locker PIN이 77** 범위라는 힌트를 이용해 올바른 PIN을 찾고, "
        "락커를 열어 FLAG를 획득해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {"platform": "all", "text": "PIN은 77** 형태다. 남은 경우의 수는 100개."},
            {
                "platform": "web",
                "text": "Network에서 반복 시도해도 서버가 429/락아웃으로 막는지 확인해봐.",
            },
            {
                "platform": "all",
                "text": "핵심은 한 번의 요청이 아니라 반복 시도 통제가 있는지다.",
            },
            {
                "platform": "all",
                "text": "터미널 자동화: seq/xargs 또는 for i in $(seq 7700 7799); do ...; done",
            },
            {
                "platform": "windows",
                "text": 'curl -X POST http://localhost:8000/api/v1/challenges/level3_5/actions/locker/unlock -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\\"locker_id\\":\\"SL-01\\",\\"pin\\":\\"7700\\"}"',
            },
            {
                "platform": "windows",
                "text": 'curl -s -X POST http://localhost:8000/api/v1/challenges/level3_5/actions/locker/unlock -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\\"locker_id\\":\\"SL-01\\",\\"pin\\":\\"7700\\"}" | findstr unlocked',
            },
            {
                "platform": "unix",
                "text": "curl -X POST http://localhost:8000/api/v1/challenges/level3_5/actions/locker/unlock -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{\"locker_id\":\"SL-01\",\"pin\":\"7700\"}'",
            },
            {
                "platform": "unix",
                "text": "curl -s -X POST http://localhost:8000/api/v1/challenges/level3_5/actions/locker/unlock -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{\"locker_id\":\"SL-01\",\"pin\":\"7700\"}' | grep unlocked",
            },
            {
                "platform": "unix",
                "text": "for i in $(seq 7700 7799); do curl -s -X POST http://localhost:8000/api/v1/challenges/level3_5/actions/locker/unlock -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{\"locker_id\":\"SL-01\",\"pin\":\"'$i'\"}' | grep unlocked; done",
            },
            {
                "platform": "all",
                "text": "seq 7700 7799 | xargs -I{} curl -s -X POST http://localhost:8000/api/v1/challenges/level3_5/actions/locker/unlock -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{\"locker_id\":\"SL-01\",\"pin\":\"{}\"}'",
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
                "허용: curl .../actions/locker/hint?locker_id=SL-01, "
                "curl -X POST .../actions/locker/unlock -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{...}'"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "짧은 PIN/OTP에는 시도 제한(레이트리밋), 락아웃, 지연(backoff), 탐지 로깅을 적용해야 한다. "
            "인증 강도는 비밀번호 길이만이 아니라 운영 통제로 완성된다."
        ),
        "code": {},
    },
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL3_5_FLAG


def judge_patch(_patched: list[str]) -> bool:
    return False


def _normalize_pin(pin: str) -> str:
    return str(pin or "").strip()


def get_locker_hint_payload(_session: Dict[str, Any], locker_id: str) -> Dict[str, Any]:
    lid = (locker_id or LOCKER_ID).strip()[:20] or LOCKER_ID
    return {
        "ok": True,
        "data": {
            "locker_id": lid,
            "hint": "PIN starts with 77**",
            "note": "No explicit mention about attempt limits.",
        },
    }


def unlock_locker_payload(session: Dict[str, Any], locker_id: str, pin: str) -> Dict[str, Any]:
    state = session.setdefault("level3_5_state", {"attempts": 0})
    attempts = int(state.get("attempts", 0)) + 1
    state["attempts"] = attempts

    lid = (locker_id or LOCKER_ID).strip()[:20] or LOCKER_ID
    candidate = _normalize_pin(pin)

    if lid != LOCKER_ID:
        return {
            "ok": True,
            "data": {
                "status": "denied",
                "message": "Unknown locker",
                "attempts": attempts,
            },
        }

    if candidate == LOCKER_PIN:
        return {
            "ok": True,
            "data": {
                "status": "unlocked",
                "locker_id": LOCKER_ID,
                "message": "Locker opened",
                "attempts": attempts,
                "flag": LEVEL3_5_FLAG,
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


def _json_response(payload: Dict[str, Any], status: int = 200) -> HttpResponse:
    return HttpResponse(
        status=status,
        headers={"content-type": "application/json"},
        body=json.dumps(payload, separators=(",", ":"), ensure_ascii=False),
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

    if method == "GET" and path == "/api/v1/challenges/level3_5/actions/locker/hint":
        params = parse_qs(query, keep_blank_values=True)
        locker_id = params.get("locker_id", [LOCKER_ID])[0]
        return _json_response(get_locker_hint_payload(session, locker_id))

    if method == "POST" and path == "/api/v1/challenges/level3_5/actions/locker/unlock":
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
            unlock_locker_payload(
                session,
                str(parsed.get("locker_id", LOCKER_ID)),
                str(parsed.get("pin", "")),
            )
        )

    return _json_response({"ok": False, "error": {"code": "NOT_FOUND", "message": "route not found"}}, 404)


_SHELL = FakeShell(
    fs_tree={
        "/workspace": {
            "README.txt": "Level 3-5 brute-force locker lab\n",
            "lockers": {"sl-01.txt": "Hint: PIN starts with 77**\n"},
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
    level_state = shell_state.setdefault("level3_5", {"cwd": "/workspace"})
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
