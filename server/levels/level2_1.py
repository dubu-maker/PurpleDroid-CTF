from __future__ import annotations
import os
import shlex
from typing import List, Dict, Any, Tuple

# 정답 플래그 설정
LEVEL2_1_FLAG = os.getenv("PURPLEDROID_LEVEL2_1_FLAG", "FLAG{HEADER_IS_NOT_INVISIBLE}")

STATIC: Dict[str, Any] = {
    "id": "level2_1",
    "level": 2,
    "title": "2-1 Invisible Header",
    "summary": "응답 헤더에 라우팅 티켓이 숨어있다.",
    "description": "미션: Signal Trace API를 호출하고, 화면에 보이지 않는 Response Header(응답 헤더)에서 X-Courier-Ticket 값을 찾아라.",
    "status": {
        "attack": "available", # 처음부터 열어둠
        "defense": "locked"
    },
    "attack": {
        "hints": [
            {
                "platform": "web",
                "text": "F12 Network에서 Signal Trace(/actions/track) 요청의 Response Headers를 확인해.",
            },
            {
                "platform": "windows",
                "text": 'curl.exe -i http://localhost:8000/api/v1/challenges/level2_1/actions/track',
            },
            {
                "platform": "unix",
                "text": 'curl -i http://localhost:8000/api/v1/challenges/level2_1/actions/track',
            },
            {
                "platform": "all",
                "text": "가상 터미널에서는 curl -i /api/v1/challenges/level2_1/actions/track 로 먼저 Method Policy를 확인해.",
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
                "Available investigation commands:\n"
                "  routes\n"
                "  curl -i /api/v1/challenges/level2_1/actions/track\n"
                "  curl /api/v1/challenges/level2_1/actions/track\n"
                "  curl -i http://localhost:8000/api/v1/challenges/level2_1/actions/track\n"
            )
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "Signal Trace 응답에서 라우팅 티켓을 Header에 그대로 싣는 라인을 선택해 봉쇄하세요. "
            "Body 정리만으로는 X-Courier-Ticket 노출을 막을 수 없습니다."
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
                {"no": 5, "text": "}"},
            ],
        },
    },
}

PATCHABLE_IDS = {"p1", "d1", "d2"}
REQUIRED_PATCH_IDS = {"p1"}

def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL2_1_FLAG


def judge_patch(patched_ids: List[str]) -> bool:
    return set(patched_ids) == REQUIRED_PATCH_IDS


def judge_patch_with_session(patched_ids: List[str], session: Dict[str, Any]) -> bool:
    return set(patched_ids) == REQUIRED_PATCH_IDS


def patch_feedback(patched_ids: List[str]) -> str:
    selected = set(patched_ids)
    messages: List[str] = []

    if "p1" in selected:
        messages.append("3번은 봉쇄 대상이 맞아. X-Courier-Ticket 라우팅 티켓을 Response Header에 그대로 싣고 있어.")
    if "d1" in selected:
        messages.append("2번은 봉쇄 대상이 아니야. 사용자에게 보이는 Body를 정리하는 라인이고 라우팅 티켓을 노출하지 않아.")
    if "d2" in selected:
        messages.append("4번은 봉쇄 대상이 아니야. 추적용 trace id만 남기며 Evidence Shard나 라우팅 티켓 값은 담지 않아.")
    if "p1" not in selected:
        messages.append("아직 X-Courier-Ticket Header 노출이 남아있어. 3번 라인을 봉쇄해야 해.")

    return " ".join(messages) if messages else "봉쇄할 라인을 선택해줘. Header에 민감한 라우팅 티켓이 남는 지점을 찾아야 해."


def _render_body() -> str:
    return '{"ok":true,"message":"routed"}\n'


def _render_response_with_headers() -> str:
    body = _render_body()
    return (
        "HTTP/1.1 200 OK\n"
        "server: uvicorn\n"
        "content-type: application/json\n"
        f"X-Courier-Ticket: {LEVEL2_1_FLAG}\n"
        f"content-length: {len(body.encode('utf-8'))}\n"
        "\n"
        f"{body}"
    )


def _render_verbose_response() -> str:
    body = _render_body()
    return (
        "* Trying 127.0.0.1:8000...\n"
        "* Connected to localhost (127.0.0.1) port 8000 (#0)\n"
        "> POST /api/v1/challenges/level2_1/actions/track HTTP/1.1\n"
        "> Host: localhost:8000\n"
        "> User-Agent: curl/7.81.0\n"
        "> Accept: */*\n"
        ">\n"
        "* Mark bundle as not supporting multiuse\n"
        "< HTTP/1.1 200 OK\n"
        "< server: uvicorn\n"
        "< content-type: application/json\n"
        f"< X-Courier-Ticket: {LEVEL2_1_FLAG}\n"
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


def terminal_exec(command: str) -> Tuple[str, str, int]:
    cmdline = command.strip()
    if not cmdline:
        return "", "", 0

    if cmdline in ("help", "?", "h"):
        return (
            "Available investigation commands:\n"
            "  routes\n"
            "  curl -i /api/v1/challenges/level2_1/actions/track\n"
            "  curl /api/v1/challenges/level2_1/actions/track\n"
            "  curl -i http://localhost:8000/api/v1/challenges/level2_1/actions/track\n"
        ), "", 0

    if cmdline == "routes":
        return (
            "Signal Edge route candidates:\n"
            "  /api/v1/challenges/level2_1/actions/track\n"
            "\n"
            "Method policy is classified until probe. Use curl -i to include Response Headers.\n",
            "",
            0,
        )

    # Windows 스타일 curl.exe 허용
    if cmdline.startswith("curl.exe "):
        cmdline = "curl " + cmdline[len("curl.exe "):]

    # curl 명령어 시뮬레이션 (앱 유저를 위한 대체 루트)
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
            return (
                _render_method_mismatch(include_headers),
                "AEGIS: method mismatch. Signal Trace accepts POST frames only. Keep header inspection enabled when you retry.\n",
                1,
            )

        if "-v" in parts or "--verbose" in parts:
            return _render_verbose_response(), "", 0

        if "-i" in parts or "--include" in parts:
            return _render_response_with_headers(), "", 0

        return _render_body(), "", 0

    return "", f"command not found: {cmdline}", 127
