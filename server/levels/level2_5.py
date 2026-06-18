from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
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
    "title": "2-5 Sealed Archive",
    "summary": "UI-only gate, unsigned claim trust, client integrity header가 연결된 Signal Edge 보스.",
    "description": (
        "미션: 버튼 클릭은 실패한다. sealed dispatch_token을 확보하고, archive path, "
        "vip/admin claim, integrity bypass header를 조합해 Sealed Archive를 열어라."
    ),
    "status": {"attack": "locked", "defense": "locked"},
    "attack": {
        "hints": [
            {"platform": "all", "text": "이 보스는 2-1~2-4 Attack을 먼저 해결해야 열린다."},
            {"platform": "all", "text": "버튼 클릭은 실패한다. 실패한 요청을 관찰해 직접 재구성해야 한다."},
            {"platform": "all", "text": "먼저 /actions/dispatch에서 sealed dispatch_token을 확보해."},
            {"platform": "all", "text": "jwt-decode로 token payload의 warehouse_path와 gate 값을 확인해."},
            {"platform": "all", "text": "원본 token은 standard/user다. 2-4의 signature 검증 누락 흐름을 다시 떠올려."},
            {"platform": "all", "text": "권한을 올려도 integrity_blocked가 남는다면 Body가 아니라 Header 쪽을 봐."},
            {"platform": "all", "text": "token payload의 gate 값은 단서일 뿐, 그 값을 그대로 보내는 것으로는 Archive가 열리지 않는다."},
            {"platform": "all", "text": "AEGIS가 실수로 신뢰하는 개발용 우회 Header가 남아 있다. Header 이름은 X-Integrity 계열이다."},
            {"platform": "all", "text": "Gate를 통과시키는 값은 true/1/enabled 같은 일반 boolean이 아니다. devtools가 연결된 상태처럼 위장해."},
            {"platform": "all", "text": "late hint: X-Integrity-Bypass: devtools-hooked"},
            {"platform": "all", "text": "Archive open 요청은 forged token, warehouse_path, X-Integrity-Bypass: devtools-hooked header를 함께 요구한다."},
            {
                "platform": "windows",
                "text": 'curl.exe -v -X POST /api/v1/challenges/level2_5/actions/open -H "Authorization: Bearer <forged_token>" -H "X-Integrity-Bypass: devtools-hooked" -H "Content-Type: application/json" --data "{\\"warehouse_path\\":\\"sealed-warehouse-7f3\\",\\"tier\\":\\"vip\\"}"',
            },
            {
                "platform": "unix",
                "text": "curl -v -X POST /api/v1/challenges/level2_5/actions/open -H 'Authorization: Bearer <forged_token>' -H 'X-Integrity-Bypass: devtools-hooked' -H 'Content-Type: application/json' --data '{\"warehouse_path\":\"sealed-warehouse-7f3\",\"tier\":\"vip\"}'",
            },
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 12000,
            "help": (
                "Allowed:\n"
                "  click-open\n"
                "  curl -i -X POST /api/v1/challenges/level2_5/actions/dispatch -H \"Content-Type: application/json\" --data '{\"parcel_id\":\"PD-2026-0001\"}'\n"
                "  jwt-decode <token>\n"
                "  decode-token <token>\n"
                "  jwt-forge-none <token>\n"
                "  curl -i -X POST /api/v1/challenges/level2_5/actions/open -H \"Authorization: Bearer <token>\" --data '{\"warehouse_path\":\"sealed-warehouse-7f3\"}'\n"
                "Final archive header is classified until late hint."
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "SEALED ARCHIVE는 단일 취약점이 아니라 복합 신뢰 경계 붕괴입니다. "
            "클라이언트가 조작 가능한 입력을 서버 권한 판단에 연결하는 라인을 선택해 봉쇄하세요."
        ),
        "code": {
            "language": "kotlin",
            "patchMode": "toggleComment",
            "lines": [
                {"no": 1, "text": "fun openSealedArchive(req: ArchiveOpenRequest, headers: Headers, session: Session) {"},
                {"no": 2, "text": '  if (!req.clientButtonPassed) audit.log("standard button flow failed")', "patchableId": "d1"},
                {"no": 3, "text": '  val token = extractBearer(headers["Authorization"])', "patchableId": "d2"},
                {"no": 4, "text": "  val decoded = jwt.decodeWithoutVerify(token)", "patchableId": "p1"},
                {"no": 5, "text": '  if (decoded.header.alg == "none") decoded.markTrusted()', "patchableId": "p2"},
                {"no": 6, "text": '  val archivePath = decoded.payload["warehouse_path"]', "patchableId": "d3"},
                {"no": 7, "text": '  val tokenTier = decoded.payload["tier"]', "patchableId": "d4"},
                {"no": 8, "text": '  val role = decoded.payload["role"]', "patchableId": "d5"},
                {"no": 9, "text": "  val effectiveTier = req.body.tier ?: tokenTier", "patchableId": "p3"},
                {"no": 10, "text": '  val integrityOk = headers["X-Integrity-Bypass"] == "devtools-hooked"', "patchableId": "p4"},
                {"no": 11, "text": '  if (req.body.warehouse_path != archivePath) return deny("path_mismatch")', "patchableId": "d6"},
                {"no": 12, "text": '  if (!integrityOk) return deny("integrity_blocked")', "patchableId": "d7"},
                {"no": 13, "text": '  if (effectiveTier == "vip" || role == "admin") openArchive(archivePath)', "patchableId": "p5"},
                {"no": 14, "text": '  audit.log("sealed archive evaluated")', "patchableId": "d8"},
                {"no": 15, "text": "}"},
            ],
        },
    },
}

