from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
import shlex
from typing import Any, Dict, List, Tuple


# 2-4 EXPRESS FORGE (HARD MODE)
# 개념: AEGIS Express Gate는 이제 토큰의 HS256 서명을 실제로 검증한다.
#       payload를 바꾸면 서명이 깨져 거부된다(비밀키 없이는 재서명 불가).
#       유일한 우회 = 고전적 취약점: header.alg == "none" 이면 검증을 통째로 건너뛴다.
# 교훈: 서명 검증이 없으면(또는 우회되면) 토큰 claim은 위조 가능한 신분증이다.
LEVEL2_4_FLAG = os.getenv("PURPLEDROID_LEVEL2_4_FLAG", "FLAG{JWT_SIGNATURE_MATTERS}")
DEFAULT_SIGNAL_ID = "SIG-1004"

# 서버만 아는 HS256 비밀키. 플레이어에게 노출되지 않는다 → 재서명 불가.
_EXPRESS_SECRET = os.getenv("PURPLEDROID_LEVEL2_4_SECRET", "aegis-express-hs256-9f17c").encode("utf-8")


# -----------------------------
# JWT helpers
# -----------------------------
def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _b64url_decode(raw: str) -> bytes:
    padded = raw + ("=" * ((4 - (len(raw) % 4)) % 4))
    return base64.urlsafe_b64decode(padded.encode("utf-8"))


def _json_b64(data: Dict[str, Any]) -> str:
    return _b64url_encode(json.dumps(data, separators=(",", ":")).encode("utf-8"))


def _sign(signing_input: str) -> str:
    """lab HS256 서명: HMAC-SHA256(secret, header.payload) → b64url."""
    digest = hmac.new(_EXPRESS_SECRET, signing_input.encode("utf-8"), hashlib.sha256).digest()
    return _b64url_encode(digest)


def issue_express_token() -> str:
    """Express Gate가 발급하는 standard pass. 서명은 유효하지만 권한은 standard."""
    header = {"alg": "HS256", "typ": "JWT", "kid": "express-hs256"}
    payload = {
        "signalId": DEFAULT_SIGNAL_ID,
        "route": "signal-edge",
        "state": "issued",
        "tier": "standard",
        "role": "operator",
        "aud": "express-gate",
        "note": "present this pass at the Express Gate",
    }
    head = _json_b64(header)
    body = _json_b64(payload)
    return f"{head}.{body}.{_sign(head + '.' + body)}"


def decode_jwt(token: str) -> Tuple[Dict[str, Any], Dict[str, Any], str]:
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("JWT 형식 오류: header.payload.signature 3개 세그먼트가 필요해.")
    header = json.loads(_b64url_decode(parts[0]).decode("utf-8"))
    payload = json.loads(_b64url_decode(parts[1]).decode("utf-8"))
    return header, payload, parts[2]


def _verify_signature(token: str) -> Tuple[bool, str]:
    parts = token.split(".")
    if len(parts) != 3:
        return False, "malformed"
    try:
        header = json.loads(_b64url_decode(parts[0]).decode("utf-8"))
    except Exception:
        return False, "malformed"
    alg = str(header.get("alg", "")).strip().lower()
    # === 의도적 취약점 ===
    # alg가 "none"이면 서명 검증을 통째로 건너뛴다. → 서명 없이 위조 payload가 통과.
    if alg == "none":
        return True, "alg-none-accepted"
    expected = _sign(parts[0] + "." + parts[1])
    if hmac.compare_digest(parts[2], expected):
        return True, "signature-valid"
    return False, "signature-invalid"


_VISIBLE_CLAIMS = ("signalId", "route", "state", "tier", "role", "aud", "note")


