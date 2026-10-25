"""Admin dashboard and store-management APIs."""

import math
import re
import unicodedata
import uuid
from datetime import date, datetime, time, timedelta
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy import case, func, or_, update
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_db, require_admin
from app.models.cart import CartItem
from app.models.category import Category
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User

router = APIRouter(prefix="/api/admin", tags=["Admin"])
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "static" / "uploads"
MAX_UPLOAD_BYTES = 2 * 1024 * 1024
ALLOWED_UPLOADS = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}
ORDER_STATUSES = ("pending", "processing", "shipping", "completed", "cancelled")
FORWARD_STATUSES = ("pending", "processing", "shipping", "completed")


class ProductInput(BaseModel):
    name: str = Field(min_length=2, max_length=300)
    category_id: int = Field(gt=0)
    price: int = Field(gt=0)
    sale_price: int | None = Field(default=None, gt=0)
    stock: int = Field(ge=0)
    description: str | None = Field(default=None, max_length=10000)
    is_featured: bool = False
    image_url: str | None = Field(default=None, max_length=500)
    images: list[str] = Field(default_factory=list, max_length=10)
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Tên sản phẩm không được để trống.")
        return cleaned

    @model_validator(mode="after")
    def validate_sale_price(self) -> "ProductInput":
        if self.sale_price is not None and self.sale_price >= self.price:
            raise ValueError("Giá khuyến mãi phải thấp hơn giá gốc.")
        return self


class ProductStatusInput(BaseModel):
    is_active: bool | None = None
    out_of_stock: bool | None = None

    @model_validator(mode="after")
    def require_action(self) -> "ProductStatusInput":
        if self.is_active is None and self.out_of_stock is None:
            raise ValueError("Cần chọn trạng thái hoạt động hoặc tình trạng kho.")
        return self


class CategoryInput(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    image_url: str | None = Field(default=None, max_length=500)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Tên danh mục không được để trống.")
        return cleaned


class OrderStatusInput(BaseModel):
    status: Literal["pending", "processing", "shipping", "completed", "cancelled"]


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]+", "-", ascii_text).strip("-") or "san-pham"


def unique_slug(db: Session, model: type[Product] | type[Category], name: str, current_id: int | None = None) -> str:
    base = slugify(name)
    candidate = base
    suffix = 2
    while True:
        query = db.query(model.id).filter(model.slug == candidate)
        if current_id is not None:
            query = query.filter(model.id != current_id)
        if query.first() is None:
            return candidate
        candidate = f"{base}-{suffix}"
        suffix += 1


def product_response(product: Product) -> dict[str, object]:
    images = product.images_list
    return {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "description": product.description,
        "price": product.price_cents,
        "sale_price": product.sale_price_cents,
        "stock": product.stock,
        "image_url": images[0] if images else None,
        "images": images,
        "category_id": product.category_id,
        "category": {
            "id": product.category.id,
            "name": product.category.name,
            "slug": product.category.slug,
            "image_url": product.category.image_url,
            "sort_order": product.category.sort_order,
        },
        "is_featured": product.is_featured,
        "is_active": product.is_active,
        "avg_rating": float(product.avg_rating),
        "created_at": product.created_at,
    }


def order_response(order: Order) -> dict[str, object]:
    return {
        "id": order.id,
        "code": order.code,
        "user_id": order.user_id,
        "customer_name": order.shipping_name,
        "customer_email": order.user.email if order.user else None,
        "shipping_name": order.shipping_name,
        "shipping_phone": order.shipping_phone,
        "shipping_address": order.shipping_address,
        "total_amount_cents": order.total_amount_cents,
        "shipping_fee_cents": order.shipping_fee_cents,
        "status": order.status,
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
                "image_url": item.product.images_list[0]
                if item.product is not None and item.product.images_list
                else None,
            }
            for item in order.items
        ],
    }


def _days_bounds(days: int) -> tuple[date, date]:
    today = date.today()
    return today - timedelta(days=days - 1), today


