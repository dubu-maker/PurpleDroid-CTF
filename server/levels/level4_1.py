from __future__ import annotations

import json
import os
from typing import Any, Dict, Tuple

from fakeshell import FakeShell, ShellContext
from fakeshell.http import HttpResponse


LEVEL4_1_FLAG = os.getenv("PURPLEDROID_LEVEL4_1_FLAG", "FLAG{BUILD_ARTIFACTS_ARE_PUBLIC}")
PARTNER_KEY = os.getenv("PURPLEDROID_LEVEL4_1_PARTNER_KEY", "pd_partner_live_4f9a2d71")
PARTNER_WEBHOOK_SECRET_TEST = os.getenv("PURPLEDROID_LEVEL4_1_WEBHOOK_SECRET_TEST", "whsec_test_5a29d1f2")
PARTNER_WEBHOOK_SECRET = os.getenv("PURPLEDROID_LEVEL4_1_WEBHOOK_SECRET", "whsec_live_b13df4ae")
ASSET_FILENAME = os.getenv("PURPLEDROID_LEVEL4_1_ASSET_FILENAME", "pd.partner.config.5f3c2a.js")
ASSET_MAP_FILENAME = os.getenv("PURPLEDROID_LEVEL4_1_ASSET_MAP_FILENAME", f"{ASSET_FILENAME}.map")
ASSET_PATH = f"/api/v1/challenges/level4_1/actions/public/assets/{ASSET_FILENAME}"
ASSET_MAP_PATH = f"/api/v1/challenges/level4_1/actions/public/assets/{ASSET_MAP_FILENAME}"


STATIC: Dict[str, Any] = {
    "id": "level4_1",
    "level": 4,
    "title": "4-1 ABSENCE MAP",
    "summary": "사라졌다고 기록된 source map이 공개 bundle shard에 남아 partner key residue를 노출한다.",
    "description": (
        "미션: AEGIS Memory Index와 공개 build artifact의 모순을 비교하고, "
        "source map의 sourcesContent에서 client-side secret residue를 복원해라."
    ),
    "status": {"attack": "available", "defense": "locked"},
    "attack": {
        "hints": [
            {
                "platform": "web",
                "text": "Sources/Network에서 공개 자산(.js/.map/config)을 찾아봐.",
            },
            {
                "platform": "all",
                "text": "bundle-hint 응답은 어떤 파일을 봐야 하는지 알려준다.",
            },
            {
                "platform": "all",
                "text": "PARTNER_KEY / SECRET / SIGNING 키워드를 파일 내용에서 검색해봐.",
            },
            {
                "platform": "windows",
                "text": 'curl -s http://localhost:8000/api/v1/challenges/level4_1/actions/public/bundle-hint',
            },
            {
                "platform": "windows",
                "text": f"curl -s http://localhost:8000{ASSET_PATH}",
            },
            {
                "platform": "windows",
                "text": f"curl -s http://localhost:8000{ASSET_MAP_PATH}",
            },
            {
                "platform": "all",
                "text": "js 본문 마지막 sourceMappingURL 주석을 따라가 .map의 sourcesContent를 확인해봐.",
            },
            {
                "platform": "windows",
                "text": 'curl -s -X POST http://localhost:8000/api/v1/challenges/level4_1/actions/partner/handshake -H "Authorization: Bearer <token>" -H "X-Partner-Key: <key>"',
            },
            {
                "platform": "unix",
                "text": "curl -s http://localhost:8000/api/v1/challenges/level4_1/actions/public/bundle-hint",
            },
            {
                "platform": "unix",
                "text": f"curl -s http://localhost:8000{ASSET_PATH}",
            },
            {
                "platform": "unix",
                "text": f"curl -s http://localhost:8000{ASSET_MAP_PATH}",
            },
            {
                "platform": "unix",
                "text": "curl -s -X POST http://localhost:8000/api/v1/challenges/level4_1/actions/partner/handshake -H 'Authorization: Bearer <token>' -H 'X-Partner-Key: <key>'",
            },
        ],
        "terminal": {
            "enabled": True,
            "prompt": "$ ",
            "maxOutputBytes": 15000,
            "help": (
                "허용: curl .../actions/public/bundle-hint, "
                "curl .../actions/public/assets/<filename>, "
                "curl .../actions/public/assets/<filename>.map, "
                "curl -X POST .../actions/partner/handshake -H 'Authorization: Bearer <token>' -H 'X-Partner-Key: <key>'"
            ),
        },
        "flagFormat": "FLAG{...}",
    },
    "defense": {
        "enabled": False,
        "instruction": (
            "Memory Vault의 공개 artifact leak을 봉쇄할 정책 카드를 선택하세요. "
            "값을 더 숨기는 것이 아니라 secret 경계, source map 배포, 유출된 key 수명, credential scope를 함께 닫아야 합니다."
        ),
        "code": {
            "language": "policy",
            "lines": [
                {
                    "no": 1,
                    "text": "Keep secrets server-side",
                    "patchableId": "policy_server_side",
                },
                {
                    "no": 2,
                    "text": "Disable production sourcemaps",
                    "patchableId": "policy_disable_sourcemaps",
                },
                {
                    "no": 3,
                    "text": "Rotate leaked partner keys",
                    "patchableId": "policy_rotate_keys",
                },
                {
                    "no": 4,
                    "text": "Scope partner credentials",
                    "patchableId": "policy_scope_credentials",
                },
                {
                    "no": 5,
                    "text": "Rename PARTNER_KEY variable",
                    "patchableId": "decoy_rename_variable",
                },
                {
                    "no": 6,
                    "text": "Minify harder",
                    "patchableId": "decoy_minify_harder",
                },
                {
                    "no": 7,
                    "text": "Base64 encode the key",
                    "patchableId": "decoy_base64_encode",
                },
                {
                    "no": 8,
                    "text": "Hide sourceMappingURL comment only",
                    "patchableId": "decoy_hide_mapping_comment",
                },
                {
                    "no": 9,
                    "text": "Trust client config",
                    "patchableId": "decoy_trust_client_config",
                },
            ],
        },
    },
}


