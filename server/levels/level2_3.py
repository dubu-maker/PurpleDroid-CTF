from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import shlex
from typing import Any, Dict, Tuple


LEVEL2_3_FLAG = os.getenv("PURPLEDROID_LEVEL2_3_FLAG", "FLAG{TOKEN_IS_NOT_ENCRYPTED}")
LEVEL2_3_SECRET = os.getenv("PURPLEDROID_LEVEL2_3_SECRET", "purpledroid-level2-3-dev-secret")
DEFAULT_PARCEL_ID = "PD-2026-0001"


STATIC: Dict[str, Any] = {
    "id": "level2_3",
    "level": 2,
    "title": "2-3 Decode the Dispatch Token",
    "summary": "발송 토큰을 디코딩하면 숨겨진 값이 보인다.",
    "description": (
        "미션: dispatch 요청 응답에서 dispatch_token을 찾고, "
        "디코딩해서 payload 안의 FLAG를 제출해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {
                "platform": "web",
                "text": "F12 Network에서 /actions/dispatch 응답 body의 dispatch_token을 확인해.",
            },
            {
                "platform": "windows",
                "text": 'curl.exe -v -X POST http://localhost:8000/api/v1/challenges/level2_3/actions/dispatch --data "{\\"parcel_id\\":\\"PD-2026-0001\\"}"',
            },
            {
                "platform": "unix",
                "text": 'curl -v -X POST http://localhost:8000/api/v1/challenges/level2_3/actions/dispatch --data \'{"parcel_id":"PD-2026-0001"}\'',
            },
            {"platform": "all", "text": "dispatch_token에는 점(.)이 2개 있다. jwt/base64url 디코딩을 시도해."},
            {"platform": "app", "text": "터미널에서 jwt-decode <dispatch_token> 명령으로 payload를 볼 수 있어."},
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 8000,
            "help": (
                "허용: curl -v -X POST http://localhost:8000/api/v1/challenges/level2_3/actions/dispatch --data "
                "'{\"parcel_id\":\"PD-2026-0001\"}', jwt-decode <token>"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": "JWT payload에는 민감정보를 넣지 말 것. 토큰에는 최소 식별 정보만 담아라.",
        "code": {},
    },
}


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _b64url_decode(raw: str) -> bytes:
    padded = raw + ("=" * ((4 - (len(raw) % 4)) % 4))
    return base64.urlsafe_b64decode(padded.encode("utf-8"))


def issue_dispatch_token(parcel_id: str) -> str:
    pid = (parcel_id or DEFAULT_PARCEL_ID).strip() or DEFAULT_PARCEL_ID
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {"parcel_id": pid, "tier": "standard", "note": LEVEL2_3_FLAG}

    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(LEVEL2_3_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    sig_b64 = _b64url_encode(signature)
    return f"{header_b64}.{payload_b64}.{sig_b64}"


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL2_3_FLAG


def judge_patch(_patched: list[str]) -> bool:
    return False


def _extract_parcel_id_from_command(cmdline: str) -> str:
    parts = shlex.split(cmdline)
    data_key = "--data" if "--data" in parts else ("--data-raw" if "--data-raw" in parts else None)
    if not data_key:
        return DEFAULT_PARCEL_ID
    idx = parts.index(data_key)
    if idx + 1 >= len(parts):
        return DEFAULT_PARCEL_ID
    raw_json = parts[idx + 1]
    payload = json.loads(raw_json)
    return str(payload.get("parcel_id") or DEFAULT_PARCEL_ID)


def _decode_jwt_payload(token: str) -> Dict[str, Any]:
    chunks = token.split(".")
    if len(chunks) != 3:
        raise ValueError("JWT format error: header.payload.signature 형식이어야 해.")
    payload_raw = _b64url_decode(chunks[1]).decode("utf-8")
    return json.loads(payload_raw)


def terminal_exec(command: str) -> Tuple[str, str, int]:
    cmdline = command.strip()
    if not cmdline:
        return "", "", 0

    if cmdline in ("help", "?", "h"):
        return (
            "Allowed:\n"
            "  curl -v -X POST http://localhost:8000/api/v1/challenges/level2_3/actions/dispatch --data '{\"parcel_id\":\"PD-2026-0001\"}'\n"
            "  curl.exe -v -X POST http://localhost:8000/api/v1/challenges/level2_3/actions/dispatch --data \"{\\\"parcel_id\\\":\\\"PD-2026-0001\\\"}\"\n"
            "  jwt-decode <dispatch_token>\n"
        ), "", 0

    if cmdline.startswith("curl.exe "):
        cmdline = "curl " + cmdline[len("curl.exe ") :]

    if cmdline.startswith("jwt-decode "):
        token = cmdline[len("jwt-decode ") :].strip()
        if not token:
            return "", "usage: jwt-decode <token>", 1
        try:
            payload = _decode_jwt_payload(token)
            pretty = json.dumps(payload, ensure_ascii=False, indent=2)
            return f"Decoded payload:\n{pretty}\n", "", 0
        except Exception as exc:
            return "", f"decode error: {exc}", 1

    if cmdline.startswith("curl "):
        if "actions/dispatch" not in cmdline:
            return "", "Hint: /actions/dispatch 엔드포인트를 호출해봐.", 1
        try:
            parcel_id = _extract_parcel_id_from_command(cmdline)
        except Exception:
            parcel_id = DEFAULT_PARCEL_ID
        token = issue_dispatch_token(parcel_id)
        body = json.dumps({"status": "ok", "dispatch_token": token}, separators=(",", ":"))
        if "-v" in cmdline:
            output = (
                "* Trying 127.0.0.1:8000...\n"
                "* Connected to localhost (127.0.0.1) port 8000 (#0)\n"
                "> POST /api/v1/challenges/level2_3/actions/dispatch HTTP/1.1\n"
                "> Host: localhost:8000\n"
                "> User-Agent: curl/7.81.0\n"
                "> Accept: */*\n"
                ">\n"
                "< HTTP/1.1 200 OK\n"
                "< server: uvicorn\n"
                "< content-type: application/json\n"
                "<\n"
                f"{body}\n"
            )
            return output, "", 0
        return f"{body}\n", "", 0

    return "", f"command not found: {cmdline}", 127
