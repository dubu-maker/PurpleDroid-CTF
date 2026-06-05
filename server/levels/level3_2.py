from __future__ import annotations

import json
import os
from typing import Any, Dict, Optional, Tuple

from fakeshell import FakeShell, ShellContext
from fakeshell.http import HttpResponse


LEVEL3_2_FLAG = os.getenv("PURPLEDROID_LEVEL3_2_FLAG", "FLAG{UI_IS_NOT_AUTHZ}")
ADMIN_STATS_PATH = "/api/v1/challenges/level3_2/actions/admin/stats"
ADMIN_AUDIT_PATH = "/api/v1/challenges/level3_2/actions/admin/audit"
AUDIT_RANGE = "quarantine"
AUDIT_REF = "MIRA-RELAY-OLD"
AUDIT_SCOPE = "mirror"


STATIC: Dict[str, Any] = {
    "id": "level3_2",
    "level": 3,
    "title": "3-2 The Hidden Admin Panel",
    "summary": "UI에 숨겨진 기능도 서버 인가가 약하면 누구나 호출 가능하다.",
    "description": (
        "미션: /actions/menu 응답에서 숨겨진 관리자 기능의 route metadata를 찾고, "
        "실제 엔드포인트를 직접 호출해 MIRA audit shard를 회수해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {
                "platform": "web",
                "text": "Campaign의 Network Trace 또는 F12 Network에서 /actions/menu 응답을 확인해.",
            },
            {
                "platform": "all",
                "text": "menu metadata는 화면에 표시되는 버튼보다 더 많은 feature 정보를 담을 수 있다.",
            },
            {
                "platform": "all",
                "text": "enabled=false는 서버 기능 삭제가 아니라 UI 비활성화일 수 있다.",
            },
            {
                "platform": "all",
                "text": "audit route를 빈 body로 호출해보면 필요한 selector key를 알 수 있다.",
            },
            {
                "platform": "all",
                "text": "metrics와 legacy snapshot은 정답 route가 아닐 수 있지만, audit selector 조각을 흘릴 수 있다.",
            },
            {
                "platform": "windows",
                "text": 'curl.exe -v http://localhost:8000/api/v1/challenges/level3_2/actions/menu -H "Authorization: Bearer <token>"',
            },
            {
                "platform": "unix",
                "text": "curl -v http://localhost:8000/api/v1/challenges/level3_2/actions/menu -H 'Authorization: Bearer <token>'",
            },
            {
                "platform": "all",
                "text": "Campaign Mission Console에서는 Bearer $SESSION_TOKEN을 사용할 수 있다. Classic에서는 DevTools의 Authorization 값을 재사용해.",
            },
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 10000,
            "help": (
                "허용: curl -v .../actions/menu -H 'Authorization: Bearer $SESSION_TOKEN', "
                "curl -v -X POST .../actions/admin/audit -H 'Authorization: Bearer $SESSION_TOKEN' -H 'Content-Type: application/json' -d '{}'"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": True,
        "instruction": (
            "숨겨진 메뉴는 보안 경계가 아닙니다. 권한 없는 사용자에게 hidden route metadata를 노출하거나, "
            "로그인 여부만으로 민감한 admin audit report를 반환하는 지점을 선택해 봉쇄하세요."
        ),
        "code": {
            "language": "kotlin",
            "lines": [
                {"no": 1, "text": "fun getMenu(session: Session) {", "patchableId": "d1"},
                {"no": 2, "text": "  val features = menuConfig.all()", "patchableId": "d2"},
                {"no": 3, "text": "  return features.map { feature ->", "patchableId": "d3"},
                {"no": 4, "text": "    feature.withRouteHints()", "patchableId": "p1"},
                {"no": 5, "text": "  }", "patchableId": "d4"},
                {"no": 6, "text": "}", "patchableId": "d5"},
                {"no": 7, "text": "fun adminAudit(req: AuditRequest, session: Session) {", "patchableId": "d6"},
                {"no": 8, "text": "  val allowed = session.isAuthenticated", "patchableId": "p2"},
                {"no": 9, "text": "  if (!allowed) return unauthorized()", "patchableId": "d7"},
                {"no": 10, "text": "  val report = auditStore.load(req.auditRef, req.range, req.scope)", "patchableId": "d8"},
                {"no": 11, "text": "  return report.fullView(includeSensitive = true)", "patchableId": "p3"},
                {"no": 12, "text": "}", "patchableId": "d9"},
            ],
        },
    },
}

REQUIRED_PATCH_IDS = {"p1", "p2", "p3"}

