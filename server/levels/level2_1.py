from __future__ import annotations

import os
import re
import secrets
import shlex
from typing import Any, Dict, List, Optional, Tuple

LEVEL2_1_FLAG = os.getenv("PURPLEDROID_LEVEL2_1_FLAG", "FLAG{HEADER_IS_NOT_INVISIBLE}")
# The decoy Courier tickets and X-Trace-Id ROTATE wholesale on every call; the real
# X-Courier-Ticket stays byte-for-byte identical every time. So one response can't
# tell you which is real — call twice and the value that did NOT change is the ticket.
# A repetition/comparison skill (not grep/text-filtering from Chapter 1). The rule is
# intentionally simple for a Chapter-2 tutorial level: stable = real, changing = decoy.
_PREVIEW_DECOY_PREFIX = "FLAG{COURIER_PREVIEW_SAMPLE_"
_CACHED_DECOY_PREFIX = "FLAG{COURIER_CACHED_STALE_"
_DECOY_RE = re.compile(r"^FLAG\{COURIER_(PREVIEW_SAMPLE|CACHED_STALE)_[0-9A-F]{6}\}$")


def rotating_preview_decoy() -> str:
    return _PREVIEW_DECOY_PREFIX + secrets.token_hex(3).upper() + "}"


def rotating_cached_decoy() -> str:
    return _CACHED_DECOY_PREFIX + secrets.token_hex(3).upper() + "}"


def rotating_trace_id() -> str:
    return "req-" + secrets.token_hex(3)

STATIC: Dict[str, Any] = {
    "id": "level2_1",
    "level": 2,
    "title": "2-1 Invisible Header",
    "summary": "응답 헤더에 라우팅 티켓이 숨어있다.",
    "description": "미션: Signal Trace API를 호출하고, 화면에 보이지 않는 Response Header(응답 헤더)를 조사하라. Courier 계열 헤더가 여럿 섞여 있는데, 같은 요청을 두 번 보내면 매번 바뀌는 미끼와 값이 그대로인 진짜 라우팅 티켓이 갈린다.",
    "status": {
        "attack": "available",
        "defense": "locked",
    },
    "attack": {
        "hints": [
            {
                "platform": "web",
                "text": "F12 Network에서 Signal Trace(/actions/track) 요청의 Response Headers를 확인해.",
            },
            {
                "platform": "windows",
                "text": "curl.exe -i -X POST /api/v1/challenges/level2_1/actions/track",
            },
            {
                "platform": "unix",
                "text": "curl -i -X POST /api/v1/challenges/level2_1/actions/track",
            },
            {
                "platform": "all",
                "text": "Body가 아니라 Header를 봐. Courier 헤더가 여러 개니 이름만 믿지 말고, 같은 요청을 두 번 보내서 매번 바뀌는 미끼와 값이 그대로인 ticket 모양 값을 갈라내.",
            },
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 8000,
            "help": (
                "Available commands:\n"
                "  routes\n"
                "  curl -i /api/v1/challenges/level2_1/actions/track\n"
                "  curl -i -X POST /api/v1/challenges/level2_1/actions/track\n"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "X-Courier-Ticket 하나만 막으면 충분한가? AEGIS Edge는 preview/cached 같은 이름으로도 "
            "ticket 모양 값을 Header에 흘린다. 라우팅 티켓 값을 Header에 싣는 라인을 모두 골라 봉쇄해. "
            "평범한 라우팅 메타데이터(edge-node, trace-id, timing)는 봉쇄 대상이 아니다."
        ),
        "code": {
            "language": "kotlin",
            "patchMode": "toggleComment",
            "lines": [
                {"no": 1, "text": "fun emitSignalTrace(response: EdgeResponse, routingTicket: String) {"},
                {
                    "no": 2,
                    "text": '  response.body = mapOf("ok" to true, "message" to "routed")',
                    "patchableId": "d1",
                },
                {
                    "no": 3,
                    "text": '  response.headers["X-Courier-Ticket"] = routingTicket',
                    "patchableId": "p1",
                },
                {
                    "no": 4,
                    "text": '  response.headers["X-Trace-Id"] = traceId()',
                    "patchableId": "d2",
                },
                {
                    "no": 5,
                    "text": '  response.headers["X-Courier-Preview"] = previewTicket(routingTicket)',
                    "patchableId": "p2",
                },
                {
                    "no": 6,
                    "text": '  response.headers["X-Internal-Route"] = "edge-node-07"',
                    "patchableId": "d3",
                },
                {
                    "no": 7,
                    "text": '  response.headers["Server-Timing"] = "edge;dur=12"',
                    "patchableId": "d4",
                },
                {"no": 8, "text": "}"},
            ],
        },
    },
}

PATCHABLE_IDS = {"p1", "p2", "d1", "d2", "d3", "d4"}
REQUIRED_PATCH_IDS = {"p1", "p2"}

PATCH_CORRECT_FEEDBACK = {
    "p1": "3번은 봉쇄 대상이 맞아. X-Courier-Ticket이 실제 라우팅 티켓 전체를 Response Header에 그대로 싣고 있어.",
    "p2": "5번은 봉쇄 대상이 맞아. X-Courier-Preview는 '미리보기'라도 여전히 ticket 모양 자격증명이야. 공격에선 미끼였어도 Header로 노출되는 것 자체가 누출이라 함께 막아야 해.",
}
PATCH_WRONG_FEEDBACK = {
    "d1": "2번은 안전해. Body에는 ok/message 같은 평범한 JSON만 담기고, 민감한 라우팅 티켓 값은 들어가지 않아.",
    "d2": "4번은 안전해. X-Trace-Id는 traceId()로 만든 추적용 임의값이라 실제 라우팅 티켓과 무관해.",
    "d3": "6번은 안전해. X-Internal-Route는 edge-node-07 같은 라우팅 메타데이터지 자격증명이 아니야. 이번 봉쇄 대상은 ticket 모양 값이야.",
    "d4": "7번은 안전해. Server-Timing은 응답 처리 시간 같은 성능 메트릭이고 기밀 유출과 관련이 없어.",
}
def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL2_1_FLAG


def flag_feedback(flag: str) -> str:
    submitted = flag.strip()
    if _DECOY_RE.match(submitted):
        if "PREVIEW_SAMPLE" in submitted:
            return (
                "MIRA: X-Courier-Preview는 미리보기 샘플이야. 다시 호출해봐 — 매번 값이 바뀔 거야. "
                "매 요청마다 새로 만들어지는 값은 실제 라우팅 티켓이 될 수 없어."
            )

        return (
            "MIRA: X-Courier-Cached는 캐시된 옛 값이야. 다시 호출해봐 — 이것도 매번 값이 바뀔 거야. "
            "안정적인 신호가 아니라 매 요청마다 재생성되는 노이즈야."
        )
    if submitted and LEVEL2_1_FLAG.startswith(submitted) and submitted != LEVEL2_1_FLAG:
        return "MIRA: 값이 잘렸어. 두 번 다 그대로인 X-Courier-Ticket의 전체 값을 제출해."
    if submitted.startswith("FLAG{") and submitted != LEVEL2_1_FLAG:
        return "MIRA: Courier 헤더가 여럿이야. COURIER TRIAGE에서 두 스냅샷을 직접 대조해 — 어떤 게 진짜인지 판단은 네 몫이야."
    return "MIRA: Body 말고 Response Header를 봐. 같은 요청을 두 번 보내서 COURIER TRIAGE에 스냅샷을 쌓아."


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
            "아직 티켓 노출 라인이 남아있어. Header 이름이 달라도 routingTicket 값 자체나 "
            "그 일부에서 파생된 노출이 남았는지 확인해."
        )

    return " ".join(messages) if messages else "봉쇄할 라인을 선택해줘. 헤더 이름이 아니라 헤더 값이 어디서 오는지 봐야 해."


