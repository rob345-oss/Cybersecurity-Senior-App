"""Supabase / PgBouncer pooler settings for async SQLAlchemy + asyncpg."""

from __future__ import annotations

import logging
import os
import ssl
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

logger = logging.getLogger(__name__)

# Supabase Supavisor ports
TRANSACTION_POOLER_PORT = 6543
SESSION_POOLER_PORT = 5432


def _parse_db_url(url: str) -> urlparse:
    for prefix in ("postgresql+asyncpg://", "postgresql://"):
        if url.startswith(prefix):
            return urlparse(url.replace(prefix, "postgresql://", 1))
    return urlparse(url)


def normalize_database_url(url: str) -> str:
    """Convert postgresql:// to postgresql+asyncpg:// for the async engine."""
    if url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def resolve_pooler_mode(url: str) -> str:
    """
    Return 'transaction' or 'session'.

    Uses DATABASE_POOLER when set; otherwise infers from port (6543 = transaction).
    """
    explicit = os.getenv("DATABASE_POOLER", "").strip().lower()
    if explicit in ("transaction", "session"):
        return explicit

    parsed = _parse_db_url(url)
    if parsed.port == TRANSACTION_POOLER_PORT:
        return "transaction"
    if (
        parsed.port == SESSION_POOLER_PORT
        and parsed.hostname
        and "pooler" in parsed.hostname
    ):
        return "session"
    return "session"


def uses_transaction_pooler(url: str) -> bool:
    return resolve_pooler_mode(url) == "transaction"


def _needs_ssl(url: str) -> bool:
    parsed = _parse_db_url(url)
    query = parse_qs(parsed.query)
    sslmode = (query.get("sslmode", [None])[0] or "").lower()
    if sslmode == "disable":
        return False
    if sslmode in ("require", "verify-ca", "verify-full", "prefer"):
        return True
    host = (parsed.hostname or "").lower()
    return "supabase.com" in host


def _build_ssl_context() -> ssl.SSLContext | None:
    """
    Build an SSL context for asyncpg.

    Uses certifi's CA bundle by default (fixes Windows trust store gaps for Supabase).
    Set DB_SSL_VERIFY=false only for local debugging.
    Optional DB_SSL_CA_FILE when the file exists.
    """
    if os.getenv("DB_SSL_VERIFY", "true").strip().lower() in ("0", "false", "no"):
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        logger.warning("DB_SSL_VERIFY is disabled; database TLS certificates are not verified")
        return ctx

    ca_file = os.getenv("DB_SSL_CA_FILE", "").strip()
    if ca_file and Path(ca_file).is_file():
        return ssl.create_default_context(cafile=ca_file)

    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        logger.warning("certifi not installed; using system CA store for database TLS")
        return ssl.create_default_context()


def get_asyncpg_connect_args(url: str) -> dict:
    """
    Build asyncpg connect_args: SSL + transaction-pooler statement cache settings.

    asyncpg does not accept libpq query params (e.g. sslmode) on connect(); those are
    handled here and stripped from the URL via strip_libpq_query_params().
    """
    connect_args: dict = {}

    if _needs_ssl(url):
        connect_args["ssl"] = _build_ssl_context()

    if uses_transaction_pooler(url):
        connect_args["statement_cache_size"] = 0
        connect_args["prepared_statement_cache_size"] = 0

    return connect_args


def strip_libpq_query_params(url: str) -> str:
    """Remove query params that SQLAlchemy would pass to asyncpg as invalid kwargs."""
    normalized = normalize_database_url(url)
    parsed = urlparse(normalized)
    if not parsed.query:
        return normalized
    query = parse_qs(parsed.query)
    for key in ("sslmode", "sslrootcert", "sslcert", "sslkey"):
        query.pop(key, None)
    remaining = urlencode({k: v[0] for k, v in query.items()})
    return urlunparse(parsed._replace(query=remaining))


def log_pooler_config(url: str) -> None:
    mode = resolve_pooler_mode(url)
    parsed = _parse_db_url(url)
    ssl_on = _needs_ssl(url)
    verify = os.getenv("DB_SSL_VERIFY", "true").strip().lower() not in ("0", "false", "no")
    logger.info(
        "Database pooler: %s (host=%s, port=%s, ssl=%s, verify=%s)",
        mode,
        parsed.hostname,
        parsed.port,
        ssl_on,
        verify,
    )
    if mode == "transaction" and parsed.port != TRANSACTION_POOLER_PORT:
        logger.warning(
            "DATABASE_POOLER=transaction but URL uses port %s; "
            "Supabase transaction pooler expects port %s",
            parsed.port,
            TRANSACTION_POOLER_PORT,
        )