@router.get("/stats")
def get_stats(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, int | float]:
    now = datetime.now()
    current_start = now - timedelta(days=30)
    previous_start = now - timedelta(days=60)
    completed = Order.status == "completed"
    total_revenue = db.query(func.coalesce(func.sum(Order.total_amount_cents), 0)).filter(completed).scalar() or 0
    current_revenue = db.query(func.coalesce(func.sum(Order.total_amount_cents), 0)).filter(
        completed, Order.created_at >= current_start
    ).scalar() or 0
    previous_revenue = db.query(func.coalesce(func.sum(Order.total_amount_cents), 0)).filter(
        completed, Order.created_at >= previous_start, Order.created_at < current_start
    ).scalar() or 0
    revenue_change = (
        ((current_revenue - previous_revenue) / previous_revenue) * 100
        if previous_revenue
        else (100.0 if current_revenue else 0.0)
    )
    return {
        "total_revenue": int(total_revenue),
        "total_orders": db.query(func.count(Order.id)).scalar() or 0,
        "total_customers": db.query(func.count(User.id)).filter(User.role == "customer").scalar() or 0,
        "pending_orders": db.query(func.count(Order.id)).filter(Order.status == "pending").scalar() or 0,
        "low_stock_products": db.query(func.count(Product.id)).filter(Product.stock <= 5).scalar() or 0,
        "revenue_change_percent": round(float(revenue_change), 2),
    }


