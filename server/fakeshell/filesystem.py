from __future__ import annotations

import posixpath
from typing import Dict, Iterable, List, Optional


class VirtualFS:
    def __init__(self, tree: Optional[Dict] = None):
        self._root = {"type": "dir", "children": {}}
        if tree:
            self._load_tree(tree)

    def _load_tree(self, tree: Dict) -> None:
        for raw_path, value in tree.items():
            path = raw_path.rstrip("/")
            path = "/" if path == "" else path
            self._add_path(path, value)

    def _normalize(self, path: str, cwd: str = "/") -> str:
        if not path:
            return cwd or "/"
        merged = path if path.startswith("/") else posixpath.join(cwd or "/", path)
        normalized = posixpath.normpath(merged)
        return normalized if normalized.startswith("/") else f"/{normalized}"

    def _ensure_dir(self, path: str) -> Dict:
        if path == "/":
            return self._root
        node = self._root
        for part in [x for x in path.strip("/").split("/") if x]:
            node = node["children"].setdefault(part, {"type": "dir", "children": {}})
            if node["type"] != "dir":
                raise ValueError(f"path is not directory: {path}")
        return node

    def _add_path(self, path: str, value) -> None:
        if isinstance(value, dict):
            node = self._ensure_dir(path)
            for name, child in value.items():
                child_name = name.rstrip("/")
                child_path = posixpath.join(path if path != "/" else "", child_name)
                child_path = child_path if child_path.startswith("/") else f"/{child_path}"
                self._add_path(child_path, child)
            return

        parent_path = posixpath.dirname(path) or "/"
        filename = posixpath.basename(path)
        parent = self._ensure_dir(parent_path)
        parent["children"][filename] = {"type": "file", "content": str(value)}

    def resolve(self, path: str, cwd: str = "/") -> str:
        return self._normalize(path, cwd)

    def _get_node(self, path: str) -> Optional[Dict]:
        path = self._normalize(path)
        if path == "/":
            return self._root
        node = self._root
        for part in [x for x in path.strip("/").split("/") if x]:
            if node["type"] != "dir":
                return None
            node = node["children"].get(part)
            if node is None:
                return None
        return node

    def exists(self, path: str, cwd: str = "/") -> bool:
        return self._get_node(self._normalize(path, cwd)) is not None

    def is_dir(self, path: str, cwd: str = "/") -> bool:
        node = self._get_node(self._normalize(path, cwd))
        return bool(node and node["type"] == "dir")

    def read_file(self, path: str, cwd: str = "/") -> str:
        node = self._get_node(self._normalize(path, cwd))
        if not node or node["type"] != "file":
            raise FileNotFoundError(path)
        return node["content"]

    def list_dir(self, path: str = ".", cwd: str = "/") -> List[str]:
        node = self._get_node(self._normalize(path, cwd))
        if not node or node["type"] != "dir":
            raise FileNotFoundError(path)
        names = list(node["children"].keys())
        names.sort()
        return names

    def find(self, start: str = ".", cwd: str = "/", name_contains: str = "") -> List[str]:
        root_path = self._normalize(start, cwd)
        start_node = self._get_node(root_path)
        if not start_node:
            return []
        pattern = (name_contains or "").lower()
        out: List[str] = []

        def walk(path: str, node: Dict) -> None:
            base = posixpath.basename(path) if path != "/" else "/"
            if not pattern or pattern in base.lower():
                out.append(path)
            if node["type"] != "dir":
                return
            for child_name, child_node in sorted(node["children"].items()):
                child_path = path.rstrip("/") + "/" + child_name if path != "/" else "/" + child_name
                walk(child_path, child_node)

        walk(root_path, start_node)
        return out

