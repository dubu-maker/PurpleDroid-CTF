from __future__ import annotations
import os
import json
import shlex
from typing import Dict, Any, Tuple

# 정답 플래그 설정
LEVEL2_2_FLAG = os.getenv("PURPLEDROID_LEVEL2_2_FLAG", "FLAG{VIP_TAMPERING_SUCCESS}")

STATIC: Dict[str, Any] = {
    "id": "level2_2",
    "level": 2,
    "title": "2-2 Tamper the Parcel",
    "summary": "요청을 살짝 바꾸면(변조하면) VIP 택배가 된다.",
    "description": "미션: 배송 요청 데이터(Body)에서 'tier' 값을 'standard'에서 'vip'로 변조하여 전송해라.",
    "status": {
        "attack": "available", # 처음부터 열어둠
        "defense": "locked"
    },
    "attack": {
        "hints": [
            {
                "platform": "windows",
                "text": 'curl.exe -v -X POST http://localhost:8000/api/v1/challenges/level2_2/actions/order --data "{\\"orderId\\":\\"A102\\",\\"tier\\":\\"standard\\"}"',
            },
            {
                "platform": "unix",
                "text": 'curl -v -X POST http://localhost:8000/api/v1/challenges/level2_2/actions/order --data \'{"orderId":"A102","tier":"standard"}\'',
            },
            {"platform": "all", "text": "tier 값을 standard -> vip 로 바꿔서 다시 실행해 봐."},
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 8000,
            "help": "예시: curl -v -X POST http://localhost:8000/api/v1/challenges/level2_2/actions/order --data '{\"orderId\":\"A102\",\"tier\":\"standard\"}' (tier를 vip로 바꿔 다시 실행)"
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": { "enabled": False, "instruction": "", "code": {} }
}

def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL2_2_FLAG

def _extract_first_json_object(text: str) -> str:
    start = text.find("{")
    if start < 0:
        raise ValueError("JSON object not found")

    depth = 0
    in_string = False
    escaped = False

    for idx in range(start, len(text)):
        ch = text[idx]
        if escaped:
            escaped = False
            continue
        if ch == "\\":
            escaped = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : idx + 1]

    raise ValueError("Unclosed JSON object")

def _parse_payload(raw: str) -> Dict[str, Any]:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # 사용자 입력에서 끝부분 잔여 문자(따옴표/공백 등)가 섞인 경우 복구 시도
        candidate = _extract_first_json_object(raw)
        return json.loads(candidate)

def terminal_exec(command: str) -> Tuple[str, str, int]:
    cmdline = command.strip()
    if not cmdline:
        return "", "", 0

    if cmdline in ("help", "?", "h"):
        return "Try modifying this: curl -X POST .../actions/order --data '{\"orderId\":\"A102\", \"tier\":\"standard\"}'\n", "", 0

    # Windows 스타일 curl.exe 허용
    if cmdline.startswith("curl.exe "):
        cmdline = "curl " + cmdline[len("curl.exe "):]

    # curl 명령어 데이터 변조 시뮬레이션
    if cmdline.startswith("curl "):
        if "actions/order" in cmdline and ("--data" in cmdline or "--data-raw" in cmdline):
            try:
                # --data 뒤에 오는 JSON 문자열 파싱 (해커가 입력한 값 추출)
                parts = shlex.split(cmdline)
                data_key = "--data" if "--data" in parts else "--data-raw"
                data_idx = parts.index(data_key)
                if data_idx + 1 >= len(parts):
                    return "", "JSON Parsing Error: --data 뒤에 JSON 본문이 필요해요.", 1
                json_str = parts[data_idx + 1]
                payload = _parse_payload(json_str)
                
                tier = str(payload.get("tier", "standard")).strip()
                
                # 핵심 해킹 포인트: tier가 vip인지 검사!
                if tier.lower() == "vip":
                    output = (
                        "> POST /api/v1/challenges/level2_2/actions/order HTTP/1.1\n"
                        f"> payload: {json_str}\n"
                        "<\n"
                        "< HTTP/1.1 200 OK\n"
                        f"< x-vip-label: {LEVEL2_2_FLAG}\n"
                        '{"ok":true,"message":"VIP package confirmed"}\n'
                    )
                    return output, "", 0
                else:
                    output = (
                        "> POST /api/v1/challenges/level2_2/actions/order HTTP/1.1\n"
                        f"> payload: {json_str}\n"
                        "<\n"
                        "< HTTP/1.1 200 OK\n"
                        '{"ok":true,"message":"Standard package confirmed"}\n'
                    )
                    return output, "", 0
            except Exception as e:
                return "", f"JSON Parsing Error: 작은따옴표(')와 큰따옴표(\") 형식을 잘 맞춰주세요.\n상세 에러: {e}", 1

    return "", f"command not found: {cmdline}", 127
