from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import shlex
import time
from typing import Any, Dict, Tuple
from urllib.parse import parse_qs

from fakeshell import FakeShell, ShellContext
from fakeshell.http import HttpResponse
from levels.level4_1 import get_webhook_secret


LEVEL4_BOSS_FLAG = os.getenv("PURPLEDROID_LEVEL4_BOSS_FLAG", "FLAG{VAULT_OPENED_BY_TRUST_CHAIN_FAILURE}")
ASSET_FILENAME = "app.config.js"
ASSET_PATH = f"/api/v1/challenges/level4_boss/actions/public/assets/{ASSET_FILENAME}"
ACTIVE_KID = "pd-2026-rot2"
LEGACY_KID = "pd-2024-legacy"
ACTIVE_SIGNING_SECRET = os.getenv("PURPLEDROID_LEVEL4_BOSS_ACTIVE_SECRET", "pd_active_rs256_sim_2026")
LEGACY_SIGNING_SECRET = os.getenv("PURPLEDROID_LEVEL4_BOSS_LEGACY_SIGNING_SECRET", "purple_legacy_signing_key")
PASS_ISS = "PurpleDroid"
PASS_AUD = "partner-hub"
VAULT_TICKET = os.getenv("PURPLEDROID_LEVEL4_BOSS_TICKET", "VT-8F3D-2C9A-2026")
REQUIRED_STAMPS = int(os.getenv("PURPLEDROID_LEVEL4_BOSS_REQUIRED_STAMPS", "5"))
TIMESTAMP_WINDOW_SEC = int(os.getenv("PURPLEDROID_LEVEL4_BOSS_TS_WINDOW", "300"))

WEBHOOK_PATH = "/api/v1/challenges/level4_boss/actions/webhook/receive"
VAULT_STATUS_PATH = "/api/v1/challenges/level4_boss/actions/vault/status"
VAULT_CLAIM_PATH = "/api/v1/challenges/level4_boss/actions/vault/claim"
ADMIN_CONFIG_PATH = "/api/v1/challenges/level4_boss/actions/admin/config"
JWKS_PATH = "/api/v1/challenges/level4_boss/actions/keys/jwks"
PASS_ISSUE_PATH = "/api/v1/challenges/level4_boss/actions/pass/issue"
PUBLIC_STATUS_PATH = "/api/v1/challenges/level4_boss/actions/public/status"


def _b64u_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _b64u_decode(seg: str) -> bytes:
    padded = seg + ("=" * ((4 - len(seg) % 4) % 4))
    return base64.urlsafe_b64decode(padded.encode("utf-8"))


LEGACY_SIGNING_KEY_B64URL = _b64u_encode(LEGACY_SIGNING_SECRET.encode("utf-8"))


