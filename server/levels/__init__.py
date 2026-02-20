# server/levels/__init__.py

# 이름이 바뀐 level1_1을 import 해야 합니다!
from . import level1_1
from . import level1_2
from . import level1_3

LEVELS = {
    level1_1.STATIC["id"]: level1_1,
    level1_2.STATIC["id"]: level1_2,
    level1_3.STATIC["id"]: level1_3,
}

LEVEL_ORDER = [
    level1_1.STATIC["id"],
    level1_2.STATIC["id"],
    level1_3.STATIC["id"],
]