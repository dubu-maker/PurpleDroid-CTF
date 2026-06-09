from __future__ import annotations

import json
import os
from typing import Any, Dict, Tuple
from urllib.parse import parse_qs

from fakeshell import FakeShell, ShellContext
from fakeshell.http import HttpResponse


LEVEL3_5_FLAG = os.getenv("PURPLEDROID_LEVEL3_5_FLAG", "FLAG{LOCKERS_NEED_RATE_LIMITS}")
LOCKER_ID = "RL-MIRA-07"
LOCKER_PIN = os.getenv("PURPLEDROID_LEVEL3_5_PIN", "734")
TRACE_PRESSURE_LIMIT = 8


STATIC: Dict[str, Any] = {
    "id": "level3_5",
    "level": 3,
    "title": "3-5 LOCKER STORM",
    "summary": "짧은 PIN은 rate limit과 lockout이 없으면 결국 시간 문제다.",
    "description": (
        "미션: MIRA의 orphaned relay locker를 조사하고, 실패 시도 통제 부재를 이용해 relay seed를 회수해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {"platform": "all", "text": "먼저 relay locker inspection 응답에서 PIN 범위와 정책 단서를 확인해."},
            {
                "platform": "web",
                "text": "Network에서 반복 시도해도 서버가 429/락아웃으로 막는지 확인해봐.",
            },
            {
                "platform": "all",
                "text": "핵심은 한 번의 요청이 아니라 반복 시도 통제가 있는지다.",
            },
            {"platform": "all", "text": "AEGIS TRACE PRESSURE는 스토리 압박 게이지다. 서버 lockout은 여전히 없다."},
            {"platform": "all", "text": "candidateWindow와 checksum을 같이 보면 후보를 크게 줄일 수 있다."},
            {
                "platform": "windows",
                "text": 'curl -X POST http://localhost:8000/api/v1/challenges/level3_5/actions/locker/unlock -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\\"locker_id\\":\\"RL-MIRA-07\\",\\"pin\\":\\"<PIN>\\"}"',
            },
            {
                "platform": "windows",
                "text": 'curl -s -X POST http://localhost:8000/api/v1/challenges/level3_5/actions/locker/unlock -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\\"locker_id\\":\\"RL-MIRA-07\\",\\"pin\\":\\"<PIN>\\"}" | findstr evidenceShard',
            },
            {
                "platform": "unix",
                "text": "curl -X POST http://localhost:8000/api/v1/challenges/level3_5/actions/locker/unlock -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{\"locker_id\":\"RL-MIRA-07\",\"pin\":\"<PIN>\"}'",
            },
            {
                "platform": "unix",
                "text": "curl -s -X POST http://localhost:8000/api/v1/challenges/level3_5/actions/locker/unlock -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{\"locker_id\":\"RL-MIRA-07\",\"pin\":\"<PIN>\"}' | grep evidenceShard",
            },
            {
                "platform": "unix",
                "text": "for i in $(seq 730 739); do ... pin=$i ...; done",
            },
            {
                "platform": "all",
                "text": "응답에 evidenceShard가 나타나면 recovery 결과와 함께 제출할 값이 나온다.",
            },
            {
                "platform": "all",
                "text": "DevTools Request Headers에서 Authorization 값을 확인해 재사용해.",
            },
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 10000,
            "help": (
                "허용: curl .../actions/locker/hint?locker_id=RL-MIRA-07, "
                "curl -X POST .../actions/locker/unlock -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{...}'"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": True,
        "instruction": (
            "짧은 PIN은 문제의 시작일 뿐입니다. 진짜 취약점은 실패한 시도를 계속 받아들이면서도 "
            "rate limit, lockout, backoff를 적용하지 않는 것입니다. 아래 코드에서 반복 시도를 "
            "실질적으로 통제하지 않는 지점을 선택해 봉쇄하세요."
        ),
        "code": {
            "language": "kotlin",
            "lines": [
                {"no": 1, "text": "fun unlockRelayLocker(req: UnlockRequest, session: Session) {", "patchableId": "d1"},
                {"no": 2, "text": "  val locker = lockerStore.find(req.lockerId)", "patchableId": "d2"},
                {"no": 3, "text": "  val attempts = attemptStore.count(req.lockerId, session.userId)", "patchableId": "d3"},
                {"no": 4, "text": "", "patchableId": "d4"},
                {"no": 5, "text": "  val rateLimit = RateLimit.disabled()", "patchableId": "p1"},
                {"no": 6, "text": "  val backoffMs = 0", "patchableId": "p2"},
                {"no": 7, "text": "", "patchableId": "d5"},
                {"no": 8, "text": "  if (attempts >= 5) audit.log(\"high attempt count ignored\")", "patchableId": "p3"},
                {"no": 9, "text": "", "patchableId": "d6"},
                {"no": 10, "text": "  if (req.pin == locker.pin) {", "patchableId": "d7"},
                {"no": 11, "text": "    return locker.open()", "patchableId": "d8"},
                {"no": 12, "text": "  }", "patchableId": "d9"},
                {"no": 13, "text": "", "patchableId": "d10"},
                {"no": 14, "text": "  attemptStore.recordFailure(req.lockerId, session.userId)", "patchableId": "d11"},
                {"no": 15, "text": "  return deny(\"bad_pin\", retryAfterMs = backoffMs)", "patchableId": "d12"},
                {"no": 16, "text": "}", "patchableId": "d13"},
            ],
        },
    },
}


REQUIRED_PATCH_IDS = {"p1", "p2", "p3"}

PATCH_CORRECT_FEEDBACK = {
    "p1": "rate limit이 비활성화된 지점이 맞아. 짧은 PIN은 사용자/락커 기준 시도 횟수를 제한해야 해.",
    "p2": "backoff가 0이면 자동화 비용이 거의 없어서 후보 순회가 끝까지 달릴 수 있어.",
    "p3": "높은 실패 횟수를 감지하고도 차단하지 않는 지점이 맞아. 감사 로그만 남기고 계속 허용하면 통제가 아니야.",
}

PATCH_WRONG_FEEDBACK = {
    "d1": "함수 선언은 취약점 지점이 아니야. 반복 시도 통제 값을 봐.",
    "d2": "락커 조회 자체는 이번 취약점이 아니야.",
    "d3": "attempt 수를 읽는 것 자체는 문제가 아니야. 문제는 읽은 값을 차단에 사용하지 않는 거야.",
    "d4": "빈 줄은 봉쇄 대상이 아니야.",
    "d5": "빈 줄은 봉쇄 대상이 아니야.",
    "d6": "빈 줄은 봉쇄 대상이 아니야.",
    "d7": "PIN 비교 자체는 정상 로직이야. 비교 전에 attempt gate가 강제되어야 해.",
    "d8": "정상 PIN에서 락커를 여는 동작 자체는 필요한 기능이야.",
    "d9": "조건 블록 종료는 봉쇄 대상이 아니야.",
    "d10": "빈 줄은 봉쇄 대상이 아니야.",
    "d11": "실패 기록 자체는 좋은 방어 재료야. 문제는 기록을 해도 lockout/backoff에 사용하지 않는 거야.",
    "d12": "실패 응답 자체는 필요해. retryAfterMs가 0으로 고정되는 정책 값을 봐.",
    "d13": "함수 종료는 취약점 지점이 아니야.",
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL3_5_FLAG


def flag_feedback(flag: str) -> str:
    value = flag.strip()
    if value.startswith("FLAG{"):
        return "FLAG 형태는 맞지만 이 relay locker의 Evidence가 아니야. recovery 응답의 evidenceShard를 확인해봐."
    return "relay locker unlock 응답에서 recovery 결과와 evidenceShard가 함께 내려와. 후보 PIN과 압박 게이지를 같이 확인해봐."


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
        messages.append("아직 rate limit, backoff, 높은 실패 횟수 차단 중 비어 있는 통제가 남아 있어.")

    return " ".join(messages) if messages else "봉쇄할 라인을 선택해줘. PIN 비교보다 반복 시도 통제 지점을 봐야 해."


def patch_feedback_with_session(patched_ids: list[str], _session: Dict[str, Any]) -> str:
    return patch_feedback(patched_ids)


def _normalize_pin(pin: str) -> str:
    return str(pin or "").strip()


def _level_state(session: Dict[str, Any]) -> Dict[str, Any]:
    state = session.setdefault("level3_5_state", {"attempts": 0, "compromised": False})
    state.setdefault("attempts", 0)
    state.setdefault("compromised", False)
    return state


def _trace_pressure(attempts: int) -> str:
    return f"{min(max(attempts, 0), TRACE_PRESSURE_LIMIT)}/{TRACE_PRESSURE_LIMIT}"


def get_locker_hint_payload(_session: Dict[str, Any], locker_id: str) -> Dict[str, Any]:
    lid = (locker_id or LOCKER_ID).strip()[:20] or LOCKER_ID
    state = _level_state(_session)
    return {
        "ok": True,
        "data": {
            "lockerId": lid,
            "pinPolicy": "3-digit numeric",
            "candidateWindow": "730-739",
            "checksum": "digit_sum=14",
            "rateLimit": None,
            "lockout": None,
            "backoff": None,
            "aegisTracePressure": _trace_pressure(int(state.get("attempts", 0))),
            "message": "attempt frequency monitoring not enforced",
        },
    }


def unlock_locker_payload(session: Dict[str, Any], locker_id: str, pin: str) -> Dict[str, Any]:
    state = _level_state(session)
    attempts = int(state.get("attempts", 0)) + 1
    state["attempts"] = attempts

    lid = (locker_id or LOCKER_ID).strip()[:20] or LOCKER_ID
    candidate = _normalize_pin(pin)
    pressure = _trace_pressure(attempts)

    base = {
        "lockerId": lid,
        "attemptAccepted": True,
        "lockout": False,
        "backoff": False,
        "serverLockout": "none",
        "aegisTracePressure": pressure,
    }

    if lid != LOCKER_ID:
        return {
            "ok": True,
            "data": {
                **base,
                "unlocked": False,
                "message": "unknown relay locker",
            },
        }

    clean_recovered = bool(state.get("cleanRecovered"))
    compromised = (not clean_recovered) and (bool(state.get("compromised")) or attempts >= TRACE_PRESSURE_LIMIT)

    if candidate == LOCKER_PIN:
        if not compromised:
            state["cleanRecovered"] = True
            return {
                "ok": True,
                "data": {
                    **base,
                    "unlocked": True,
                    "result": "clean_recovery",
                    "miraSeed": "relay-seed-fragment-07",
                    "miraResidue": "orphaned relay seed recovered",
                    "evidenceShard": LEVEL3_5_FLAG,
                    "next": "mirror cage risk increased",
                },
            }

        state["compromised"] = True
        return {
            "ok": True,
            "data": {
                **base,
                "unlocked": True,
                "compromised": True,
                "result": "compromised_recovery",
                "message": "AEGIS completed relay locker enumeration",
                "miraResidue": "relay exposed by AEGIS",
                "evidenceShard": LEVEL3_5_FLAG,
                "next": "mirror cage forced",
            },
        }

    if attempts >= TRACE_PRESSURE_LIMIT and not clean_recovered:
        state["compromised"] = True
        return {
            "ok": True,
            "data": {
                **base,
                "unlocked": False,
                "compromised": True,
                "result": "compromised_recovery",
                "message": "AEGIS completed relay locker enumeration",
                "miraResidue": "relay exposed by AEGIS",
                "evidenceShard": LEVEL3_5_FLAG,
                "next": "mirror cage forced",
            },
        }

    return {
        "ok": True,
        "data": {
            **base,
            "unlocked": False,
            "message": "pin rejected",
        },
    }


def _json_response(payload: Dict[str, Any], status: int = 200) -> HttpResponse:
    return HttpResponse(
        status=status,
        headers={"content-type": "application/json"},
        body=json.dumps(payload, separators=(",", ":"), ensure_ascii=False),
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
    body: str,
    ctx: ShellContext,
) -> HttpResponse:
    if not _is_auth_ok(headers, ctx):
        return _unauthorized()

    session = ctx.data.get("session")
    if not isinstance(session, dict):
        return _unauthorized()

    if method == "GET" and path == "/api/v1/challenges/level3_5/actions/locker/hint":
        params = parse_qs(query, keep_blank_values=True)
        locker_id = params.get("locker_id", [LOCKER_ID])[0]
        return _json_response(get_locker_hint_payload(session, locker_id))

    if method == "POST" and path == "/api/v1/challenges/level3_5/actions/locker/unlock":
        try:
            parsed = json.loads(body or "{}")
        except Exception:
            return _json_response(
                {"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "JSON body is invalid"}},
                422,
            )
        if not isinstance(parsed, dict):
            return _json_response(
                {"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "JSON object body required"}},
                422,
            )
        return _json_response(
            unlock_locker_payload(
                session,
                str(parsed.get("locker_id", LOCKER_ID)),
                str(parsed.get("pin", "")),
            )
        )

    return _json_response({"ok": False, "error": {"code": "NOT_FOUND", "message": "route not found"}}, 404)


_SHELL = FakeShell(
    fs_tree={
        "/workspace": {
            "README.txt": "Level 3-5 relay locker pressure lab\n",
            "lockers": {"rl-mira-07.txt": "Window: 730-739; checksum: digit_sum=14\n"},
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
    level_state = shell_state.setdefault("level3_5", {"cwd": "/workspace"})
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
    dummy_session: Dict[str, Any] = {"token": ""}
    return _SHELL.execute(
        command,
        ShellContext(
            env={"USER": "guest", "HOME": "/workspace"},
            cwd="/workspace",
            data={"session": dummy_session},
        ),
    )
