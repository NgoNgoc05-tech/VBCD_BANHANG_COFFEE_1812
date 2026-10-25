"""Gemini-powered product advice with a local catalog fallback."""

import json
import logging
import math
import re
import threading
import time
import unicodedata
from collections import defaultdict, deque
from typing import Any

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from google import genai
from google.genai import types
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.deps import get_db
from app.models.product import Product
from app.schemas.chat import ChatProduct, ChatRequest, ChatResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["Chat"])

_RATE_LIMIT = 10
_RATE_WINDOW_SECONDS = 60
_request_times: dict[str, deque[float]] = defaultdict(deque)
_rate_lock = threading.Lock()


def _normalize(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value.casefold())
    return "".join(
        character for character in decomposed if not unicodedata.combining(character)
    )


def _price_limit(message: str) -> int | None:
    normalized = _normalize(message)
    match = re.search(
        r"(?:duoi|<|toi da|khong qua)\s*(\d[\d.,]*)\s*(k|nghin|ngan|tr|trieu)?",
        normalized,
    )
    if match is None:
        return None
    raw_amount = match.group(1)
    unit = match.group(2)
    if unit is None:
        amount = float(raw_amount.replace(".", "").replace(",", ""))
        multiplier = 1
    else:
        amount = float(raw_amount.replace(",", "."))
        multiplier = 1_000_000 if unit in {"tr", "trieu"} else 1_000
    return int(amount * multiplier)


def _chat_product(product: Product) -> ChatProduct:
    images = product.images_list
    return ChatProduct(
        id=product.id,
        name=product.name,
        slug=product.slug,
        price=product.price_cents,
        sale_price=product.sale_price_cents,
        image_url=images[0] if images else None,
    )


def _fallback(message: str, products: list[Product]) -> ChatResponse:
    normalized_message = _normalize(message)
    price_limit = _price_limit(message)
    search_terms = [
        term
        for term in re.findall(r"[a-z0-9]+", normalized_message)
        if term not in {
            "ca", "phe", "nao", "loai", "cho", "minh", "toi", "muon", "tim",
            "duoi", "tren", "toi", "da", "nghin", "ngan", "trieu", "k", "gia",
            "bao", "nhieu", "la", "gi", "voi", "va", "mot", "it", "nhe",
            "khong", "qua", "pha", "the", "nao",
        }
    ]
    rated: list[tuple[int, Product]] = []
    for product in products:
        if product.stock <= 0:
            continue
        effective_price = product.sale_price_cents or product.price_cents
        if price_limit is not None and effective_price > price_limit:
            continue
        searchable = _normalize(
            f"{product.name} {product.description or ''} "
            f"{product.category.name if product.category else ''}"
        )
        normalized_name = _normalize(product.name)
        score = sum(
            3 if term in normalized_name else 1
            for term in search_terms
            if term in searchable
        )
        if "qua tang" in normalized_message and product.category.slug == "qua-tang":
            score += 8
        if "phin" in normalized_message and "phin" in searchable:
            score += 6
        if "cold brew" in normalized_message and "cold brew" in searchable:
            score += 6
        if "it dang" in normalized_message and any(
            phrase in searchable
            for phrase in ("dang nhe", "dang thap", "it dang", "khong dang")
        ):
            score += 5
        rated.append((score, product))

    if search_terms and any(score > 0 for score, _ in rated):
        rated = [(score, product) for score, product in rated if score > 0]
    rated.sort(
        key=lambda item: (
            item[0],
            item[1].is_featured,
            -(item[1].sale_price_cents or item[1].price_cents),
        ),
        reverse=True,
    )
    recommendations = [product for _, product in rated[:3]]
    if recommendations:
        if price_limit is not None:
            formatted_limit = f"{price_limit:,}".replace(",", ".")
            reply = (
                "Mình gợi ý một vài lựa chọn phù hợp trong ngân sách "
                f"**{formatted_limit}đ** của bạn:"
            )
        else:
            reply = "Mình gợi ý bạn tham khảo một vài lựa chọn phù hợp từ Phin & Bean:"
    else:
        reply = (
            "Mình chưa tìm thấy sản phẩm còn hàng phù hợp với tiêu chí này. "
            "Bạn thử chọn mức giá khác hoặc cho mình biết thêm gu cà phê nhé."
        )
    return ChatResponse(
        reply=reply,
        products=[_chat_product(product) for product in recommendations],
    )