REQUIRED_PATCH_IDS = {
    "policy_server_side",
    "policy_disable_sourcemaps",
    "policy_rotate_keys",
    "policy_scope_credentials",
}

PATCH_CORRECT_FEEDBACK = {
    "policy_server_side": "맞아. partner key는 client bundle이 아니라 서버에서만 사용해야 해.",
    "policy_disable_sourcemaps": "맞아. 운영 source map과 sourcesContent는 공개 배포에서 제거하거나 접근 제한해야 해.",
    "policy_rotate_keys": "맞아. 이미 public artifact에 노출된 key는 폐기하고 새로 발급해야 해.",
    "policy_scope_credentials": "맞아. partner credential은 서비스/origin/권한 범위를 최소화해야 해.",
}

PATCH_WRONG_FEEDBACK = {
    "decoy_rename_variable": "변수명을 바꿔도 값은 bundle이나 source map에 남아. 이름 숨기기는 봉쇄가 아니야.",
    "decoy_minify_harder": "minification은 분석을 늦출 뿐 secret 보호 경계가 아니야.",
    "decoy_base64_encode": "Base64는 인코딩이지 암호화가 아니야. client에 있으면 복원 가능해.",
    "decoy_hide_mapping_comment": "sourceMappingURL 주석만 지워도 public map 파일이 남아 있으면 직접 접근될 수 있어.",
    "decoy_trust_client_config": "client config는 공격자가 읽고 바꿀 수 있어. 신뢰 경계가 될 수 없어.",
}

PATCH_MISSING_LABELS = {
    "policy_server_side": "server-side secret",
    "policy_disable_sourcemaps": "production sourcemap 통제",
    "policy_rotate_keys": "leaked key rotation",
    "policy_scope_credentials": "credential scope 제한",
}


def check_flag(flag: str) -> bool:
    return flag.strip() == LEVEL4_1_FLAG


def flag_feedback(flag: str) -> str:
    value = flag.strip()
    if value == "FLAG{SOURCE_MAP_CANARY}":
        return (
            "그건 source map canary야. AEGIS가 redaction 상태를 확인하려고 심어둔 표식이지 Evidence Shard가 아니야. "
            "진짜 문제는 partner key가 client memory에 남아 있다는 거야."
        )
    if value.startswith("FLAG{"):
        return "FLAG처럼 보이지만 이번 Evidence Shard가 아니야. Partner Handshake Evidence를 복원해봐."
    return "Memory Board에서 partner key residue를 handshake impact와 연결해야 Evidence Shard가 복원돼."


def judge_patch(patched: list[str]) -> bool:
    return set(patched) == REQUIRED_PATCH_IDS


def patch_feedback(patched: list[str]) -> str:
    selected = set(patched)
    messages: list[str] = []
    seen: set[str] = set()

    for pid in patched:
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
        messages.append(f"아직 닫히지 않은 경계가 있어: {missing_names}.")

    return "\n".join(messages) if messages else "정책 카드를 선택해줘. 숨기기보다 secret 경계와 배포 산출물 통제가 핵심이야."


def bundle_hint_payload() -> Dict[str, Any]:
    return {
        "ok": True,
        "data": {
            "assetPath": ASSET_PATH,
            "note": "This file is public. Treat it as attacker-visible.",
        },
    }


