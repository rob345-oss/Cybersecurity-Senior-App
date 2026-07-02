import sys
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.main import app
from backend.storage.memory import MemoryStore
from backend.auth.dependencies import get_current_user
from backend.database.models import User


async def _override_get_current_user() -> User:
    return User(
        id=uuid4(),
        email_encrypted="test@example.com",
        password_hash="test-password-hash",
        email_verified=True,
    )


@pytest.fixture
def client():
    """Create a test client with auth bypass and a fresh in-memory store."""
    from backend import main

    main.store = MemoryStore(session_ttl_hours=0)
    app.dependency_overrides[get_current_user] = _override_get_current_user
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def api_key():
  """Legacy fixture kept for tests that still accept headers."""
  import os

  return os.getenv("API_KEY", "")


@pytest.fixture
def headers(api_key):
    """Bearer auth is injected via dependency override; headers remain for compatibility."""
    if api_key:
        return {"X-API-Key": api_key}
    return {}
