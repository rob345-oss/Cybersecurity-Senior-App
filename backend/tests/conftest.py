import os
import sys
from pathlib import Path
from uuid import uuid4

os.environ.setdefault("SKIP_DB_CHECK", "true")

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend import main
from backend.auth.dependencies import get_current_user
from backend.database.models import User
from backend.main import app
from backend.storage.memory import MemoryStore


@pytest.fixture(autouse=True)
def reset_store():
    main.store = MemoryStore(session_ttl_hours=0)


@pytest.fixture
def mock_user():
    user = User()
    user.id = uuid4()
    user.email_encrypted = "test@example.com"
    user.password_hash = "hashed-password"
    user.email_verified = True
    return user


@pytest.fixture
def client(mock_user):
    """Authenticated test client with in-memory session store."""

    async def override_get_current_user():
        return mock_user

    app.dependency_overrides[get_current_user] = override_get_current_user
    with TestClient(app) as test_client:
        yield test_client
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
