from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, Tuple

from fakeshell import FakeShell, ShellContext
from fakeshell.http import HttpResponse


LEVEL4_3_FLAG = os.getenv("PURPLEDROID_LEVEL4_3_FLAG", "FLAG{REPLAY_NEEDS_IDEMPOTENCY}")
STAMP_TARGET = int(os.getenv("PURPLEDROID_LEVEL4_3_TARGET", "5"))
BURST_WINDOW_SEC = int(os.getenv("PURPLEDROID_LEVEL4_3_WINDOW_SEC", "5"))


STATIC: Dict[str, Any] = {
    "id": "level4_3",
    "level": 4,
    "title": "4-3 Replay the Delivery Confirmation",
    "summary": "요청이 유효하더라도 '새 요청'인지 검증하지 않으면 리플레이로 누적 악용된다.",
    "description": (
        "미션: 첫 delivered 요청이 들어오면 짧은 시간 창이 열린다. "
        f"{BURST_WINDOW_SEC}초 안에 delivered 이벤트를 {STAMP_TARGET}회 누적해 "
        "stamps 응답에서 FLAG를 획득해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {"platform": "all", "text": "첫 delivered 요청이 타이머 시작점이다. 시간 창 안에서 목표 횟수를 채워야 한다."},
            {"platform": "all", "text": f"제한 시간({BURST_WINDOW_SEC}초)을 넘기면 timeout과 함께 카운터가 리셋된다."},
            {"platform": "web", "text": "Network에서 delivered 요청을 연속 재전송하며 remainingSec/count 변화를 관찰해."},
            {
                "platform": "windows",
                "text": 'curl -s -X POST http://localhost:8000/api/v1/challenges/level4_3/actions/event/delivered -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\\"event_id\\":\\"EVT-2026-DEL-001\\",\\"parcel_id\\":\\"PD-1004\\",\\"status\\":\\"delivered\\"}"',
            },
            {
                "platform": "windows",
                "text": 'curl -s http://localhost:8000/api/v1/challenges/level4_3/actions/stamps -H "Authorization: Bearer <token>"',
            },
            {"platform": "all", "text": "같은 event_id는 거부된다. 하지만 event_id만 바꾸면? 서버가 '새 이벤트'로 인정하는지 확인해봐."},
            {"platform": "all", "text": "seq 1 5 | xargs -I{} curl ... 패턴으로 event_id를 자동 변경하며 반복 전송해봐."},
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 18000,
            "help": (
                "허용: curl -X POST .../actions/event/delivered -H 'Authorization: Bearer <token>' "
                "-H 'Content-Type: application/json' -d '{\"event_id\":\"EVT-...\",\"parcel_id\":\"PD-1004\",\"status\":\"delivered\"}', "
                "curl .../actions/stamps"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "event_id/idempotency key를 서버에 저장해 재사용을 차단하고, "
            "timestamp 윈도우 + 재전송 탐지(로그/알림) + 레이트리밋을 적용해 replay를 막아라."
        ),
        "code": {},
    },
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL4_3_FLAG


def judge_patch(_patched: list[str]) -> bool:
    return False


def _level_state(session: Dict[str, Any]) -> Dict[str, Any]:
    st = session.setdefault("level4_3", {})
    st.setdefault("stampCount", 0)
    st.setdefault("events", [])
    st.setdefault("seenEventIds", [])
    st.setdefault("windowStartAt", 0)
    st.setdefault("windowExpiresAt", 0)
    st.setdefault("lastTimeoutAt", 0)
    return st


def delivered_event_payload(session: Dict[str, Any], event_id: str, parcel_id: str, status: str) -> Dict[str, Any]:
    st = _level_state(session)
    now = int(time.time())

    event_id_norm = str(event_id or "").strip()
    parcel_id_norm = str(parcel_id or "").strip()
    status_norm = str(status or "").strip().lower()
    if not event_id_norm or not parcel_id_norm:
        return {
            "ok": False,
            "error": {"code": "VALIDATION_ERROR", "message": "event_id/parcel_id가 필요해."},
        }

    duplicate = event_id_norm in st["seenEventIds"]

    timed_out = bool(st["windowExpiresAt"] and now > st["windowExpiresAt"])
    if timed_out:
        st["stampCount"] = 0
        st["windowStartAt"] = 0
        st["windowExpiresAt"] = 0
        st["lastTimeoutAt"] = now
        st["seenEventIds"] = []

    accepted = status_norm == "delivered"

    # intentional vulnerability:
    # duplicate event_id는 거부하지만(credited=False),
    # event_id만 바꾸면 같은 요청을 무한 재전송해서 stamp를 누적할 수 있다.
    credited = False
    if accepted and not duplicate:
        if not st["windowStartAt"]:
            st["windowStartAt"] = now
            st["windowExpiresAt"] = now + BURST_WINDOW_SEC
        st["stampCount"] += 1
        credited = True
        st["seenEventIds"].append(event_id_norm)

    if duplicate:
        st["seenEventIds"].append(event_id_norm)

    st["events"].append(
        {
            "event_id": event_id_norm,
            "parcel_id": parcel_id_norm,
            "status": status_norm,
            "duplicate": duplicate,
            "accepted": accepted,
            "credited": credited,
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
    elif timed_out:
        message = f"timeout: previous {BURST_WINDOW_SEC}s window expired, counter reset"
    elif ready:
        message = "burst target reached"
    else:
        message = f"collecting: send {STAMP_TARGET} delivered events within {BURST_WINDOW_SEC}s"

    return {
        "ok": True,
        "data": {
            "accepted": accepted,
            "credited": credited,
            "duplicate": duplicate,
            "replayProtection": "event_id",
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
    now = int(time.time())
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
        payload = delivered_event_payload(session, event_id, parcel_id, status)
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