PATCHABLE_IDS = {"p1", "p2", "p3", "p4", "p5", "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"}
REQUIRED_PATCH_IDS = {"p1", "p2", "p3", "p4", "p5"}

PATCH_CORRECT_FEEDBACK = {
    "p1": "4번은 봉쇄 대상이 맞아. token payload는 읽을 수 있지만, verify 전에는 신뢰할 수 없어.",
    "p2": "5번은 봉쇄 대상이 맞아. alg=none을 trusted로 처리하는 것도 문제지만, 핵심은 signature 검증 없이 token claim을 신분증처럼 믿는 거야.",
    "p3": "9번은 봉쇄 대상이 맞아. req.body.tier는 클라이언트 주장이라 서버 권한 판단을 덮어쓰면 안 돼.",
    "p4": "10번은 봉쇄 대상이 맞아. X-Integrity-Bypass는 클라이언트가 직접 보낼 수 있는 Header라 integrity 증거가 될 수 없어.",
    "p5": "13번은 봉쇄 대상이 맞아. 마지막 Archive open 분기가 아직 검증되지 않은 claim을 믿고 있어.",
}
PATCH_WRONG_FEEDBACK = {
    "d1": "2번은 버튼 실패를 기록하는 로그야. 버튼은 보안 경계가 아니지만, 이 줄 자체가 Archive를 여는 핵심 신뢰 분기는 아니야.",
    "d2": "3번은 Bearer token 추출이야. 추출 자체보다 추출한 token을 어떻게 검증하고 신뢰하는지가 핵심이야.",
    "d3": "6번은 archive path claim을 읽는 단계야. 읽기 자체보다 verify 없는 신뢰와 권한 연결을 봐야 해.",
    "d4": "7번은 tier claim을 읽는 단계야. claim을 읽는 것과 서버 권한으로 신뢰하는 것은 달라.",
    "d5": "8번은 role claim을 읽는 단계야. 문제는 검증되지 않은 role이 Archive 권한으로 이어지는 지점이야.",
    "d6": "11번은 path mismatch를 막는 필요한 검증이야. 이 검사를 없애면 오히려 Archive 경계가 약해져.",
    "d7": "12번은 integrity 확인 자체야. 문제는 integrityOk를 클라이언트 Header 하나로 만든 앞단의 신뢰야.",
    "d8": "14번은 감사 로그야. Archive 권한이나 integrity 판단을 직접 바꾸지 않아.",
}


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _b64url_decode(raw: str) -> bytes:
    padded = raw + ("=" * ((4 - (len(raw) % 4)) % 4))
    return base64.urlsafe_b64decode(padded.encode("utf-8"))


