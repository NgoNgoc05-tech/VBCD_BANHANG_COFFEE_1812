"""Tiện ích bảo mật: JWT token & mật khẩu băm bcrypt."""
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from pydantic import ValidationError
from app.core.config import settings
from app.schemas.auth import TokenPayload

# --- Password hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """So sánh mật khẩu người dùng nhập với hash đã lưu."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Tạo hash bcrypt từ mật khẩu thuần."""
    return pwd_context.hash(password, rounds=settings.BCRYPT_ROUNDS)


# --- JWT Token ---
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Tạo JWT access token.
    Thông thường data chứa {"sub": str(user_id)}.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> TokenPayload | None:
    """
    Giải mã JWT. Trả về None nếu token hết hạn hoặc không hợp lệ.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return TokenPayload(**payload)
    except (JWTError, ValidationError):
        return None
