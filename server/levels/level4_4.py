from __future__ import annotations

import json
import os
from typing import Any, Dict, Tuple

from fakeshell import FakeShell, ShellContext
from fakeshell.http import HttpResponse


LEVEL4_4_FLAG = os.getenv("PURPLEDROID_LEVEL4_4_FLAG", "FLAG{XFF_IS_NOT_YOUR_IDENTITY}")
PARTNER_GATEWAY_IP = os.getenv("PURPLEDROID_LEVEL4_4_GATEWAY_IP", "203.0.113.77")


STATIC: Dict[str, Any] = {
    "id": "level4_4",
    "level": 4,
    "title": "4-4 Ghost Partner IP",
    "summary": "IP allowlist를 X-Forwarded-For로만 판단하면 헤더 스푸핑으로 우회된다.",
    "description": (
        "미션: 파트너 전용 정산 API를 호출해 FLAG를 획득해라. "
        "서버가 client ip를 어떻게 판단하는지 관찰하고, 헤더 신뢰 경계를 찾아 우회해봐."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {"platform": "all", "text": "차단 응답의 seenClientIp/hint를 먼저 확인해. 서버가 어떤 IP를 믿는지 단서가 있다."},
            {"platform": "web", "text": "whoami로 remoteAddr/seenClientIp/xff를 비교하고, XFF를 넣었을 때 값이 바뀌는지 확인해."},
            {"platform": "all", "text": "X-Forwarded-For가 여러 개면 서버가 첫 번째 IP를 client로 쓰는 경우가 많다."},
            {
                "platform": "windows",
                "text": 'curl -s http://localhost:8000/api/v1/challenges/level4_4/actions/public/gateway-status -i',
            },
            {
                "platform": "windows",
                "text": 'curl -s http://localhost:8000/api/v1/challenges/level4_4/actions/whoami -H "Authorization: Bearer <token>" -H "X-Forwarded-For: <gateway_ip>, 10.0.0.1"',
            },
            {
                "platform": "windows",
                "text": 'curl -s -X POST http://localhost:8000/api/v1/challenges/level4_4/actions/partner/settlement -H "Authorization: Bearer <token>" -H "X-Forwarded-For: <gateway_ip>, 10.0.0.1" -H "Content-Type: application/json" -d "{}"',
            },
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 18000,
            "help": (
                "허용: curl .../actions/public/gateway-status, curl .../actions/whoami -H 'Authorization: Bearer <token>' "
                "[-H 'X-Forwarded-For: <ip>, <proxy_ip>'], "
                "curl -X POST .../actions/partner/settlement -H 'Authorization: Bearer <token>' "
                "[-H 'X-Forwarded-For: <ip>, <proxy_ip>'] -H 'Content-Type: application/json' -d '{}'"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "X-Forwarded-For는 신뢰 가능한 프록시 뒤에서만 사용하고, 외부에서 온 XFF는 제거/덮어쓰기해라. "
            "중요 기능은 IP allowlist 단독이 아니라 HMAC/mTLS/토큰 스코프 등 강한 인증을 병행해야 한다."
        ),
        "code": {},
    },
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL4_4_FLAG


def judge_patch(_patched: list[str]) -> bool:
    return False


def resolve_seen_client_ip(remote_addr: str, xff: str | None) -> str:
    xff_text = str(xff or "").strip()
    if not xff_text:
        return str(remote_addr or "unknown")
    first = xff_text.split(",")[0].strip()
    return first or str(remote_addr or "unknown")


def gateway_status_payload() -> Dict[str, Any]:
    return {
        "ok": True,
        "data": {
            "gatewayName": "PGW-01",
            "region": "KR",
            "config": {
                "upstreamProxy": "proxy.purpledroid.internal",
                "peerAddress": PARTNER_GATEWAY_IP,
                "protocol": "HTTPS",
            },
            "note": "Settlement API is allowlisted to partner gateway network only.",
        },
    }


def whoami_payload(remote_addr: str, xff: str | None) -> Dict[str, Any]:
    seen_ip = resolve_seen_client_ip(remote_addr, xff)
    return {
        "ok": True,
        "data": {
            "remoteAddr": str(remote_addr or "unknown"),
            "seenClientIp": seen_ip,
            "xff": (str(xff).strip() if xff else None),
        },
    }


def settlement_payload(remote_addr: str, xff: str | None) -> Tuple[bool, Dict[str, Any]]:
    seen_ip = resolve_seen_client_ip(remote_addr, xff)
    if seen_ip != PARTNER_GATEWAY_IP:
        return (
            False,
            {
                "ok": False,
                "error": {
                    "code": "PARTNER_NETWORK_ONLY",
                    "message": "Only partner gateway can call this.",
                    "details": {
                        "seenClientIp": seen_ip,
                        "hint": "Do you trust X-Forwarded-For blindly?",
                    },
                },
            },
        )
    return (
        True,
        {
            "ok": True,
            "data": {
                "status": "ok",
                "message": "Settlement exported.",
                "flag": LEVEL4_4_FLAG,
            },
        },
    )


def _json_response(payload: Dict[str, Any], status: int = 200, headers: Dict[str, str] | None = None) -> HttpResponse:
    out_headers = {"content-type": "application/json"}
    if headers:
        out_headers.update(headers)
    return HttpResponse(
        status=status,
        headers=out_headers,
        body=json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
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
    _query: str,
    headers: Dict[str, str],
    _body: str,
    ctx: ShellContext,
) -> HttpResponse:
    remote_addr = str(ctx.env.get("REMOTE_ADDR", "127.0.0.1"))
    xff = headers.get("x-forwarded-for")

    if method == "GET" and path == "/api/v1/challenges/level4_4/actions/public/gateway-status":
        return _json_response(gateway_status_payload())

    if method == "GET" and path == "/api/v1/challenges/level4_4/actions/whoami":
        if not _is_auth_ok(headers, ctx):
            return _unauthorized()
        return _json_response(whoami_payload(remote_addr, xff))

    if method == "POST" and path == "/api/v1/challenges/level4_4/actions/partner/settlement":
        if not _is_auth_ok(headers, ctx):
            return _unauthorized()
        ok_result, payload = settlement_payload(remote_addr, xff)
        if not ok_result:
            return _json_response(payload, 403)
        return _json_response(payload)

    return _json_response({"ok": False, "error": {"code": "NOT_FOUND", "message": "route not found"}}, 404)


_SHELL = FakeShell(
    fs_tree={
        "/workspace": {
            "README.txt": "Level 4-4 ghost partner ip lab\n",
            "notes": {"proxy.txt": "XFF trust boundary matters\n"},
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
        "base64",
    },
)


def terminal_exec_with_session(command: str, session: Dict[str, Any]) -> Tuple[str, str, int]:
    shell_state = session.setdefault("fakeShellState", {})
    level_state = shell_state.setdefault("level4_4", {"cwd": "/workspace"})
    ctx = ShellContext(
        env={
            "USER": str(session.get("userId", "user_1004")),
            "SESSION_TOKEN": str(session.get("token", "")),
            "REMOTE_ADDR": "127.0.0.1",
            "HOME": "/workspace",
        },
        cwd=str(level_state.get("cwd", "/workspace")),
    )
    stdout, stderr, code = _SHELL.execute(str(command or ""), ctx)
    level_state["cwd"] = ctx.cwd
    return stdout, stderr, code


def terminal_exec(command: str) -> Tuple[str, str, int]:
    return _SHELL.execute(
        str(command or ""),
        ShellContext(
            env={
                "USER": "guest",
                "SESSION_TOKEN": "guest-token",
                "REMOTE_ADDR": "127.0.0.1",
                "HOME": "/workspace",
            },
            cwd="/workspace",
        ),
    )

