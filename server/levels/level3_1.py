from __future__ import annotations

import copy
import json
import os
import re
from typing import Any, Dict, Optional, Tuple
from urllib.parse import parse_qs

from fakeshell import FakeShell, ShellContext
from fakeshell.http import HttpResponse


LEVEL3_1_FLAG = os.getenv("PURPLEDROID_LEVEL3_1_FLAG", "FLAG{BOLA_ENUMERATION_WORKS}")
DEFAULT_OWNER = "user_1004"

_PARCELS: Dict[str, Dict[str, Any]] = {
    "PD-1002": {
        "parcel_id": "PD-1002",
        "owner": "user_1002",
        "tier": "standard",
        "status": "delivered",
        "contents": "book",
        "delivery_instructions": "Leave at door.",
    },
    "PD-1003": {
        "parcel_id": "PD-1003",
        "owner": "user_1003",
        "tier": "standard",
        "status": "in_transit",
        "contents": "kitchen tools",
        "delivery_instructions": "Call on arrival.",
    },
    "PD-1004": {
        "parcel_id": "PD-1004",
        "owner": DEFAULT_OWNER,
        "tier": "standard",
        "status": "in_transit",
        "contents": "gaming mouse",
        "delivery_instructions": "Leave at concierge.",
    },
    "PD-1005": {
        "parcel_id": "PD-1005",
        "owner": "user_1005",
        "tier": "standard",
        "status": "sorting",
        "contents": "pet supplies",
        "delivery_instructions": "Ring bell once.",
    },
    "PD-1006": {
        "parcel_id": "PD-1006",
        "owner": "vip_neighbor",
        "tier": "vip",
        "status": "in_transit",
        "contents": "VIP-only gift",
        "recipient_phone": "+82-10-1006-0000",
        "delivery_instructions": "Handle with care.",
        "logistics": {
            "warehouse": "WH-EAST-07",
            "priority": "express",
            "handler": {
                "team": "vip-ops",
                "shift": "night",
                "notes": {
                    "last_scan": "2026-02-24T03:12:00Z",
                    "courier_ticket": LEVEL3_1_FLAG,
                    "ack": True,
                },
            },
        },
    },
}


STATIC: Dict[str, Any] = {
    "id": "level3_1",
    "level": 3,
    "title": "3-1 Steal the Neighbor's Parcel",
    "summary": "남의 택배 정보가 보이면 인가 결함(BOLA)이다.",
    "description": (
        "미션: 내 택배(PD-1004) 조회 흐름을 관찰하고, parcel_id를 바꿔 "
        "다른 고객 택배를 조회해 FLAG를 찾아 제출해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {
                "platform": "web",
                "text": "F12 Network에서 /actions/parcels/mine 과 /actions/parcel 요청을 확인해.",
            },
            {
                "platform": "all",
                "text": "내 owner와 내 parcel_id의 숫자 suffix 패턴이 연결되는지 확인해.",
            },
            {
                "platform": "all",
                "text": "내 번호 주변 작은 범위(parcel_id)를 열거해봐.",
            },
            {
                "platform": "windows",
                "text": 'curl.exe -v -X GET "http://localhost:8000/api/v1/challenges/level3_1/actions/parcel?parcel_id=<parcel_id>" -H "Authorization: Bearer <token>"',
            },
            {
                "platform": "unix",
                "text": "curl -v -X GET 'http://localhost:8000/api/v1/challenges/level3_1/actions/parcel?parcel_id=<parcel_id>' -H 'Authorization: Bearer <token>'",
            },
            {
                "platform": "all",
                "text": "DevTools의 Request Headers에서 Authorization 값을 확인해 재사용해.",
            },
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 25000,
            "help": (
                "허용: curl -v -X GET http://localhost:8000/api/v1/challenges/level3_1/actions/parcels/mine -H 'Authorization: Bearer <token>', "
                "curl -v -X GET 'http://localhost:8000/api/v1/challenges/level3_1/actions/parcel?parcel_id=<parcel_id>' -H 'Authorization: Bearer <token>'"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "인증과 인가는 다르다. 객체 반환 직전에 owner_id == current_user 검증을 "
            "강제하고, 프론트 숨김 로직에 의존하지 마라."
        ),
        "code": {},
    },
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL3_1_FLAG


def judge_patch(_patched: list[str]) -> bool:
    return False


def get_parcel(parcel_id: str) -> Optional[Dict[str, Any]]:
    record = _PARCELS.get((parcel_id or "").strip().upper())
    return copy.deepcopy(record) if record else None


def get_mine_view(owner: str = DEFAULT_OWNER) -> Dict[str, Any]:
    own = get_parcel("PD-1004")
    return {
        "owner": owner or DEFAULT_OWNER,
        "parcels": [
            {
                "parcel_id": own["parcel_id"] if own else "PD-1004",
                "label": "My Parcel",
                "tier": own["tier"] if own else "standard",
            }
        ],
        "hint": "owner suffix와 parcel_id suffix의 관계를 관찰해봐.",
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
    query: str,
    headers: Dict[str, str],
    _body: str,
    ctx: ShellContext,
) -> HttpResponse:
    if not _is_auth_ok(headers, ctx):
        return _unauthorized()

    if method == "GET" and path == "/api/v1/challenges/level3_1/actions/parcels/mine":
        return _json_response({"ok": True, "data": get_mine_view(str(ctx.env.get("USER", DEFAULT_OWNER)))})

    if method == "GET" and path == "/api/v1/challenges/level3_1/actions/parcel":
        parcel_id = (parse_qs(query).get("parcel_id", [""])[0] or "").upper()
        if not parcel_id:
            return _json_response(
                {"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "parcel_id is required"}},
                422,
            )
        parcel = get_parcel(parcel_id)
        if not parcel:
            return _json_response({"ok": False, "error": {"code": "NOT_FOUND", "message": "parcel not found"}}, 404)
        return _json_response({"ok": True, "data": parcel})

    if method == "GET":
        matched = re.match(r"^/api/v1/challenges/level3_1/actions/parcels/([A-Za-z0-9\-]+)$", path)
        if matched:
            parcel = get_parcel(matched.group(1))
            if not parcel:
                return _json_response({"ok": False, "error": {"code": "NOT_FOUND", "message": "parcel not found"}}, 404)
            return _json_response({"ok": True, "data": parcel})

    return _json_response({"ok": False, "error": {"code": "NOT_FOUND", "message": "route not found"}}, 404)


_SHELL = FakeShell(
    fs_tree={
        "/workspace": {
            "README.txt": "PurpleDroid fake shell workspace\n",
            "notes": {"level3_1.txt": "Observe requests and enumerate parcel ids.\n"},
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
    level_state = shell_state.setdefault("level3_1", {"cwd": "/workspace"})
    ctx = ShellContext(
        env={
            "USER": str(session.get("userId", DEFAULT_OWNER)),
            "SESSION_TOKEN": str(session.get("token", "")),
            "HOME": "/workspace",
        },
        cwd=str(level_state.get("cwd", "/workspace")),
    )
    stdout, stderr, code = _SHELL.execute(command, ctx)
    level_state["cwd"] = ctx.cwd
    return stdout, stderr, code


def terminal_exec(command: str) -> Tuple[str, str, int]:
    return _SHELL.execute(command, ShellContext(env={"USER": DEFAULT_OWNER, "HOME": "/workspace"}, cwd="/workspace"))
