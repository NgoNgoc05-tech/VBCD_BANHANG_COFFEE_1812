"""Authenticated server-side cart endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user, get_db
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.user import User
from app.routers.catalog import serialize_product
from app.schemas.commerce import (
    CartItemInput,
    CartMergeRequest,
    CartQuantityUpdate,
)

router = APIRouter(prefix="/api/cart", tags=["Cart"])


def get_or_create_cart(db: Session, user_id: int) -> Cart:
    cart = db.query(Cart).filter(Cart.user_id == user_id).with_for_update().first()
    if cart is None:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.flush()
    return cart


def serialize_cart(db: Session, cart: Cart | None) -> dict[str, object]:
    if cart is None:
        items: list[dict[str, object]] = []
    else:
        cart = (
            db.query(Cart)
            .options(
                joinedload(Cart.items)
                .joinedload(CartItem.product)
                .joinedload(Product.category)
            )
            .filter(Cart.id == cart.id)
            .first()
        )
        items = []
        for item in (cart.items if cart is not None else []):
            if item.product is None or item.product.category is None:
                continue
            items.append(
                {
                    "id": item.id,
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "product": serialize_product(item.product),
                }
            )
    subtotal = sum(
        item["quantity"]
        * (
            item["product"]["sale_price"]
            if item["product"]["sale_price"] is not None
            else item["product"]["price"]
        )
        for item in items
    )
    return {"items": items, "subtotal": subtotal}


def get_product_for_cart(db: Session, product_id: int) -> Product:
    product = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.id == product_id)
        .with_for_update()
        .first()
    )
    if product is None or not product.is_active:
        raise HTTPException(status_code=404, detail="Sản phẩm không còn được bán.")
    if product.stock <= 0:
        raise HTTPException(status_code=409, detail="Sản phẩm hiện đã hết hàng.")
    return product


def find_cart_item(cart: Cart, product_id: int) -> CartItem | None:
    return next((item for item in cart.items if item.product_id == product_id), None)


@router.get("")
def get_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    cart = (
        db.query(Cart)
        .options(joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.category))
        .filter(Cart.user_id == current_user.id)
        .first()
    )
    return serialize_cart(db, cart)


@router.post("/items")
def add_cart_item(
    item_data: CartItemInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        cart = get_or_create_cart(db, current_user.id)
        product = get_product_for_cart(db, item_data.product_id)
        item = find_cart_item(cart, product.id)
        new_quantity = (item.quantity if item else 0) + item_data.quantity
        if new_quantity > product.stock:
            raise HTTPException(
                status_code=409,
                detail=f"Chỉ còn {product.stock} sản phẩm trong kho.",
            )
        if item is None:
            item = CartItem(cart_id=cart.id, product_id=product.id, quantity=new_quantity)
            db.add(item)
        else:
            item.quantity = new_quantity
        db.commit()
        return serialize_cart(db, cart)
    except Exception:
        db.rollback()
        raise


@router.put("/items/{product_id}")
def update_cart_item(
    product_id: int,
    quantity_data: CartQuantityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        cart = get_or_create_cart(db, current_user.id)
        product = get_product_for_cart(db, product_id)
        item = find_cart_item(cart, product_id)
        if item is None:
            raise HTTPException(status_code=404, detail="Sản phẩm không có trong giỏ hàng.")
        if quantity_data.quantity > product.stock:
            raise HTTPException(
                status_code=409,
                detail=f"Chỉ còn {product.stock} sản phẩm trong kho.",
            )
        item.quantity = quantity_data.quantity
        db.commit()
        return serialize_cart(db, cart)
    except Exception:
        db.rollback()
        raise


@router.delete("/items/{product_id}")
def delete_cart_item(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        cart = get_or_create_cart(db, current_user.id)
        item = find_cart_item(cart, product_id)
        if item is not None:
            db.delete(item)
        db.commit()
        return serialize_cart(db, cart)
    except Exception:
        db.rollback()
        raise


@router.delete("")
def empty_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if cart is not None:
        db.delete(cart)
        db.commit()
    return {"items": [], "subtotal": 0}


@router.post("/merge")
def merge_cart(
    data: CartMergeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        cart = get_or_create_cart(db, current_user.id)
        requested: dict[int, int] = {}
        for item in data.items:
            requested[item.product_id] = requested.get(item.product_id, 0) + item.quantity

        merge_plan: list[tuple[Product, CartItem | None, int]] = []
        for product_id, quantity in requested.items():
            product = get_product_for_cart(db, product_id)
            existing = find_cart_item(cart, product_id)
            merge_plan.append(
                (product, existing, min(product.stock, (existing.quantity if existing else 0) + quantity))
            )

        for product, existing, quantity in merge_plan:
            if existing is None:
                db.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=quantity))
            else:
                existing.quantity = quantity
        db.commit()
        return serialize_cart(db, cart)
    except Exception:
        db.rollback()
        raise
