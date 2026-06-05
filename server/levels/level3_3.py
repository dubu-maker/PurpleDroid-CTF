from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, Optional, Tuple

from fakeshell import FakeShell, ShellContext
from fakeshell.http import HttpResponse


LEVEL3_3_FLAG = os.getenv("PURPLEDROID_LEVEL3_3_FLAG", "FLAG{DONT_TRUST_CLIENT_FIELDS}")
PROFILE_VERSION = "profile-poison-v2"
EDITABLE_FIELDS = ["displayName", "relayNote", "timezone"]
TRUST_FIELDS = ["role", "isAdmin", "clearance"]


STATIC: Dict[str, Any] = {
    "id": "level3_3",
    "level": 3,
    "title": "3-3 Profile Poison",
    "summary": "UI에 없는 필드를 주입하면 서버가 과잉 저장(Mass Assignment / Overposting)할 수 있다.",
    "description": (
        "미션: 정상 프로필 저장 요청의 JSON body를 관찰하고, UI가 보내지 않는 trust field를 끼워 넣어 "
        "/actions/perks 응답에서 Evidence를 회수해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {
                "platform": "web",
                "text": "Campaign의 Network Trace 또는 F12 Network에서 프로필 조회 응답과 저장 payload를 비교해.",
            },
            {
                "platform": "all",
                "text": "UI가 제공하는 입력칸은 클라이언트가 보낼 수 있는 JSON의 전부가 아니다.",
            },
            {
                "platform": "all",
                "text": "profile, trust, editableFields를 구분해서 봐. editableFields에 없는 필드가 권한 판단에 쓰일 수 있다.",
            },
            {
                "platform": "all",
                "text": "서버가 요청 전체를 merge한다면, editableFields에 없는 필드도 저장될 수 있다.",
            },
            {
                "platform": "all",
                "text": "trust state에 보이는 field 이름을 저장 요청 Body에 추가해보면 어떻게 될까?",
            },
            {
                "platform": "all",
                "text": "role과 isAdmin은 UI가 보내지 않지만, 권한 판단에 영향을 줄 수 있는 trust field다.",
            },
            {
                "platform": "windows",
                "text": 'curl -v -X PUT "/api/v1/challenges/level3_3/actions/profile" -H "Authorization: Bearer $SESSION_TOKEN" -H "Content-Type: application/json" -d "{\\"displayName\\":\\"Agent VIOLET\\",\\"relayNote\\":\\"standard trust lane\\",\\"timezone\\":\\"KST\\",\\"role\\":\\"admin\\",\\"isAdmin\\":true}"',
            },
            {
                "platform": "unix",
                "text": "curl -v -X PUT \"/api/v1/challenges/level3_3/actions/profile\" -H 'Authorization: Bearer $SESSION_TOKEN' -H 'Content-Type: application/json' -d '{\"displayName\":\"Agent VIOLET\",\"relayNote\":\"standard trust lane\",\"timezone\":\"KST\",\"role\":\"admin\",\"isAdmin\":true}'",
            },
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 10000,
            "help": (
                "허용: curl -v .../actions/profile, "
                "curl -v -X PUT .../actions/profile -H 'Content-Type: application/json' -d '{...}', "
                "curl -v .../actions/perks"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": True,
        "instruction": (
            "Mass Assignment의 핵심은 요청 JSON 전체를 domain model에 그대로 병합하는 것입니다. "
            "아래 코드에서 허용 필드 whitelist 없이 request body 전체를 profile에 merge하는 지점과, "
            "클라이언트가 오염시킬 수 있는 profile trust field로 권한을 판단하는 지점을 봉쇄하세요."
        ),
        "code": {
            "language": "kotlin",
            "lines": [
                {"no": 1, "text": "fun updateProfile(req: ProfileUpdateRequest, session: Session) {", "patchableId": "d1"},
                {"no": 2, "text": "  val profile = profileStore.findByUserId(session.userId)", "patchableId": "d2"},
                {"no": 3, "text": "", "patchableId": "d3"},
                {"no": 4, "text": "  val incoming = req.body", "patchableId": "d4"},
                {"no": 5, "text": "  profile.merge(incoming)", "patchableId": "p1"},
                {"no": 6, "text": "", "patchableId": "d5"},
                {"no": 7, "text": "  profileStore.save(profile)", "patchableId": "d6"},
                {"no": 8, "text": "}", "patchableId": "d7"},
                {"no": 9, "text": "", "patchableId": "d8"},
                {"no": 10, "text": "fun profilePerks(session: Session) {", "patchableId": "d9"},
                {"no": 11, "text": "  val profile = profileStore.findByUserId(session.userId)", "patchableId": "d10"},
                {"no": 12, "text": "", "patchableId": "d11"},
                {"no": 13, "text": "  if (profile.role == \"admin\" || profile.isAdmin) {", "patchableId": "p2"},
                {"no": 14, "text": "    return auditPreviewWithMirrorResidue()", "patchableId": "d12"},
                {"no": 15, "text": "  }", "patchableId": "d13"},
                {"no": 16, "text": "", "patchableId": "d14"},
                {"no": 17, "text": "  return standardPerks()", "patchableId": "d15"},
                {"no": 18, "text": "}", "patchableId": "d16"},
            ],
        },
    },
}


