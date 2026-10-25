"""Validation schemas for cart and checkout APIs."""

import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

PHONE_PATTERN = re.compile(r"^(0|\+84)(3|5|7|8|9)\d{8}$")


class CartItemInput(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(ge=1, le=99)


class CartMergeRequest(BaseModel):
    items: list[CartItemInput] = Field(max_length=100)


class CartQuantityUpdate(BaseModel):
    quantity: int = Field(ge=1, le=99)


class CardInput(BaseModel):
    number: str
    holder: str = Field(min_length=2, max_length=100)
    expiry: str = Field(pattern=r"^(0[1-9]|1[0-2])/\d{2}$")
    cvv: str = Field(pattern=r"^\d{3}$")

    @field_validator("number")
    @classmethod
    def validate_card_number(cls, value: str) -> str:
        digits = re.sub(r"\s+", "", value)
        if not re.fullmatch(r"\d{16}", digits):
            raise ValueError("Số thẻ phải gồm 16 chữ số.")
        return digits

    @field_validator("holder")
    @classmethod
    def validate_holder(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Vui lòng nhập tên chủ thẻ.")
        return normalized

    @field_validator("expiry")
    @classmethod
    def validate_expiry(cls, value: str) -> str:
        month, year = (int(part) for part in value.split("/"))
        year += 2000
        now = datetime.now()
        if (year, month) < (now.year, now.month):
            raise ValueError("Thẻ đã hết hạn.")
        return value


class OrderCreateRequest(BaseModel):
    shipping_name: str = Field(min_length=2, max_length=200)
    shipping_phone: str
    shipping_address: str = Field(min_length=5, max_length=500)
    note: str | None = Field(default=None, max_length=1000)
    payment_method: Literal["cod", "mock_card", "vietqr"]
    card: CardInput | None = None

    @field_validator("shipping_name", "shipping_address")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Thông tin giao hàng không được để trống.")
        return normalized

    @field_validator("shipping_phone")
    @classmethod
    def validate_shipping_phone(cls, value: str) -> str:
        normalized = value.strip()
        if not PHONE_PATTERN.fullmatch(normalized):
            raise ValueError("Số điện thoại không đúng định dạng.")
        return normalized

    @model_validator(mode="after")
    def require_card_details(self) -> "OrderCreateRequest":
        if self.payment_method == "mock_card" and self.card is None:
            raise ValueError("Vui lòng nhập thông tin thẻ.")
        return self


class ReviewCreateRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1, max_length=2000)

    @field_validator("comment")
    @classmethod
    def validate_comment(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Vui lòng nhập nội dung đánh giá.")
        return normalized


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    unit_price_cents: int
    quantity: int


class OrderResponse(BaseModel):
    id: int
    code: str
    user_id: int
    total_amount_cents: int
    shipping_fee_cents: int
    status: str
    shipping_name: str
    shipping_phone: str
    shipping_address: str
    payment_method: str
    payment_status: str
    note: str | None
    created_at: datetime
    items: list[OrderItemResponse]
