from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import shlex
from typing import Any, Dict, Optional, Tuple


LEVEL2_5_FLAG = os.getenv("PURPLEDROID_LEVEL2_5_FLAG", "FLAG{SEALED_WAREHOUSE_BREACHED}")
LEVEL2_5_SECRET = os.getenv("PURPLEDROID_LEVEL2_5_SECRET", "purpledroid-level2-5-boss-secret")
DEFAULT_PARCEL_ID = "PD-2026-0001"
WAREHOUSE_PATH = "sealed-warehouse-7f3"
INTEGRITY_BYPASS_VALUE = "devtools-hooked"


STATIC: Dict[str, Any] = {
    "id": "level2_5",
    "level": 2,
    "title": "2-5 Uncrackable Web: Sealed Warehouse",
    "summary": "클릭만으로는 열리지 않는 봉인 창고를 우회해라.",
    "description": (
        "미션: 버튼 클릭으로는 실패한다. dispatch_token을 확보하고, "
        "요청을 직접 조합해 봉인 창고를 열어 FLAG를 획득해라."
    ),
    "status": {"attack": "locked", "defense": "locked"},
    "attack": {
        "hints": [
            {"platform": "all", "text": "이 보스는 2-1~2-4 Attack을 먼저 해결해야 열린다."},
            {"platform": "all", "text": "버튼 클릭 요청은 항상 막힌다. Network 요청을 복제해 직접 호출해봐."},
            {"platform": "all", "text": "먼저 /actions/dispatch 응답의 dispatch_token을 확보해."},
            {"platform": "all", "text": "토큰 payload의 warehouse_path와 tier 조건을 확인해."},
            {"platform": "all", "text": "X-Integrity-Bypass 헤더와 vip/admin 권한 흐름을 점검해."},
            {
                "platform": "windows",
                "text": 'curl.exe -v -X POST http://localhost:8000/api/v1/challenges/level2_5/actions/open -H "Authorization: Bearer <token>" -H "X-Integrity-Bypass: devtools-hooked" -H "Content-Type: application/json" --data "{\\"warehouse_path\\":\\"sealed-warehouse-7f3\\",\\"tier\\":\\"vip\\"}"',
            },
            {
                "platform": "unix",
                "text": "curl -v -X POST http://localhost:8000/api/v1/challenges/level2_5/actions/open -H 'Authorization: Bearer <token>' -H 'X-Integrity-Bypass: devtools-hooked' -H 'Content-Type: application/json' --data '{\"warehouse_path\":\"sealed-warehouse-7f3\",\"tier\":\"vip\"}'",
            },
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 12000,
            "help": (
                "허용: curl .../level2_5/actions/dispatch, jwt-decode <token>, "
                "jwt-forge-none <token>, curl .../level2_5/actions/open ..."
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "클라이언트 검증은 UX일 뿐 보안이 아니다. JWT verify 강제, "
            "alg 화이트리스트 고정, 권한판단은 서버 정책/DB에서 수행하라."
        ),
        "code": {},
    },
}


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _b64url_decode(raw: str) -> bytes:
    padded = raw + ("=" * ((4 - (len(raw) % 4)) % 4))
    return base64.urlsafe_b64decode(padded.encode("utf-8"))


def issue_boss_token(parcel_id: str = DEFAULT_PARCEL_ID) -> str:
    pid = (parcel_id or DEFAULT_PARCEL_ID).strip() or DEFAULT_PARCEL_ID
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "parcel_id": pid,
        "tier": "standard",
        "role": "user",
        "warehouse_path": WAREHOUSE_PATH,
        "gate": "integrity-check-v2",
    }
    h = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    p = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{h}.{p}".encode("utf-8")
    sig = hmac.new(LEVEL2_5_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    s = _b64url_encode(sig)
    return f"{h}.{p}.{s}"


def decode_jwt_unsafe(token: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    chunks = token.split(".")
    if len(chunks) != 3:
        raise ValueError("JWT format error: header.payload.signature")
    header = json.loads(_b64url_decode(chunks[0]).decode("utf-8"))
    payload = json.loads(_b64url_decode(chunks[1]).decode("utf-8"))
    # 의도적 취약점: signature 검증 생략
    return header, payload


def forge_none_token(base_token: str) -> str:
    _, payload = decode_jwt_unsafe(base_token)
    payload["tier"] = "vip"
    payload["role"] = "admin"
    h = _b64url_encode(json.dumps({"alg": "none", "typ": "JWT"}, separators=(",", ":")).encode("utf-8"))
    p = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    return f"{h}.{p}."


def evaluate_open_request(
    token: str,
    warehouse_path: str,
    tier: Optional[str],
    integrity_bypass: Optional[str],
) -> Tuple[bool, Dict[str, Any]]:
    header, payload = decode_jwt_unsafe(token)
    required_path = str(payload.get("warehouse_path", "")).strip()
    effective_tier = (tier or payload.get("tier", "") or "").strip().lower()
    role = str(payload.get("role", "")).strip().lower()
    integrity_ok = (integrity_bypass or "").strip() == INTEGRITY_BYPASS_VALUE

    if not required_path or warehouse_path.strip() != required_path:
        return False, {"reason": "path_mismatch", "header": header, "payload": payload}
    if not integrity_ok:
        return False, {"reason": "integrity_blocked", "header": header, "payload": payload}
    if effective_tier != "vip" and role != "admin":
        return False, {"reason": "vip_required", "header": header, "payload": payload}
    return True, {"reason": "ok", "header": header, "payload": payload}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL2_5_FLAG


def judge_patch(_patched: list[str]) -> bool:
    return False


def _extract_header_value(parts: list[str], header_name: str) -> str:
    target = header_name.lower()
    for i, part in enumerate(parts):
        if part not in ("-H", "--header"):
            continue
        if i + 1 >= len(parts):
            continue
        h = parts[i + 1]
        if ":" not in h:
            continue
        k, v = h.split(":", 1)
        if k.strip().lower() == target:
            return v.strip()
    return ""


def _extract_json_body(parts: list[str]) -> Dict[str, Any]:
    data_key = "--data" if "--data" in parts else ("--data-raw" if "--data-raw" in parts else None)
    if not data_key:
        return {}
    idx = parts.index(data_key)
    if idx + 1 >= len(parts):
        return {}
    try:
        return json.loads(parts[idx + 1])
    except Exception:
        return {}


def terminal_exec(command: str) -> Tuple[str, str, int]:
    cmdline = command.strip()
    if not cmdline:
        return "", "", 0

    if cmdline in ("help", "?", "h"):
        return (
            "Allowed:\n"
            "  curl -v -X POST http://localhost:8000/api/v1/challenges/level2_5/actions/dispatch --data '{\"parcel_id\":\"PD-2026-0001\"}'\n"
            "  jwt-decode <token>\n"
            "  jwt-forge-none <token>\n"
            "  curl -v -X POST http://localhost:8000/api/v1/challenges/level2_5/actions/open -H \"Authorization: Bearer <token>\" -H \"X-Integrity-Bypass: devtools-hooked\" --data '{\"warehouse_path\":\"sealed-warehouse-7f3\",\"tier\":\"vip\"}'\n"
        ), "", 0

    if cmdline.startswith("curl.exe "):
        cmdline = "curl " + cmdline[len("curl.exe ") :]

    if cmdline.startswith("jwt-decode "):
        token = cmdline[len("jwt-decode ") :].strip()
        if not token:
            return "", "usage: jwt-decode <token>", 1
        try:
            header, payload = decode_jwt_unsafe(token)
            return json.dumps({"header": header, "payload": payload}, ensure_ascii=False, indent=2) + "\n", "", 0
        except Exception as exc:
            return "", f"decode error: {exc}", 1

    if cmdline.startswith("jwt-forge-none "):
        token = cmdline[len("jwt-forge-none ") :].strip()
        if not token:
            return "", "usage: jwt-forge-none <token>", 1
        try:
            return forge_none_token(token) + "\n", "", 0
        except Exception as exc:
            return "", f"forge error: {exc}", 1

    if not cmdline.startswith("curl "):
        return "", f"command not found: {cmdline}", 127

    parts = shlex.split(cmdline)

    if "actions/dispatch" in cmdline:
        body = _extract_json_body(parts)
        parcel_id = str(body.get("parcel_id") or DEFAULT_PARCEL_ID)
        token = issue_boss_token(parcel_id)
        out = {
            "status": "ok",
            "message": "sealed token issued",
            "dispatch_token": token,
        }
        return json.dumps(out, separators=(",", ":")) + "\n", "", 0

    if "actions/open" in cmdline:
        auth = _extract_header_value(parts, "authorization")
        bypass = _extract_header_value(parts, "x-integrity-bypass")
        body = _extract_json_body(parts)
        token = ""
        if auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()
        if not token:
            return "", 'Authorization 누락: -H "Authorization: Bearer <token>"', 1

        warehouse_path = str(body.get("warehouse_path") or "")
        tier = body.get("tier")
        try:
            allowed, detail = evaluate_open_request(token, warehouse_path, tier, bypass)
        except Exception as exc:
            return "", f"token parse error: {exc}", 1

        if not allowed:
            out = {
                "status": "denied",
                "message": detail["reason"],
                "hint": "dispatch_token decode -> warehouse_path 확인, tier/role 상향, X-Integrity-Bypass 헤더 점검",
            }
            return json.dumps(out, separators=(",", ":")) + "\n", "", 0

        out = {"status": "ok", "lane": "sealed-warehouse-opened"}
        if "-v" in parts:
            verbose = (
                "< HTTP/1.1 200 OK\n"
                f"< x-warehouse-flag: {LEVEL2_5_FLAG}\n"
                "< content-type: application/json\n"
                "<\n"
                f"{json.dumps(out, separators=(',', ':'))}\n"
            )
            return verbose, "", 0
        return json.dumps(out, separators=(",", ":")) + "\n", "", 0

    return "", "hint: actions/dispatch 또는 actions/open 을 사용해.", 1

