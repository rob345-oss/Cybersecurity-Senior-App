"""Shared pytest fixtures for backend tests."""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Ensure JWT/encryption keys exist before app modules import them
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key-for-unit-tests-only")
os.environ.setdefault("ENCRYPTION_KEY", "2LJxQbIdlX7PQqOMBAPlXb1bgM9AYDVJDRo2iFvD_Q4=")
os.environ.setdefault("SKIP_DB_CHECK", "true")


@pytest.fixture
def auth_user():
    """Lightweight stand-in for an authenticated SQLAlchemy User."""
    from backend.database.models import User

    return User(
        id=uuid4(),
        email_encrypted="test@example.com",
        password_hash="not-used",
        email_verified=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def mock_auth_user(auth_user):
    """Alias used by CareCircle tests."""
    return auth_user


@pytest.fixture
def client(auth_user):
    """Authenticated TestClient with dependency overrides (no live DB required)."""
    from backend import main
    from backend.auth.dependencies import get_current_user
    from backend.main import app
    from backend.storage.memory import MemoryStore

    main.store = MemoryStore(session_ttl_hours=0)

    async def _override_user():
        return auth_user

    app.dependency_overrides[get_current_user] = _override_user
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture(autouse=True)
def override_jwt_auth(auth_user):
    """
    Bypass JWT auth for API tests that define their own TestClient.

    Production endpoints require get_current_user; without this override those
    tests receive 401 Unauthorized.
    """
    from backend.auth.dependencies import get_current_user
    from backend.main import app

    previous = app.dependency_overrides.get(get_current_user)
    app.dependency_overrides[get_current_user] = lambda: auth_user
    yield auth_user
    if previous is not None:
        app.dependency_overrides[get_current_user] = previous
    else:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
def api_key():
    return os.getenv("API_KEY", "")


@pytest.fixture
def headers(api_key):
    if api_key:
        return {"X-API-Key": api_key}
    return {}


@pytest.fixture
def auth_headers(auth_user):
    """Bearer token headers for tests that call JWT-protected routes explicitly."""
    from backend.auth.jwt_handler import create_access_token

    token = create_access_token({"sub": str(auth_user.id)})
    return {"Authorization": f"Bearer {token}"}