def _render_body() -> str:
    return '{"ok":true,"message":"routed"}'


def _render_response_with_headers() -> str:
    body = _render_body()
    return (
        "HTTP/1.1 200 OK\n"
        "server: uvicorn\n"
        "content-type: application/json\n"
        f"X-Trace-Id: {rotating_trace_id()}\n"
        f"X-Courier-Preview: {rotating_preview_decoy()}\n"
        f"X-Courier-Ticket: {LEVEL2_1_FLAG}\n"
        "X-Internal-Route: edge-node-07\n"
        f"X-Courier-Cached: {rotating_cached_decoy()}\n"
        "Server-Timing: edge;dur=12\n"
        f"content-length: {len(body.encode('utf-8'))}\n"
        "\n"
        f"{body}\n"
    )


def _render_verbose_response() -> str:
    body = _render_body()
    return (
        "* Trying current mission API...\n"
        "* Connected to localhost mission API (#0)\n"
        "> POST /api/v1/challenges/level2_1/actions/track HTTP/1.1\n"
        "> Host: localhost\n"
        "> User-Agent: curl/7.81.0\n"
        "> Accept: */*\n"
        ">\n"
        "* Mark bundle as not supporting multiuse\n"
        "< HTTP/1.1 200 OK\n"
        "< server: uvicorn\n"
        "< content-type: application/json\n"
        f"< X-Trace-Id: {rotating_trace_id()}\n"
        f"< X-Courier-Preview: {rotating_preview_decoy()}\n"
        f"< X-Courier-Ticket: {LEVEL2_1_FLAG}\n"
        "< X-Internal-Route: edge-node-07\n"
        f"< X-Courier-Cached: {rotating_cached_decoy()}\n"
        "< Server-Timing: edge;dur=12\n"
        f"< content-length: {len(body.encode('utf-8'))}\n"
        "<\n"
        f"{body}\n"
        "* Connection #0 to host localhost left intact\n"
    )


