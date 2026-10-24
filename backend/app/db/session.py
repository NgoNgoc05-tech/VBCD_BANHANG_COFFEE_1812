"""Cấu hình SQLAlchemy engine, session và Base."""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# SQLite cần thiết lập check_same_thread=False để dùng đa thread
_connect_args: dict = {}
if "sqlite" in settings.DATABASE_URL:
    _connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=_connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base dùng chung cho toàn bộ models
Base = declarative_base()
