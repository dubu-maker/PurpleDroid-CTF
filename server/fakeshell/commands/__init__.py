from __future__ import annotations

from typing import Any, Callable, Dict, Tuple

from .android import run_adb
from .base import run_cd, run_echo, run_help, run_pwd, run_whoami
from .flow import run_seq, run_xargs
from .fs_cmd import run_cat, run_find, run_ls
from .network import run_curl
from .text import run_findstr, run_grep, run_head, run_tail, run_wc

CommandFunc = Callable[[list[str], str, Any], Tuple[str, str, int]]

COMMANDS: Dict[str, CommandFunc] = {
    "echo": run_echo,
    "help": run_help,
    "whoami": run_whoami,
    "pwd": run_pwd,
    "cd": run_cd,
    "ls": run_ls,
    "cat": run_cat,
    "find": run_find,
    "grep": run_grep,
    "findstr": run_findstr,
    "head": run_head,
    "tail": run_tail,
    "wc": run_wc,
    "seq": run_seq,
    "xargs": run_xargs,
    "curl": run_curl,
    "adb": run_adb,
}
