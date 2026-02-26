from __future__ import annotations

import json
from typing import Any, Dict, Tuple

from ..http import VirtualHTTP


def _parse_curl_args(args: list[str]) -> tuple[str, str, Dict[str, str], str, bool]:
    method = "GET"
    headers: Dict[str, str] = {}
    body = ""
    show_headers = False
    url = ""
    i = 0
    while i < len(args):
        token = args[i]
        if token in ("-v", "-i", "--include"):
            show_headers = True
            i += 1
            continue
        if token == "-X" and i + 1 < len(args):
            method = args[i + 1].upper()
            i += 2
            continue
        if token in ("-H", "--header") and i + 1 < len(args):
            raw = args[i + 1]
            if ":" in raw:
                k, v = raw.split(":", 1)
                headers[k.strip().lower()] = v.strip()
            i += 2
            continue
        if token in ("-d", "--data", "--data-raw") and i + 1 < len(args):
            body = args[i + 1]
            if method == "GET":
                method = "POST"
            i += 2
            continue
        if not token.startswith("-") and not url:
            url = token
            i += 1
            continue
        i += 1
    return method, url, headers, body, show_headers


def run_curl(args: list[str], _stdin: str, ctx: Any) -> Tuple[str, str, int]:
    if not ctx.http:
        return "", "virtual http unavailable", 1
    method, url, headers, body, show_headers = _parse_curl_args(args)
    if not url:
        return "", "curl: URL required", 1

    resp = ctx.http.request(method, url, headers, body, ctx)
    out_body = resp.body if isinstance(resp.body, str) else json.dumps(resp.body, separators=(",", ":"))
    if out_body and not out_body.endswith("\n"):
        out_body += "\n"

    if not show_headers:
        return out_body, "", 0

    lines = [f"< HTTP/1.1 {resp.status} {VirtualHTTP.status_text(resp.status)}"]
    for k, v in resp.headers.items():
        lines.append(f"< {k}: {v}")
    lines.append("<")
    lines.append(out_body.rstrip("\n"))
    return "\n".join(lines) + "\n", "", 0