def _is_rate_limited(client_ip: str, now: float) -> int | None:
    with _rate_lock:
        requests = _request_times[client_ip]
        while requests and now - requests[0] >= _RATE_WINDOW_SECONDS:
            requests.popleft()
        if len(requests) >= _RATE_LIMIT:
            return max(1, math.ceil(_RATE_WINDOW_SECONDS - (now - requests[0])))
        requests.append(now)
        return None


def _catalog_prompt(products: list[Product]) -> str:
    entries = []
    for product in products:
        entries.append(
            {
                "id": product.id,
                "name": product.name,
                "price": product.price_cents,
                "sale_price": product.sale_price_cents,
                "in_stock": product.stock > 0,
                "category": product.category.name if product.category else "",
                "description": (product.description or "")[:240],
            }
        )
    return (
        "Bạn là nhân viên tư vấn thân thiện của Phin & Bean. Chỉ tư vấn dựa trên dữ liệu "
        "sản phẩm được cung cấp, không bịa sản phẩm/giá. Trả lời ngắn gọn bằng tiếng Việt, "
        "gợi ý tối đa 3 sản phẩm phù hợp kèm giá. Nếu không có sản phẩm phù hợp, hãy hỏi "
        "thêm nhu cầu thay vì tự tạo thông tin. Chỉ đề xuất sản phẩm còn hàng. "
        "Trả lời đúng JSON gồm reply (chuỗi Markdown tiếng Việt) và suggested_product_ids "
        "(mảng tối đa 3 ID nguyên).\n\n"
        f"Danh mục sản phẩm đang bán:\n{json.dumps(entries, ensure_ascii=False)}"
    )


def _gemini_response(request_data: ChatRequest, products: list[Product]) -> ChatResponse:
    client = genai.Client(
        api_key=settings.GEMINI_API_KEY,
        http_options=types.HttpOptions(timeout=15_000),
    )
    history = request_data.history[-10:]
    contents: list[dict[str, Any]] = [
        {
            "role": "model" if item.role in {"assistant", "model"} else "user",
            "parts": [{"text": item.content}],
        }
        for item in history
    ]
    contents.append({"role": "user", "parts": [{"text": request_data.message}]})
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=_catalog_prompt(products),
            response_mime_type="application/json",
            temperature=0.4,
        ),
    )
    response_text = response.text
    if not response_text:
        raise ValueError("Gemini returned an empty response")
    parsed = json.loads(response_text)
    reply = parsed.get("reply")
    if not isinstance(reply, str) or not reply.strip():
        raise ValueError("Gemini response does not include a valid reply")

    available = {product.id: product for product in products if product.stock > 0}
    suggested_ids = parsed.get("suggested_product_ids", [])
    if not isinstance(suggested_ids, list):
        suggested_ids = []
    selected: list[Product] = []
    seen_ids: set[int] = set()
    for product_id in suggested_ids:
        try:
            normalized_id = int(product_id)
        except (TypeError, ValueError):
            continue
        product = available.get(normalized_id)
        if product is not None and normalized_id not in seen_ids:
            selected.append(product)
            seen_ids.add(normalized_id)
        if len(selected) == 3:
            break
    return ChatResponse(reply=reply.strip(), products=[_chat_product(item) for item in selected])


@router.post("", response_model=ChatResponse)
def chat(
    chat_request: ChatRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> ChatResponse | JSONResponse:
    client_ip = request.client.host if request.client else "unknown"
    retry_after = _is_rate_limited(client_ip, time.monotonic())
    if retry_after is not None:
        return JSONResponse(
            status_code=429,
            content={
                "detail": "Bạn nhắn hơi nhanh, đợi chút nhé.",
                "retry_after": retry_after,
            },
            headers={"Retry-After": str(retry_after)},
        )

    products = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.is_active.is_(True))
        .all()
    )
    if not settings.GEMINI_API_KEY or not settings.GEMINI_API_KEY.strip():
        logger.warning("Gemini API key is missing; using catalog chat fallback.")
        return _fallback(chat_request.message, products)

    try:
        return _gemini_response(chat_request, products)
    except Exception:
        logger.exception("Gemini chat failed; using catalog chat fallback.")
        return _fallback(chat_request.message, products)
