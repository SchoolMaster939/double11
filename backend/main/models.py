from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
import uuid
class Seller(BaseModel):
    id: str = f"seller_{uuid.uuid4().hex[:8]}"
    name: str

    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class Promotion(BaseModel):
    id: str = f"promotion_{uuid.uuid4().hex[:8]}"
    name: str
    time: str
    discount_rate: float

    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class Product(BaseModel):
    id: str = f"product_{uuid.uuid4().hex[:8]}"
    _type: str
    detail: str
    original_price: float
    promotion: Optional[Promotion]
    seller: Seller

    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())

