# server/levels/__init__.py
from . import level1

LEVELS = {
    level1.STATIC["id"]: level1,
}

LEVEL_ORDER = [
    level1.STATIC["id"],
]
    