def _render_method_mismatch(include_headers: bool) -> str:
    body = '{"ok":false,"error":"METHOD_POLICY_MISMATCH"}\n'
    if not include_headers:
        return body
    return (
        "HTTP/1.1 405 Method Not Allowed\n"
        "server: uvicorn\n"
        "allow: POST\n"
        "content-type: application/json\n"
        f"content-length: {len(body.encode('utf-8'))}\n"
        "\n"
        f"{body}"
    )


_FIRST_NUDGE = (
    "\nMIRA: Courier 헤더가 여러 개고, FLAG처럼 보이는 것도 여럿이야. "
    "응답 하나로는 뭐가 진짜인지 몰라 — 같은 요청을 한 번 더 보내.\n"
)
_SECOND_NUDGE = (
    "\nMIRA: 이제 두 스냅샷이 COURIER TRIAGE에 잡혔어. 뭐가 바뀌고 뭐가 그대로인지는 "
    "네가 직접 읽어내 — 답은 안 짚어줄게.\n"
)


def _run_attack_terminal(command: str, session: Optional[Dict[str, Any]] = None) -> Tuple[str, str, int]:
    cmdline = command.strip()
    if not cmdline:
        return "", "", 0

    if cmdline in ("help", "?", "h"):
        return (
            "Available commands:\n"
            "  routes\n"
            "  curl -i /api/v1/challenges/level2_1/actions/track\n"
            "  curl -i -X POST /api/v1/challenges/level2_1/actions/track\n"
        ), "", 0

    if cmdline == "routes":
        return (
            "Signal Edge route candidates:\n"
            "  /api/v1/challenges/level2_1/actions/track\n"
            "\n"
            "Method policy is classified until probe. Use curl -i to include Response Headers.\n"
        ), "", 0

    if cmdline.startswith("curl.exe "):
        cmdline = "curl " + cmdline[len("curl.exe "):]

    if cmdline.startswith("curl "):
        try:
            parts = shlex.split(cmdline)
        except ValueError as exc:
            return "", f"invalid curl command: {exc}", 2

        if "actions/track" not in cmdline:
            return "", "Hint: try 'routes' to list the Signal Trace endpoint.", 1

        upper_parts = [part.upper() for part in parts]
        is_post = any(part == "POST" for part in upper_parts) or any(part == "-XPOST" for part in upper_parts)
        if not is_post:
            include_headers = "-i" in parts or "--include" in parts or "-v" in parts or "--verbose" in parts
            if include_headers:
                stderr_msg = "AEGIS: 405. 응답 헤더를 읽어봐. 서버가 허용하는 메서드가 명시돼 있어.\n"
            else:
                stderr_msg = "AEGIS: 메서드 체크 실패. 응답에 단서가 있는데, 지금은 Body만 표시됐어.\n"
            return _render_method_mismatch(include_headers), stderr_msg, 1

        wants_headers = (
            "-i" in parts or "--include" in parts or "-v" in parts or "--verbose" in parts
        )
        if wants_headers:
            # Count header views per session so the 2nd+ call can nudge differently
            # (guide the actual comparison instead of repeating the first hint).
            views = 1
            if session is not None:
                # Store under session["level2_1"] so POST .../level2_1/reset
                # (which does session.pop("level2_1")) restarts the nudge escalation.
                level_state = session.setdefault("level2_1", {})
                views = int(level_state.get("track_views", 0)) + 1
                level_state["track_views"] = views
            nudge = _SECOND_NUDGE if views >= 2 else _FIRST_NUDGE
            if "-v" in parts or "--verbose" in parts:
                return _render_verbose_response() + nudge, "", 0
            return _render_response_with_headers() + nudge, "", 0

        return (
            _render_body()
            + "\nMIRA: Body는 AEGIS가 정리한 표면이야. 응답은 Body만이 아니야 — -i로 Response Header를 열어봐.\n"
        ), "", 0

    return "", f"command not found: {cmdline}", 127


def terminal_exec_with_session(command: str, session: Dict[str, Any]) -> Tuple[str, str, int]:
    cmdline = command.strip()
    if cmdline.startswith("defense"):
        return "", "2-1 containment uses code-line selection only.", 2
    return _run_attack_terminal(cmdline, session)


def terminal_exec(command: str) -> Tuple[str, str, int]:
    cmdline = command.strip()
    if cmdline.startswith("defense"):
        return "", "2-1 containment uses code-line selection only.", 2
    return _run_attack_terminal(cmdline)
