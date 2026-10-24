"""FastAPI main app - cấu hình CORS, include routers."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import health

app = FastAPI(title=settings.APP_NAME, version="1.0.0", docs_url="/docs")

# CORS: chỉ cho phép origin của frontend (liệt kê trong .env)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router health check (public)
app.include_router(health.router)


@app.get("/", tags=["Root"])
def root():
    return {"message": f"Chào mừng đến với {settings.APP_NAME} API"}
