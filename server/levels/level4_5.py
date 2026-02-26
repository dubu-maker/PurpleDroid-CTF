from __future__ import annotations

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


LEVEL4_5_FLAG = os.getenv("PURPLEDROID_LEVEL4_5_FLAG", "FLAG{SIGNED_WEBHOOKS_STILL_FAIL_IF_SECRET_LEAKS}")
TIMESTAMP_WINDOW_SEC = 300


STATIC: Dict[str, Any] = {
    "id": "level4_5",
    "level": 4,
    "title": "4-5 Ghost Webhook",
    "summary": "서명 검증이 있어도 시크릿이 유출되면 웹훅 위조가 가능해진다.",
    "description": (
        "미션: webhook spec을 확인하고 4-1에서 유출된 PARTNER_WEBHOOK_SECRET으로 서명을 계산해 "
        "배송 완료 이벤트를 위조 전송한 뒤, track 응답에서 FLAG를 찾아 제출해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {"platform": "all", "text": "웹훅은 사용자 세션 API가 아니라 서버 입력 채널이다. 먼저 /webhook/spec을 확인해."},
            {"platform": "all", "text": "signing string은 '<timestamp>.<raw_body>' 형태다."},
            {"platform": "all", "text": "시크릿은 4-1 공개 번들에서 유출될 수 있다."},
            {"platform": "all", "text": "웹훅 성공 뒤에는 /track?parcel_id=PD-1004 결과를 다시 조회해 상태 변화를 확인해."},
            {
                "platform": "windows",
                "text": 'curl -s http://localhost:8000/api/v1/challenges/level4_5/actions/webhook/spec',
            },
            {
                "platform": "windows",
                "text": 'sign-webhook <timestamp> "{\\"type\\":\\"parcel.delivered\\",\\"parcel_id\\":\\"PD-1004\\",\\"delivered_at\\":1739999999,\\"meta\\":{\\"courier\\":\\"PurpleDroid\\"}}"',
            },
            {
                "platform": "windows",
                "text": 'curl -s -X POST http://localhost:8000/api/v1/challenges/level4_5/actions/webhook/receive -H "X-Webhook-Timestamp: <ts>" -H "X-Webhook-Event-Id: EVT-9001" -H "X-Webhook-Signature: <sig>" -H "Content-Type: application/json" --data-raw "{\\"type\\":\\"parcel.delivered\\",\\"parcel_id\\":\\"PD-1004\\",\\"delivered_at\\":1739999999,\\"meta\\":{\\"courier\\":\\"PurpleDroid\\"}}"',
            },
            {
                "platform": "windows",
                "text": 'curl -s "http://localhost:8000/api/v1/challenges/level4_5/actions/track?parcel_id=PD-1004" -H "Authorization: Bearer <token>"',
            },
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 18000,
            "help": (
                "허용: curl .../actions/webhook/spec, "
                "curl -X POST .../actions/webhook/receive -H 'X-Webhook-Timestamp: <ts>' "
                "-H 'X-Webhook-Event-Id: EVT-...' -H 'X-Webhook-Signature: sha256=<hex>' -H 'Content-Type: application/json' --data-raw '<json>', "
                "curl .../actions/track?parcel_id=PD-1004 -H 'Authorization: Bearer <token>', "
                "sign-webhook <timestamp> '<raw_json>', hmacsha256 <secret> '<message>'"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "웹훅 시크릿을 클라이언트 배포물에서 제거하고 서버 비밀 저장소로 이동해라. "
            "timestamp window + event_id 재사용 차단으로 replay를 막고, "
            "웹훅 처리 로깅/탐지로 비정상 이벤트를 추적해야 한다."
        ),
        "code": {},
    },
}


