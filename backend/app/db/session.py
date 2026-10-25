"""Cấu hình SQLAlchemy engine, session và Base."""
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

database_url = make_url(settings.DATABASE_URL)
if database_url.get_backend_name() == "sqlite" and database_url.database not in (
    None,
    "",
    ":memory:",
):
    database_path = Path(database_url.database)
    database_path.parent.mkdir(parents=True, exist_ok=True)

# SQLite cần thiết lập check_same_thread=False để dùng đa thread
_connect_args: dict = {}
if database_url.get_backend_name() == "sqlite":
    _connect_args["check_same_thread"] = False

engine = create_engine(
    database_url,
    connect_args=_connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base dùng chung cho toàn bộ models
Base = declarative_base()
