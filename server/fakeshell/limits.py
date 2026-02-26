from __future__ import annotations

MAX_INPUT_CHARS = 1250
MAX_PIPE_STAGES = 8
MAX_OUTPUT_BYTES = 50_000
MAX_COMMAND_SECONDS = 0.5


def check_input_limit(command: str) -> None:
    if len(command or "") > MAX_INPUT_CHARS:
        raise ValueError(f"command too long (max {MAX_INPUT_CHARS})")


def check_stage_limit(stage_count: int) -> None:
    if stage_count > MAX_PIPE_STAGES:
        raise ValueError(f"too many pipeline stages (max {MAX_PIPE_STAGES})")


def truncate_output(text: str) -> tuple[str, bool]:
    raw = (text or "").encode("utf-8")
    if len(raw) <= MAX_OUTPUT_BYTES:
        return text or "", False
    clipped = raw[:MAX_OUTPUT_BYTES].decode("utf-8", errors="ignore")
    return clipped + "\n...(truncated)\n", True
