"""Public category and product catalog endpoints."""

import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_db
from app.models.category import Category
from app.models.product import Product

router = APIRouter(tags=["Catalog"])


def serialize_category(category: Category) -> dict[str, object]:
    return {
        "id": category.id,
        "name": category.name,
        "slug": category.slug,
        "image_url": category.image_url,
        "sort_order": category.sort_order,
    }


def serialize_product(product: Product) -> dict[str, object]:
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
        "category": serialize_category(product.category),
        "category_id": product.category_id,
        "is_featured": product.is_featured,
        "is_active": product.is_active,
        "avg_rating": float(product.avg_rating),
        "created_at": product.created_at,
    }


@router.get("/api/categories")
def list_categories(db: Session = Depends(get_db)) -> list[dict[str, object]]:
    categories = (
        db.query(Category)
        .order_by(Category.sort_order.asc(), Category.name.asc())
        .all()
    )
    return [serialize_category(category) for category in categories]


@router.get("/api/products")
def list_products(
    search: str | None = Query(default=None, max_length=200),
    category: str | None = Query(default=None, max_length=200),
    min_price: int | None = Query(default=None, ge=0),
    max_price: int | None = Query(default=None, ge=0),
    sort: str = Query(default="newest", pattern="^(newest|price_asc|price_desc|rating)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    query = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.is_active.is_(True))
    )
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(Product.name.ilike(term), Product.description.ilike(term))
        )
    if category and category.strip():
        query = query.join(Product.category).filter(
            or_(
                Category.slug == category.strip(),
                Category.name.ilike(category.strip()),
            )
        )
    if min_price is not None:
        query = query.filter(
            func.coalesce(Product.sale_price_cents, Product.price_cents) >= min_price
        )
    if max_price is not None:
        query = query.filter(
            func.coalesce(Product.sale_price_cents, Product.price_cents) <= max_price
        )
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(
            status_code=422,
            detail="Giá tối thiểu không được lớn hơn giá tối đa.",
        )

    total = query.count()
    sort_columns = {
        "newest": (Product.created_at.desc(), Product.id.desc()),
        "price_asc": (
            func.coalesce(Product.sale_price_cents, Product.price_cents).asc(),
            Product.id.asc(),
        ),
        "price_desc": (
            func.coalesce(Product.sale_price_cents, Product.price_cents).desc(),
            Product.id.desc(),
        ),
        "rating": (Product.avg_rating.desc(), Product.id.desc()),
    }
    products = (
        query.order_by(*sort_columns[sort])
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "items": [serialize_product(product) for product in products],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size),
    }


@router.get("/api/products/{slug}")
def get_product(slug: str, db: Session = Depends(get_db)) -> dict[str, object]:
    product = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.slug == slug, Product.is_active.is_(True))
        .first()
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm.")
    return serialize_product(product)
