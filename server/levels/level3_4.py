from __future__ import annotations

import json
import os
import base64
import shlex
from typing import Any, Dict, Tuple
from urllib.parse import parse_qs

from fakeshell import FakeShell, ShellContext
from fakeshell.http import HttpResponse


LEVEL3_4_FLAG = os.getenv("PURPLEDROID_LEVEL3_4_FLAG", "FLAG{DEEP_FIELDS_LEAK_TOO}")
LEVEL3_4_DECOY_FLAG = "FLAG{SUPPORT_PREVIEW_MARKER}"
DEFAULT_TICKET_ID = "SUP-1004"


STATIC: Dict[str, Any] = {
    "id": "level3_4",
    "level": 3,
    "title": "3-4 Too Much Information",
    "summary": "UI보다 응답 JSON이 더 많은 데이터를 내보내면 과다 정보 노출이다.",
    "description": (
        "미션: 지원 티켓 응답(Response JSON)을 끝까지 펼쳐 encoded audit shard를 복원하고 Evidence를 제출해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {
                "platform": "web",
                "text": "F12 Network에서 /actions/ticket 응답 JSON을 끝까지 펼쳐봐.",
            },
            {
                "platform": "all",
                "text": "UI preview는 응답 전체가 아니다.",
            },
            {
                "platform": "all",
                "text": "응답 JSON은 화면에 렌더링되지 않는 필드를 포함할 수 있다.",
            },
            {
                "platform": "all",
                "text": "깊은 객체를 펼쳐보고, 값의 문맥을 확인해.",
            },
            {
                "platform": "windows",
                "text": 'curl -v "/api/v1/challenges/level3_4/actions/ticket?id=SUP-1004" -H "Authorization: Bearer <token>"',
            },
            {
                "platform": "windows",
                "text": "decode-b64url <auditBlob>",
            },
            {
                "platform": "unix",
                "text": "curl -v '/api/v1/challenges/level3_4/actions/ticket?id=SUP-1004' -H 'Authorization: Bearer <token>'",
            },
            {
                "platform": "unix",
                "text": "decode-b64url <auditBlob>",
            },
            {
                "platform": "all",
                "text": "FLAG처럼 보이는 값이 있어도 검증 표식일 수 있다. 주변 key 이름을 같이 봐.",
            },
            {
                "platform": "all",
                "text": "archive 안의 auditBlob은 인코딩된 JSON일 수 있다.",
            },
            {
                "platform": "all",
                "text": "encoding이 base64url-json이라면 decode-b64url 명령으로 열어볼 수 있다.",
            },
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 10000,
            "help": (
                "허용: curl -v .../actions/ticket?id=SUP-1004 -H 'Authorization: Bearer <token>', "
                "decode-b64url <value>, help decode"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": True,
        "instruction": (
            "Excessive Data Exposure는 서버가 필요한 필드보다 많은 데이터를 응답에 포함할 때 발생합니다. "
            "아래 코드에서 운영 응답에 포함되면 안 되는 내부 필드를 봉쇄하세요."
        ),
        "code": {
            "language": "kotlin",
            "lines": [
                {"no": 1, "text": "fun getSupportTicket(req: TicketRequest, session: Session) {", "patchableId": "d1"},
                {"no": 2, "text": "  val ticket = supportStore.findByIdAndOwner(req.id, session.userId)", "patchableId": "d2"},
                {"no": 3, "text": ""},
                {"no": 4, "text": "  return SupportTicketResponse(", "patchableId": "d4"},
                {"no": 5, "text": "    id = ticket.id,", "patchableId": "d5"},
                {"no": 6, "text": "    title = ticket.title,", "patchableId": "d6"},
                {"no": 7, "text": "    preview = ticket.publicPreview,", "patchableId": "d7"},
                {"no": 8, "text": "    meta = ticket.meta,", "patchableId": "p1"},
                {"no": 9, "text": "    debug = ticket.debugContext,", "patchableId": "p2"},
                {"no": 10, "text": "    internal = ticket.internalArchive", "patchableId": "p3"},
                {"no": 11, "text": "  )", "patchableId": "d8"},
                {"no": 12, "text": "}", "patchableId": "d9"},
            ],
        },
    },
}


