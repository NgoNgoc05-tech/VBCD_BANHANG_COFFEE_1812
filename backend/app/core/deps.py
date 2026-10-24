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
) -> User | None:
    """Trích xuất user hiện tại từ JWT. Trả về None nếu chưa đăng nhập."""
    if credentials is None:
        return None
    payload = decode_access_token(credentials.credentials)
    if payload is None or payload.sub is None:
        return None
    user = db.query(User).filter(User.id == int(payload.sub)).first()
    return user


def require_user(
    user: User | None = Depends(get_current_user),
) -> User:
    """
    Dependency bắt buộc phải đăng nhập.
    Dùng cho các endpoint cần xác thực.
    """
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vui lòng đăng nhập để thực hiện hành động này.",
        )
    return user


def require_admin(
    user: User = Depends(require_user),
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
