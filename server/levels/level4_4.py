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
                "text": 'curl -s /api/v1/challenges/level4_4/actions/public/gateway-status -i',
            },
            {
                "platform": "windows",
                "text": 'curl -s /api/v1/challenges/level4_4/actions/whoami -H "Authorization: Bearer <token>" -H "X-Forwarded-For: <gateway_ip>, 10.0.0.1"',
            },
            {
                "platform": "windows",
                "text": 'curl -s -X POST /api/v1/challenges/level4_4/actions/partner/settlement -H "Authorization: Bearer <token>" -H "X-Forwarded-For: <gateway_ip>, 10.0.0.1" -H "Content-Type: application/json" -d "{}"',
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
        "enabled": True,
        "instruction": (
            "X-Forwarded-For는 신뢰 가능한 프록시 뒤에서만 사용하고, 외부에서 온 XFF는 제거/덮어쓰기해라. "
            "중요 기능은 IP allowlist 단독이 아니라 HMAC/mTLS/토큰 스코프 등 강한 인증을 병행해야 한다."
        ),
        "code": {
            "language": "policy",
            "lines": [
                {"no": 1, "text": "Strip untrusted X-Forwarded-For at edge", "patchableId": "policy_strip_untrusted_xff"},
                {"no": 2, "text": "Trust forwarded headers only from known proxies", "patchableId": "policy_trusted_proxy_only"},
                {"no": 3, "text": "Use remote address by default", "patchableId": "policy_remote_addr_default"},
                {"no": 4, "text": "Require mTLS/HMAC/token scope for settlement", "patchableId": "policy_strong_settlement_auth"},
                {"no": 5, "text": "Log forwarded-chain mismatches", "patchableId": "bonus_log_forwarded_mismatch"},
                {"no": 6, "text": "Rename X-Forwarded-For header", "patchableId": "decoy_rename_xff"},
                {"no": 7, "text": "Hide whoami endpoint", "patchableId": "decoy_hide_whoami"},
                {"no": 8, "text": "Keep IP allowlist only", "patchableId": "decoy_ip_only"},
                {"no": 9, "text": "Trust first XFF value", "patchableId": "decoy_trust_first_xff"},
            ],
        },
    },
}

REQUIRED_PATCH_IDS = {
    "policy_strip_untrusted_xff",
    "policy_trusted_proxy_only",
    "policy_remote_addr_default",
    "policy_strong_settlement_auth",
}

BONUS_PATCH_IDS = {"bonus_log_forwarded_mismatch"}

PATCH_CORRECT_FEEDBACK = {
    "policy_strip_untrusted_xff": "맞아. 외부에서 들어온 X-Forwarded-For는 edge에서 제거하거나 덮어써야 해.",
    "policy_trusted_proxy_only": "맞아. forwarded header는 신뢰 가능한 proxy가 붙인 경우에만 읽어야 해.",
    "policy_remote_addr_default": "맞아. 기본 client identity는 클라이언트가 쓴 헤더가 아니라 실제 remote address에서 시작해야 해.",
    "policy_strong_settlement_auth": "맞아. settlement 같은 중요 기능은 IP allowlist 단독이 아니라 mTLS/HMAC/token scope로 인증해야 해.",
    "bonus_log_forwarded_mismatch": "좋아. forwarded chain mismatch 로깅은 탐지에 도움이 되지만, 핵심 봉쇄는 header 신뢰 경계를 닫는 거야.",
}

PATCH_WRONG_FEEDBACK = {
    "decoy_rename_xff": "헤더 이름만 바꾸면 같은 신뢰 문제가 다른 이름으로 반복돼.",
    "decoy_hide_whoami": "whoami를 숨겨도 settlement API가 XFF를 신뢰하면 우회는 그대로 가능해.",
    "decoy_ip_only": "IP allowlist 단독은 trusted proxy chain이 없으면 클라이언트 입력에 속을 수 있어.",
    "decoy_trust_first_xff": "첫 번째 XFF 값을 신뢰한 것이 이번 취약점의 핵심이야.",
}

PATCH_MISSING_LABELS = {
    "policy_strip_untrusted_xff": "untrusted XFF 제거/덮어쓰기",
    "policy_trusted_proxy_only": "trusted proxy 뒤에서만 XFF 신뢰",
    "policy_remote_addr_default": "remote address 기본 사용",
    "policy_strong_settlement_auth": "settlement 강한 인증",
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL4_4_FLAG


def flag_feedback(flag: str) -> str:
    value = flag.strip()
    if value.startswith("FLAG{"):
        return "Settlement Evidence가 아니야. gateway-status에서 허용 IP를 찾고 X-Forwarded-For 신뢰 경계를 확인해봐."
    return "X-Forwarded-For 첫 번째 값으로 partner gateway IP를 주장할 수 있는지 settlement 호출에서 검증해봐."


def judge_patch(patched: list[str]) -> bool:
    selected = set(patched)
    return REQUIRED_PATCH_IDS.issubset(selected) and not (selected - REQUIRED_PATCH_IDS - BONUS_PATCH_IDS)


def patch_feedback(patched: list[str]) -> str:
    selected = set(patched)
    messages: list[str] = []
    seen: set[str] = set()

    for pid in patched:
        if pid in seen:
            continue
        seen.add(pid)
        if pid in PATCH_CORRECT_FEEDBACK:
            messages.append(PATCH_CORRECT_FEEDBACK[pid])
        elif pid in PATCH_WRONG_FEEDBACK:
            messages.append(PATCH_WRONG_FEEDBACK[pid])

    missing = REQUIRED_PATCH_IDS - selected
    if missing:
        missing_names = ", ".join(PATCH_MISSING_LABELS[pid] for pid in sorted(missing))
        messages.append(f"아직 닫히지 않은 경계가 있어: {missing_names}.")

    extra_wrong = selected - REQUIRED_PATCH_IDS - BONUS_PATCH_IDS
    if extra_wrong:
        messages.append("decoy는 빼고, forwarded header 신뢰 경계와 settlement 인증에 직접 작동하는 control만 남겨봐.")

    return "\n".join(messages) if messages else "정책 카드를 선택해줘. XFF 신뢰와 settlement 인증 경계를 함께 닫아야 해."


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
    if token == "$SESSION_TOKEN":
        return True
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
