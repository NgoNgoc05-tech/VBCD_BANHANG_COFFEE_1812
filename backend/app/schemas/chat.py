"""Validation schemas for the public chat assistant API."""

from typing import Literal

from pydantic import BaseModel, Field, field_validator


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant", "model"]
    content: str = Field(max_length=5000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    history: list[ChatHistoryItem] = Field(default_factory=list)

    @field_validator("history")
    @classmethod
    def keep_recent_history(
        cls, history: list[ChatHistoryItem]
    ) -> list[ChatHistoryItem]:
        return history[-10:]


class ChatProduct(BaseModel):
    id: int
    name: str
    slug: str
    price: int
    sale_price: int | None
    image_url: str | None


class ChatResponse(BaseModel):
    reply: str
    products: list[ChatProduct]
