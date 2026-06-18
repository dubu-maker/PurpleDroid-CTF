from __future__ import annotations

import os
import shlex
from typing import Any, Dict, List, Tuple

LEVEL2_1_FLAG = os.getenv("PURPLEDROID_LEVEL2_1_FLAG", "FLAG{HEADER_IS_NOT_INVISIBLE}")

STATIC: Dict[str, Any] = {
    "id": "level2_1",
    "level": 2,
    "title": "2-1 Invisible Header",
    "summary": "응답 헤더에 라우팅 티켓이 숨어있다.",
    "description": "미션: Signal Trace API를 호출하고, 화면에 보이지 않는 Response Header(응답 헤더)에서 X-Courier-Ticket 값을 찾아라.",
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
                "text": "헤더 키워드: X-Courier-Ticket (Body가 아니라 Header를 봐야 함)",
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
            "X-Courier-Ticket을 막는 것만으로 충분한가? AEGIS Edge는 여러 헤더로 같은 정보를 흘릴 수 있다. "
            "코드에서 라우팅 티켓 값을 Header에 직접 싣는 setter 라인을 선택해 봉쇄해."
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
                    "text": '  response.headers["X-Internal-Route"] = routingTicket.take(8)',
                    "patchableId": "p2",
                },
                {
                    "no": 6,
                    "text": '  response.headers["Server-Timing"] = "edge;dur=12"',
                    "patchableId": "d3",
                },
                {"no": 7, "text": "}"},
            ],
        },
    },
}

PATCHABLE_IDS = {"p1", "p2", "d1", "d2", "d3"}
REQUIRED_PATCH_IDS = {"p1", "p2"}

PATCH_CORRECT_FEEDBACK = {
    "p1": "3번은 봉쇄 대상이 맞아. 공격 단계에서 회수한 X-Courier-Ticket이 routingTicket 전체를 Response Header에 그대로 싣고 있어.",
    "p2": "5번은 봉쇄 대상이 맞아. X-Internal-Route라는 이름으로 위장했지만 routingTicket.take(8)로 티켓 앞부분을 다시 유출하고 있어.",
}
PATCH_WRONG_FEEDBACK = {
    "d1": "2번은 안전해. Body에는 ok/message 같은 평범한 JSON만 담기고, 민감한 라우팅 티켓 값은 들어가지 않아.",
    "d2": "4번은 안전해. X-Trace-Id는 traceId()로 만든 추적용 임의값이라 실제 라우팅 티켓과 무관해.",
    "d3": "6번은 안전해. Server-Timing은 응답 처리 시간 같은 성능 메트릭이고 기밀 유출과 관련이 없어.",
}
def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL2_1_FLAG


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
    return '{"ok":true,"message":"routed"}\n'


def _render_response_with_headers() -> str:
    body = _render_body()
    return (
        "HTTP/1.1 200 OK\n"
        "server: uvicorn\n"
        "content-type: application/json\n"
        f"X-Courier-Ticket: {LEVEL2_1_FLAG}\n"
        f"X-Internal-Route: {LEVEL2_1_FLAG[:8]}\n"
        f"content-length: {len(body.encode('utf-8'))}\n"
        "\n"
        f"{body}"
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
        f"< X-Courier-Ticket: {LEVEL2_1_FLAG}\n"
        f"< X-Internal-Route: {LEVEL2_1_FLAG[:8]}\n"
        f"< content-length: {len(body.encode('utf-8'))}\n"
        "<\n"
        f"{body}"
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


def _run_attack_terminal(command: str) -> Tuple[str, str, int]:
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

        if "-v" in parts or "--verbose" in parts:
            return _render_verbose_response(), "", 0

        if "-i" in parts or "--include" in parts:
            return _render_response_with_headers(), "", 0

        return _render_body(), "", 0

    return "", f"command not found: {cmdline}", 127


def terminal_exec_with_session(command: str, session: Dict[str, Any]) -> Tuple[str, str, int]:
    cmdline = command.strip()
    if cmdline.startswith("defense"):
        return "", "2-1 containment uses code-line selection only.", 2
    return _run_attack_terminal(cmdline)


def terminal_exec(command: str) -> Tuple[str, str, int]:
    cmdline = command.strip()
    if cmdline.startswith("defense"):
        return "", "2-1 containment uses code-line selection only.", 2
    return _run_attack_terminal(cmdline)
