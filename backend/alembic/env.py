"""Config for Alembic environment (dựa trên app.core.config)."""
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

from app.db.session import Base
from app.core.config import settings

# Lấy bảng metadata từ models
from app.models import User, Category, Product, Review, Cart, CartItem, Order, OrderItem

# this is the Alembic Config object, which gets read by Alembic commands
config = context.config

# Thiết lập Python logging từ file .ini, nếu có
try:
    config.set_section_option("logger_root", "level", "INFO")
    fileConfig(config.config_file_name)
except Exception:
    pass

# Lấy giá trị URL từ biến môi trường hoặc config file
database_url = os.getenv("DATABASE_URL", settings.DATABASE_URL)

# Thêm target_metadata cho autogenerate
if "target_metadata" not in dir(config):
    config.target_metadata = Base.metadata

# Thiết lập động engine cho môi trường "offline"
config.set_main_option("sqlalchemy.url", database_url)


def run_migrations_offline() -> None:
    """Chạy migrations trong chế độ offline."""
    context.configure(
        url=database_url,
        target_metadata=config.target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Chạy migrations trong chế độ online (kết nối với database)."""
    engine = engine_from_config(
        config.get_section("alembic"),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args={"check_same_thread": False} if "sqlite" in database_url else {},
    )

    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=config.target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
