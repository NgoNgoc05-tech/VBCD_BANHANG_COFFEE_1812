"""Cấu hình ứng dụng dựa trên biến môi trường (.env)."""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # --- Application ---
    APP_NAME: str = "Phin & Bean"
    APP_ENV: str = "development"

    # --- Database (SQLite dev, dễ dàng đổi sang MySQL qua DATABASE_URL) ---
    DATABASE_URL: str = "sqlite:///./shop.db"

    # --- CORS (chỉ cho phép origin của frontend) ---
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]

    # --- JWT ---
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # --- Bcrypt ---
    BCRYPT_ROUNDS: int = 12

    # --- Gemini (AI Chatbot) ---
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    # Helper để tính toán đường dẫn static
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    @property
    def STATIC_DIR(self) -> str:
        return os.path.join(self.BASE_DIR, "static")

    @property
    def UPLOAD_DIR(self) -> str:
        return os.path.join(self.STATIC_DIR, "uploads")


settings = Settings()