def _visible(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {k: payload[k] for k in _VISIBLE_CLAIMS if k in payload}


def evaluate_express_access(token: str) -> Tuple[bool, Dict[str, Any]]:
    """서명 검증 → 권한 claim 검사. main.py와 터미널이 공유한다."""
    header, payload, _sig = decode_jwt(token)  # malformed면 여기서 raise
    ok_sig, reason = _verify_signature(token)
    if not ok_sig:
        return False, {
            "header": header,
            "payload": _visible(payload),
            "reason": reason,
            "httpStatus": 401,
            "message": "signature verification failed — payload was altered but not correctly re-signed.",
        }
    tier = str(payload.get("tier", "")).strip().lower()
    role = str(payload.get("role", "")).strip().lower()
    if tier == "vip" or role == "admin":
        return True, {
            "header": header,
            "payload": _visible(payload),
            "reason": "privileged-claim",
            "httpStatus": 200,
        }
    return False, {
        "header": header,
        "payload": _visible(payload),
        "reason": "not-privileged",
        "httpStatus": 403,
        "message": "signature ok, but tier/role is not privileged — VIP or admin required.",
    }


# -----------------------------
# flag
# -----------------------------
def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL2_4_FLAG


def flag_feedback(flag: str) -> str:
    s = flag.strip()
    if s.startswith("FLAG{") and s != LEVEL2_4_FLAG:
        return (
            "MIRA: 그 값이 아니야. 서명 검증을 우회(alg=none)한 위조 토큰으로 Express Gate를 "
            "통과시켜서 나온 응답의 flag를 제출해."
        )
    return (
        "MIRA: Express Gate를 통과하면 응답에 flag가 나와. standard 토큰은 서명이 유효해도 권한이 낮아 — "
        "tier/role 위조 + alg=none이 같이 필요해."
    )


# -----------------------------
# STATIC (mission spec)
# -----------------------------
STATIC: Dict[str, Any] = {
    "id": "level2_4",
    "level": 2,
    "title": "2-4 Express Forge",
    "summary": "Express Gate가 서명을 검증하지만 alg=none이면 검증을 건너뛴다 — claim은 위조 가능한 신분증이 된다.",
    "description": (
        "미션: standard pass는 서명이 유효하다. payload를 바꾸면 서명이 깨져 거부된다. "
        "Express Gate가 서명 검증을 어떻게 우회당하는지 찾아 VIP pass를 위조해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {"platform": "all", "text": "echo $DISPATCH_TOKEN 으로 standard pass를 꺼내고, jwt-decode로 header/payload/signature를 확인해."},
            {"platform": "all", "text": "jwt-edit로 payload의 tier나 role만 바꿔 그대로 Express Gate에 보내봐 — 서버가 서명을 검증하는지 먼저 확인."},
            {"platform": "all", "text": "payload를 바꾸면 서명이 깨진다. 비밀키가 없으니 재서명은 불가능해. 그럼 검증 '자체'를 건너뛰게 만들 방법은?"},
            {"platform": "all", "text": "JWT header의 alg 값이 검증 방식을 정한다. alg=none이면 많은 구현이 서명 검증을 통째로 건너뛴다."},
            {"platform": "all", "text": "header.alg=none 으로 바꾸고 tier=vip(또는 role=admin)으로 위조한 토큰을 Bearer로 보내."},
            {
                "platform": "windows",
                "text": 'curl.exe -i -X POST /api/v1/challenges/level2_4/actions/express -H "Authorization: Bearer <forged_token>"',
            },
            {
                "platform": "unix",
                "text": 'curl -i -X POST /api/v1/challenges/level2_4/actions/express -H "Authorization: Bearer <forged_token>"',
            },
            {"platform": "app", "text": "jwt-edit <token> tier=vip --header alg=none 처럼 payload/header 필드를 직접 바꿀 수 있어. 무엇을 바꿀지는 네가 판단해."},
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 12000,
            "help": (
                "Allowed:\n"
                "  echo $DISPATCH_TOKEN\n"
                "  jwt-decode <token>\n"
                "  jwt-edit <token> [key=value ...] [--header key=value ...]\n"
                '  curl -i -X POST /api/v1/challenges/level2_4/actions/express -H "Authorization: Bearer <token>"\n'
                "예) jwt-edit $DISPATCH_TOKEN tier=vip --header alg=none\n"
                "무엇을 바꿀지는 스스로 판단해 — 도구는 대신 결정하지 않아."
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "Express Gate가 토큰을 신뢰하는 흐름에서, 서명 검증 없이(또는 우회한 채) 접근을 허용하는 라인을 "
            "봉쇄하세요. Bearer 추출·header decode·올바른 HMAC 검증·검증 실패 시 거부·검증 후 권한 판단은 "
            "대상이 아닙니다. 'alg=none이면 서명 검증을 건너뛰는' 라인이 핵심입니다."
        ),
        "code": {
            "language": "kotlin",
            "patchMode": "toggleComment",
            "lines": [
                {"no": 1, "text": "fun enterExpressLane(authHeader: String, session: Session) {"},
                {"no": 2, "text": "  val token = extractBearer(authHeader)", "patchableId": "d1"},
                {"no": 3, "text": "  val header = jwt.decodeHeader(token)", "patchableId": "d2"},
                {"no": 4, "text": '  if (header.alg == "none") return grantExpressLane(token)', "patchableId": "p1"},
                {"no": 5, "text": "  if (!jwt.verifyHmac(token, EXPRESS_SECRET)) return unauthorized()", "patchableId": "d3"},
                {"no": 6, "text": "  val claims = jwt.verifiedClaims(token)", "patchableId": "d4"},
                {"no": 7, "text": '  if (claims.tier == "vip" || claims.role == "admin") return grantExpressLane(token)', "patchableId": "d5"},
                {"no": 8, "text": "  return forbidden()", "patchableId": "d6"},
                {"no": 9, "text": "}"},
            ],
        },
    },
}

PATCHABLE_IDS = {"p1", "d1", "d2", "d3", "d4", "d5", "d6"}
REQUIRED_PATCH_IDS = {"p1"}

PATCH_CORRECT_FEEDBACK = {
    "p1": "4번이 핵심이야. alg=none이면 서명 검증을 통째로 건너뛰고 통행권을 내줘 — 서명 없는 토큰을 신뢰하는 셈이야. 봉쇄하면 alg=none 토큰이 5번 검증으로 내려가 거부돼.",
}
PATCH_WRONG_FEEDBACK = {
    "d1": "2번은 안전해. Bearer 토큰을 꺼내는 것 자체는 문제가 아니야.",
    "d2": "3번은 안전해. header를 읽는 것(decode)은 취약점이 아니야 — 문제는 읽은 걸 검증 없이 신뢰하는 순간이야.",
    "d3": "5번은 안전해 — 지우면 안 돼. 이게 올바른 HMAC 서명 검증이고, 실패하면 거부하는 정상 게이트야.",
    "d4": "6번은 안전해. 검증을 통과한 뒤 claim을 읽는 건 정상이야.",
    "d5": "7번은 안전해. 서명 검증(5번)을 통과한 다음의 tier/role 판단이라 신뢰할 수 있어.",
    "d6": "8번은 안전해. 기본 거부(forbidden) 폴백이야.",
}


def judge_patch(patched_ids: List[str]) -> bool:
    return set(patched_ids) == REQUIRED_PATCH_IDS


def judge_patch_with_session(patched_ids: List[str], session: Dict[str, Any]) -> bool:
    return set(patched_ids) == REQUIRED_PATCH_IDS


def patch_feedback(patched_ids: List[str]) -> str:
    selected = set(patched_ids)
    messages: List[str] = []
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
            "아직 서명 검증을 우회하는 경로가 남아있어. alg=none이면 검증을 건너뛰는 라인을 봉쇄해야 해."
        )
    return " ".join(messages) if messages else "봉쇄할 라인을 선택해줘. 서명 검증을 건너뛰는 지점을 봐야 해."


