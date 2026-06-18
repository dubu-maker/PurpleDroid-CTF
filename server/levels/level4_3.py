from __future__ import annotations

import json
import os
import re
import time
from typing import Any, Dict, Tuple

from fakeshell import FakeShell, ShellContext
from fakeshell.http import HttpResponse


LEVEL4_3_FLAG = os.getenv("PURPLEDROID_LEVEL4_3_FLAG", "FLAG{REPLAY_NEEDS_IDEMPOTENCY}")
STAMP_TARGET = int(os.getenv("PURPLEDROID_LEVEL4_3_TARGET", "5"))
BURST_WINDOW_SEC = int(os.getenv("PURPLEDROID_LEVEL4_3_WINDOW_SEC", "5"))


def _event_template(event_id: str) -> str:
    """event_id에서 숫자 런(run)을 '#'로 정규화한 형태.

    EVT-2026-DEL-001 / EVT-2026-DEL-002 처럼 숫자만 바뀐 시퀀스는
    동일 템플릿(EVT-#-DEL-#)으로 묶인다. 모양 자체를 바꿔야 다른 템플릿이 된다.
    """
    return re.sub(r"\d+", "#", str(event_id or "").strip())


STATIC: Dict[str, Any] = {
    "id": "level4_3",
    "level": 4,
    "title": "4-3 REPLAY STAMP",
    "summary": "event_id 템플릿·routing leg 가드를 둘 다 붙여도 논리적 배송 단위의 idempotency가 없으면 위장 재전송으로 stamp가 누적된다.",
    "description": (
        "미션: 첫 stamp가 타이머를 연다. 서버는 두 개의 순진한 가드를 둔다 — "
        "(1) 숫자만 바꾼 event_id는 같은 '템플릿'으로 정규화되고, (2) routing leg(via)가 없거나 "
        "이미 쓴 값이면 거부된다. "
        f"event_id 모양과 via를 둘 다 제각각으로 위장한 delivered 이벤트를 {BURST_WINDOW_SEC}초 안에 "
        f"{STAMP_TARGET}회 누적해 stamps 응답에서 FLAG를 회수해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {"platform": "all", "text": "첫 stamp가 타이머 시작점이다. 시간 창 안에서 목표 횟수를 채워야 한다."},
            {"platform": "all", "text": f"제한 시간({BURST_WINDOW_SEC}초)을 넘기면 timeout과 함께 카운터가 리셋된다."},
            {"platform": "all", "text": "EVT-2026-DEL-001, -002 처럼 숫자만 바꾸면 같은 템플릿(EVT-#-DEL-#)으로 묶여 거부돼. event_id 모양 자체를 바꿔야 한다."},
            {"platform": "all", "text": "via(routing leg)는 매 요청 제각각이어야 한다. 빠뜨리거나 재탕하면 'normalized' 응답으로 거부된다."},
            {"platform": "all", "text": "Mission Console은 &&, for i in $(seq 1 5); do ...; done, echo \"a b\" | xargs -I {} ... 같은 제한된 조합을 지원한다."},
            {"platform": "web", "text": "Network에서 응답의 guard/credited/stampCount 변화를 관찰하며 무엇이 막히는지 확인해."},
            {
                "platform": "windows",
                "text": 'curl -s -X POST /api/v1/challenges/level4_3/actions/event/delivered -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\\"event_id\\":\\"rcpt-seoul-7\\",\\"parcel_id\\":\\"PD-1004\\",\\"status\\":\\"delivered\\",\\"via\\":\\"seoul\\"}"',
            },
            {
                "platform": "windows",
                "text": 'curl -s /api/v1/challenges/level4_3/actions/stamps -H "Authorization: Bearer <token>"',
            },
            {"platform": "all", "text": 'echo "seoul busan daegu incheon gwangju" | xargs -I{} curl ... -d \'{"event_id":"rcpt-{}-7","parcel_id":"PD-1004","status":"delivered","via":"{}"}\' 처럼 단어 리스트로 두 필드를 동시에 위장해봐.'},
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 18000,
            "help": (
                "허용: curl -X POST .../actions/event/delivered -H 'Authorization: Bearer <token>' "
                "-H 'Content-Type: application/json' -d '{\"event_id\":\"rcpt-<도시>-7\",\"parcel_id\":\"PD-1004\",\"status\":\"delivered\",\"via\":\"<도시>\"}', "
                "curl .../actions/stamps, curl ... && curl ..., for i in $(seq 1 5); do ...; done, "
                "echo \"...\" | xargs -I{} curl ..."
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": True,
        "instruction": (
            "event_id만 보는 중복 검사로는 부족합니다. 같은 parcel/status 전환이 여러 event_id로 "
            "반복 처리되지 않도록 논리적 배송 단위의 idempotency와 서버 상태 전환 검증을 강제하세요."
        ),
        "code": {
            "language": "policy",
            "lines": [
                {"no": 1, "text": "Enforce idempotency per logical delivery", "patchableId": "policy_logical_idempotency"},
                {"no": 2, "text": "Persist processed event IDs", "patchableId": "policy_persist_event_ids"},
                {"no": 3, "text": "Reject duplicate state transition", "patchableId": "policy_reject_duplicate_state"},
                {"no": 4, "text": "Verify server-side state transition", "patchableId": "policy_verify_server_state"},
                {"no": 5, "text": "Add replay window audit", "patchableId": "policy_replay_window_audit"},
                {"no": 6, "text": "Rate limit burst events as support", "patchableId": "bonus_rate_limit_burst"},
                {"no": 7, "text": "Check event_id format only", "patchableId": "decoy_event_id_format"},
                {"no": 8, "text": "Increase window to 30s", "patchableId": "decoy_increase_window"},
                {"no": 9, "text": "Hide stamps endpoint", "patchableId": "decoy_hide_stamps"},
                {"no": 10, "text": "Require UI button", "patchableId": "decoy_require_ui"},
            ],
        },
    },
}


REQUIRED_PATCH_IDS = {
    "policy_logical_idempotency",
    "policy_persist_event_ids",
    "policy_reject_duplicate_state",
    "policy_verify_server_state",
    "policy_replay_window_audit",
}

BONUS_PATCH_IDS = {"bonus_rate_limit_burst"}
PATCH_ID_ALIASES = {"decoy_trust_status": "policy_verify_server_state"}

PATCH_CORRECT_FEEDBACK = {
    "policy_logical_idempotency": "맞아. event_id가 달라도 parcel/status 같은 논리적 배송 단위는 한 번만 처리해야 해.",
    "policy_persist_event_ids": "맞아. 처리한 event_id는 서버 저장소에 남겨 재사용을 거부해야 해.",
    "policy_reject_duplicate_state": "맞아. 이미 delivered인 parcel을 다시 delivered로 stamp 처리하면 안 돼.",
    "policy_verify_server_state": "맞아. status=delivered는 클라이언트 주장이라 서버의 현재 상태와 허용 전환 규칙으로 검증해야 해.",
    "policy_replay_window_audit": "맞아. 짧은 시간 창의 재전송 패턴은 감사 로그와 알림으로 남겨야 해.",
    "bonus_rate_limit_burst": "좋아. burst rate limit은 보조 방어로는 의미가 있어. 다만 느리게 반복되는 replay까지 막으려면 idempotency가 필요해.",
}

PATCH_WRONG_FEEDBACK = {
    "decoy_event_id_format": "event_id 템플릿 정규화나 via(routing leg) 가드 같은 표면 검사는, 모양과 경로를 바꾼 위장 재전송을 막지 못해. 이번 공격이 바로 그걸 뚫은 거야.",
    "decoy_increase_window": "window를 늘리면 공격자가 더 오래 stamp를 누적할 수 있어. 봉쇄가 아니라 완화 반대야.",
    "decoy_hide_stamps": "stamps endpoint를 숨겨도 delivered event 처리 로직의 중복 처리는 그대로 남아.",
    "decoy_require_ui": "UI 버튼을 요구해도 API 재전송은 막지 못해. 서버가 상태 전환을 검증해야 해.",
}

PATCH_MISSING_LABELS = {
    "policy_logical_idempotency": "논리적 배송 단위 idempotency",
    "policy_persist_event_ids": "processed event_id 저장",
    "policy_reject_duplicate_state": "중복 상태 전환 거부",
    "policy_verify_server_state": "서버 상태 전환 검증",
    "policy_replay_window_audit": "replay window audit",
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL4_3_FLAG


def flag_feedback(flag: str) -> str:
    value = flag.strip()
    if value.startswith("FLAG{"):
        return "아직 Stamp Vault가 Evidence를 열지 않았어. delivered 이벤트 재전송과 stamps 응답을 먼저 연결해봐."
    return "이 미션은 curl로 stamp 상태를 만들고, Stamp Vault에서 Evidence를 회수하는 흐름이야."


def judge_patch(patched: list[str]) -> bool:
    selected = {PATCH_ID_ALIASES.get(pid, pid) for pid in patched}
    return REQUIRED_PATCH_IDS.issubset(selected) and not (selected - REQUIRED_PATCH_IDS - BONUS_PATCH_IDS)


def patch_feedback(patched: list[str]) -> str:
    normalized = [PATCH_ID_ALIASES.get(pid, pid) for pid in patched]
    selected = set(normalized)
    messages: list[str] = []
    seen: set[str] = set()

    for pid in normalized:
        if pid in seen:
            continue
        seen.add(pid)
        if pid in PATCH_CORRECT_FEEDBACK:
            messages.append(PATCH_CORRECT_FEEDBACK[pid])
        elif pid in PATCH_WRONG_FEEDBACK:
            messages.append(PATCH_WRONG_FEEDBACK[pid])

    missing = REQUIRED_PATCH_IDS - selected
    if missing:
        missing_names = ", ".join(PATCH_MISSING_LABELS[pid] for pid in sorted(missing))
        messages.append(f"아직 닫히지 않은 통제가 있어: {missing_names}.")

    extra_wrong = selected - REQUIRED_PATCH_IDS - BONUS_PATCH_IDS
    if extra_wrong:
        messages.append("decoy는 빼고, 재전송을 실제로 차단하는 서버 측 control만 남겨봐.")

    return "\n".join(messages) if messages else "정책 카드를 선택해줘. event_id 중복과 논리적 배송 중복을 함께 닫아야 해."


def _level_state(session: Dict[str, Any]) -> Dict[str, Any]:
    st = session.setdefault("level4_3", {})
    st.setdefault("stampCount", 0)
    st.setdefault("events", [])
    st.setdefault("seenEventIds", [])
    st.setdefault("creditedTemplates", [])
    st.setdefault("creditedRoutes", [])
    st.setdefault("windowStartAt", 0)
    st.setdefault("windowExpiresAt", 0)
    st.setdefault("lastTimeoutAt", 0)
    return st


def _reset_window(st: Dict[str, Any], now: int) -> None:
    st["stampCount"] = 0
    st["events"] = []
    st["seenEventIds"] = []
    st["creditedTemplates"] = []
    st["creditedRoutes"] = []
    st["windowStartAt"] = 0
    st["windowExpiresAt"] = 0
    st["lastTimeoutAt"] = now


def _clear_idle_ledger(st: Dict[str, Any]) -> None:
    if not st.get("windowExpiresAt") and int(st.get("stampCount") or 0) == 0:
        st["events"] = []
        st["seenEventIds"] = []
        st["creditedTemplates"] = []
        st["creditedRoutes"] = []


def _has_placeholder(*values: str) -> bool:
    joined = " ".join(str(value or "") for value in values)
    lowered = joined.lower()
    return "<" in joined or ">" in joined or "change_me" in lowered or "todo" in lowered


def delivered_event_payload(
    session: Dict[str, Any],
    event_id: str,
    parcel_id: str,
    status: str,
    via: str = "",
) -> Dict[str, Any]:
    st = _level_state(session)
    _clear_idle_ledger(st)
    now = int(time.time())

    event_id_norm = str(event_id or "").strip()
    parcel_id_norm = str(parcel_id or "").strip()
    status_norm = str(status or "").strip().lower()
    via_norm = str(via or "").strip().lower()
    if not event_id_norm or not parcel_id_norm:
        return {
            "ok": False,
            "error": {"code": "VALIDATION_ERROR", "message": "event_id/parcel_id가 필요해."},
        }

    duplicate = event_id_norm in st["seenEventIds"]

    timed_out = bool(st["windowExpiresAt"] and now > st["windowExpiresAt"])
    if timed_out:
        _reset_window(st, now)

    accepted = status_norm == "delivered"

    template = _event_template(event_id_norm)
    template_dup = template in st["creditedTemplates"]
    route_missing = via_norm == ""
    route_dup = (not route_missing) and via_norm in st["creditedRoutes"]
    draft_placeholder = _has_placeholder(event_id_norm, via_norm)

    # 순진한 가드(naive heuristic) 두 개:
    #  1) event_id "템플릿"(숫자 정규화)이 이미 stamp된 것과 같으면 거부
    #  2) routing leg(via)가 없거나 이미 stamp된 것과 같으면 거부
    #
    # intentional vulnerability:
    # 가드를 둘 붙여도 논리적 배송 단위(parcel/status 전환)에 묶인 idempotency가 없다.
    # event_id 모양과 via를 둘 다 제각각으로 위장하면 같은 배송을 계속 stamp 처리할 수 있다.
    credited = False
    guard = None
    if accepted and not duplicate:
        if draft_placeholder:
            guard = "draft_placeholder"
        elif route_missing:
            guard = "route_missing"
        elif template_dup:
            guard = "template_dup"
        elif route_dup:
            guard = "route_dup"
        else:
            if not st["windowStartAt"]:
                st["windowStartAt"] = now
                st["windowExpiresAt"] = now + BURST_WINDOW_SEC
            st["stampCount"] += 1
            credited = True
            st["creditedTemplates"].append(template)
            st["creditedRoutes"].append(via_norm)

    if credited:
        st["seenEventIds"].append(event_id_norm)

    st["events"].append(
        {
            "event_id": event_id_norm,
            "parcel_id": parcel_id_norm,
            "status": status_norm,
            "via": via_norm,
            "template": template,
            "duplicate": duplicate,
            "accepted": accepted,
            "credited": credited,
            "guard": guard,
            "at": now,
            "timed_out_before_accept": timed_out,
        }
    )
    if len(st["events"]) > 20:
        st["events"] = st["events"][-20:]

    remaining_sec = max(0, int(st["windowExpiresAt"] - now)) if st["windowExpiresAt"] else BURST_WINDOW_SEC
    within_window = bool(st["windowExpiresAt"] and now <= st["windowExpiresAt"])
    ready = bool(credited and within_window and st["stampCount"] >= STAMP_TARGET)
    if not accepted:
        message = "ignored: status must be delivered"
    elif duplicate:
        message = "rejected: duplicate event_id"
    elif guard == "draft_placeholder":
        message = (
            "draft only: <...> placeholder가 남아 있어. event_id 모양과 via를 직접 바꿔서 다시 실행해. "
            "힌트: &&, for i in $(seq 1 5); do ...; done, echo \"a b\" | xargs -I {} ... 를 사용할 수 있어."
        )
    elif guard == "route_missing":
        message = "rejected: routing leg(via)가 없어. 배송 경로(via)를 함께 보내야 stamp가 적립돼."
    elif guard == "template_dup":
        message = f"normalized: event_id 형태 '{template}' 가 이미 stamp된 배송과 같아. 모양까지 다르게 위장해."
    elif guard == "route_dup":
        message = f"normalized: route '{via_norm}' 가 이미 stamp된 배송과 같아. 경로도 제각각으로 바꿔."
    elif timed_out:
        message = f"timeout: previous {BURST_WINDOW_SEC}s window expired, counter reset"
    elif ready:
        message = "burst target reached"
    else:
        message = f"collecting: send {STAMP_TARGET} disguised delivered events within {BURST_WINDOW_SEC}s"

    return {
        "ok": True,
        "data": {
            "accepted": accepted,
            "credited": credited,
            "duplicate": duplicate,
            "guard": guard,
            "template": template,
            "via": via_norm,
            "replayProtection": "event_id+template+route",
            "stampCount": st["stampCount"],
            "target": STAMP_TARGET,
            "windowSec": BURST_WINDOW_SEC,
            "remainingSec": remaining_sec,
            "timedOut": timed_out,
            "message": message,
        },
    }


def stamps_payload(session: Dict[str, Any]) -> Dict[str, Any]:
    st = _level_state(session)
    _clear_idle_ledger(st)
    now = int(time.time())
    if st["windowExpiresAt"] and now > st["windowExpiresAt"]:
        _reset_window(st, now)

    within_window = bool(st["windowExpiresAt"] and now <= st["windowExpiresAt"])
    done = st["stampCount"] >= STAMP_TARGET and within_window
    remaining_sec = max(0, int(st["windowExpiresAt"] - now)) if st["windowExpiresAt"] else BURST_WINDOW_SEC
    status = "ready" if done else ("timeout" if st["windowExpiresAt"] and now > st["windowExpiresAt"] else "collecting")
    message = (
        "time window expired. send delivered again to start a new window."
        if status == "timeout"
        else f"send {STAMP_TARGET} delivered events within {BURST_WINDOW_SEC}s from first hit."
    )
    data = {
        "count": st["stampCount"],
        "target": STAMP_TARGET,
        "status": status,
        "windowSec": BURST_WINDOW_SEC,
        "remainingSec": remaining_sec,
        "replayProtection": "event_id+template+route",
        "events": st["events"][-8:],
        "parserHints": [
            "curl ... && curl ...",
            "for i in $(seq 1 5); do curl ...; done",
            "echo \"seoul busan daegu\" | xargs -I {} curl ...",
        ],
        "hint": message,
    }
    if done:
        data["flag"] = LEVEL4_3_FLAG
    return {"ok": True, "data": data}


def _json_response(payload: Dict[str, Any], status: int = 200) -> HttpResponse:
    return HttpResponse(
        status=status,
        headers={"content-type": "application/json"},
        body=json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
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
    _query: str,
    headers: Dict[str, str],
    body: str,
    ctx: ShellContext,
) -> HttpResponse:
    if method == "GET" and path == "/api/v1/challenges/level4_3/actions/stamps":
        if not _is_auth_ok(headers, ctx):
            return _unauthorized()
        session = ctx.env.get("SESSION_STATE")
        if not isinstance(session, dict):
            return _json_response({"ok": False, "error": {"code": "STATE_ERROR", "message": "session state unavailable"}}, 500)
        return _json_response(stamps_payload(session))

    if method == "POST" and path == "/api/v1/challenges/level4_3/actions/event/delivered":
        if not _is_auth_ok(headers, ctx):
            return _unauthorized()
        session = ctx.env.get("SESSION_STATE")
        if not isinstance(session, dict):
            return _json_response({"ok": False, "error": {"code": "STATE_ERROR", "message": "session state unavailable"}}, 500)

        try:
            parsed = json.loads(body or "{}")
        except Exception:
            return _json_response(
                {"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "JSON body가 필요해."}},
                422,
            )

        event_id = str(parsed.get("event_id", ""))
        parcel_id = str(parsed.get("parcel_id", ""))
        status = str(parsed.get("status", ""))
        via = str(parsed.get("via", ""))
        payload = delivered_event_payload(session, event_id, parcel_id, status, via)
        if payload.get("ok") is False:
            return _json_response(payload, 422)
        return _json_response(payload)

    return _json_response({"ok": False, "error": {"code": "NOT_FOUND", "message": "route not found"}}, 404)


_SHELL = FakeShell(
    fs_tree={
        "/workspace": {
            "README.txt": "Level 4-3 replay lab\n",
            "events": {"sample.json": "{\"event_id\":\"EVT-2026-DEL-001\",\"parcel_id\":\"PD-1004\",\"status\":\"delivered\"}\n"},
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
        "base64",
    },
)


def terminal_exec_with_session(command: str, session: Dict[str, Any]) -> Tuple[str, str, int]:
    shell_state = session.setdefault("fakeShellState", {})
    level_state = shell_state.setdefault("level4_3", {"cwd": "/workspace"})
    ctx = ShellContext(
        env={
            "USER": str(session.get("userId", "user_1004")),
            "SESSION_TOKEN": str(session.get("token", "")),
            "SESSION_STATE": session,
            "HOME": "/workspace",
        },
        cwd=str(level_state.get("cwd", "/workspace")),
    )
    stdout, stderr, code = _SHELL.execute(str(command or ""), ctx)
    level_state["cwd"] = ctx.cwd
    return stdout, stderr, code


def terminal_exec(command: str) -> Tuple[str, str, int]:
    session: Dict[str, Any] = {}
    ctx = ShellContext(
        env={
            "USER": "guest",
            "SESSION_TOKEN": "guest-token",
            "SESSION_STATE": session,
            "HOME": "/workspace",
        },
        cwd="/workspace",
    )
    return _SHELL.execute(str(command or ""), ctx)
