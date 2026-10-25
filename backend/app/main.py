"""FastAPI main app - cấu hình CORS, include routers."""
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.routers import admin, auth, cart, catalog, chat, health, orders

app = FastAPI(title=settings.APP_NAME, version="1.0.0", docs_url="/docs")

# CORS: chỉ cho phép origin của frontend (liệt kê trong .env)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = Path(__file__).resolve().parent.parent / "static"
static_dir.mkdir(parents=True, exist_ok=True)
(static_dir / "uploads").mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Router health check (public)
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(chat.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(admin.router)


@app.get("/", tags=["Root"])
def root():
    return {"message": f"Chào mừng đến với {settings.APP_NAME} API"}