# global webhook state (webhook receiver is intentionally sessionless)
_STATE: Dict[str, Any] = {
    "processedEventIds": set(),
    "parcelStatus": {
        "PD-1004": {"status": "in_transit", "source": "system", "receipt": None},
    },
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL4_5_FLAG


def judge_patch(_patched: list[str]) -> bool:
    return False


def webhook_spec_payload() -> Dict[str, Any]:
    return {
        "ok": True,
        "data": {
            "headers": {
                "timestamp": "X-Webhook-Timestamp",
                "signature": "X-Webhook-Signature",
                "eventId": "X-Webhook-Event-Id",
            },
            "signature": {
                "alg": "HMAC-SHA256",
                "format": "sha256=<hex>",
                "signingString": "<timestamp>.<raw_body>",
            },
            "timestampWindowSec": TIMESTAMP_WINDOW_SEC,
            "sampleBody": {
                "type": "parcel.delivered",
                "parcel_id": "PD-1004",
                "delivered_at": 1739999999,
                "meta": {"courier": "PurpleDroid"},
            },
        },
    }


def _hmac_sha256_hex(secret: str, message: str) -> str:
    return hmac.new(secret.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()


def compute_signature(secret: str, timestamp: str, raw_body: str) -> str:
    signing = f"{timestamp}.{raw_body}"
    return f"sha256={_hmac_sha256_hex(secret, signing)}"


def _parse_timestamp(ts: str, now_ts: int) -> Tuple[bool, int]:
    try:
        parsed = int(str(ts).strip())
    except Exception:
        return False, 0
    return abs(now_ts - parsed) <= TIMESTAMP_WINDOW_SEC, parsed


def receive_webhook_payload(
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

    in_window, _ = _parse_timestamp(ts_text, now)
    if not in_window:
        return 401, {"ok": False, "error": {"code": "STALE_WEBHOOK", "message": "timestamp out of window"}}

    expected = compute_signature(get_webhook_secret(), ts_text, raw_body)
    if not hmac.compare_digest(sig_text, expected):
        return 401, {"ok": False, "error": {"code": "BAD_SIGNATURE", "message": "signature mismatch"}}

    try:
        body = json.loads(raw_body or "{}")
    except Exception:
        return 400, {"ok": False, "error": {"code": "BAD_JSON", "message": "invalid json body"}}

    if event_text in _STATE["processedEventIds"]:
        return 200, {"ok": True, "data": {"accepted": True, "credited": False, "duplicate": True}}

    _STATE["processedEventIds"].add(event_text)

    event_type = str(body.get("type", "")).strip()
    parcel_id = str(body.get("parcel_id", "")).strip()
    if event_type == "parcel.delivered" and parcel_id:
        _STATE["parcelStatus"][parcel_id] = {
            "status": "delivered",
            "source": "webhook",
            "receipt": event_text,
        }

    return 200, {"ok": True, "data": {"accepted": True, "credited": True}}


def track_payload(parcel_id: str) -> Dict[str, Any]:
    pid = str(parcel_id or "").strip() or "PD-1004"
    st = _STATE["parcelStatus"].get(pid, {"status": "unknown", "source": "none", "receipt": None})
    data = {
        "parcel_id": pid,
        "status": st["status"],
        "source": st["source"],
        "meta": {"receipt": st.get("receipt")},
    }
    if st["status"] == "delivered" and st["source"] == "webhook":
        data["meta"]["flag"] = LEVEL4_5_FLAG
    return {"ok": True, "data": data}


def sign_webhook_command(timestamp: str, raw_body: str) -> Tuple[str, str, int]:
    sig = compute_signature(get_webhook_secret(), timestamp, raw_body)
    return f"{sig}\n", "", 0


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
    query: str,
    headers: Dict[str, str],
    body: str,
    ctx: ShellContext,
) -> HttpResponse:
    if method == "GET" and path == "/api/v1/challenges/level4_5/actions/webhook/spec":
        return _json_response(webhook_spec_payload())

    if method == "POST" and path == "/api/v1/challenges/level4_5/actions/webhook/receive":
        status, payload = receive_webhook_payload(
            headers.get("x-webhook-timestamp"),
            headers.get("x-webhook-event-id"),
            headers.get("x-webhook-signature"),
            body,
            int(time.time()),
        )
        return _json_response(payload, status)

    if method == "GET" and path == "/api/v1/challenges/level4_5/actions/track":
        if not _is_auth_ok(headers, ctx):
            return _unauthorized()
        q = parse_qs(query or "")
        parcel_id = (q.get("parcel_id") or ["PD-1004"])[0]
        return _json_response(track_payload(parcel_id))

    return _json_response({"ok": False, "error": {"code": "NOT_FOUND", "message": "route not found"}}, 404)


_SHELL = FakeShell(
    fs_tree={
        "/workspace": {
            "README.txt": "Level 4-5 ghost webhook lab\n",
            "samples": {"webhook_body.json": '{"type":"parcel.delivered","parcel_id":"PD-1004","delivered_at":1739999999,"meta":{"courier":"PurpleDroid"}}\n'},
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

    if cmd.startswith("sign-webhook "):
        try:
            parts = shlex.split(cmd)
            if len(parts) < 3:
                return "", "usage: sign-webhook <timestamp> '<raw_json>'", 1
            timestamp = parts[1]
            raw_body = parts[2]
            return sign_webhook_command(timestamp, raw_body)
        except Exception as exc:
            return "", f"sign-webhook error: {exc}", 1

    if cmd.startswith("hmacsha256 "):
        try:
            parts = shlex.split(cmd)
            if len(parts) < 3:
                return "", "usage: hmacsha256 <secret> '<message>'", 1
            secret = parts[1]
            message = parts[2]
            return f"{_hmac_sha256_hex(secret, message)}\n", "", 0
        except Exception as exc:
            return "", f"hmacsha256 error: {exc}", 1

    shell_state = session.setdefault("fakeShellState", {})
    level_state = shell_state.setdefault("level4_5", {"cwd": "/workspace"})
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
    if cmd.startswith("sign-webhook "):
        try:
            parts = shlex.split(cmd)
            if len(parts) < 3:
                return "", "usage: sign-webhook <timestamp> '<raw_json>'", 1
            return sign_webhook_command(parts[1], parts[2])
        except Exception as exc:
            return "", f"sign-webhook error: {exc}", 1
    if cmd.startswith("hmacsha256 "):
        try:
            parts = shlex.split(cmd)
            if len(parts) < 3:
                return "", "usage: hmacsha256 <secret> '<message>'", 1
            return f"{_hmac_sha256_hex(parts[1], parts[2])}\n", "", 0
        except Exception as exc:
            return "", f"hmacsha256 error: {exc}", 1
    return _SHELL.execute(cmd, ShellContext(env={"USER": "guest", "HOME": "/workspace"}, cwd="/workspace"))