def build_artifact_source() -> str:
    minified = (
        'const a="https://partner-gw.purpledroid.local",b="pd_partner_test_6f31b020",'
        'c="pd_partner_stage_1190ab77",d="masked";export{a as A,b as B,c as C,d as D};'
    )
    return f"{minified}\n//# sourceMappingURL={ASSET_MAP_FILENAME}\n"


def build_artifact_sourcemap() -> str:
    source_content = (
        "/* Partner SDK Config (DO NOT SHIP SECRETS) */\n"
        'export const PARTNER_API_BASE = "https://partner-gw.purpledroid.local";\n'
        "\n"
        "/* decoy */\n"
        'export const PARTNER_KEY_TEST = "pd_partner_test_6f31b020";\n'
        'export const PARTNER_KEY_STAGING = "pd_partner_stage_1190ab77";\n'
        "\n"
        "/* leaked real secret */\n"
        f'export const PARTNER_KEY = "{PARTNER_KEY}"; // TODO: move to server\n'
        "\n"
        "/* webhook signing secrets (should never be in client build) */\n"
        f'export const PARTNER_WEBHOOK_SECRET_TEST = "{PARTNER_WEBHOOK_SECRET_TEST}";\n'
        f'export const PARTNER_WEBHOOK_SECRET = "{PARTNER_WEBHOOK_SECRET}"; // TODO: move to server\n'
    )
    sm = {
        "version": 3,
        "file": ASSET_FILENAME,
        "sources": ["src/pd.partner.config.ts"],
        "sourcesContent": [source_content],
        "names": [],
        "mappings": "AAAA",
    }
    return json.dumps(sm, ensure_ascii=False, separators=(",", ":"))


def is_partner_key_valid(partner_key: str) -> bool:
    return str(partner_key or "").strip() == PARTNER_KEY


def get_webhook_secret() -> str:
    return PARTNER_WEBHOOK_SECRET


def partner_handshake_payload() -> Dict[str, Any]:
    return {
        "ok": True,
        "data": {
            "partner": "ok",
            "message": "Partner handshake accepted.",
            "flag": LEVEL4_1_FLAG,
        },
    }


def _json_response(payload: Dict[str, Any], status: int = 200) -> HttpResponse:
    return HttpResponse(
        status=status,
        headers={"content-type": "application/json"},
        body=json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
    )


def _text_response(text: str, content_type: str = "text/plain", status: int = 200) -> HttpResponse:
    return HttpResponse(
        status=status,
        headers={"content-type": content_type},
        body=text,
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
    _body: str,
    ctx: ShellContext,
) -> HttpResponse:
    if method == "GET" and path == "/api/v1/challenges/level4_1/actions/public/bundle-hint":
        return _json_response(bundle_hint_payload())

    if method == "GET" and path == ASSET_PATH:
        return _text_response(build_artifact_source(), content_type="application/javascript")

    if method == "GET" and path == ASSET_MAP_PATH:
        return _text_response(build_artifact_sourcemap(), content_type="application/json")

    if method == "POST" and path == "/api/v1/challenges/level4_1/actions/partner/handshake":
        if not _is_auth_ok(headers, ctx):
            return _unauthorized()
        provided_key = headers.get("x-partner-key", "")
        if not is_partner_key_valid(provided_key):
            return _json_response(
                {"ok": False, "error": {"code": "PARTNER_DENIED", "message": "Partner key invalid."}},
                403,
            )
        return _json_response(partner_handshake_payload())

    return _json_response({"ok": False, "error": {"code": "NOT_FOUND", "message": "route not found"}}, 404)


_SHELL = FakeShell(
    fs_tree={
        "/workspace": {
            "README.txt": "Level 4-1 leaky build artifact lab\n",
            "build": {"manifest.txt": f"{ASSET_FILENAME}\n{ASSET_MAP_FILENAME}\n"},
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
        "base64",
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
    level_state = shell_state.setdefault("level4_1", {"cwd": "/workspace"})
    ctx = ShellContext(
        env={
            "USER": str(session.get("userId", "user_1004")),
            "SESSION_TOKEN": str(session.get("token", "")),
            "HOME": "/workspace",
        },
        cwd=str(level_state.get("cwd", "/workspace")),
    )
    stdout, stderr, code = _SHELL.execute(command, ctx)
    level_state["cwd"] = ctx.cwd
    return stdout, stderr, code


def terminal_exec(command: str) -> Tuple[str, str, int]:
    return _SHELL.execute(command, ShellContext(env={"USER": "guest", "HOME": "/workspace"}, cwd="/workspace"))
