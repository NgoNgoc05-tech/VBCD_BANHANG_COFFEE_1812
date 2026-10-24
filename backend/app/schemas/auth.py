"""Pydantic schemas cho Auth (chưa có router auth ở giai đoạn 1)."""
from pydantic import BaseModel
from datetime import datetime


class TokenPayload(BaseModel):
    """Payload chứa trong JWT (thường có sub = user id và exp = thời gian)."""
    sub: int | None = None
    exp: datetime | None = None
