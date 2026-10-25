"""Pydantic schemas for authentication and user profiles."""

import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_PATTERN = re.compile(r"^(0|\+84)(3|5|7|8|9)\d{8}$")


def validate_email(value: str) -> str:
    normalized = value.strip().lower()
    if not EMAIL_PATTERN.fullmatch(normalized):
        raise ValueError("Email không hợp lệ.")
    return normalized


def validate_password(value: str) -> str:
    if not any(character.isalpha() for character in value) or not any(
        character.isdigit() for character in value
    ):
        raise ValueError("Mật khẩu phải có ít nhất 8 ký tự, gồm cả chữ và số.")
    return value


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=200)
    email: str
    password: str = Field(min_length=8, max_length=128)
    phone: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=500)

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Họ tên không được để trống.")
        return normalized

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return validate_email(value)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        return validate_password(value)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if value is not None and value.strip() and not PHONE_PATTERN.fullmatch(value.strip()):
            raise ValueError("Số điện thoại không đúng định dạng.")
        return value.strip() if value else value


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return validate_email(value)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    phone: str | None
    address: str | None
    role: str
    created_at: datetime


class TokenPayload(BaseModel):
    """JWT payload; ``sub`` is the user ID."""

    sub: int
    exp: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=200)
    phone: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=500)

    @field_validator("full_name", mode="before")
    @classmethod
    def validate_full_name(cls, value: str | None) -> str | None:
        if value is None:
            raise ValueError("Họ tên không được để trống.")
        normalized = value.strip()
        if not normalized:
            raise ValueError("Họ tên không được để trống.")
        return normalized

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if value is not None and value.strip() and not PHONE_PATTERN.fullmatch(value.strip()):
            raise ValueError("Số điện thoại không đúng định dạng.")
        return value.strip() if value else value


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return validate_password(value)


class MessageResponse(BaseModel):
    message: str
