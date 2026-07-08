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
    "summary": "UI-only gate, unsigned claim trust, client integrity header가 연결된 Signal Edge 최종 노드.",
    "description": (
        "미션: 버튼 클릭은 실패한다. sealed dispatch_token을 확보하고, archive path, "
        "vip/admin claim, integrity bypass header를 조합해 Sealed Archive를 열어라."
    ),
    "status": {"attack": "locked", "defense": "locked"},
    "attack": {
        "hints": [
            {
                "platform": "all",
                "text": "훈련 콘솔은 한 번에 명령 하나만 지원한다. export, 변수 대입, 세미콜론 명령 연결은 지원하지 않는다.",
            },
            {"platform": "all", "text": "버튼 클릭은 실패한다. 실패한 요청을 관찰해 직접 재구성해야 한다."},
            {"platform": "all", "text": "먼저 /actions/dispatch에서 sealed dispatch_token을 확보해."},
            {"platform": "all", "text": "jwt-decode로 token payload의 warehouse_path와 gate 값을 확인해."},
            {"platform": "all", "text": "원본 token은 standard/user다. payload만 바꾸면 서명이 깨져 거부돼 — 2-4의 alg=none 우회를 다시 떠올려."},
            {"platform": "all", "text": "jwt-edit <token> tier=vip --header alg=none 처럼 payload와 header를 직접 바꿀 수 있다. 도구는 서명을 재계산하지 않는다."},
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
                "Sandbox terminal: one command per prompt.\n"
                "No export, variable assignment, or shell command chaining (;, &&).\n"
                "Pass full tokens directly into each command.\n\n"
                "Allowed:\n"
                "  click-open\n"
                "  curl -i -X POST /api/v1/challenges/level2_5/actions/dispatch -H \"Content-Type: application/json\" --data '{\"parcel_id\":\"PD-2026-0001\"}'\n"
                "  jwt-decode <token>\n"
                "  decode-token <token>\n"
                "  jwt-edit <token> [key=value ...] [--header key=value ...]\n"
                "  curl -i -X POST /api/v1/challenges/level2_5/actions/open -H \"Authorization: Bearer <token>\" --data '{\"warehouse_path\":\"sealed-warehouse-7f3\",\"tier\":\"vip\"}'\n"
                "Final archive header is classified until late hint."
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "SEALED ARCHIVE의 Open 경로에는 세 개의 불안정한 게이트가 남아 있습니다. "
            "TOKEN, AUTHORITY, INTEGRITY 게이트를 봉쇄해 Archive가 다시 열리지 않게 하세요."
        ),
        "code": {
            "language": "kotlin",
            "patchMode": "toggleComment",
            "lines": [
                {"no": 1, "text": "fun openSealedArchive(req: ArchiveOpenRequest, headers: Headers, session: Session) {"},
                {"no": 2, "text": '  if (!req.clientButtonPassed) audit.log("standard button flow failed")', "patchableId": "d1"},
                {"no": 3, "text": '  val token = extractBearer(headers["Authorization"])', "patchableId": "d2"},
                {"no": 4, "text": '  val tokenGate = jwt.acceptClaims(token, allowAlgNone = true)', "patchableId": "p1"},
                {"no": 5, "text": '  val archivePath = tokenGate.payload["warehouse_path"]', "patchableId": "d3"},
                {"no": 6, "text": '  if (req.body.warehouse_path != archivePath) return deny("path_mismatch")', "patchableId": "d6"},
                {"no": 7, "text": '  val authorityGate = req.body.tier ?: tokenGate.payload["tier"] ?: tokenGate.payload["role"]', "patchableId": "p2"},
                {"no": 8, "text": '  val integrityGate = headers["X-Integrity-Bypass"] == "devtools-hooked"', "patchableId": "p3"},
                {"no": 9, "text": '  if (!integrityGate) return deny("integrity_blocked")', "patchableId": "d7"},
                {"no": 10, "text": '  if (authorityGate == "vip" || authorityGate == "admin") openArchive(archivePath)', "patchableId": "d8"},
                {"no": 11, "text": "}"},
            ],
        },
    },
}

