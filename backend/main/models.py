from datetime import datetime
import uuid

from pydantic import BaseModel, Field
from typing import Dict, List, Optional


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def _now() -> str:
    return datetime.now().isoformat()


class Seller(BaseModel):
    id: str = Field(default_factory=lambda: _new_id("seller"))
    name: str
    owner_id: str = ""

    created_at: str = Field(default_factory=_now)
    updated_at: str = Field(default_factory=_now)


class Promotion(BaseModel):
    id: str = Field(default_factory=lambda: _new_id("promotion"))
    name: str
    start_time: str
    end_time: str
    discount_rate: float
    seller_id: str = ""

    created_at: str = Field(default_factory=_now)
    updated_at: str = Field(default_factory=_now)


class ProductImage(BaseModel):
    id: str = Field(default_factory=lambda: _new_id("image"))
    url: str = ""
    filename: str = ""


class Product(BaseModel):
    id: str = Field(default_factory=lambda: _new_id("product"))
    name: str = ""
    product_type: str
    detail: Dict[str, str] = Field(default_factory=dict)
    original_price: float
    images: List[ProductImage] = Field(default_factory=list)
    promotion: Optional[Promotion] = None
    seller: Seller
    seller_id: str = ""

    created_at: str = Field(default_factory=_now)
    updated_at: str = Field(default_factory=_now)


class User(BaseModel):
    id: str = Field(default_factory=lambda: _new_id("user"))
    account: str
    name: str
    avatar: Optional[str] = None
    password_hash: str
    password_salt: str

    created_at: str = Field(default_factory=_now)
    updated_at: str = Field(default_factory=_now)

    def to_public(self) -> dict:
        data = self.model_dump()
        data.pop("password_hash", None)
        data.pop("password_salt", None)
        return data


class Follow(BaseModel):
    id: str = Field(default_factory=lambda: _new_id("follow"))
    user_id: str
    target_type: str          # seller / promotion / product
    target_id: str

    created_at: str = Field(default_factory=_now)


class Token(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex)
    user_id: str
    created_at: str = Field(default_factory=_now)


class CartItem(BaseModel):
    id: str = Field(default_factory=lambda: _new_id("cart"))
    user_id: str
    product_id: str
    quantity: int = 1

    created_at: str = Field(default_factory=_now)
    updated_at: str = Field(default_factory=_now)