@router.get("/stats/revenue")
def get_revenue(
    days: int = Query(default=30, ge=1, le=365),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    start_day, end_day = _days_bounds(days)
    start = datetime.combine(start_day, time.min)
    end = datetime.combine(end_day + timedelta(days=1), time.min)
    rows = (
        db.query(
            func.date(Order.created_at).label("day"),
            func.coalesce(func.sum(Order.total_amount_cents), 0).label("revenue"),
            func.count(Order.id).label("orders"),
        )
        .filter(Order.status == "completed", Order.created_at >= start, Order.created_at < end)
        .group_by(func.date(Order.created_at))
        .all()
    )
    by_day = {str(day): {"revenue": int(revenue), "orders": int(orders)} for day, revenue, orders in rows}
    return {
        "items": [
            {
                "date": (start_day + timedelta(days=offset)).isoformat(),
                **by_day.get(
                    (start_day + timedelta(days=offset)).isoformat(),
                    {"revenue": 0, "orders": 0},
                ),
            }
            for offset in range(days)
        ]
    }


@router.get("/stats/orders-by-status")
def orders_by_status(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, int]:
    counts = dict(db.query(Order.status, func.count(Order.id)).group_by(Order.status).all())
    return {status: int(counts.get(status, 0)) for status in ORDER_STATUSES}


@router.get("/stats/top-products")
def top_products(
    limit: int = Query(default=5, ge=1, le=50),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[dict[str, object]]:
    rows = (
        db.query(Product, func.sum(OrderItem.quantity).label("sold_quantity"))
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.status == "completed")
        .options(joinedload(Product.category))
        .group_by(Product.id)
        .order_by(func.sum(OrderItem.quantity).desc(), Product.name.asc())
        .limit(limit)
        .all()
    )
    return [{**product_response(product), "sold_quantity": int(quantity)} for product, quantity in rows]


@router.get("/orders/recent")
def recent_orders(
    limit: int = Query(default=5, ge=1, le=50),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[dict[str, object]]:
    orders = (
        db.query(Order)
        .options(joinedload(Order.user), joinedload(Order.items).joinedload(OrderItem.product))
        .order_by(Order.created_at.desc(), Order.id.desc())
        .limit(limit)
        .all()
    )
    return [order_response(order) for order in orders]


@router.get("/products")
def list_products(
    search: str | None = Query(default=None, max_length=200),
    category: int | None = Query(default=None, ge=1),
    status: str | None = Query(default=None, pattern="^(active|inactive|out_of_stock|low_stock)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    query = db.query(Product).options(joinedload(Product.category))
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(Product.name.ilike(term), Product.slug.ilike(term)))
    if category:
        query = query.filter(Product.category_id == category)
    if status == "active":
        query = query.filter(Product.is_active.is_(True))
    elif status == "inactive":
        query = query.filter(Product.is_active.is_(False))
    elif status == "out_of_stock":
        query = query.filter(Product.stock == 0)
    elif status == "low_stock":
        query = query.filter(Product.stock <= 5)

    total = query.count()
    products = (
        query.order_by(Product.created_at.desc(), Product.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "items": [product_response(product) for product in products],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size),
    }


@router.post("/products", status_code=201)
def create_product(
    data: ProductInput,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    category = db.query(Category).filter(Category.id == data.category_id).first()
    if category is None:
        raise HTTPException(status_code=422, detail="Danh mục không tồn tại.")
    product = Product(
        name=data.name,
        slug=unique_slug(db, Product, data.name),
        description=data.description,
        price_cents=data.price,
        sale_price_cents=data.sale_price,
        stock=data.stock,
        category_id=data.category_id,
        is_featured=data.is_featured,
        is_active=data.is_active,
    )
    product.images_list = ([data.image_url] if data.image_url else []) + [
        image for image in data.images if image and image != data.image_url
    ]
    db.add(product)
    db.commit()
    db.refresh(product)
    return product_response(product)


@router.put("/products/{product_id}")
def update_product(
    product_id: int,
    data: ProductInput,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm.")
    if db.query(Category.id).filter(Category.id == data.category_id).first() is None:
        raise HTTPException(status_code=422, detail="Danh mục không tồn tại.")
    product.name = data.name
    product.slug = unique_slug(db, Product, data.name, product.id)
    product.description = data.description
    product.price_cents = data.price
    product.sale_price_cents = data.sale_price
    product.stock = data.stock
    product.category_id = data.category_id
    product.is_featured = data.is_featured
    product.is_active = data.is_active
    product.images_list = ([data.image_url] if data.image_url else []) + [
        image for image in data.images if image and image != data.image_url
    ]
    db.commit()
    db.refresh(product)
    return product_response(product)


@router.patch("/products/{product_id}/status")
def update_product_status(
    product_id: int,
    data: ProductStatusInput,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    product = db.query(Product).options(joinedload(Product.category)).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm.")
    if data.is_active is not None:
        product.is_active = data.is_active
    if data.out_of_stock is not None:
        if data.out_of_stock:
            product.stock = 0
        elif product.stock == 0:
            raise HTTPException(
                status_code=409,
                detail="Hãy cập nhật số lượng tồn kho trước khi bật lại sản phẩm.",
            )
    db.commit()
    db.refresh(product)
    return product_response(product)


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm.")
    has_orders = db.query(OrderItem.id).filter(OrderItem.product_id == product.id).first()
    if has_orders:
        product.is_active = False
        db.commit()
        return {"message": "Sản phẩm đã có trong đơn hàng nên được ẩn khỏi cửa hàng, không xóa lịch sử."}
    db.query(CartItem).filter(CartItem.product_id == product.id).delete(synchronize_session=False)
    db.delete(product)
    db.commit()
    return {"message": "Đã xóa sản phẩm."}


@router.post("/upload")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    _admin: User = Depends(require_admin),
) -> dict[str, str]:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_UPLOADS or file.content_type != ALLOWED_UPLOADS[suffix]:
        raise HTTPException(status_code=415, detail="Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.")

    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Ảnh tải lên không được vượt quá 2 MB.")
    if not content:
        raise HTTPException(status_code=400, detail="Tệp ảnh đang trống.")
    valid_signature = (
        (suffix in {".jpg", ".jpeg"} and content.startswith(b"\xff\xd8\xff"))
        or (suffix == ".png" and content.startswith(b"\x89PNG\r\n\x1a\n"))
        or (suffix == ".webp" and content.startswith(b"RIFF") and content[8:12] == b"WEBP")
    )
    if not valid_signature:
        raise HTTPException(status_code=415, detail="Nội dung tệp không đúng định dạng ảnh đã chọn.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{suffix}"
    (UPLOAD_DIR / filename).write_bytes(content)
    return {"url": f"{str(request.base_url).rstrip('/')}/static/uploads/{filename}"}


@router.get("/categories")
def list_categories(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[dict[str, object]]:
    categories = (
        db.query(Category, func.count(Product.id).label("product_count"))
        .outerjoin(Product, Product.category_id == Category.id)
        .group_by(Category.id)
        .order_by(Category.sort_order.asc(), Category.name.asc())
        .all()
    )
    return [
        {
            "id": category.id,
            "name": category.name,
            "slug": category.slug,
            "image_url": category.image_url,
            "sort_order": category.sort_order,
            "product_count": int(product_count),
        }
        for category, product_count in categories
    ]


@router.post("/categories", status_code=201)
def create_category(
    data: CategoryInput,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    category = Category(
        name=data.name,
        slug=unique_slug(db, Category, data.name),
        image_url=data.image_url,
        sort_order=(db.query(func.max(Category.sort_order)).scalar() or 0) + 1,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return {"id": category.id, "name": category.name, "slug": category.slug, "image_url": category.image_url, "sort_order": category.sort_order, "product_count": 0}


@router.put("/categories/{category_id}")
def update_category(
    category_id: int,
    data: CategoryInput,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    category = db.query(Category).filter(Category.id == category_id).first()
    if category is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục.")
    category.name = data.name
    category.slug = unique_slug(db, Category, data.name, category.id)
    category.image_url = data.image_url
    db.commit()
    db.refresh(category)
    product_count = db.query(func.count(Product.id)).filter(Product.category_id == category.id).scalar() or 0
    return {"id": category.id, "name": category.name, "slug": category.slug, "image_url": category.image_url, "sort_order": category.sort_order, "product_count": product_count}


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    category = db.query(Category).filter(Category.id == category_id).first()
    if category is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục.")
    if db.query(Product.id).filter(Product.category_id == category.id).first():
        raise HTTPException(status_code=409, detail="Không thể xóa danh mục đang có sản phẩm.")
    db.delete(category)
    db.commit()
    return {"message": "Đã xóa danh mục."}


@router.get("/orders")
def list_orders(
    status: str | None = Query(default=None, pattern="^(pending|processing|shipping|completed|cancelled)$"),
    date_from: date | None = None,
    date_to: date | None = None,
    search: str | None = Query(default=None, max_length=200),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    query = db.query(Order).join(User, Order.user_id == User.id)
    if status:
        query = query.filter(Order.status == status)
    if date_from:
        query = query.filter(Order.created_at >= datetime.combine(date_from, time.min))
    if date_to:
        query = query.filter(Order.created_at < datetime.combine(date_to + timedelta(days=1), time.min))
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Order.code.ilike(term),
                Order.shipping_name.ilike(term),
                Order.shipping_phone.ilike(term),
                User.full_name.ilike(term),
                User.email.ilike(term),
            )
        )
    total = query.count()
    orders = (
        query.options(joinedload(Order.user), joinedload(Order.items).joinedload(OrderItem.product))
        .order_by(Order.created_at.desc(), Order.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "items": [order_response(order) for order in orders],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size),
    }


@router.get("/orders/{code}")
def get_admin_order(
    code: str,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    order = (
        db.query(Order)
        .options(joinedload(Order.user), joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.code == code)
        .first()
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng.")
    return order_response(order)


@router.patch("/orders/{code}/status")
def update_order_status(
    code: str,
    data: OrderStatusInput,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        order = (
            db.query(Order)
            .options(joinedload(Order.items))
            .filter(Order.code == code)
            .with_for_update()
            .first()
        )
        if order is None:
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng.")
        next_status = data.status
        if order.status == "cancelled":
            raise HTTPException(status_code=409, detail="Đơn hàng đã hủy, không thể đổi trạng thái.")
        if next_status == "cancelled":
            if order.status not in {"pending", "processing"}:
                raise HTTPException(status_code=409, detail="Chỉ được hủy đơn trước khi chuyển sang đang giao.")
            for item in order.items:
                db.execute(
                    update(Product)
                    .where(Product.id == item.product_id)
                    .values(stock=Product.stock + item.quantity)
                )
            if order.payment_method == "mock_card" and order.payment_status == "paid":
                order.payment_status = "refunded"
        else:
            current_index = FORWARD_STATUSES.index(order.status) if order.status in FORWARD_STATUSES else -1
            target_index = FORWARD_STATUSES.index(next_status)
            if target_index != current_index + 1:
                raise HTTPException(status_code=409, detail="Đơn hàng chỉ được chuyển sang trạng thái kế tiếp.")
            if next_status == "completed" and order.payment_method in {"cod", "vietqr"}:
                order.payment_status = "paid"
        order.status = next_status
        db.commit()
        db.refresh(order)
        order = (
            db.query(Order)
            .options(joinedload(Order.user), joinedload(Order.items).joinedload(OrderItem.product))
            .filter(Order.id == order.id)
            .first()
        )
        return order_response(order)
    except Exception:
        db.rollback()
        raise


@router.get("/customers")
def list_customers(
    search: str | None = Query(default=None, max_length=200),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    query = db.query(User).filter(User.role == "customer")
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(User.full_name.ilike(term), User.email.ilike(term), User.phone.ilike(term)))
    total = query.count()
    users = query.order_by(User.created_at.desc(), User.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    user_ids = [user.id for user in users]
    aggregates = {}
    if user_ids:
        rows = (
            db.query(
                Order.user_id,
                func.count(Order.id).label("order_count"),
                func.coalesce(
                    func.sum(
                        case(
                            (Order.status == "completed", Order.total_amount_cents),
                            else_=0,
                        )
                    ),
                    0,
                ).label("total_spent"),
            )
            .filter(Order.user_id.in_(user_ids))
            .group_by(Order.user_id)
            .all()
        )
        aggregates = {user_id: (int(count), int(spent)) for user_id, count, spent in rows}
    return {
        "items": [
            {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "phone": user.phone,
                "created_at": user.created_at,
                "order_count": aggregates.get(user.id, (0, 0))[0],
                "total_spent": aggregates.get(user.id, (0, 0))[1],
            }
            for user in users
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size),
    }
