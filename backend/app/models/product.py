"""Product model - bảng products (cà phê, dụng cụ pha chế)."""
import json
from sqlalchemy import String, Integer, DateTime, func, Numeric, Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    slug: Mapped[str] = mapped_column(String(300), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Giá tiền lưu dưới dạng cents (VND) để tránh float
    # Ví dụ: 690000 = 6.9 triệu VND
    price_cents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sale_price_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Danh sách URL ảnh dạng JSON, ví dụ: ["https://...", "https://..."]
    images: Mapped[str] = mapped_column(String, default="[]", nullable=False)
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("categories.id"), nullable=False, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    avg_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0.0, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    category = relationship("Category", back_populates="products")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")

    @property
    def images_list(self) -> list:
        """Đọc JSON string images thành list các URL."""
        try:
            return json.loads(self.images) if self.images else []
        except Exception:
            return []

    @images_list.setter
    def images_list(self, value: list) -> None:
        """Ghi list các URL ảnh thành JSON string."""
        self.images = json.dumps(value)