def _normalize_curl_line(command: str) -> str:
    return re.sub(r"\\\s+", " ", command.strip())


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
            "복합 신뢰 경계가 아직 열려 있어. JWT signature 검증, token claim 신뢰 경계, Body tier override, "
            "client integrity Header, 최종 Archive open 분기를 모두 서버 기준으로 묶어야 해."
        )

    return " ".join(messages) if messages else "봉쇄할 라인을 선택해줘. 버튼, token, body, header, 최종 권한 부여가 어디서 신뢰로 바뀌는지 봐야 해."


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
    data_key = None
    for candidate in ("--data", "--data-raw", "-d"):
        if candidate in parts:
            data_key = candidate
            break
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
    cmdline = _normalize_curl_line(command)
    if not cmdline:
        return "", "", 0

    if cmdline == "click-open":
        return (
            "AEGIS: Canonical button flow denied.\n"
            "AEGIS: Sealed Archive cannot be opened by standard UI.\n"
            "MIRA: 버튼은 실패했지만 요청은 어딘가로 갔을 거야. 직접 조합해봐.\n"
        ), "", 0

    if cmdline in ("help", "?", "h"):
        return STATIC["attack"]["terminal"]["help"] + "\n", "", 0

    if cmdline.startswith("curl.exe "):
        cmdline = "curl " + cmdline[len("curl.exe ") :]

    decode_prefix = ""
    if cmdline.startswith("jwt-decode "):
        decode_prefix = "jwt-decode "
    elif cmdline.startswith("decode-token "):
        decode_prefix = "decode-token "
    if decode_prefix:
        token = cmdline[len(decode_prefix) :].strip()
        if not token:
            return "", f"usage: {decode_prefix.strip()} <token>", 1
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
        if "-i" in parts or "-v" in parts:
            return (
                "> POST /api/v1/challenges/level2_5/actions/dispatch HTTP/1.1\n"
                f"> payload: {json.dumps({'parcel_id': parcel_id}, ensure_ascii=False, separators=(',', ':'))}\n"
                "<\n"
                "< HTTP/1.1 200 OK\n"
                "< x-dispatch-trace: sealed-token-issued\n"
                f"{json.dumps(out, ensure_ascii=False, separators=(',', ':'))}\n"
            ), "", 0
        return json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", "", 0

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
            }
            if detail["reason"] == "integrity_blocked":
                payload = detail.get("payload", {})
                tier = str(payload.get("tier", "")).lower()
                role = str(payload.get("role", "")).lower()
                if tier == "vip" or role == "admin":
                    if bypass:
                        out["hint"] = "Header 이름은 맞지만 값이 달라. 이 devtools bypass는 gate 이름이 아니라 허용된 우회 값이 필요해."
                    elif "integrity" in cmdline.lower() or "gate" in cmdline.lower():
                        out["hint"] = "비슷하지만 gate 값 자체를 보내는 Header는 아니야. AEGIS가 실수로 신뢰하는 개발용 우회 Header를 찾아야 해. late hint: X-Integrity-Bypass."
                    else:
                        out["hint"] = "권한 claim은 올라갔지만 integrity gate가 남아있어. gate는 단서고, 실제로는 개발용 우회 Header를 추가해야 해."
                else:
                    out["hint"] = "Archive path는 맞지만 integrity gate가 먼저 막고 있어. 먼저 token claim을 올리고, 그 다음 개발용 우회 Header를 확인해."
            elif detail["reason"] == "vip_required":
                out["hint"] = "Archive path는 맞지만 token claim이 standard/user 상태야."
            elif detail["reason"] == "path_mismatch":
                out["hint"] = "warehouse_path는 token payload에 들어있는 값을 사용해야 해."
            return json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", "", 0

        out = {"status": "ok", "lane": "sealed-warehouse-opened"}
        if "-v" in parts:
            verbose = (
                "< HTTP/1.1 200 OK\n"
                f"< x-warehouse-flag: {LEVEL2_5_FLAG}\n"
                "< content-type: application/json\n"
                "<\n"
                f"{json.dumps(out, ensure_ascii=False, separators=(',', ':'))}\n"
            )
            return verbose, "", 0
        return json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", "", 0

    return "", "hint: actions/dispatch 또는 actions/open 을 사용해.", 1
