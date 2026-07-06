import sys
from pathlib import Path
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.main import app
from backend.storage.memory import MemoryStore
from backend.auth.dependencies import get_current_user


@pytest.fixture
def client():
    """Create a test client with auth bypass and a fresh in-memory store."""
    from backend import main

    main.store = MemoryStore(session_ttl_hours=0)

    mock_user = MagicMock()
    mock_user.id = uuid4()

    async def override_get_current_user():
        return mock_user

    app.dependency_overrides[get_current_user] = override_get_current_user
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def api_key():
    """Get API key from environment or use empty string for testing."""
    import os

    return os.getenv("API_KEY", "")


@pytest.fixture
def headers(api_key):
    """Create headers with API key if needed."""
    if api_key:
        return {"X-API-Key": api_key}
    return {}