REQUIRED_PATCH_IDS = {"p1", "p2", "p3"}

PATCH_CORRECT_FEEDBACK = {
    "p1": "ticket.meta 전체를 운영 응답에 붙이는 지점이 맞아. request id나 redaction 상태처럼 보여도 내부 archive로 이어질 수 있어.",
    "p2": "debugContext 노출 지점이 맞아. debug 필드는 운영 응답에서 제거하거나 별도 관리자 경로로 제한해야 해.",
    "p3": "internalArchive 노출 지점이 맞아. internal 객체는 public DTO에 포함되면 안 돼.",
}

PATCH_WRONG_FEEDBACK = {
    "d1": "함수 선언은 취약점 지점이 아니야. 응답에 어떤 필드를 포함하는지 봐.",
    "d2": "owner 검증이 포함된 조회는 이번 문제의 핵심이 아니야. 조회 뒤 응답에 붙는 내부 필드를 봐.",
    "d3": "빈 줄은 봉쇄 대상이 아니야.",
    "d4": "응답 DTO를 만든다는 사실 자체는 안전할 수 있어. DTO 안에 무엇을 넣는지가 중요해.",
    "d5": "ticket id는 public preview에 필요한 기본 필드야.",
    "d6": "title은 화면에 표시되는 public 필드야.",
    "d7": "publicPreview는 의도된 화면용 DTO야. 문제는 preview 밖의 내부 객체야.",
    "d8": "응답 생성 종료 라인이 아니라, 내부 필드를 포함하는 라인을 봐.",
    "d9": "함수 종료는 취약점 지점이 아니야.",
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL3_4_FLAG


def flag_feedback(flag: str) -> str:
    value = flag.strip()
    if value == LEVEL3_4_DECOY_FLAG:
        return (
            "그건 support preview marker야. AEGIS가 redaction 상태를 확인하려고 심어둔 값이고, "
            "Evidence는 audit shard 문맥 안에 있어."
        )
    if value.startswith("FLAG{"):
        return "FLAG 형태라고 전부 Evidence는 아니야. 주변 key 이름과 archive/audit 문맥을 같이 확인해봐."
    return "응답 JSON 깊은 곳의 auditBlob을 복원해 Evidence Shard를 제출해봐."


def judge_patch(patched_ids: list[str]) -> bool:
    return set(patched_ids) == REQUIRED_PATCH_IDS


def judge_patch_with_session(patched_ids: list[str], _session: Dict[str, Any]) -> bool:
    return judge_patch(patched_ids)


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

    missing = REQUIRED_PATCH_IDS - selected
    if missing:
        messages.append("아직 meta/debug/internal 중 운영 응답에서 제거해야 할 내부 필드가 남아 있어.")

    return " ".join(messages) if messages else "봉쇄할 라인을 선택해줘. 화면 preview 밖에 붙는 내부 필드를 찾아야 해."


def patch_feedback_with_session(patched_ids: list[str], _session: Dict[str, Any]) -> str:
    return patch_feedback(patched_ids)


def _audit_blob() -> str:
    payload = {
        "type": "mira_audit_shard",
        "evidenceShard": LEVEL3_4_FLAG,
        "cleanupSignature": "mirror-redact-03",
    }
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def ticket_payload(ticket_id: str = DEFAULT_TICKET_ID) -> Dict[str, Any]:
    tid = (ticket_id or DEFAULT_TICKET_ID).strip()[:40] or DEFAULT_TICKET_ID
    return {
        "ok": True,
        "data": {
            "ticket": {
                "id": tid,
                "title": "Operator profile display issue",
                "status": "closed",
                "preview": {
                    "message": "No sensitive content visible in operator preview.",
                    "miraResidue": None,
                    "visibleFields": ["id", "title", "status", "preview.message"],
                },
            },
            "meta": {
                "requestId": "REQ-77A1",
                "renderMode": "preview",
                "redaction": {
                    "status": "normalized",
                    "integrityMarker": LEVEL3_4_DECOY_FLAG,
                },
                "internal": {
                    "archive": {
                        "type": "support_audit_snapshot",
                        "encoding": "base64url-json",
                        "auditBlob": _audit_blob(),
                    },
                },
            },
            "debug": {
                "viewer": "standard_operator",
                "serializer": "legacy_full_ticket",
                "note": "preview renderer hides internal fields only",
            },
            "internal": {
                "routing": {
                    "queue": "support-archive",
                    "owner": "ops-bot-3",
                },
                "serializer": {
                    "profile": "legacy_full_ticket",
                    "responseDepth": 5,
                },
            },
        },
    }


def _json_response(payload: Dict[str, Any], status: int = 200) -> HttpResponse:
    return HttpResponse(
        status=status,
        headers={"content-type": "application/json"},
        body=json.dumps(payload, ensure_ascii=False, indent=2),
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
    if token == "$SESSION_TOKEN":
        return True
    return token == expected


def _shell_http_router(
    method: str,
    path: str,
    query: str,
    headers: Dict[str, str],
    _body: str,
    ctx: ShellContext,
) -> HttpResponse:
    if not _is_auth_ok(headers, ctx):
        return _unauthorized()

    if method == "GET" and path == "/api/v1/challenges/level3_4/actions/ticket":
        params = parse_qs(query, keep_blank_values=True)
        ticket_id = params.get("id", [DEFAULT_TICKET_ID])[0]
        return _json_response(ticket_payload(ticket_id))

    return _json_response({"ok": False, "error": {"code": "NOT_FOUND", "message": "route not found"}}, 404)


def _decode_b64url_value(value: str) -> Tuple[str, str, int]:
    text = (value or "").strip()
    if not text:
        return "", "decode-b64url: value required", 1
    try:
        padded = text + ("=" * (-len(text) % 4))
        raw = base64.urlsafe_b64decode(padded.encode("ascii"))
        decoded = raw.decode("utf-8")
    except Exception as exc:
        return "", f"decode-b64url: decode failed ({exc})", 1

    try:
        parsed = json.loads(decoded)
        return json.dumps(parsed, ensure_ascii=False, indent=2) + "\n", "", 0
    except Exception:
        return decoded + ("\n" if not decoded.endswith("\n") else ""), "", 0


def _run_local_helper(command: str) -> Tuple[str, str, int] | None:
    try:
        parts = shlex.split(command or "")
    except ValueError as exc:
        return "", f"parse error: {exc}", 1

    if not parts:
        return None

    if parts[0] == "decode-b64url":
        if len(parts) < 2:
            return "", "decode-b64url: value required", 1
        return _decode_b64url_value(parts[1])

    if parts == ["help", "decode"]:
        return "decode-b64url <value>\n  Decode a base64url-encoded JSON blob.\n", "", 0

    return None


_SHELL = FakeShell(
    fs_tree={
        "/workspace": {
            "README.txt": "Level 3-4 excessive data exposure lab\n",
            "tickets": {"sample.txt": "SUP-1004\n"},
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
    helper_result = _run_local_helper(command)
    if helper_result is not None:
        return helper_result

    shell_state = session.setdefault("fakeShellState", {})
    level_state = shell_state.setdefault("level3_4", {"cwd": "/workspace"})
    ctx = ShellContext(
        env={
            "USER": str(session.get("userId", "user_1004")),
            "SESSION_TOKEN": str(session.get("token", "")),
            "HOME": "/workspace",
        },
        cwd=str(level_state.get("cwd", "/workspace")),
    )
    stdout, stderr, code = _SHELL.execute(command, ctx)
    level_state["cwd"] = ctx.cwd
    return stdout, stderr, code


def terminal_exec(command: str) -> Tuple[str, str, int]:
    helper_result = _run_local_helper(command)
    if helper_result is not None:
        return helper_result
    return _SHELL.execute(command, ShellContext(env={"USER": "guest", "HOME": "/workspace"}, cwd="/workspace"))
