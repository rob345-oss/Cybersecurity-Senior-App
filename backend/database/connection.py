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

# Load environment variables from .env file
# Look for .env file in project root (parent of backend directory)
env_path = Path(__file__).parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
    logging.info(f"Loaded environment variables from {env_path}")
else:
    # Also try loading from current directory
    load_dotenv()
    logging.info("Attempted to load .env file from current directory")

# Get database URL from environment variable
DATABASE_URL_RAW = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://titanium_user:titanium_password@localhost:5432/titanium_guardian"
)

# #region agent log
import json
log_path = Path(__file__).parent.parent.parent / ".cursor" / "debug.log"
try:
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId":"debug-session","runId":"pre-fix","hypothesisId":"A","location":"connection.py:28","message":"DATABASE_URL from env","data":{"url_prefix":DATABASE_URL_RAW[:30] if DATABASE_URL_RAW else None,"url_length":len(DATABASE_URL_RAW) if DATABASE_URL_RAW else 0,"url_scheme":DATABASE_URL_RAW.split("://")[0] if "://" in DATABASE_URL_RAW else "none"},"timestamp":int(__import__("time").time()*1000)}) + "\n")
except: pass
# #endregion

# Normalize DATABASE_URL to use asyncpg driver
def normalize_database_url(url: str) -> str:
    """
    Convert postgresql:// URLs to postgresql+asyncpg:// for async engine compatibility.
    
    Args:
        url: Database URL string
        
    Returns:
        Normalized URL with asyncpg driver
    """
    if url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        # Replace postgresql:// with postgresql+asyncpg://
        normalized = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        # #region agent log
        try:
            log_path_local = Path(__file__).parent.parent.parent / ".cursor" / "debug.log"
            with open(log_path_local, "a", encoding="utf-8") as f:
                f.write(json.dumps({"sessionId":"debug-session","runId":"pre-fix","hypothesisId":"D","location":"connection.py:normalize_database_url","message":"URL normalized","data":{"original_scheme":"postgresql://","normalized_scheme":"postgresql+asyncpg://"},"timestamp":int(__import__("time").time()*1000)}) + "\n")
        except: pass
        # #endregion
        return normalized
    return url

DATABASE_URL = normalize_database_url(DATABASE_URL_RAW)

# #region agent log
try:
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId":"debug-session","runId":"pre-fix","hypothesisId":"D","location":"connection.py:45","message":"After normalization","data":{"final_url_scheme":DATABASE_URL.split("://")[0] if "://" in DATABASE_URL else "none"},"timestamp":int(__import__("time").time()*1000)}) + "\n")
except: pass
# #endregion

# Get DB_PATH from environment variable (optional, for PostgreSQL binaries)
DB_PATH = os.getenv("DB_PATH", "")

# Validate DATABASE_URL format
def validate_database_url(url: str) -> bool:
    """
    Validate that DATABASE_URL is in the correct format.
    
    Args:
        url: Database URL string
        
    Returns:
        True if valid, False otherwise
    """
    try:
        parsed = urlparse(url)
        # Check for postgresql+asyncpg scheme
        if not url.startswith("postgresql+asyncpg://"):
            return False
        if not parsed.netloc:
            return False
        return True
    except Exception:
        return False

# #region agent log
try:
    validation_result = validate_database_url(DATABASE_URL)
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId":"debug-session","runId":"pre-fix","hypothesisId":"B","location":"connection.py:58","message":"URL validation result","data":{"is_valid":validation_result,"url_scheme":DATABASE_URL.split("://")[0] if "://" in DATABASE_URL else "none"},"timestamp":int(__import__("time").time()*1000)}) + "\n")
except: pass
# #endregion

if not validate_database_url(DATABASE_URL):
    logging.warning(
        f"Invalid DATABASE_URL format: {DATABASE_URL[:50]}... "
        "Expected format: postgresql+asyncpg://user:password@host:port/database"
    )

# #region agent log
try:
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId":"debug-session","runId":"pre-fix","hypothesisId":"C","location":"connection.py:64","message":"Before create_async_engine","data":{"url_scheme":DATABASE_URL.split("://")[0] if "://" in DATABASE_URL else "none","has_asyncpg":DATABASE_URL.startswith("postgresql+asyncpg://"),"has_postgresql_only":DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+asyncpg://")},"timestamp":int(__import__("time").time()*1000)}) + "\n")
except: pass
# #endregion

# Create async engine
try:
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,  # Set to True for SQL query logging
        future=True,
        pool_pre_ping=True,  # Verify connections before using
        pool_size=10,
        max_overflow=20,
    )
    # #region agent log
    try:
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"pre-fix","hypothesisId":"E","location":"connection.py:65","message":"Engine created successfully","data":{"engine_type":type(engine).__name__},"timestamp":int(__import__("time").time()*1000)}) + "\n")
    except: pass
    # #endregion
except Exception as e:
    # #region agent log
    try:
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"pre-fix","hypothesisId":"E","location":"connection.py:65","message":"Engine creation failed","data":{"error_type":type(e).__name__,"error_message":str(e)[:200]},"timestamp":int(__import__("time").time()*1000)}) + "\n")
    except: pass
    # #endregion
    raise

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting database session.
    
    Yields:
        AsyncSession: Database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def check_database_connection() -> bool:
    """
    Check if database connection is available.
    
    Returns:
        True if connection is successful, False otherwise
    """
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logging.error(f"Database connection check failed: {e}")
        return False


async def init_db() -> None:
    """
    Initialize database (create all tables).
    Should be called on application startup.
    """
    async with engine.begin() as conn:
        # Import models to ensure they're registered
        from backend.database import models  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)

