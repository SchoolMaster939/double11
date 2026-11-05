import sys
from pathlib import Path

def get_base_url() -> Path:
    if hasattr(sys, '_MEIPASS'):
        return Path(sys.executable).parent
    else:
        return Path(__file__).parent.parent.parent.parent


SAVE_PATH_ = get_base_url() / "data"

SELLER_PATH = SAVE_PATH_ / "seller.json"
PROMOTION_PATH = SAVE_PATH_ / "promotion.json"
PRODUCT_PATH = SAVE_PATH_ / "product.json"

def ensure_dir() -> Path | None:
    if not SAVE_PATH_.exists():
        SAVE_PATH_.mkdir(exist_ok=True)
        print(f"[ensure_dir] SAVE_PATH_CONFIG is not exists")
    return SAVE_PATH_

def models_dir() -> dict:
    res = {
        "seller": [True, str(SELLER_PATH)],
        "promotion": [True, str(PROMOTION_PATH)],
        "product": [True, str(PRODUCT_PATH)]
    }
    if not SELLER_PATH.exists():
        res.update({"seller": [False, str(SELLER_PATH)]})
    if not PROMOTION_PATH.exists():
        res.update({"promotion": [False, str(PROMOTION_PATH)]})
    if not PRODUCT_PATH.exists():
        res.update({"product": [False, str(PRODUCT_PATH)]})
    return res

def init_object(_object: str = "") -> None:
    res = models_dir()
    if _object:
        data = res.get(_object)
        if not data[0]:
            return
        if not Path(data[1]).exists():
            with open(data[1])
