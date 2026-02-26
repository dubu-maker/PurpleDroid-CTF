from __future__ import annotations

import json
import os
from typing import Any, Dict, Optional, Tuple

from fakeshell import FakeShell, ShellContext
from fakeshell.http import HttpResponse


LEVEL3_2_FLAG = os.getenv("PURPLEDROID_LEVEL3_2_FLAG", "FLAG{UI_IS_NOT_AUTHZ}")
ADMIN_STATS_PATH = "/api/v1/challenges/level3_2/actions/admin/stats"
ADMIN_AUDIT_PATH = "/api/v1/challenges/level3_2/actions/admin/audit"


STATIC: Dict[str, Any] = {
    "id": "level3_2",
    "level": 3,
    "title": "3-2 The Hidden Admin Panel",
    "summary": "UI에 숨겨진 기능도 서버 인가가 약하면 누구나 호출 가능하다.",
    "description": (
        "미션: /actions/menu 응답에서 숨겨진 관리자 기능의 단서를 찾고, "
        "실제 엔드포인트를 추론해 직접 호출해 FLAG를 획득해라. (경로는 직접 주어지지 않음)"
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {
                "platform": "web",
                "text": "F12 Network에서 menu/features 응답을 확인해. enabled=false 항목의 routeHint를 읽어봐.",
            },
            {
                "platform": "all",
                "text": "직접 path는 안 준다. 패턴/키워드 단서로 경로를 추론해야 한다.",
            },
            {
                "platform": "all",
                "text": "함정 엔드포인트가 섞여 있다. 여러 후보를 직접 호출해 결과를 비교해.",
            },
            {
                "platform": "windows",
                "text": 'curl.exe -v http://localhost:8000/api/v1/challenges/level3_2/actions/menu -H "Authorization: Bearer <token>"',
            },
            {
                "platform": "unix",
                "text": "curl -v http://localhost:8000/api/v1/challenges/level3_2/actions/menu -H 'Authorization: Bearer <token>'",
            },
            {
                "platform": "all",
                "text": "DevTools의 Request Headers에서 Authorization 값을 확인해 재사용해.",
            },
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 10000,
            "help": (
                "허용: curl -v .../actions/menu -H 'Authorization: Bearer <token>', "
                "curl -v -X POST .../actions/<guessed>/<guessed> -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{}'"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "Security by obscurity는 보안이 아니다. 프론트에서 숨긴 메뉴를 신뢰하지 말고, "
            "서버 엔드포인트마다 RBAC 인가 검증을 강제하라."
        ),
        "code": {},
    },
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL3_2_FLAG


def judge_patch(_patched: list[str]) -> bool:
    return False


def menu_payload() -> Dict[str, Any]:
    return {
        "ok": True,
        "data": {
            "menu": ["track", "profile", "support"],
            "features": {
                "admin_panel": {
                    "enabled": False,
                    "requiresRole": "admin",
                    "routeHint": {
                        "pattern": "/api/v1/challenges/level3_2/actions/<segment1>/<segment2>",
                        "clues": [
                            "segment1 is related to privileged operations",
                            "segment2 is related to review/export of records",
                        ],
                        "knownWords": ["admin", "audit", "stats", "export"],
                    },
                    "note": "internal only - hidden in UI",
                },
                "bulk_export": {
                    "enabled": False,
                    "pathHint": "/api/v1/challenges/level3_2/actions/export",
                    "requiresRole": "operator",
                    "note": "deprecated - scheduled for removal",
                },
            },
        },
    }


def stats_payload() -> Dict[str, Any]:
    """함정 엔드포인트: FLAG 없이 평범한 통계만 반환"""
    return {
        "ok": True,
        "data": {
            "status": "ok",
            "stats": {
                "total_parcels": 4829,
                "active_couriers": 37,
                "avg_delivery_hours": 14.2,
                "region_breakdown": {
                    "seoul": 2104,
                    "busan": 891,
                    "incheon": 634,
                    "other": 1200,
                },
            },
        },
    }


def audit_payload(range_value: str = "last_24h") -> Dict[str, Any]:
    return {
        "ok": True,
        "data": {
            "status": "ok",
            "report": {
                "title": "Courier Hub Internal Audit",
                "exported": True,
                "items": 17,
                "range": range_value,
                "internal_note": f"operator memo: {LEVEL3_2_FLAG}",
            },
        },
    }


def export_payload() -> Dict[str, Any]:
    """함정 엔드포인트: deprecated 기능, FLAG 없음"""
    return {
        "ok": True,
        "data": {
            "status": "deprecated",
            "message": "This export feature has been migrated. Check the admin panel for current tools.",
        },
    }


def _json_response(payload: Dict[str, Any], status: int = 200) -> HttpResponse:
    return HttpResponse(status=status, headers={"content-type": "application/json"}, body=json.dumps(payload, separators=(",", ":")))


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
    _query: str,
    headers: Dict[str, str],
    body: str,
    ctx: ShellContext,
) -> HttpResponse:
    if not _is_auth_ok(headers, ctx):
        return _unauthorized()

    if method == "GET" and path == "/api/v1/challenges/level3_2/actions/menu":
        return _json_response(menu_payload())

    if method == "POST" and path == ADMIN_STATS_PATH:
        # 의도적 취약점: admin 권한 검증 누락 (함정 - FLAG 없음)
        return _json_response(stats_payload())

    if method == "POST" and path == ADMIN_AUDIT_PATH:
        range_value = "last_24h"
        if body:
            try:
                parsed = json.loads(body)
                range_value = str(parsed.get("range", "last_24h"))
            except Exception:
                range_value = "last_24h"
        # 의도적 취약점: admin 권한 검증 누락 (진짜 FLAG)
        return _json_response(audit_payload(range_value))

    if method in ("GET", "POST") and path == "/api/v1/challenges/level3_2/actions/export":
        # deprecated 함정
        return _json_response(export_payload())

    return _json_response({"ok": False, "error": {"code": "NOT_FOUND", "message": "route not found"}}, 404)


_SHELL = FakeShell(
    fs_tree={
        "/workspace": {
            "README.txt": "Level 3-2 hidden admin panel lab\n",
            "menu": {"visible.txt": "track\nprofile\nsupport\n"},
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
    level_state = shell_state.setdefault("level3_2", {"cwd": "/workspace"})
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
