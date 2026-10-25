"""Checkout, payment simulation, and customer order lookup."""

import secrets
import time
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import update
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user, get_db
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.commerce import OrderCreateRequest

router = APIRouter(prefix="/api", tags=["Orders"])
FREE_SHIPPING_THRESHOLD = 500_000
STANDARD_SHIPPING_FEE = 30_000


def generate_order_code() -> str:
    return f"PB{datetime.now().strftime('%y%m%d')}{secrets.token_hex(2).upper()}"


def serialize_order(order: Order) -> dict[str, object]:
    return {
        "id": order.id,
        "code": order.code,
        "user_id": order.user_id,
        "total_amount_cents": order.total_amount_cents,
        "shipping_fee_cents": order.shipping_fee_cents,
        "status": order.status,
        "shipping_name": order.shipping_name,
        "shipping_phone": order.shipping_phone,
        "shipping_address": order.shipping_address,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "note": order.note,
        "created_at": order.created_at,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "unit_price_cents": item.unit_price_cents,
                "quantity": item.quantity,
            }
            for item in order.items
        ],
    }


@router.post("/orders", status_code=201)
def create_order(
    data: OrderCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    if data.payment_method == "mock_card":
        if data.card is None:
            raise HTTPException(status_code=422, detail="Vui lòng nhập thông tin thẻ.")
        time.sleep(1.5)
        if data.card.number == "4000000000000002":
            raise HTTPException(status_code=402, detail="Thẻ bị từ chối")

    try:
        cart = (
            db.query(Cart)
            .options(joinedload(Cart.items).joinedload(CartItem.product))
            .filter(Cart.user_id == current_user.id)
            .with_for_update()
            .first()
        )
        if cart is None or not cart.items:
            raise HTTPException(status_code=400, detail="Giỏ hàng đang trống.")

        product_rows: list[tuple[CartItem, Product, int]] = []
        subtotal = 0
        for cart_item in cart.items:
            product = (
                db.query(Product)
                .filter(Product.id == cart_item.product_id)
                .with_for_update()
                .first()
            )
            if product is None or not product.is_active:
                product_name = (
                    cart_item.product.name
                    if cart_item.product is not None
                    else f"Mã sản phẩm {cart_item.product_id}"
                )
                raise HTTPException(
                    status_code=409,
                    detail=f"Sản phẩm {product_name} không còn được bán.",
                )
            if product.stock < cart_item.quantity:
                raise HTTPException(
                    status_code=409,
                    detail=f"Sản phẩm {product.name} chỉ còn {product.stock} trong kho.",
                )
            unit_price = (
                product.sale_price_cents
                if product.sale_price_cents is not None
                else product.price_cents
            )
            subtotal += unit_price * cart_item.quantity
            product_rows.append((cart_item, product, unit_price))

        shipping_fee = 0 if subtotal >= FREE_SHIPPING_THRESHOLD else STANDARD_SHIPPING_FEE
        order = Order(
            code=generate_order_code(),
            user_id=current_user.id,
            total_amount_cents=subtotal + shipping_fee,
            shipping_fee_cents=shipping_fee,
            status="pending",
            shipping_name=data.shipping_name,
            shipping_phone=data.shipping_phone,
            shipping_address=data.shipping_address,
            payment_method=data.payment_method,
            payment_status="paid" if data.payment_method == "mock_card" else "unpaid",
            note=data.note,
        )
        db.add(order)
        db.flush()

        for cart_item, product, unit_price in product_rows:
            stock_update = db.execute(
                update(Product)
                .where(
                    Product.id == product.id,
                    Product.is_active.is_(True),
                    Product.stock >= cart_item.quantity,
                )
                .values(stock=Product.stock - cart_item.quantity)
            )
            if stock_update.rowcount != 1:
                raise HTTPException(
                    status_code=409,
                    detail=f"Sản phẩm {product.name} vừa hết hàng hoặc không đủ tồn kho.",
                )
            db.add(
                OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    product_name=product.name,
                    unit_price_cents=unit_price,
                    quantity=cart_item.quantity,
                )
            )

        db.delete(cart)
        db.commit()
        db.refresh(order)
        return serialize_order(order)
    except Exception:
        db.rollback()
        raise


@router.get("/orders/{code}")
def get_order(
    code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.code == code)
        .first()
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng.")
    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem đơn hàng này.")
    return serialize_order(order)