STATIC: Dict[str, Any] = {
    "id": "level4_boss",
    "level": 4,
    "title": "4-BOSS Partner Vault Heist",
    "summary": "공개 자산 유출 + kid 기반 검증 우회 + 웹훅 위조를 체인으로 연결해 파트너 금고를 열어라.",
    "description": (
        "미션: public/status -> asset 단서 확보 -> legacy PartnerPass 위조 -> admin/config 열람 -> "
        "서명된 webhook으로 스탬프 누적 -> vault/claim으로 최종 FLAG를 획득해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {"platform": "web", "text": "public/status의 assetHint를 따라 공개 자산 파일을 먼저 확인해."},
            {"platform": "all", "text": "asset에서 LEGACY_KID와 WEBHOOK_SECRET_B64 단서를 찾아."},
            {"platform": "all", "text": "jwks에서 legacy kid(kty=oct)와 k 값을 확인한 뒤 PartnerPass를 위조해."},
            {"platform": "all", "text": "admin/config는 BAD_PARTNER_PASS와 FORBIDDEN이 구분된다. 에러 타입을 읽어가며 맞춰."},
            {"platform": "all", "text": "webhook 스탬프는 accepted가 아니라 credited가 올라가야 한다."},
            {"platform": "all", "text": "스탬프 5개를 빠르게 쌓으려면 seq 1 5 | xargs -I{} ... 패턴을 활용해. event_id와 timestamp가 매번 달라야 credited 된다."},
            {
                "platform": "windows",
                "text": f'curl -s http://localhost:8000{PUBLIC_STATUS_PATH}',
            },
            {
                "platform": "windows",
                "text": f'curl -s http://localhost:8000{JWKS_PATH} -H "Authorization: Bearer <token>"',
            },
            {
                "platform": "windows",
                "text": "jwt-sign-hs256 pd-2024-legacy <legacy_secret> '{\"iss\":\"PurpleDroid\",\"aud\":\"partner-hub\",\"sub\":\"user_1004\",\"role\":\"admin\",\"iat\":<now>,\"exp\":<future>}'",
            },
            {
                "platform": "windows",
                "text": f'curl -s http://localhost:8000{ADMIN_CONFIG_PATH} -H "Authorization: Bearer <token>" -H "X-Partner-Pass: <jwt>"',
            },
            {
                "platform": "windows",
                "text": "sign-webhook <timestamp> '<raw_json>'",
            },
            {
                "platform": "windows",
                "text": f'curl -s -X POST http://localhost:8000{WEBHOOK_PATH} -H "X-Webhook-Timestamp: <ts>" -H "X-Webhook-Event-Id: EVT-9001" -H "X-Webhook-Signature: <sig>" -H "Content-Type: application/json" --data-raw "<json>"',
            },
            {
                "platform": "windows",
                "text": f'curl -s -X POST http://localhost:8000{VAULT_CLAIM_PATH} -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{{\\"ticket\\":\\"{VAULT_TICKET}\\"}}"',
            },
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 25000,
            "help": (
                "허용: curl, jwt-decode <token>, jwt-sign-hs256 <kid> <secret> '<payload_json>', "
                "sign-webhook <timestamp> '<raw_json>'"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "공개 자산에서 시크릿 제거, JWKS 대칭키 노출 금지, kid whitelist+alg pinning, "
            "role 서버 재검증, webhook replay 방어(event_id/timestamp/rate-limit)를 동시에 적용해라."
        ),
        "code": {},
    },
}


