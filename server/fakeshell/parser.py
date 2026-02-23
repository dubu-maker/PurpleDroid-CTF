from __future__ import annotations

import shlex
from typing import List


def _split_outside_quotes(text: str, token: str) -> List[str]:
    parts: List[str] = []
    if not text:
        return [""]
    quote: str | None = None
    escaped = False
    start = 0
    i = 0
    token_len = len(token)
    while i < len(text):
        ch = text[i]
        if escaped:
            escaped = False
            i += 1
            continue
        if ch == "\\":
            escaped = True
            i += 1
            continue
        if quote:
            if ch == quote:
                quote = None
            i += 1
            continue
        if ch in ("'", '"'):
            quote = ch
            i += 1
            continue
        if text.startswith(token, i):
            parts.append(text[start:i].strip())
            i += token_len
            start = i
            continue
        i += 1
    parts.append(text[start:].strip())
    return parts


def parse_command_line(command: str) -> List[List[List[str]]]:
    chains_raw = _split_outside_quotes(command or "", "&&")
    chains: List[List[List[str]]] = []
    for chain in chains_raw:
        if not chain:
            continue
        stages_raw = _split_outside_quotes(chain, "|")
        stages: List[List[str]] = []
        for stage in stages_raw:
            if not stage:
                continue
            stages.append(shlex.split(stage))
        if stages:
            chains.append(stages)
    return chains

