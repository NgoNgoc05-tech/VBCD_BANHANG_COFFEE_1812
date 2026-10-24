"""Auth router - đăng ký, đăng nhập, lấy user hiện tại."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import TokenPayload
from app.schemas.product import Product
from app.schemas.order import Order
from app.schemas.review import Review

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user_data: dict):
    """Đăng ký một người mới."""
    # Tạo user mới
    # (sẽ cần thêm validation và checks)
    raise HTTPException(
        status_code=status.HTTP_201_CREATED,
        detail="Đang xử lý đăng ký..."
    )


@router.post("/login", response_model=dict)
async def login(credentials: dict):
    """Đăng nhập và tạo JWT token."""
    # Tìm user theo email
    # Tạo token JWT
    # Trả về token
    raise HTTPException(
        status_code=status.HTTP_200_OK,
        detail="Đang xử lý đăng nhập..."
    )


@router.get("/me", response_model=TokenPayload)
async def get_me(current_user: TokenPayload = Depends(get_current_user)):
    """Lấy thông tin user hiện tại."""
    return current_user