# -----------------------------
# terminal
# -----------------------------
def _normalize(command: str) -> str:
    return re.sub(r"\\\s+", " ", command.strip())


def _expand_env(cmdline: str, token: str) -> str:
    return cmdline.replace("${DISPATCH_TOKEN}", token).replace("$DISPATCH_TOKEN", token)


_HEADER_FIELDS = {"alg", "typ", "kid"}


def _parse_edit_args(args: List[str]) -> Tuple[Dict[str, str], Dict[str, str]]:
    """관대한 파서. 아래 형식을 모두 받는다:
      key=value                         (payload; --header 뒤엔 header)
      --header key=value / --payload    (모드 전환)
      --header '{...}' / --payload '{...}'  (JSON 통째로 병합)
      --tier vip / --alg none / --field=value  (flag 형식; alg/typ/kid는 header)
    """
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
        a = args[i]
        if a in ("--payload", "--header"):
            section = a[2:]
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
        if a.startswith("--") and len(a) > 2:
            field = a[2:]
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
        if "=" in a:
            key, value = a.split("=", 1)
            key = key.strip()
            # alg/typ/kid는 명백한 header 필드라 bare key=value로 써도 header로 보낸다.
            if key in _HEADER_FIELDS or mode == "header":
                header_edits[key] = value.strip()
            else:
                payload_edits[key] = value.strip()
        i += 1
    return payload_edits, header_edits


