"""Database connection and session management."""

from __future__ import annotations

import os
import logging
from pathlib import Path
from typing import AsyncGenerator
from urllib.parse import urlparse

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

from backend.database.pooler import (
    get_asyncpg_connect_args,
    log_pooler_config,
    strip_libpq_query_params,
)

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
    logging.info(f"Loaded environment variables from {env_path}")
else:
    load_dotenv()
    logging.info("Attempted to load .env file from current directory")

DATABASE_URL_RAW = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://titanium_user:titanium_password@localhost:5432/titanium_guardian",
)

log_pooler_config(DATABASE_URL_RAW)
ASYNCPG_CONNECT_ARGS = get_asyncpg_connect_args(DATABASE_URL_RAW)
DATABASE_URL = strip_libpq_query_params(DATABASE_URL_RAW)

DB_PATH = os.getenv("DB_PATH", "")


def validate_database_url(url: str) -> bool:
    try:
        if not url.startswith("postgresql+asyncpg://"):
            return False
        parsed = urlparse(url)
        return bool(parsed.netloc)
    except Exception:
        return False


if not validate_database_url(DATABASE_URL):
    logging.warning(
        f"Invalid DATABASE_URL format: {DATABASE_URL[:50]}... "
        "Expected format: postgresql+asyncpg://user:password@host:port/database"
    )

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args=ASYNCPG_CONNECT_ARGS,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def check_database_connection() -> bool:
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        err = str(e)
        if "CERTIFICATE_VERIFY_FAILED" in err:
            logging.error(
                "Database TLS verification failed (%s). "
                "If you are on a corporate VPN or proxy, set DB_SSL_VERIFY=false in .env for local dev, "
                "or set DB_SSL_CA_FILE to your organization's root CA bundle.",
                e,
            )
        else:
            logging.error(f"Database connection check failed: {e}")
        return False


async def init_db() -> None:
    async with engine.begin() as conn:
        from backend.database import models  # noqa: F401

        await conn.run_sync(Base.metadata.create_all)