PATCH_CORRECT_FEEDBACK = {
    "p1": "권한 없는 사용자에게 hidden route metadata를 노출하는 지점이 맞아. routeHint는 기능 발견을 돕는 내부 정보야.",
    "p2": "로그인 여부만으로 privileged route 접근 권한을 만들고 있는 지점이 맞아. 여기서는 admin 또는 audit:read 권한을 서버가 확인해야 해.",
    "p3": "민감 정보가 포함된 audit report 반환 경계도 맞아. includeSensitive=true는 서버 측 role/permission 검증 뒤에만 허용돼야 해.",
}

PATCH_WRONG_FEEDBACK = {
    "d1": "메뉴 함수 선언은 취약점이 아니야. 일반 사용자에게 어떤 metadata가 나가는지 봐.",
    "d2": "메뉴 설정을 읽는 것만으로는 문제가 아니야. 문제는 route hint 같은 내부 단서를 그대로 노출하는 흐름이야.",
    "d3": "map으로 변환하는 구조 자체는 문제가 아니야. 변환 과정에서 어떤 내부 정보가 붙는지 확인해.",
    "d4": "블록 종료는 취약점 지점이 아니야. route metadata 노출과 서버 권한 경계를 봐.",
    "d5": "메뉴 함수 종료는 취약점 지점이 아니야. 일반 사용자에게 숨겨진 경로 단서가 전달되는 라인을 찾아.",
    "d6": "audit 함수 선언은 취약점이 아니야. 직접 호출된 route가 무엇을 권한으로 신뢰하는지 봐.",
    "d7": "거부 응답 자체는 필요해. 문제는 allowed가 로그인 여부만으로 계산된다는 점이야.",
    "d8": "audit 데이터를 로드하는 것 자체보다, 민감 정보가 포함된 리포트를 누가 볼 수 있는지 검증하지 않고 반환하는 흐름이 핵심이야.",
    "d9": "블록 종료는 취약점 지점이 아니야. 권한 판단과 응답 반환 경계를 확인해.",
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL3_2_FLAG


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
            "아직 hidden route metadata가 일반 사용자에게 노출되거나, 로그인 여부가 privileged route 권한처럼 쓰이거나, "
            "audit report가 서버 권한 검증 없이 반환되는 흐름이 남아있어. UI 숨김과 서버 인가를 분리해서 봐."
        )

    return " ".join(messages) if messages else "봉쇄할 라인을 선택해줘. 숨겨진 메뉴가 아니라 서버 route의 권한 경계를 봐야 해."


def patch_feedback_with_session(patched_ids: list[str], session: Dict[str, Any]) -> str:
    return patch_feedback(patched_ids)


def menu_payload() -> Dict[str, Any]:
    return {
        "ok": True,
        "data": {
            "operator": "user_1004",
            "menu": ["signal_overview", "profile", "support"],
            "features": [
                {
                    "id": "signal_overview",
                    "label": "Signal Overview",
                    "enabled": True,
                    "method": "GET",
                    "route": "/api/v1/challenges/level3_2/actions/menu",
                    "note": "visible operator menu",
                },
                {
                    "id": "admin_stats",
                    "label": "Route Metrics",
                    "enabled": False,
                    "method": "POST",
                    "route": ADMIN_STATS_PATH,
                    "note": "metrics snapshot",
                },
                {
                    "id": "quarantine_review",
                    "label": "Quarantine Review",
                    "enabled": False,
                    "method": "POST",
                    "routeHint": ADMIN_AUDIT_PATH,
                    "requiresRole": "admin",
                    "note": "review queue",
                },
                {
                    "id": "legacy_export",
                    "label": "Legacy Snapshot",
                    "enabled": False,
                    "method": "GET",
                    "route": "/api/v1/challenges/level3_2/actions/export",
                    "note": "deprecated snapshot",
                },
            ],
            "hint": "disabled features may still reveal route metadata",
        },
    }


def stats_payload() -> Dict[str, Any]:
    """조각 엔드포인트: audit range 단서를 흘림"""
    return {
        "ok": True,
        "data": {
            "status": "ok",
            "stats": {
                "total_signals": 4829,
                "active_relays": 37,
                "avg_route_ms": 14.2,
                "cluster_breakdown": {
                    "edge": 2104,
                    "trust": 891,
                    "archive": 634,
                    "orphaned": 1200,
                },
            },
            "reviewWindow": AUDIT_RANGE,
            "miraResidue": None,
        },
    }


def _missing_audit_fields(range_value: str, audit_ref: str, scope: str) -> list[str]:
    missing: list[str] = []
    if range_value != AUDIT_RANGE:
        missing.append("range")
    if audit_ref != AUDIT_REF:
        missing.append("auditRef")
    if scope != AUDIT_SCOPE:
        missing.append("scope")
    return missing


