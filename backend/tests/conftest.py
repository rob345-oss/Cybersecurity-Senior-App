import sys
import os
from pathlib import Path
from uuid import uuid4

# Avoid requiring a live database during API integration tests.
os.environ.setdefault("SKIP_DB_CHECK", "true")

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.main import app
from backend.storage.memory import MemoryStore
from backend.auth.dependencies import get_current_user
from backend.database.models import User

TEST_USER_ID = uuid4()


async def _mock_current_user() -> User:
    return User(
        id=TEST_USER_ID,
        email_encrypted="test_encrypted_email",
        password_hash="test_hash",
        email_verified=True,
    )


@pytest.fixture
def client():
    """Create a test client with a fresh store and mocked authentication."""
    from backend import main

    main.store = MemoryStore(session_ttl_hours=0)
    app.dependency_overrides[get_current_user] = _mock_current_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def headers():
    """Compatibility fixture; auth is handled via dependency override."""
    return {}