def _apply_edits(token: str, payload_edits: Dict[str, str], header_edits: Dict[str, str]) -> str:
    header, payload, sig = decode_jwt(token)
    payload.update(payload_edits)
    header.update(header_edits)
    # alg=none이면 서명 없는 토큰(trailing dot)이 정석 — 서명 자리를 비운다.
    # 그 외에는 원본 서명을 유지 → payload를 바꾸면 서명이 깨진 채 남는다(그게 핵심).
    if str(header.get("alg", "")).strip().lower() == "none":
        sig = ""
    head = _json_b64(header)
    body = _json_b64(payload)
    return f"{head}.{body}.{sig}"


def _extract_bearer(cmdline: str) -> str:
    parts = shlex.split(cmdline)
    for i, part in enumerate(parts):
        if part not in ("-H", "--header"):
            continue
        if i + 1 >= len(parts):
            continue
        raw = parts[i + 1]
        if ":" not in raw:
            continue
        key, value = raw.split(":", 1)
        if key.strip().lower() != "authorization":
            continue
        value = value.strip()
        if value.lower().startswith("bearer "):
            return value.split(" ", 1)[1].strip()
    return ""


def _edit_nudge(payload_edits: Dict[str, str], header_edits: Dict[str, str]) -> str:
    alg_none = str(header_edits.get("alg", "")).strip().lower() == "none"
    priv = (
        str(payload_edits.get("tier", "")).strip().lower() == "vip"
        or str(payload_edits.get("role", "")).strip().lower() == "admin"
    )
    if alg_none and priv:
        return "위조 후보가 만들어졌어 — 이 토큰을 Bearer로 Express Gate에 보내봐."
    if priv and not alg_none:
        return "권한 claim은 바꿨어. 그대로 보내서 서버가 서명을 검증하는지 먼저 확인해봐."
    if alg_none and not priv:
        return "alg=none으로 서명 검증은 우회돼. 근데 tier/role이 아직 standard야 — 권한 claim도 위조해."
    return "필드를 바꿨어. jwt-decode로 확인하고 Express Gate로 보내봐."