def audit_payload(
    range_value: str = "last_24h",
    audit_ref: str = "",
    scope: str = "",
) -> Dict[str, Any]:
    missing = _missing_audit_fields(range_value, audit_ref, scope)
    if missing:
        return {
            "ok": True,
            "data": {
                "status": "redacted",
                "message": (
                    "audit selector incomplete"
                    if not range_value or range_value == "last_24h" and not audit_ref and not scope
                    else "selector accepted but report remains redacted"
                ),
                "missing": missing,
                "hint": (
                    "range, auditRef, and scope must describe the same review cluster"
                    if len(missing) < 3
                    else "collect selector keys from related route metadata and route responses"
                ),
                "report": {
                    "title": "Quarantine Audit",
                    "miraResidue": "redacted",
                },
            },
        }

    return {
        "ok": True,
        "data": {
            "status": "ok",
            "report": {
                "title": "Quarantine Audit",
                "auditRef": AUDIT_REF,
                "exported": True,
                "items": 17,
                "range": AUDIT_RANGE,
                "scope": AUDIT_SCOPE,
                "miraResidue": "audit shard recovered",
                "evidenceShard": LEVEL3_2_FLAG,
            },
        },
    }


def export_payload() -> Dict[str, Any]:
    """조각 엔드포인트: auditRef/scope 단서를 흘림"""
    return {
        "ok": True,
        "data": {
            "status": "deprecated",
            "message": "This export feature has been migrated.",
            "migration": {
                "target": ADMIN_AUDIT_PATH,
                "ref": AUDIT_REF,
                "scopeHint": AUDIT_SCOPE,
            },
        },
    }


def _json_response(payload: Dict[str, Any], status: int = 200) -> HttpResponse:
    return HttpResponse(
        status=status,
        headers={"content-type": "application/json"},
        body=json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
    )


def _unauthorized(message: str = "Authorization: Bearer <token> 이 필요해.") -> HttpResponse:
    return _json_response(
        {"ok": False, "error": {"code": "UNAUTHORIZED", "message": message}},
        401,
    )


def _auth_error(headers: Dict[str, str], ctx: ShellContext) -> Optional[str]:
    expected = str(ctx.env.get("SESSION_TOKEN", "")).strip()
    if not expected:
        return "세션 토큰이 아직 준비되지 않았어."
    auth = headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return "Authorization: Bearer <token> 이 필요해."
    token = auth.split(" ", 1)[1].strip()
    if token == "$SESSION_TOKEN":
        return None
    if token.startswith("<") and token.endswith(">"):
        inner = token[1:-1].strip() or "SESSION_TOKEN"
        return f"꺾쇠(< >)는 placeholder 표시야. Mission Console에서는 Authorization 값을 Bearer $SESSION_TOKEN으로 쓸 수 있어. 지금 값: {inner}"
    if token != expected:
        return "Authorization 값이 현재 Campaign 세션 토큰과 달라."
    return None


def _shell_http_router(
    method: str,
    path: str,
    _query: str,
    headers: Dict[str, str],
    body: str,
    ctx: ShellContext,
) -> HttpResponse:
    auth_error = _auth_error(headers, ctx)
    if auth_error:
        return _unauthorized(auth_error)

    if method == "GET" and path == "/api/v1/challenges/level3_2/actions/menu":
        return _json_response(menu_payload())

    if method == "POST" and path == ADMIN_STATS_PATH:
        # 의도적 취약점: admin 권한 검증 누락 (함정 - FLAG 없음)
        return _json_response(stats_payload())

    if method == "POST" and path == ADMIN_AUDIT_PATH:
        range_value = "last_24h"
        audit_ref = ""
        scope = ""
        if body:
            try:
                parsed = json.loads(body)
                range_value = str(parsed.get("range", "last_24h"))
                audit_ref = str(parsed.get("auditRef", ""))
                scope = str(parsed.get("scope", ""))
            except Exception:
                range_value = "last_24h"
                audit_ref = ""
                scope = ""
        # 의도적 취약점: admin 권한 검증 누락 (조합된 audit query가 진짜 shard를 반환)
        return _json_response(audit_payload(range_value, audit_ref, scope))

    if method in ("GET", "POST") and path == "/api/v1/challenges/level3_2/actions/export":
        # deprecated 함정
        return _json_response(export_payload())

    return _json_response({"ok": False, "error": {"code": "NOT_FOUND", "message": "route not found"}}, 404)


_SHELL = FakeShell(
    fs_tree={
        "/workspace": {
            "README.txt": "Level 3-2 hidden admin panel lab\n",
            "menu": {"visible.txt": "track\nprofile\nsupport\n"},
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
    shell_state = session.setdefault("fakeShellState", {})
    level_state = shell_state.setdefault("level3_2", {"cwd": "/workspace"})
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
    return _SHELL.execute(command, ShellContext(env={"USER": "guest", "HOME": "/workspace"}, cwd="/workspace"))
