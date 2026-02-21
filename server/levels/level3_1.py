from __future__ import annotations

import copy
import json
import os
import re
from typing import Any, Dict, Optional, Tuple


LEVEL3_1_FLAG = os.getenv("PURPLEDROID_LEVEL3_1_FLAG", "FLAG{BOLA_IS_REAL}")

_PARCELS: Dict[str, Dict[str, Any]] = {
    "PD-1004": {
        "parcel_id": "PD-1004",
        "owner": "player",
        "tier": "standard",
        "status": "in_transit",
        "contents": "general package",
        "meta": {"note": "no issue"},
    },
    "PD-1005": {
        "parcel_id": "PD-1005",
        "owner": "vip_neighbor",
        "tier": "vip",
        "status": "in_transit",
        "contents": "VIP-only gift",
        "meta": {"note": LEVEL3_1_FLAG},
    },
}


STATIC: Dict[str, Any] = {
    "id": "level3_1",
    "level": 3,
    "title": "3-1 Steal the Neighbor's Parcel",
    "summary": "남의 택배 정보가 보이면 인가 결함(BOLA)이다.",
    "description": (
        "미션: 내 택배(PD-1004) 조회 흐름을 관찰하고, parcel_id를 조작해 "
        "이웃 VIP 택배를 조회해 FLAG를 찾아 제출해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {
                "platform": "web",
                "text": "F12 Network에서 내 택배 조회 요청 URL 끝 parcel_id를 확인해.",
            },
            {
                "platform": "windows",
                "text": 'curl.exe -v -X GET http://localhost:8000/api/v1/challenges/level3_1/actions/parcels/<parcel_id> -H "Authorization: Bearer <token>"',
            },
            {
                "platform": "unix",
                "text": "curl -v -X GET http://localhost:8000/api/v1/challenges/level3_1/actions/parcels/<parcel_id> -H 'Authorization: Bearer <token>'",
            },
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 8000,
            "help": "허용: curl -v -X GET http://localhost:8000/api/v1/challenges/level3_1/actions/parcels/<parcel_id> -H 'Authorization: Bearer <token>'",
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "인증과 인가는 다르다. 객체 반환 직전에 owner_id == current_user 검증을 "
            "강제하고, 프론트 숨김 로직에 의존하지 마라."
        ),
        "code": {},
    },
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL3_1_FLAG


def judge_patch(_patched: list[str]) -> bool:
    return False


def get_parcel(parcel_id: str) -> Optional[Dict[str, Any]]:
    record = _PARCELS.get((parcel_id or "").strip().upper())
    return copy.deepcopy(record) if record else None


def terminal_exec(command: str) -> Tuple[str, str, int]:
    cmdline = command.strip()
    if not cmdline:
        return "", "", 0

    if cmdline in ("help", "?", "h"):
        return (
            "Allowed:\n"
            "  curl -v -X GET http://localhost:8000/api/v1/challenges/level3_1/actions/parcels/<parcel_id> -H 'Authorization: Bearer <token>'\n"
        ), "", 0

    if cmdline.startswith("curl.exe "):
        cmdline = "curl " + cmdline[len("curl.exe ") :]

    if not cmdline.startswith("curl "):
        return "", f"command not found: {cmdline}", 127

    matched = re.search(r"/api/v1/challenges/level3_1/actions/parcels/([A-Za-z0-9\-]+)", cmdline)
    if not matched:
        return "", "Hint: /actions/parcels/<parcel_id> 경로를 호출해.", 1

    parcel_id = matched.group(1).upper()
    parcel = get_parcel(parcel_id)
    if not parcel:
        return json.dumps({"status": "not_found", "parcel_id": parcel_id}) + "\n", "", 0

    # 의도적 취약점: Authorization은 필요하지만, 소유권 검증은 생략
    return json.dumps(parcel, separators=(",", ":")) + "\n", "", 0
