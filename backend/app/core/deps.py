"""Dependencies dùng chung: DB session, auth, phân quyền."""
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.security import decode_access_token
from app.models import User

# Bearer token dependency (gửi kèm Authorization: Bearer <token>)
security = HTTPBearer(auto_error=False)


def get_db() -> Generator[Session, None, None]:
    """Cung cấp một session SQLAlchemy cho mỗi yêu cầu."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Validate the bearer token and load its user."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Vui lòng đăng nhập để thực hiện hành động này.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise unauthorized
    user = db.query(User).filter(User.id == payload.sub).first()
    if user is None:
        raise unauthorized
    return user


def require_user(
    user: User = Depends(get_current_user),
) -> User:
    """Compatibility dependency for endpoints requiring authentication."""
    return user


def require_admin(
    user: User = Depends(get_current_user),
) -> User:
    """
    Dependency bắt buộc role=admin.
    Dùng cho các endpoint admin.
    """
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền thực hiện hành động này.",
        )
    return user