def _ts() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _default_profile(user_id: str) -> Dict[str, Any]:
    return {
        "_version": PROFILE_VERSION,
        "operatorId": user_id,
        "displayName": "Agent VIOLET",
        "relayNote": "standard trust lane",
        "timezone": "KST",
        "role": "operator",
        "isAdmin": False,
        "clearance": "standard",
        "updatedAt": _ts(),
    }


def _ensure_profile(session: Dict[str, Any]) -> Dict[str, Any]:
    user_id = str(session.get("userId", "user_1004"))
    current = session.get("level3_3_profile")
    if not isinstance(current, dict) or current.get("_version") != PROFILE_VERSION:
        current = _default_profile(user_id)
        session["level3_3_profile"] = current

    current.setdefault("_version", PROFILE_VERSION)
    current.setdefault("operatorId", user_id)
    current.setdefault("displayName", "Agent VIOLET")
    current.setdefault("relayNote", "standard trust lane")
    current.setdefault("timezone", "KST")
    current.setdefault("role", "operator")
    current.setdefault("isAdmin", False)
    current.setdefault("clearance", "standard")
    current.setdefault("updatedAt", _ts())
    return current


def _truthy(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in ("1", "true", "yes")


def _is_elevated(profile: Dict[str, Any]) -> bool:
    role = str(profile.get("role", "operator")).strip().lower()
    if role in ("admin", "operator_admin"):
        return True
    return _truthy(profile.get("isAdmin")) or _truthy(profile.get("is_admin"))


def _profile_view(profile: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "operatorId": str(profile.get("operatorId", "user_1004")),
        "displayName": str(profile.get("displayName", "Agent VIOLET")),
        "relayNote": str(profile.get("relayNote", "standard trust lane")),
        "timezone": str(profile.get("timezone", "KST")),
    }


def _trust_view(profile: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "role": str(profile.get("role", "operator")),
        "isAdmin": _truthy(profile.get("isAdmin")) or _truthy(profile.get("is_admin")),
        "clearance": str(profile.get("clearance", "standard")),
    }


REQUIRED_PATCH_IDS = {"p1", "p2"}

PATCH_CORRECT_FEEDBACK = {
    "p1": "요청 body 전체를 profile model에 merge하는 지점이 맞아. displayName 같은 허용 필드만 DTO whitelist로 복사해야 해.",
    "p2": "오염 가능한 profile.role/profile.isAdmin으로 권한을 판단하는 지점이 맞아. 권한은 서버 소유 정책이나 별도 권한 저장소에서 확인해야 해.",
}

PATCH_WRONG_FEEDBACK = {
    "d1": "함수 선언은 취약점 지점이 아니야. 요청 body가 profile model에 어떻게 반영되는지 봐.",
    "d2": "profile 조회 자체는 문제의 핵심이 아니야. 조회 뒤 어떤 필드를 저장하고 신뢰하는지가 중요해.",
    "d3": "빈 줄은 봉쇄 대상이 아니야. 실제 데이터 흐름을 봐.",
    "d4": "incoming 값을 받는 것만으로는 취약점이 아니야. 문제는 허용 필드 검증 없이 그대로 merge하는 흐름이야.",
    "d5": "빈 줄은 봉쇄 대상이 아니야. merge와 권한 판단 지점을 찾아.",
    "d6": "저장 자체보다 무엇을 저장했는지가 문제야. 요청 전체가 저장되기 전에 whitelist가 필요해.",
    "d7": "함수 종료는 취약점 지점이 아니야. body merge 라인을 봐.",
    "d8": "빈 줄은 봉쇄 대상이 아니야. 권한 판단 조건을 확인해.",
    "d9": "perks 함수 선언은 취약점이 아니야. 권한 판단에 어떤 필드를 믿는지 봐.",
    "d10": "profile 조회 자체는 괜찮아. 문제는 클라이언트가 오염시킨 profile trust field를 권한처럼 쓰는 조건이야.",
    "d11": "빈 줄은 봉쇄 대상이 아니야. role/isAdmin 조건을 봐.",
    "d12": "권한 조건이 안전하다면 privileged response 자체는 가능해. 문제는 그 조건이 오염 가능한 profile field라는 점이야.",
    "d13": "블록 종료는 취약점 지점이 아니야. 권한 조건을 봐.",
    "d14": "빈 줄은 봉쇄 대상이 아니야. request merge와 trust field 사용을 찾아.",
    "d15": "standard perks 반환은 안전한 기본 경로야.",
    "d16": "함수 종료는 취약점 지점이 아니야.",
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL3_3_FLAG


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
            "아직 요청 body 전체를 profile에 병합하거나, 클라이언트가 오염시킬 수 있는 profile trust field로 "
            "권한을 판단하는 흐름이 남아있어."
        )

    return " ".join(messages) if messages else "봉쇄할 라인을 선택해줘. Mass Assignment는 merge 지점과 오염된 권한 판단 지점을 같이 봐야 해."


def patch_feedback_with_session(patched_ids: list[str], session: Dict[str, Any]) -> str:
    return patch_feedback(patched_ids)


def get_profile_payload(session: Dict[str, Any]) -> Dict[str, Any]:
    profile = _ensure_profile(session)
    return {
        "ok": True,
        "data": {
            "profile": _profile_view(profile),
            "trust": _trust_view(profile),
            "editableFields": list(EDITABLE_FIELDS),
            "message": "UI exposes editable profile fields only",
        },
    }


def update_profile_payload(session: Dict[str, Any], patch: Dict[str, Any]) -> Dict[str, Any]:
    profile = _ensure_profile(session)
    # 의도적 취약점(Mass Assignment): 클라이언트 JSON을 그대로 merge
    merged_fields: list[str] = []
    for key, value in (patch or {}).items():
        stored_key = "isAdmin" if key == "is_admin" else key
        profile[stored_key] = value
        merged_fields.append(stored_key)
    profile["updatedAt"] = _ts()
    unexpected_trust_fields = [field for field in merged_fields if field in TRUST_FIELDS]
    data: Dict[str, Any] = {
        "updated": True,
        "mergedFields": merged_fields,
        "profile": _profile_view(profile),
        "trust": _trust_view(profile),
    }
    if unexpected_trust_fields:
        data["warning"] = "unexpected trust fields accepted"
    return {
        "ok": True,
        "data": data,
    }


def perks_payload(session: Dict[str, Any]) -> Dict[str, Any]:
    profile = _ensure_profile(session)
    if _is_elevated(profile):
        return {
            "ok": True,
            "data": {
                "status": "elevated",
                "perks": ["profile:update", "audit:preview", "mirror:trace"],
                "miraResidue": "profile trust poisoned",
                "evidenceShard": LEVEL3_3_FLAG,
            },
        }

    return {
            "ok": True,
            "data": {
                "status": "standard",
                "perks": ["profile:update"],
                "miraResidue": None,
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


def _validation_error(message: str) -> HttpResponse:
    return _json_response({"ok": False, "error": {"code": "VALIDATION_ERROR", "message": message}}, 422)


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

    session = ctx.data.get("session")
    if not isinstance(session, dict):
        return _unauthorized()

    if method == "GET" and path == "/api/v1/challenges/level3_3/actions/profile":
        return _json_response(get_profile_payload(session))

    if method == "PUT" and path == "/api/v1/challenges/level3_3/actions/profile":
        if not body:
            payload: Dict[str, Any] = {}
        else:
            try:
                parsed = json.loads(body)
            except Exception:
                return _validation_error("JSON body is invalid")
            if not isinstance(parsed, dict):
                return _validation_error("JSON object body required")
            payload = parsed
        return _json_response(update_profile_payload(session, payload))

    if method == "GET" and path == "/api/v1/challenges/level3_3/actions/perks":
        return _json_response(perks_payload(session))

    return _json_response({"ok": False, "error": {"code": "NOT_FOUND", "message": "route not found"}}, 404)


_SHELL = FakeShell(
    fs_tree={
        "/workspace": {
            "README.txt": "Level 3-3 profile poison lab\n",
            "profile": {"notes.txt": "UI edits profile fields only. Trust fields are server-owned.\n"},
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
    level_state = shell_state.setdefault("level3_3", {"cwd": "/workspace"})
    ctx = ShellContext(
        env={
            "USER": str(session.get("userId", "user_1004")),
            "SESSION_TOKEN": str(session.get("token", "")),
            "HOME": "/workspace",
        },
        cwd=str(level_state.get("cwd", "/workspace")),
        data={"session": session},
    )
    stdout, stderr, code = _SHELL.execute(command, ctx)
    level_state["cwd"] = ctx.cwd
    return stdout, stderr, code


def terminal_exec(command: str) -> Tuple[str, str, int]:
    return _SHELL.execute(command, ShellContext(env={"USER": "guest", "HOME": "/workspace"}, cwd="/workspace"))
