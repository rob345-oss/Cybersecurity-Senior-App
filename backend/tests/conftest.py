"""Shared pytest fixtures."""

from __future__ import annotations

import sys
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


@pytest.fixture
def auth_user():
    """Lightweight stand-in for an authenticated SQLAlchemy User."""
    from backend.database.models import User

    return User(
        id=uuid4(),
        email_encrypted="test@example.com",
        password_hash="not-used",
        email_verified=True,
    )


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
        app.dependency_overrides.clear()


@pytest.fixture
def api_key():
    import os

    return os.getenv("API_KEY", "")


@pytest.fixture
def headers(api_key):
    if api_key:
        return {"X-API-Key": api_key}
    return {}
