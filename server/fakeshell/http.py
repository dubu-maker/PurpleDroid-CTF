from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, Optional
from urllib.parse import urlparse


@dataclass
class HttpResponse:
    status: int = 200
    headers: Dict[str, str] = field(default_factory=lambda: {"content-type": "application/json"})
    body: str = ""


RouteHandler = Callable[[str, str, str, Dict[str, str], str, Any], HttpResponse]


def _status_text(code: int) -> str:
    return {
        200: "OK",
        201: "Created",
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        422: "Unprocessable Entity",
        429: "Too Many Requests",
        500: "Internal Server Error",
    }.get(code, "OK")


class VirtualHTTP:
    def __init__(self, routes: Optional[Dict[str, Any]] = None):
        self.routes = routes or {}

    def request(self, method: str, url: str, headers: Dict[str, str], body: str, ctx: Any) -> HttpResponse:
        method = (method or "GET").upper()
        parsed = urlparse(url)
        path = parsed.path or "/"
        query = parsed.query or ""
        key_query = f"{method}:{path}?{query}" if query else ""
        key_path = f"{method}:{path}"

        route = self.routes.get(key_query) if key_query else None
        if route is None:
            route = self.routes.get(key_path)
        if route is None and "*" in self.routes:
            route = self.routes["*"]

        if route is None:
            payload = {"ok": False, "error": {"code": "NOT_FOUND", "message": "route not found"}}
            return HttpResponse(status=404, body=json.dumps(payload, separators=(",", ":")))

        if callable(route):
            return route(method, path, query, headers, body, ctx)

        status = int(route.get("status", 200))
        response_headers = dict(route.get("headers", {"content-type": "application/json"}))
        route_body = route.get("body", "")
        if not isinstance(route_body, str):
            route_body = json.dumps(route_body, separators=(",", ":"))
        return HttpResponse(status=status, headers=response_headers, body=route_body)

    @staticmethod
    def status_text(status: int) -> str:
        return _status_text(status)

