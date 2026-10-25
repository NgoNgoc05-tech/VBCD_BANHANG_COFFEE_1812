"""Order & OrderItem models - lưu đơn hàng và lịch sử giá tại thời điểm mua."""
from sqlalchemy import String, Integer, DateTime, func, ForeignKey, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    # Mã đơn hàng duy nhất, ví dụ: "COFFEE-XXXXXX"
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    total_amount_cents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    shipping_fee_cents: Mapped[int] = mapped_column(
        Integer, default=0, server_default=text("0"), nullable=False
    )
    # pending | processing | shipping | completed | cancelled
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    shipping_name: Mapped[str] = mapped_column(String(200), nullable=False)
    shipping_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    shipping_address: Mapped[str] = mapped_column(String(500), nullable=False)
    # cod | mock_card | mock_vietqr
    payment_method: Mapped[str] = mapped_column(String(20), nullable=False)
    # unpaid | paid | failed | refunded
    payment_status: Mapped[str] = mapped_column(String(20), default="unpaid", nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    # Lưu snapshot tên sản phẩm + giá tại thời điểm mua để không bị thay đổi
    product_name: Mapped[str] = mapped_column(String(300), nullable=False)
    unit_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