_STATE: Dict[str, Any] = {
    "stampCountByTicket": {VAULT_TICKET: 0},
    "processedEventIds": set(),
    "lastTimestampByTicket": {},
    "lastWarningByTicket": {VAULT_TICKET: None},
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL4_BOSS_FLAG


def judge_patch(_patched: list[str]) -> bool:
    return False


def _hs256_sign(signing_input: str, secret: str) -> str:
    digest = hmac.new(secret.encode("utf-8"), signing_input.encode("utf-8"), hashlib.sha256).digest()
    return _b64u_encode(digest)


def _json_segment(data: Dict[str, Any]) -> str:
    return _b64u_encode(json.dumps(data, separators=(",", ":"), ensure_ascii=False).encode("utf-8"))


def _sign_hs256_token(header: Dict[str, Any], payload: Dict[str, Any], secret: str) -> str:
    h = _json_segment(header)
    p = _json_segment(payload)
    signing_input = f"{h}.{p}"
    sig = _hs256_sign(signing_input, secret)
    return f"{signing_input}.{sig}"


def issue_partner_pass(user_id: str = "user_1004") -> str:
    now = int(time.time())
    header = {"alg": "RS256", "kid": ACTIVE_KID, "typ": "JWT"}
    payload = {
        "iss": PASS_ISS,
        "aud": PASS_AUD,
        "sub": user_id,
        "role": "user",
        "iat": now,
        "exp": now + 1800,
    }
    return _sign_hs256_token(header, payload, ACTIVE_SIGNING_SECRET)


def issue_pass_payload(user_id: str = "user_1004") -> Dict[str, Any]:
    return {
        "ok": True,
        "data": {
            "partnerPass": issue_partner_pass(user_id),
            "info": {
                "aud": PASS_AUD,
                "iss": PASS_ISS,
                "role": "user",
                "requiredRoleForAdminConfig": "admin",
            },
        },
    }


def jwks_payload() -> Dict[str, Any]:
    return {
        "ok": True,
        "data": {
            "keys": [
                {"kid": ACTIVE_KID, "kty": "RSA", "alg": "RS256", "use": "sig", "note": "active"},
                {
                    "kid": LEGACY_KID,
                    "kty": "oct",
                    "alg": "HS256",
                    "use": "sig",
                    "k": LEGACY_SIGNING_KEY_B64URL,
                    "note": "deprecated",
                },
            ],
            "note": "Verifier picks key by kid.",
        },
    }


def public_status_payload() -> Dict[str, Any]:
    return {
        "ok": True,
        "data": {
            "service": "PurpleDroid Partner Hub",
            "build": "web-prod",
            "assetHint": ASSET_PATH,
            "note": "Partner integration settings are shipped in build artifacts.",
        },
    }


def public_asset_source() -> str:
    webhook_secret_b64 = base64.b64encode(get_webhook_secret().encode("utf-8")).decode("utf-8")
    return (
        "/* PurpleDroid Partner Hub app config */\n"
        'export const PARTNER_PASS_ACTIVE_KID = "pd-2026-rot2";\n'
        f'export const PARTNER_PASS_LEGACY_KID = "{LEGACY_KID}";\n'
        "\n"
        "/* webhook HMAC signing — DO NOT SHIP */\n"
        'export const WEBHOOK_SECRET_TEST = "whsec_test_legacy_mock";\n'
        'export const WEBHOOK_SECRET_DECOY = "whsec_decoy_unused";\n'
        f'export const WEBHOOK_SECRET_B64 = "{webhook_secret_b64}";  // base64(webhook HMAC secret)\n'
        "\n"
        "// NOTE: JWT signing key is NOT here — check JWKS endpoint (keys[].k for legacy kid)\n"
        "// TODO: move all secrets to server-side vault\n"
    )


def _decode_jwt(token: str) -> Tuple[Dict[str, Any], Dict[str, Any], str, str]:
    parts = str(token or "").strip().split(".")
    if len(parts) != 3:
        raise ValueError("token must have 3 segments")
    h_raw, p_raw, sig = parts
    header = json.loads(_b64u_decode(h_raw).decode("utf-8"))
    payload = json.loads(_b64u_decode(p_raw).decode("utf-8"))
    return header, payload, f"{h_raw}.{p_raw}", sig


def _validate_claims(payload: Dict[str, Any]) -> Tuple[bool, str]:
    now = int(time.time())
    if payload.get("iss") != PASS_ISS:
        return False, "invalid issuer"
    if payload.get("aud") != PASS_AUD:
        return False, "invalid audience"
    exp = int(payload.get("exp", 0) or 0)
    if exp and exp < now:
        return False, "token expired"
    return True, ""


def _get_legacy_secret_from_jwks() -> str:
    return _b64u_decode(LEGACY_SIGNING_KEY_B64URL).decode("utf-8")


def verify_partner_pass(token: str) -> Tuple[bool, Dict[str, Any], Dict[str, Any], Dict[str, Any]]:
    try:
        header, payload, signing_input, signature = _decode_jwt(token)
    except Exception as exc:
        return False, {}, {}, {"code": "BAD_PARTNER_PASS", "message": f"token malformed ({exc})", "status": 401}

    kid = str(header.get("kid", "")).strip()
    if kid == ACTIVE_KID:
        expected = _hs256_sign(signing_input, ACTIVE_SIGNING_SECRET)
    elif kid == LEGACY_KID:
        expected = _hs256_sign(signing_input, _get_legacy_secret_from_jwks())
    else:
        return False, header, payload, {"code": "BAD_PARTNER_PASS", "message": "unknown kid", "status": 401}

    if not hmac.compare_digest(signature, expected):
        return False, header, payload, {"code": "BAD_PARTNER_PASS", "message": "signature invalid", "status": 401}

    ok_claims, reason = _validate_claims(payload)
    if not ok_claims:
        return False, header, payload, {"code": "BAD_PARTNER_PASS", "message": reason, "status": 401}

    if str(payload.get("role", "user")).strip().lower() != "admin":
        return False, header, payload, {"code": "FORBIDDEN", "message": "admin only", "status": 403}

    return True, header, payload, {}


def admin_config_payload(partner_pass: str) -> Tuple[bool, Dict[str, Any]]:
    ok, _header, _payload, err = verify_partner_pass(partner_pass)
    if not ok:
        return False, {"ok": False, "error": {"code": err["code"], "message": err["message"]}, "_status": err["status"]}

    return True, {
        "ok": True,
        "data": {
            "env": {"build": "prod", "region": "KR"},
            "partner": {
                "features": {
                    "vault": {
                        "enabled": True,
                        "policy": {"requiredStamps": REQUIRED_STAMPS},
                        "paths": {
                            "webhookReceive": WEBHOOK_PATH,
                            "vaultStatus": VAULT_STATUS_PATH,
                            "vaultClaim": VAULT_CLAIM_PATH,
                        },
                        "ticket": VAULT_TICKET,
                        "webhook": {
                            "headers": {
                                "timestamp": "X-Webhook-Timestamp",
                                "signature": "X-Webhook-Signature",
                                "eventId": "X-Webhook-Event-Id",
                            },
                            "signatureFormat": "sha256=<hex>",
                            "signingString": "<timestamp>.<raw_body>",
                        },
                    }
                }
            },
        },
    }


def _sign_webhook(timestamp: str, raw_body: str) -> str:
    signing = f"{timestamp}.{raw_body}"
    hexd = hmac.new(get_webhook_secret().encode("utf-8"), signing.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"sha256={hexd}"


def webhook_receive_payload(
    timestamp: str | None,
    event_id: str | None,
    signature: str | None,
    raw_body: str,
    now_ts: int | None = None,
) -> Tuple[int, Dict[str, Any]]:
    now = int(now_ts or time.time())
    ts_text = str(timestamp or "").strip()
    event_text = str(event_id or "").strip()
    sig_text = str(signature or "").strip()

    if not ts_text or not event_text or not sig_text:
        return 400, {"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "required webhook headers missing"}}

    try:
        ts_int = int(ts_text)
    except Exception:
        return 400, {"ok": False, "error": {"code": "STALE_WEBHOOK", "message": "timestamp out of window"}}
    if abs(now - ts_int) > TIMESTAMP_WINDOW_SEC:
        return 401, {"ok": False, "error": {"code": "STALE_WEBHOOK", "message": "timestamp out of window"}}

    expected = _sign_webhook(ts_text, raw_body)
    if not hmac.compare_digest(sig_text, expected):
        return 401, {"ok": False, "error": {"code": "BAD_SIGNATURE", "message": "signature mismatch"}}

    try:
        body = json.loads(raw_body or "{}")
    except Exception:
        return 400, {"ok": False, "error": {"code": "BAD_JSON", "message": "invalid json body"}}

    ticket = str(body.get("ticket", "")).strip()
    event_type = str(body.get("type", "")).strip()
    stamp = str(body.get("stamp", "")).strip().lower()
    if ticket != VAULT_TICKET or event_type != "vault.stamp" or stamp != "delivered":
        return 200, {
            "ok": True,
            "data": {
                "accepted": False,
                "credited": False,
                "stampCount": _STATE["stampCountByTicket"].get(VAULT_TICKET, 0),
                "target": REQUIRED_STAMPS,
                "warnings": ["IGNORED_EVENT"],
            },
        }

    warnings = []
    if event_text in _STATE["processedEventIds"]:
        warnings.append("DUPLICATE_EVENT_ID")
        _STATE["lastWarningByTicket"][ticket] = "DUPLICATE_EVENT_ID"
        return 200, {
            "ok": True,
            "data": {
                "accepted": True,
                "credited": False,
                "stampCount": _STATE["stampCountByTicket"].get(ticket, 0),
                "target": REQUIRED_STAMPS,
                "warnings": warnings,
            },
        }

    last_ts = _STATE["lastTimestampByTicket"].get(ticket)
    if last_ts == ts_int:
        warnings.append("SUSPICIOUS_SAME_TIMESTAMP")
        _STATE["processedEventIds"].add(event_text)
        _STATE["lastWarningByTicket"][ticket] = "SUSPICIOUS_SAME_TIMESTAMP"
        return 200, {
            "ok": True,
            "data": {
                "accepted": True,
                "credited": False,
                "stampCount": _STATE["stampCountByTicket"].get(ticket, 0),
                "target": REQUIRED_STAMPS,
                "warnings": warnings,
            },
        }

    _STATE["processedEventIds"].add(event_text)
    _STATE["lastTimestampByTicket"][ticket] = ts_int
    _STATE["stampCountByTicket"][ticket] = _STATE["stampCountByTicket"].get(ticket, 0) + 1
    _STATE["lastWarningByTicket"][ticket] = None
    return 200, {
        "ok": True,
        "data": {
            "accepted": True,
            "credited": True,
            "stampCount": _STATE["stampCountByTicket"][ticket],
            "target": REQUIRED_STAMPS,
            "warnings": warnings,
        },
    }


def vault_status_payload(ticket: str) -> Tuple[bool, Dict[str, Any]]:
    t = str(ticket or "").strip()
    if t != VAULT_TICKET:
        return False, {"ok": False, "error": {"code": "BAD_TICKET", "message": "unknown vault ticket"}, "_status": 404}
    return True, {
        "ok": True,
        "data": {
            "ticket": t,
            "stampCount": _STATE["stampCountByTicket"].get(t, 0),
            "target": REQUIRED_STAMPS,
            "lastWarning": _STATE["lastWarningByTicket"].get(t),
        },
    }


def vault_claim_payload(ticket: str) -> Tuple[bool, Dict[str, Any]]:
    t = str(ticket or "").strip()
    if t != VAULT_TICKET:
        return False, {"ok": False, "error": {"code": "BAD_TICKET", "message": "invalid ticket"}, "_status": 403}
    count = _STATE["stampCountByTicket"].get(t, 0)
    if count < REQUIRED_STAMPS:
        return False, {"ok": False, "error": {"code": "NOT_READY", "message": "need more stamps"}, "_status": 409}
    return True, {"ok": True, "data": {"status": "unlocked", "flag": LEVEL4_BOSS_FLAG}}


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
    clean = {k: v for k, v in payload.items() if not str(k).startswith("_")}
    return HttpResponse(
        status=status,
        headers={"content-type": "application/json"},
        body=json.dumps(clean, ensure_ascii=False, separators=(",", ":")),
    )


def _text_response(text: str, content_type: str = "text/plain", status: int = 200) -> HttpResponse:
    return HttpResponse(status=status, headers={"content-type": content_type}, body=text)


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
    if method == "GET" and path == PUBLIC_STATUS_PATH:
        return _json_response(public_status_payload())

    if method == "GET" and path == ASSET_PATH:
        return _text_response(public_asset_source(), "application/javascript")

    if method == "GET" and path == JWKS_PATH:
        if not _is_auth_ok(headers, ctx):
            return _unauthorized()
        return _json_response(jwks_payload())

    if method == "GET" and path == PASS_ISSUE_PATH:
        if not _is_auth_ok(headers, ctx):
            return _unauthorized()
        return _json_response(issue_pass_payload(str(ctx.env.get("USER", "user_1004"))))

    if method == "GET" and path == ADMIN_CONFIG_PATH:
        if not _is_auth_ok(headers, ctx):
            return _unauthorized()
        ok_cfg, payload = admin_config_payload(headers.get("x-partner-pass", ""))
        status = int(payload.get("_status", 200))
        return _json_response(payload, status if not ok_cfg else 200)

    if method == "POST" and path == WEBHOOK_PATH:
        status, payload = webhook_receive_payload(
            headers.get("x-webhook-timestamp"),
            headers.get("x-webhook-event-id"),
            headers.get("x-webhook-signature"),
            body,
            int(time.time()),
        )
        return _json_response(payload, status)

    if method == "GET" and path == VAULT_STATUS_PATH:
        if not _is_auth_ok(headers, ctx):
            return _unauthorized()
        q = parse_qs(query or "")
        ticket = (q.get("ticket") or [""])[0]
        ok_status, payload = vault_status_payload(ticket)
        status_code = int(payload.get("_status", 200))
        return _json_response(payload, status_code if not ok_status else 200)

    if method == "POST" and path == VAULT_CLAIM_PATH:
        if not _is_auth_ok(headers, ctx):
            return _unauthorized()
        try:
            parsed = json.loads(body or "{}")
        except Exception:
            return _json_response({"ok": False, "error": {"code": "BAD_JSON", "message": "invalid json body"}}, 400)
        ok_claim, payload = vault_claim_payload(str(parsed.get("ticket", "")))
        status_code = int(payload.get("_status", 200))
        return _json_response(payload, status_code if not ok_claim else 200)

    return _json_response({"ok": False, "error": {"code": "NOT_FOUND", "message": "route not found"}}, 404)


_SHELL = FakeShell(
    fs_tree={
        "/workspace": {
            "README.txt": "Level 4 boss partner vault heist\n",
            "samples": {
                "vault_stamp.json": '{"type":"vault.stamp","ticket":"VT-8F3D-2C9A-2026","stamp":"delivered","meta":{"source":"partner-webhook"}}\n'
            },
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

    if cmd.startswith("jwt-sign-hs256 "):
        try:
            parts = shlex.split(cmd)
            if len(parts) < 4:
                return "", "usage: jwt-sign-hs256 <kid> <secret> '<payload_json>'", 1
            kid = parts[1]
            secret = parts[2]
            payload = json.loads(parts[3])
            token = _sign_hs256_token({"alg": "HS256", "kid": kid, "typ": "JWT"}, payload, secret)
            return f"{token}\n", "", 0
        except Exception as exc:
            return "", f"jwt-sign-hs256 failed: {exc}", 1

    if cmd.startswith("sign-webhook "):
        try:
            parts = shlex.split(cmd)
            if len(parts) < 3:
                return "", "usage: sign-webhook <timestamp> '<raw_json>'", 1
            sig = _sign_webhook(parts[1], parts[2])
            return f"{sig}\n", "", 0
        except Exception as exc:
            return "", f"sign-webhook failed: {exc}", 1

    shell_state = session.setdefault("fakeShellState", {})
    level_state = shell_state.setdefault("level4_boss", {"cwd": "/workspace"})
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
    if cmd.startswith("sign-webhook "):
        try:
            parts = shlex.split(cmd)
            if len(parts) < 3:
                return "", "usage: sign-webhook <timestamp> '<raw_json>'", 1
            return f"{_sign_webhook(parts[1], parts[2])}\n", "", 0
        except Exception as exc:
            return "", f"sign-webhook failed: {exc}", 1
    return _SHELL.execute(cmd, ShellContext(env={"USER": "guest", "HOME": "/workspace"}, cwd="/workspace"))

