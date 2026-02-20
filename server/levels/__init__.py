from . import level1_1
from . import level1_2
from . import level1_3
from . import level2_1
from . import level2_2  # 👈 추가

LEVELS = {
    level1_1.STATIC["id"]: level1_1,
    level1_2.STATIC["id"]: level1_2,
    level1_3.STATIC["id"]: level1_3,
    level2_1.STATIC["id"]: level2_1,
    level2_2.STATIC["id"]: level2_2,  # 👈 추가
}

LEVEL_ORDER = [
    level1_1.STATIC["id"],
    level1_2.STATIC["id"],
    level1_3.STATIC["id"],
    level2_1.STATIC["id"],
    level2_2.STATIC["id"],  # 👈 추가
]