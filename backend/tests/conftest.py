"""Shared pytest fixtures for backend tests."""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import pytest

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Ensure JWT/encryption keys exist before app modules import them
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key-for-unit-tests-only")
os.environ.setdefault("ENCRYPTION_KEY", "2LJxQbIdlX7PQqOMBAPlXb1bgM9AYDVJDRo2iFvD_Q4=")
os.environ.setdefault("SKIP_DB_CHECK", "true")


@pytest.fixture
def mock_auth_user():
    """Create a lightweight authenticated user for dependency overrides."""
    from backend.database.models import User

    return User(
        id=uuid4(),
        email_encrypted="test-email-encrypted",
        password_hash="test-password-hash",
        email_verified=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.fixture(autouse=True)
def override_jwt_auth(mock_auth_user):
    """
    Bypass JWT auth for API tests.

    Production endpoints require get_current_user; integration tests historically
    only sent optional API-key headers and now receive 401 without this override.
    """
    from backend.auth.dependencies import get_current_user
    from backend.main import app

    app.dependency_overrides[get_current_user] = lambda: mock_auth_user
    yield mock_auth_user
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
def auth_headers(mock_auth_user):
    """Bearer token headers for tests that call JWT-protected routes explicitly."""
    from backend.auth.jwt_handler import create_access_token

    token = create_access_token({"sub": str(mock_auth_user.id)})
    return {"Authorization": f"Bearer {token}"}
