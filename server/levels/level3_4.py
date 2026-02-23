from __future__ import annotations

import json
import os
from typing import Any, Dict, Tuple
from urllib.parse import parse_qs

from fakeshell import FakeShell, ShellContext
from fakeshell.http import HttpResponse


LEVEL3_4_FLAG = os.getenv("PURPLEDROID_LEVEL3_4_FLAG", "FLAG{DATA_EXPOSURE_HURTS}")
DEFAULT_TICKET_ID = "SUP-1004"
LEVEL3_4_FLAG_B64 = "RkxBR3tEQVRBX0VYUE9TVVJFX0hVUlRTfQ=="


STATIC: Dict[str, Any] = {
    "id": "level3_4",
    "level": 3,
    "title": "3-4 Too Much Information",
    "summary": "UI보다 응답 JSON이 더 많은 데이터를 내보내면 과다 정보 노출이다.",
    "description": (
        "미션: 지원 티켓 응답(Response JSON)을 끝까지 펼쳐 debug/meta/internal 구조 안의 FLAG를 찾아 제출해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {
                "platform": "web",
                "text": "F12 Network에서 /actions/ticket 응답 JSON을 끝까지 펼쳐봐.",
            },
            {
                "platform": "all",
                "text": "2-1은 Header였다. 이번엔 Body(JSON) 안의 깊은 필드다.",
            },
            {
                "platform": "all",
                "text": "debug / meta / internal 키워드를 찾아봐. 값이 바로 FLAG 형태가 아닐 수도 있다.",
            },
            {
                "platform": "windows",
                "text": 'curl -v "http://localhost:8000/api/v1/challenges/level3_4/actions/ticket?id=SUP-1004" -H "Authorization: Bearer <token>"',
            },
            {
                "platform": "windows",
                "text": 'curl -s "http://localhost:8000/api/v1/challenges/level3_4/actions/ticket?id=SUP-1004" -H "Authorization: Bearer <token>" | findstr RkxB',
            },
            {
                "platform": "unix",
                "text": "curl -v 'http://localhost:8000/api/v1/challenges/level3_4/actions/ticket?id=SUP-1004' -H 'Authorization: Bearer <token>'",
            },
            {
                "platform": "unix",
                "text": "curl -s 'http://localhost:8000/api/v1/challenges/level3_4/actions/ticket?id=SUP-1004' -H 'Authorization: Bearer <token>' | grep RkxB",
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
                "허용: curl -v .../actions/ticket?id=SUP-1004 -H 'Authorization: Bearer <token>', "
                "curl ... | grep FLAG"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "응답 DTO를 최소화하고 UI에 쓰지 않는 debug/internal/meta 필드는 운영 응답에서 제거하라. "
            "백엔드에서 explicit serializer(allow-list)로 필요한 필드만 내려라."
        ),
        "code": {},
    },
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL3_4_FLAG


def judge_patch(_patched: list[str]) -> bool:
    return False


def ticket_payload(ticket_id: str = DEFAULT_TICKET_ID) -> Dict[str, Any]:
    tid = (ticket_id or DEFAULT_TICKET_ID).strip()[:40] or DEFAULT_TICKET_ID
    return {
        "ok": True,
        "data": {
            "ticket": {
                "id": tid,
                "title": "Parcel delayed inquiry",
                "status": "answered",
                "ui_preview": {
                    "summary": "배송 지연 문의가 접수되었고 처리 완료됨.",
                    "visible_fields": ["title", "status", "summary"],
                },
                "meta": {
                    "debug": {
                        "build": "prod",
                        "trace_id": "9d1b-4c2a-88b1",
                        "notes": {
                            "last_migration": "2026-02-23",
                            "sealed_blob": LEVEL3_4_FLAG_B64,
                            "encoding": "base64",
                        },
                    }
                },
            },
            "internal": {
                "flags": {
                    "showAdminPanel": False,
                    "enableAuditExport": True,
                },
                "routing": {
                    "queue": "support-l2",
                    "owner": "ops-bot-3",
                },
            },
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
    _body: str,
    ctx: ShellContext,
) -> HttpResponse:
    if not _is_auth_ok(headers, ctx):
        return _unauthorized()

    if method == "GET" and path == "/api/v1/challenges/level3_4/actions/ticket":
        params = parse_qs(query, keep_blank_values=True)
        ticket_id = params.get("id", [DEFAULT_TICKET_ID])[0]
        return _json_response(ticket_payload(ticket_id))

    return _json_response({"ok": False, "error": {"code": "NOT_FOUND", "message": "route not found"}}, 404)


_SHELL = FakeShell(
    fs_tree={
        "/workspace": {
            "README.txt": "Level 3-4 excessive data exposure lab\n",
            "tickets": {"sample.txt": "SUP-1004\n"},
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
    level_state = shell_state.setdefault("level3_4", {"cwd": "/workspace"})
    ctx = ShellContext(
        env={
            "USER": str(session.get("userId", "user_1004")),
            "SESSION_TOKEN": str(session.get("token", "")),
            "HOME": "/workspace",
        },
        cwd=str(level_state.get("cwd", "/workspace")),
    )
    stdout, stderr, code = _SHELL.execute(command, ctx)
    level_state["cwd"] = ctx.cwd
    return stdout, stderr, code


def terminal_exec(command: str) -> Tuple[str, str, int]:
    return _SHELL.execute(command, ShellContext(env={"USER": "guest", "HOME": "/workspace"}, cwd="/workspace"))