def terminal_exec(command: str) -> Tuple[str, str, int]:
    cmdline = _normalize(command)
    if not cmdline:
        return "", "", 0

    standard_token = issue_express_token()

    if cmdline in ("echo $DISPATCH_TOKEN", "printenv DISPATCH_TOKEN"):
        return f"{standard_token}\n", "", 0
    if cmdline in ("env", "printenv"):
        return f"DISPATCH_TOKEN={standard_token}\n", "", 0
    if cmdline in ("help", "?", "h"):
        return STATIC["attack"]["terminal"]["help"] + "\n", "", 0

    if cmdline.startswith("curl.exe "):
        cmdline = "curl " + cmdline[len("curl.exe ") :]

    cmdline = _expand_env(cmdline, standard_token)

    if cmdline.startswith("jwt-decode "):
        token = cmdline[len("jwt-decode ") :].strip()
        if not token:
            return "", "usage: jwt-decode <token>", 1
        try:
            header, payload, sig = decode_jwt(token)
        except Exception as exc:
            return "", f"decode error: {exc}", 1
        pretty = json.dumps({"header": header, "payload": payload, "signature": sig}, ensure_ascii=False, indent=2)
        mira = "payload는 평문으로 읽혀. 하지만 서명이 검증되는지 확인해 — payload를 바꾼 뒤 그대로 Express Gate에 보내봐."
        return f"{pretty}\nMIRA: {mira}\n", "", 0

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
            new_token = _apply_edits(token, payload_edits, header_edits)
        except Exception as exc:
            return "", f"edit error: {exc}", 1
        nudge = _edit_nudge(payload_edits, header_edits)
        return f"{new_token}\nMIRA: {nudge}\n", "", 0

    if cmdline.startswith("jwt-forge-none"):
        return (
            "",
            "jwt-forge-none은 더 이상 제공되지 않아. jwt-edit로 header/payload를 직접 바꿔 — "
            "무엇을 바꿀지는 네가 판단해야 해.",
            127,
        )

    if cmdline.startswith("curl ") and "actions/express" in cmdline:
        token = _extract_bearer(cmdline)
        if not token:
            return "", 'Authorization 헤더가 필요해. 예: -H "Authorization: Bearer <token>"', 1
        try:
            allowed, detail = evaluate_express_access(token)
        except Exception as exc:
            return "", f"token parse error: {exc}", 1
        verbose = "-i" in shlex.split(cmdline) or "-v" in shlex.split(cmdline)
        if allowed:
            body = json.dumps(
                {"status": "ok", "lane": "express", "flag": LEVEL2_4_FLAG, "claims": detail["payload"]},
                separators=(",", ":"),
            )
            mira = "통과! 서명 검증이 없으니(alg=none) claim이 곧 신분이 됐어 — 이게 이 노드의 교훈이야."
            head = (
                "> POST /api/v1/challenges/level2_4/actions/express HTTP/1.1\n"
                "<\n< HTTP/1.1 200 OK\n< x-express-gate: forged-pass-accepted\n"
                if verbose
                else ""
            )
            return f"{head}{body}\nMIRA: {mira}\n", "", 0

        reason = detail.get("reason")
        if reason in ("signature-invalid", "malformed"):
            code, gate = 401, "signature-invalid"
            mira = (
                "서명이 검증되고 있어 — payload를 바꾸면 서명이 깨져. 비밀키 없이 재서명은 못 해. "
                "그럼 검증 '자체'를 건너뛰게 만드는 header 값(alg)은 뭘까?"
            )
        else:
            code, gate = 403, "standard-token-denied"
            mira = "서명 검증은 넘어갔어. 이제 권한 claim이 문제야 — tier=vip 또는 role=admin으로 위조해."
        body = json.dumps(
            {
                "status": "denied",
                "lane": "standard",
                "reason": reason,
                "message": detail.get("message"),
                "claims": detail["payload"],
            },
            separators=(",", ":"),
        )
        head = (
            "> POST /api/v1/challenges/level2_4/actions/express HTTP/1.1\n"
            f"<\n< HTTP/1.1 {code} {'Unauthorized' if code == 401 else 'Forbidden'}\n< x-express-gate: {gate}\n"
            if verbose
            else ""
        )
        return f"{head}{body}\nMIRA: {mira}\n", "", 0

    return "", f"command not found: {cmdline}", 127
