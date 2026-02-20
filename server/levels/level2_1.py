from __future__ import annotations
import os
from typing import List, Dict, Any, Tuple

# 정답 플래그 설정
LEVEL2_1_FLAG = os.getenv("PURPLEDROID_LEVEL2_1_FLAG", "FLAG{HEADER_IS_NOT_INVISIBLE}")

STATIC: Dict[str, Any] = {
    "id": "level2_1",
    "level": 2,
    "title": "2-1 Invisible Header",
    "summary": "응답 헤더에 플래그가 숨어있다.",
    "description": "미션: 배송 조회 API를 호출하고, 화면에 보이지 않는 Response Header(응답 헤더)에서 X-Courier-Ticket 값을 찾아라.",
    "status": {
        "attack": "available", # 처음부터 열어둠
        "defense": "locked"
    },
    "attack": {
        "hints": [
            {
                "platform": "web",
                "text": "F12 Network에서 /actions/track 요청의 Response Headers를 확인해.",
            },
            {
                "platform": "windows",
                "text": 'curl.exe -v -X POST http://localhost:8000/api/v1/challenges/level2_1/actions/track',
            },
            {
                "platform": "unix",
                "text": 'curl -v -X POST http://localhost:8000/api/v1/challenges/level2_1/actions/track',
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
            "help": "허용: curl -v -X POST http://localhost:8000/api/v1/challenges/level2_1/actions/track (또는 curl.exe ...)"
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": { "enabled": False, "instruction": "", "code": {} }
}

def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL2_1_FLAG

def terminal_exec(command: str) -> Tuple[str, str, int]:
    cmdline = command.strip()
    if not cmdline:
        return "", "", 0

    if cmdline in ("help", "?", "h"):
        return (
            "Allowed:\n"
            "  curl -v -X POST http://localhost:8000/api/v1/challenges/level2_1/actions/track\n"
            "  curl.exe -v -X POST http://localhost:8000/api/v1/challenges/level2_1/actions/track\n"
        ), "", 0

    # Windows 스타일 curl.exe 허용
    if cmdline.startswith("curl.exe "):
        cmdline = "curl " + cmdline[len("curl.exe "):]

    # curl 명령어 시뮬레이션 (앱 유저를 위한 대체 루트)
    if cmdline.startswith("curl "):
        if "-v" in cmdline and "actions/track" in cmdline:
            # 실제 네트워크 통신처럼 보이게 디테일한 로그 작성
            output = (
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
                f"< x-courier-ticket: {LEVEL2_1_FLAG}\n"
                "< content-length: 33\n"
                "<\n"
                '{"ok":true,"message":"delivered"}\n'
                "* Connection #0 to host localhost left intact\n"
            )
            return output, "", 0
        else:
            return "", "Hint: try 'curl -v http://localhost:8000/api/v1/challenges/level2_1/actions/track'", 1

    return "", f"command not found: {cmdline}", 127