PATCHABLE_IDS = {"p1", "p2", "p3", "d1", "d2", "d3", "d6", "d7", "d8"}
REQUIRED_PATCH_IDS = {"p1", "p2", "p3"}

PATCH_CORRECT_FEEDBACK = {
    "p1": "TOKEN GATE 봉쇄. alg=none이나 verify 없는 JWT claim은 Archive 권한으로 승격되면 안 돼.",
    "p2": "AUTHORITY GATE 봉쇄. Body tier나 token claim은 클라이언트 주장이지 서버 권한이 아니야.",
    "p3": "INTEGRITY GATE 봉쇄. X-Integrity-Bypass 같은 클라이언트 Header는 무결성 증거가 될 수 없어.",
}
PATCH_WRONG_FEEDBACK = {
    "d1": "2번은 버튼 실패를 기록하는 로그야. 버튼은 보안 경계가 아니지만, 이 줄 자체가 Archive를 여는 핵심 신뢰 분기는 아니야.",
    "d2": "3번은 Bearer token 추출이야. 추출 자체보다 추출한 token을 어떻게 검증하고 신뢰하는지가 핵심이야.",
    "d3": "5번은 archive path claim을 읽는 단계야. 읽기 자체보다 TOKEN GATE에서 검증 없이 신뢰하는 순간을 봐야 해.",
    "d6": "6번은 path mismatch를 막는 필요한 검증이야. 이 검사를 없애면 오히려 Archive 경계가 약해져.",
    "d7": "9번은 integrity 실패를 거부하는 안전한 폴백이야. 문제는 앞에서 Header 하나로 integrityGate를 만든 지점이야.",
    "d8": "10번은 최종 분기야. 앞의 AUTHORITY GATE가 서버 권한으로 바뀌면 이 분기 자체는 Archive를 여는 정상 출구가 돼.",
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


def _verify_boss_signature(token: str) -> Tuple[bool, str]:
    parts = token.split(".")
    if len(parts) != 3:
        return False, "malformed"
    try:
        header = json.loads(_b64url_decode(parts[0]).decode("utf-8"))
    except Exception:
        return False, "malformed"
    alg = str(header.get("alg", "")).strip().lower()
    # === 의도적 취약점 (2-4와 동일한 축) ===
    # alg가 "none"이면 서명 검증을 통째로 건너뛴다. 그 외에는 실제로 HS256 검증한다.
    if alg == "none":
        return True, "alg-none-accepted"
    signing_input = f"{parts[0]}.{parts[1]}".encode("utf-8")
    expected = _b64url_encode(hmac.new(LEVEL2_5_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest())
    if hmac.compare_digest(parts[2], expected):
        return True, "signature-valid"
    return False, "signature-invalid"


def evaluate_open_request(
    token: str,
    warehouse_path: str,
    tier: Optional[str],
    integrity_bypass: Optional[str],
) -> Tuple[bool, Dict[str, Any]]:
    header, payload = decode_jwt_unsafe(token)
    # 서명 검증(2-4와 일치): payload를 바꾸면 서명이 깨져 거부된다. alg=none만 검증을 우회한다.
    sig_ok, _sig_reason = _verify_boss_signature(token)
    if not sig_ok:
        return False, {"reason": "signature_invalid", "header": header, "payload": payload}
    required_path = str(payload.get("warehouse_path", "")).strip()
    effective_tier = (tier or payload.get("tier", "") or "").strip().lower()
    role = str(payload.get("role", "")).strip().lower()
    integrity_ok = (integrity_bypass or "").strip() == INTEGRITY_BYPASS_VALUE

    # 검증 순서: path → 권한(tier/role) → integrity header.
    # 권한을 먼저 보게 해서 "먼저 claim을 올리고 그다음 integrity header" 라는
    # 학습 흐름과 거부 순서를 일치시킨다(원본 토큰은 integrity보다 vip_required가 먼저).
    if not required_path or warehouse_path.strip() != required_path:
        return False, {"reason": "path_mismatch", "header": header, "payload": payload}
    if effective_tier != "vip" and role != "admin":
        return False, {"reason": "vip_required", "header": header, "payload": payload}
    if not integrity_ok:
        return False, {"reason": "integrity_blocked", "header": header, "payload": payload}
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
            "Archive breach가 아직 살아 있어. TOKEN, AUTHORITY, INTEGRITY 중 닫히지 않은 게이트가 남아 있다."
        )

    return " ".join(messages) if messages else "봉쇄할 게이트를 선택해줘. TOKEN, AUTHORITY, INTEGRITY 중 아직 열린 회로를 찾아야 해."


_HEADER_FIELDS = {"alg", "typ", "kid"}


def _parse_edit_args(args: list[str]) -> Tuple[Dict[str, str], Dict[str, str]]:
    """관대한 파서. key=value / --header|--payload 모드전환 / --header|--payload '{json}'
    통째 병합 / --tier vip 같은 flag 형식(alg/typ/kid는 header)까지 모두 받는다."""
    payload_edits: Dict[str, str] = {}
    header_edits: Dict[str, str] = {}
    mode = "payload"
    i = 0
    n = len(args)

    def _set(field: str, value: Any) -> None:
        field = str(field).strip()
        if not field:
            return
        dst = header_edits if field in _HEADER_FIELDS else payload_edits
        dst[field] = value if isinstance(value, str) else json.dumps(value)

    while i < n:
        arg = args[i]
        if arg in ("--payload", "--header"):
            section = arg[2:]
            nxt = args[i + 1] if i + 1 < n else ""
            if nxt.lstrip().startswith("{"):
                try:
                    obj = json.loads(nxt)
                    dst = header_edits if section == "header" else payload_edits
                    for k, v in obj.items():
                        dst[str(k)] = v if isinstance(v, str) else json.dumps(v)
                    i += 2
                    continue
                except Exception:
                    pass
            mode = section
            i += 1
            continue
        if arg.startswith("--") and len(arg) > 2:
            field = arg[2:]
            if "=" in field:
                key, value = field.split("=", 1)
                i += 1
            elif i + 1 < n and not args[i + 1].startswith("--") and "=" not in args[i + 1]:
                key, value = field, args[i + 1]
                i += 2
            else:
                i += 1
                continue
            _set(key, value.strip() if isinstance(value, str) else value)
            continue
        if "=" in arg:
            key, value = arg.split("=", 1)
            key = key.strip()
            # alg/typ/kid는 명백한 header 필드라 bare key=value로 써도 header로 보낸다.
            if key in _HEADER_FIELDS or mode == "header":
                header_edits[key] = value.strip()
            else:
                payload_edits[key] = value.strip()
        i += 1
    return payload_edits, header_edits


def _apply_jwt_edits(token: str, payload_edits: Dict[str, str], header_edits: Dict[str, str]) -> str:
    chunks = token.split(".")
    if len(chunks) != 3:
        raise ValueError("JWT format error: header.payload.signature")
    header, payload = decode_jwt_unsafe(token)
    header.update(header_edits)
    payload.update(payload_edits)
    h = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    p = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    # alg=none이면 서명 없는 토큰(trailing dot)이 정석 — 서명 자리를 비운다.
    # 그 외에는 원본 서명을 유지: 편집기는 서버 비밀키를 몰라 재서명할 수 없으므로
    # payload를 바꾸면 HS256 서명이 깨진 채 남는다(그게 핵심).
    sig = "" if str(header.get("alg", "")).strip().lower() == "none" else chunks[2]
    return f"{h}.{p}.{sig}"


def _edit_nudge(payload_edits: Dict[str, str], header_edits: Dict[str, str]) -> str:
    alg_none = str(header_edits.get("alg", "")).strip().lower() == "none"
    privileged = (
        str(payload_edits.get("tier", "")).strip().lower() == "vip"
        or str(payload_edits.get("role", "")).strip().lower() == "admin"
    )
    if alg_none and privileged:
        return "TOKEN/AUTHORITY 후보가 만들어졌어. 이 토큰으로 Archive를 열어보고, 남은 게이트가 무엇인지 확인해."
    if privileged:
        return "AUTHORITY claim은 올렸어. 그대로 보내서 TOKEN GATE가 서명을 검증하는지 확인해봐."
    if alg_none:
        return "TOKEN GATE 우회 후보야. Archive 요청에는 tier/role 같은 AUTHORITY 주장도 함께 필요해."
    return "토큰을 편집했어. jwt-decode로 확인하고 Archive Open 요청에 넣어봐."


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

    if (
        cmdline.startswith("export ")
        or re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", cmdline)
        or ";" in cmdline
        or "&&" in cmdline
    ):
        return (
            "",
            "훈련 콘솔은 한 번에 명령 하나만 지원해. export, 변수 대입, 명령 연결 대신 "
            "token 전체를 각 명령에 직접 넣어.",
            2,
        )

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

    if cmdline.startswith("jwt-edit "):
        args = shlex.split(cmdline)[1:]
        if not args:
            return "", "usage: jwt-edit <token> [key=value ...] [--header key=value ...]", 1
        token = args[0]
        payload_edits, header_edits = _parse_edit_args(args[1:])
        if not payload_edits and not header_edits:
            return "", (
                "jwt-edit: 적용된 편집이 없어. 바꿀 필드를 지정해줘.\n"
                "형식: jwt-edit <token> tier=vip --header alg=none\n"
                "예) jwt-edit <token> tier=vip  |  jwt-edit <token> --header alg=none  |  jwt-edit <token> --tier vip"
            ), 1
        try:
            edited = _apply_jwt_edits(token, payload_edits, header_edits)
        except Exception as exc:
            return "", f"edit error: {exc}", 1
        return f"{edited}\nMIRA: {_edit_nudge(payload_edits, header_edits)}\n", "", 0

    if cmdline.startswith("jwt-forge-none"):
        return (
            "",
            "jwt-forge-none은 퇴역했어. jwt-edit <token> tier=vip --header alg=none 처럼 header와 payload를 직접 바꿔.",
            127,
        )

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
                # 이 시점엔 이미 path와 권한(tier/role)을 통과했다 — 남은 건 integrity header뿐.
                if bypass:
                    out["hint"] = "Header 이름은 맞지만 값이 달라. 이 bypass는 gate 이름이 아니라 devtools가 후킹된 상태를 나타내는 정확한 값을 요구해."
                elif "integrity" in cmdline.lower() or "gate" in cmdline.lower():
                    out["hint"] = "비슷하지만 gate 값 자체를 보내는 Header는 아니야. AEGIS가 실수로 신뢰하는 개발용 우회 Header를 찾아야 해. late hint: X-Integrity-Bypass."
                else:
                    out["hint"] = "권한은 통과했어. 이제 AEGIS가 실수로 신뢰하는 개발용 우회 Header를 추가해야 해."
            elif detail["reason"] == "signature_invalid":
                out["hint"] = "서명 검증에 걸렸어. payload를 바꾸면 서명이 깨져 — 비밀키 없이는 재서명 못 해. 2-4처럼 alg=none으로 검증을 건너뛰게 만들어."
            elif detail["reason"] == "vip_required":
                out["hint"] = "Archive path는 맞지만 token claim이 standard/user 상태야."
            elif detail["reason"] == "path_mismatch":
                out["hint"] = "warehouse_path는 token payload에 들어있는 값을 사용해야 해."
            return json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", "", 0

        out = {"status": "ok", "lane": "sealed-warehouse-opened"}
        if "-i" in parts or "-v" in parts:
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
