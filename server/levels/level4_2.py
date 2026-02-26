from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any, Dict, Tuple

from fakeshell import FakeShell, ShellContext
from fakeshell.http import HttpResponse


LEVEL4_2_FLAG = os.getenv("PURPLEDROID_LEVEL4_2_FLAG", "FLAG{KID_CONTROLS_THE_LOCK}")
ACTIVE_KID = "pd-2026-rot2"
LEGACY_KID = "pd-2024-legacy"
ACTIVE_SIGNING_SECRET = os.getenv("PURPLEDROID_LEVEL4_2_ACTIVE_SECRET", "pd_active_rs256_sim_2026")
PASS_ISSUER = "purpledroid.partner"
PASS_AUDIENCE = "partner-admin"


STATIC: Dict[str, Any] = {
    "id": "level4_2",
    "level": 4,
    "title": "4-2 Key Roulette Partner Pass",
    "summary": "kid 조작으로 검증 키 선택이 바뀌면 파트너 패스 위조가 가능해진다.",
    "description": (
        "미션: PartnerPass의 kid를 조작해 서버가 legacy 경로로 검증하도록 만들고, "
        "admin/audit 호출로 FLAG를 획득해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {"platform": "all", "text": "pass/issue로 정상 PartnerPass를 먼저 받아 header.kid와 payload.role을 확인해."},
            {"platform": "all", "text": "keys/jwks 응답에서 active/legacy 키 상태를 비교해."},
            {"platform": "all", "text": "kid는 서버가 어떤 키로 검증할지 고르게 만들 수 있다."},
            {"platform": "all", "text": "레거시(legacy) 검증 로직은 생각보다 훨씬 더 허술할 수 있어. 서명 검증 자체를 안 할지도?"},            
            {"platform": "all", "text": "legacy/deprecated 키 경로가 살아 있으면 뒷문이 된다."},
            {
                "platform": "windows",
                "text": 'curl -s http://localhost:8000/api/v1/challenges/level4_2/actions/pass/issue -H "Authorization: Bearer <token>"',
            },
            {
                "platform": "windows",
                "text": 'curl -s http://localhost:8000/api/v1/challenges/level4_2/actions/keys/jwks -H "Authorization: Bearer <token>"',
            },
            {
                "platform": "windows",
                "text": 'curl -s -X POST http://localhost:8000/api/v1/challenges/level4_2/actions/admin/audit -H "Authorization: Bearer <token>" -H "X-Partner-Pass: <forged_pass>"',
            },
            {
                "platform": "unix",
                "text": "curl -s /api/v1/challenges/level4_2/actions/pass/issue -H 'Authorization: Bearer <token>'",
            },
            {
                "platform": "unix",
                "text": "curl -s /api/v1/challenges/level4_2/actions/keys/jwks -H 'Authorization: Bearer <token>'",
            },
            {
                "platform": "unix",
                "text": "curl -s -X POST /api/v1/challenges/level4_2/actions/admin/audit -H 'Authorization: Bearer <token>' -H 'X-Partner-Pass: <forged_pass>'",
            },
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 18000,
            "help": (
                "허용: curl .../actions/pass/issue, curl .../actions/keys/jwks, "
                "curl -X POST .../actions/admin/audit -H 'Authorization: Bearer <token>' -H 'X-Partner-Pass: <token>', "
                "jwt-decode <token>, jwt-help"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "kid 화이트리스트/alg pinning/클레임 검증(iss, aud, exp)과 서버 권한 재검증을 함께 적용해 "
            "키 선택 조작과 legacy 우회 경로를 차단하라."
        ),
        "code": {},
    },
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL4_2_FLAG


def judge_patch(_patched: list[str]) -> bool:
    return False


def _b64u_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _b64u_decode(seg: str) -> bytes:
    padded = seg + ("=" * ((4 - len(seg) % 4) % 4))
    return base64.urlsafe_b64decode(padded.encode("utf-8"))


def _hs256_sign(signing_input: str, secret: str) -> str:
    digest = hmac.new(secret.encode("utf-8"), signing_input.encode("utf-8"), hashlib.sha256).digest()
    return _b64u_encode(digest)


def _json_segment(data: Dict[str, Any]) -> str:
    return _b64u_encode(json.dumps(data, separators=(",", ":"), ensure_ascii=False).encode("utf-8"))


def issue_partner_pass(user_id: str = "user_1004") -> str:
    now = int(time.time())
    header = {"alg": "RS256", "kid": ACTIVE_KID, "typ": "JWT"}
    payload = {
        "iss": PASS_ISSUER,
        "aud": PASS_AUDIENCE,
        "sub": user_id,
        "role": "user",
        "scope": "partner:read",
        "iat": now,
        "exp": now + 1800,
    }
    h = _json_segment(header)
    p = _json_segment(payload)
    signing_input = f"{h}.{p}"
    s = _hs256_sign(signing_input, ACTIVE_SIGNING_SECRET)
    return f"{signing_input}.{s}"


def issue_pass_payload(user_id: str = "user_1004") -> Dict[str, Any]:
    return {
        "ok": True,
        "data": {
            "partnerPass": issue_partner_pass(user_id),
            "note": "Look at header.kid and payload.role",
        },
    }


def jwks_payload() -> Dict[str, Any]:
    return {
        "ok": True,
        "data": {
            "keys": [
                {"kid": ACTIVE_KID, "alg": "RS256", "status": "active"},
                {"kid": LEGACY_KID, "alg": "HS256", "status": "deprecated"},
            ],
            "note": "The verifier picks key by kid",
        },
    }


def _decode_jwt(token: str) -> Tuple[Dict[str, Any], Dict[str, Any], str, str]:
    parts = str(token or "").strip().split(".")
    if len(parts) != 3:
        raise ValueError("token must have 3 segments")
    h_raw, p_raw, sig = parts
    header = json.loads(_b64u_decode(h_raw).decode("utf-8"))
    payload = json.loads(_b64u_decode(p_raw).decode("utf-8"))
    return header, payload, f"{h_raw}.{p_raw}", sig


def _validate_common_claims(payload: Dict[str, Any]) -> Tuple[bool, str]:
    now = int(time.time())
    if payload.get("iss") != PASS_ISSUER:
        return False, "invalid issuer"
    if payload.get("aud") != PASS_AUDIENCE:
        return False, "invalid audience"
    exp = int(payload.get("exp", 0) or 0)
    if exp and exp < now:
        return False, "token expired"
    return True, ""


def verify_partner_pass(token: str) -> Tuple[bool, Dict[str, Any], Dict[str, Any], Dict[str, Any]]:
    try:
        header, payload, signing_input, signature = _decode_jwt(token)
    except Exception as exc:
        return False, {}, {}, {"code": "FORBIDDEN", "message": f"invalid partner pass ({exc})", "status": 403}

    kid = str(header.get("kid", "")).strip()
    if kid == ACTIVE_KID:
        expected = _hs256_sign(signing_input, ACTIVE_SIGNING_SECRET)
        if not hmac.compare_digest(signature, expected):
            return False, header, payload, {"code": "FORBIDDEN", "message": "invalid signature", "status": 403}
    elif kid == LEGACY_KID:
        # intentional vulnerability:
        # legacy compatibility path skips signature verification and trusts payload.
        pass
    else:
        return False, header, payload, {"code": "FORBIDDEN", "message": "unknown kid", "status": 403}

    ok, reason = _validate_common_claims(payload)
    if not ok:
        return False, header, payload, {"code": "FORBIDDEN", "message": reason, "status": 403}

    return True, header, payload, {}


def admin_audit_payload(partner_pass: str) -> Tuple[bool, Dict[str, Any]]:
    ok, _header, payload, err = verify_partner_pass(partner_pass)
    if not ok:
        return False, err

    role = str(payload.get("role", "user")).strip().lower()
    scope = str(payload.get("scope", "")).strip().lower()
    if role != "admin" and "admin" not in scope:
        return False, {"code": "FORBIDDEN", "message": "admin only", "status": 403}

    return True, {
        "ok": True,
        "data": {
            "status": "ok",
            "report": "internal audit exported",
            "flag": LEVEL4_2_FLAG,
        },
    }


def jwt_decode_pretty(token: str) -> Tuple[str, str, int]:
    try:
        header, payload, _signing_input, _sig = _decode_jwt(token)
    except Exception as exc:
        return "", f"jwt-decode failed: {exc}", 1
    lines = [
        "header:",
        json.dumps(header, ensure_ascii=False, indent=2),
        "payload:",
        json.dumps(payload, ensure_ascii=False, indent=2),
    ]
    return "\n".join(lines) + "\n", "", 0


def _json_response(payload: Dict[str, Any], status: int = 200) -> HttpResponse:
    return HttpResponse(
        status=status,
        headers={"content-type": "application/json"},
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
    if method == "GET" and path == "/api/v1/challenges/level4_2/actions/pass/issue":
        if not _is_auth_ok(headers, ctx):
            return _unauthorized()
        user_id = str(ctx.env.get("USER", "user_1004"))
        return _json_response(issue_pass_payload(user_id))

    if method == "GET" and path == "/api/v1/challenges/level4_2/actions/keys/jwks":
        if not _is_auth_ok(headers, ctx):
            return _unauthorized()
        return _json_response(jwks_payload())

    if method == "POST" and path == "/api/v1/challenges/level4_2/actions/admin/audit":
        if not _is_auth_ok(headers, ctx):
            return _unauthorized()
        pass_token = headers.get("x-partner-pass", "")
        ok, payload = admin_audit_payload(pass_token)
        if not ok:
            return _json_response({"ok": False, "error": {"code": payload["code"], "message": payload["message"]}}, payload["status"])
        return _json_response(payload)

    return _json_response({"ok": False, "error": {"code": "NOT_FOUND", "message": "route not found"}}, 404)


_SHELL = FakeShell(
    fs_tree={
        "/workspace": {
            "README.txt": "Level 4-2 key roulette lab\n",
            "tokens": {"notes.txt": "Inspect kid / alg / role / scope\n"},
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
        "base64",
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
    cmd = str(command or "").strip()
    if cmd.startswith("jwt-decode "):
        token = cmd[len("jwt-decode ") :].strip()
        return jwt_decode_pretty(token)
    if cmd in ("jwt-help", "jwt help"):
        return (
            "JWT helper:\n"
            "  jwt-decode <token>   decode header/payload\n"
            "Watch fields: kid, alg, role, scope, exp\n",
            "",
            0,
        )

    shell_state = session.setdefault("fakeShellState", {})
    level_state = shell_state.setdefault("level4_2", {"cwd": "/workspace"})
    ctx = ShellContext(
        env={
            "USER": str(session.get("userId", "user_1004")),
            "SESSION_TOKEN": str(session.get("token", "")),
            "HOME": "/workspace",
        },
        cwd=str(level_state.get("cwd", "/workspace")),
    )
    stdout, stderr, code = _SHELL.execute(cmd, ctx)
    level_state["cwd"] = ctx.cwd
    return stdout, stderr, code


def terminal_exec(command: str) -> Tuple[str, str, int]:
    cmd = str(command or "").strip()
    if cmd.startswith("jwt-decode "):
        token = cmd[len("jwt-decode ") :].strip()
        return jwt_decode_pretty(token)
    if cmd in ("jwt-help", "jwt help"):
        return (
            "JWT helper:\n"
            "  jwt-decode <token>   decode header/payload\n",
            "",
            0,
        )

    return _SHELL.execute(cmd, ShellContext(env={"USER": "guest", "HOME": "/workspace"}, cwd="/workspace"))
