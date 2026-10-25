"""Public category and product catalog endpoints."""

import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload, selectinload

from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.deps import get_current_user, get_db
from app.core.security import decode_access_token
from app.models.category import Category
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.review import Review
from app.models.user import User
from app.schemas.commerce import ReviewCreateRequest

router = APIRouter(tags=["Catalog"])
optional_bearer = HTTPBearer(auto_error=False)


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
    featured: bool | None = Query(default=None),
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
    if featured is not None:
        query = query.filter(Product.is_featured.is_(featured))
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
        .options(
            joinedload(Product.category),
            selectinload(Product.reviews).joinedload(Review.user),
        )
        .filter(Product.slug == slug, Product.is_active.is_(True))
        .first()
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm.")
    response = serialize_product(product)
    response["reviews"] = [
        {
            "id": review.id,
            "rating": review.rating,
            "comment": review.comment,
            "created_at": review.created_at,
            "user": {"full_name": review.user.full_name},
        }
        for review in sorted(product.reviews, key=lambda item: item.created_at, reverse=True)
    ]
    return response


def _eligible_to_review(db: Session, user_id: int, product_id: int) -> bool:
    return (
        db.query(OrderItem.id)
        .join(Order, OrderItem.order_id == Order.id)
        .filter(
            Order.user_id == user_id,
            Order.status == "completed",
            OrderItem.product_id == product_id,
        )
        .first()
        is not None
    )


@router.get("/api/products/{slug}/reviews")
def list_product_reviews(
    slug: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=5, ge=1, le=50),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    product = db.query(Product).filter(Product.slug == slug, Product.is_active.is_(True)).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm.")

    query = db.query(Review).filter(Review.product_id == product.id)
    total = query.count()
    reviews = (
        query.options(joinedload(Review.user))
        .order_by(Review.created_at.desc(), Review.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    grouped_counts = (
        db.query(Review.rating, func.count(Review.id))
        .filter(Review.product_id == product.id)
        .group_by(Review.rating)
        .all()
    )
    rating_counts = {str(rating): count for rating, count in grouped_counts}
    for rating in range(1, 6):
        rating_counts.setdefault(str(rating), 0)

    return {
        "items": [
            {
                "id": review.id,
                "product_id": review.product_id,
                "user_id": review.user_id,
                "rating": review.rating,
                "comment": review.comment,
                "created_at": review.created_at,
                "user": {"full_name": review.user.full_name},
            }
            for review in reviews
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size),
        "average_rating": float(product.avg_rating),
        "rating_counts": rating_counts,
    }


@router.get("/api/products/{slug}/can-review")
def can_review_product(
    slug: str,
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    product = db.query(Product).filter(Product.slug == slug, Product.is_active.is_(True)).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm.")
    if credentials is None:
        return {"can_review": False}

    payload = decode_access_token(credentials.credentials)
    user = db.query(User).filter(User.id == payload.sub).first() if payload else None
    return {
        "can_review": bool(user and _eligible_to_review(db, user.id, product.id))
    }


@router.post("/api/products/{slug}/reviews")
def upsert_product_review(
    slug: str,
    data: ReviewCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    product = db.query(Product).filter(Product.slug == slug, Product.is_active.is_(True)).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm.")
    if not _eligible_to_review(db, current_user.id, product.id):
        raise HTTPException(
            status_code=403,
            detail="Bạn cần mua và nhận sản phẩm để gửi đánh giá.",
        )

    try:
        review = (
            db.query(Review)
            .filter(Review.product_id == product.id, Review.user_id == current_user.id)
            .first()
        )
        if review is None:
            review = Review(
                product_id=product.id,
                user_id=current_user.id,
                rating=data.rating,
                comment=data.comment,
            )
            db.add(review)
        else:
            review.rating = data.rating
            review.comment = data.comment

        db.flush()
        average = (
            db.query(func.avg(Review.rating))
            .filter(Review.product_id == product.id)
            .scalar()
        )
        product.avg_rating = round(float(average or 0), 2)
        db.commit()
        db.refresh(review)
        return {
            "id": review.id,
            "product_id": review.product_id,
            "user_id": review.user_id,
            "rating": review.rating,
            "comment": review.comment,
            "created_at": review.created_at,
            "user": {"full_name": current_user.full_name},
        }
    except Exception:
        db.rollback()
        raise
