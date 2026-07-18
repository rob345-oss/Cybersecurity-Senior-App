"""Shared pytest fixtures for backend tests."""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import pytest

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


@pytest.fixture
def auth_user():
    """Fake authenticated user for dependency overrides."""
    return SimpleNamespace(
        id=uuid4(),
        email_encrypted="test-email",
        full_name_encrypted="test-name",
        phone_encrypted=None,
        password_hash="hash",
        email_verified=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def authed_client(auth_user):
    """
    FastAPI TestClient with JWT auth dependency overridden.

    Legacy API integration tests predate Bearer auth and still send X-API-Key.
    Override get_current_user so protected /v1 endpoints are reachable in CI.
    """
    from fastapi.testclient import TestClient

    from backend.auth.dependencies import get_current_user
    from backend.main import app
    from backend.storage.memory import MemoryStore
    from backend import main as main_module

    main_module.store = MemoryStore(session_ttl_hours=0)

    async def _override_user():
        return auth_user

    app.dependency_overrides[get_current_user] = _override_user
    client = TestClient(app)
    try:
        yield client
    finally:
        app.dependency_overrides.pop(get_current_user, None)
