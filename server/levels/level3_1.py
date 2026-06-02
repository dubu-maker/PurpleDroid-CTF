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
        "enabled": True,
        "instruction": (
            "로그인 여부만 확인하는 것으로는 부족합니다. 조회한 Signal Capsule이 현재 사용자 소유인지 "
            "검증하지 않은 채 응답으로 반환되는 지점을 선택해 봉쇄하세요."
        ),
        "code": {
            "language": "kotlin",
            "lines": [
                {"no": 1, "text": "fun readSignalCapsule(req: Request, session: Session) {", "patchableId": "d1"},
                {"no": 2, "text": '  val capsuleId = req.query["parcel_id"]', "patchableId": "d2"},
                {"no": 3, "text": "  val capsule = capsuleRepo.find(capsuleId) ?: return notFound()", "patchableId": "d3"},
                {"no": 4, "text": '  if (!session.isAuthenticated) return deny("login_required")', "patchableId": "d4"},
                {"no": 5, "text": '  audit.log("capsule lookup requested")', "patchableId": "d5"},
                {"no": 6, "text": "  val response = capsule.toResponse()", "patchableId": "d6"},
                {"no": 7, "text": "  return ok(response)", "patchableId": "p1"},
                {"no": 8, "text": "}", "patchableId": "d7"},
            ],
        },
    },
}

REQUIRED_PATCH_IDS = {"p1"}

PATCH_CORRECT_FEEDBACK = {
    "p1": "응답 반환 지점이 맞아. 이 분기 전에 capsule.ownerId == session.userId 같은 서버 측 소유자 검증이 들어가야 해.",
}

PATCH_WRONG_FEEDBACK = {
    "d1": "함수 선언 자체는 취약점이 아니야. 실제로 객체가 응답으로 나가는 경계를 봐야 해.",
    "d2": "parcel_id를 읽는 것만으로는 문제가 아니야. 문제는 그 ID로 찾은 객체를 누구에게 반환하느냐야.",
    "d3": "객체 조회 자체는 필요할 수 있어. 조회 후 현재 사용자가 그 객체의 소유자인지 확인하는 단계가 빠진 게 핵심이야.",
    "d4": "로그인 확인은 필요한 방어지만 충분하지 않아. 인증된 사용자가 남의 객체를 볼 수 있는지가 이번 미션의 핵심이야.",
    "d5": "감사 로그는 보조 통제야. 남의 객체가 응답으로 나가는 문제를 직접 막지는 못해.",
    "d6": "응답 DTO 생성은 일반적인 처리야. 다만 이 응답을 내보내기 전에 소유자 검증이 필요해.",
    "d7": "블록 종료는 취약점 지점이 아니야. 반환 경계에서 owner 검증이 빠졌는지 확인해.",
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL3_1_FLAG


def judge_patch(patched_ids: list[str]) -> bool:
    return set(patched_ids) == REQUIRED_PATCH_IDS


def judge_patch_with_session(patched_ids: list[str], session: Dict[str, Any]) -> bool:
    return set(patched_ids) == REQUIRED_PATCH_IDS


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

    if REQUIRED_PATCH_IDS - selected:
        messages.append(
            "아직 객체가 현재 사용자 소유인지 확인하지 않은 채 응답으로 나가는 경로가 남아있어. "
            "인증 체크와 객체별 인가 체크를 구분해서 봐."
        )

    return " ".join(messages) if messages else "봉쇄할 라인을 선택해줘. 객체가 응답으로 나가기 직전의 신뢰 경계를 봐야 해."


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
