import json
import sys
from pathlib import Path
from typing import Dict


def get_base_url() -> Path:
    if hasattr(sys, '_MEIPASS'):
        return Path(sys.executable).parent
    else:
        return Path(__file__).parent.parent.parent.parent


SAVE_PATH_ = get_base_url() / "data"

SELLER_PATH = SAVE_PATH_ / "seller.json"
PROMOTION_PATH = SAVE_PATH_ / "promotion.json"
PRODUCT_PATH = SAVE_PATH_ / "product.json"

# 用户 关注 登录令牌
USER_PATH = SAVE_PATH_ / "user.json"
FOLLOW_PATH = SAVE_PATH_ / "follow.json"
TOKEN_PATH = SAVE_PATH_ / "token.json"
# 购物车
CART_PATH = SAVE_PATH_ / "cart.json"


COLLECTION_PATHS: Dict[str, Path] = {
    "seller": SELLER_PATH,
    "promotion": PROMOTION_PATH,
    "product": PRODUCT_PATH,
    "user": USER_PATH,
    "follow": FOLLOW_PATH,
    "token": TOKEN_PATH,
    "cart": CART_PATH,
}


def ensure_dir() -> Path | None:
    if not SAVE_PATH_.exists():
        SAVE_PATH_.mkdir(exist_ok=True)
        print(f"[ensure_dir] SAVE_PATH_CONFIG is not exists")
    return SAVE_PATH_


def models_dir() -> dict:
    res = {}
    for name, path in COLLECTION_PATHS.items():
        res[name] = [path.exists(), str(path)]
    return res


def init_data(_object: str = "") -> Dict:
    if _object:
        return {str(_object): []}

    return {name: {name: []} for name in COLLECTION_PATHS}


def init_object(_object: str = "") -> None:
    res = models_dir()
    if _object:
        data = res.get(_object)
        if not data or data[0]:
            return
        if not Path(data[1]).exists():
            with open(Path(data[1]), "w", encoding="utf-8") as f:
                json.dump(init_data(_object), f, indent=2, ensure_ascii=False)
        return

    try:
        for name, path in COLLECTION_PATHS.items():
            if not path.exists():
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(init_data(name), f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[init_object] {e}")
