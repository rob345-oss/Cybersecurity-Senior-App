"""Tests for CareCircle share onboarding."""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

os.environ.setdefault("ENCRYPTION_KEY", "2LJxQbIdlX7PQqOMBAPlXb1bgM9AYDVJDRo2iFvD_Q4=")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key-for-unit-tests-only")

from backend.auth.jwt_handler import create_access_token
from backend.care_circle.message_templates import build_personalized_message
from backend.care_circle.phone_utils import format_phone_for_display, normalize_phone, validate_phone
from backend.care_circle.protected_number import assign_protected_number
from backend.database.models import User
from backend.main import app


@pytest.fixture
def client():
    from backend import main

    main.store = __import__("backend.storage.memory", fromlist=["MemoryStore"]).MemoryStore(
        session_ttl_hours=0
    )
    return TestClient(app)


@pytest.fixture
def mock_user():
    user = User(
        id=uuid4(),
        email_encrypted="enc",
        password_hash="hash",
        email_verified=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    return user


@pytest.fixture
def auth_headers(mock_user):
    token = create_access_token({"sub": str(mock_user.id)})
    return {"Authorization": f"Bearer {token}"}


class TestPhoneUtils:
    def test_validate_us_number(self):
        assert validate_phone("5551234567") is True
        assert validate_phone("(555) 123-4567") is True

    def test_validate_international_number(self):
        assert validate_phone("+44 7911 123456") is True

    def test_validate_rejects_short_number(self):
        assert validate_phone("12345") is False

    def test_normalize_preserves_plus(self):
        assert normalize_phone("+1 (555) 123-4567") == "+15551234567"

    def test_format_us_display(self):
        formatted = format_phone_for_display("+15551234567")
        assert "+1" in formatted
        assert "555" in formatted


class TestMessageTemplates:
    def test_default_template_personalization(self):
        message = build_personalized_message(
            user_first_name="Alex",
            contact_first_name="Jamie",
            protected_number="+1 (555) 123-4567",
            template="default",
        )
        assert "Jamie" in message
        assert "Alex" in message
        assert "Titanium Guardian" in message
        assert "don't share" in message.lower() or "do not share" in message.lower()

    def test_short_template(self):
        message = build_personalized_message(
            user_first_name="Alex",
            contact_first_name="Jamie",
            protected_number="+1 555 123 4567",
            template="short",
        )
        assert "protected number" in message.lower()


class TestProtectedNumberAssignment:
    def test_assign_without_twilio_env(self, monkeypatch):
        monkeypatch.delenv("TWILIO_PHONE_NUMBER", raising=False)
        user_id = uuid4()
        number = assign_protected_number(user_id)
        assert number.startswith("+1")
        assert len(number) >= 11

    def test_assign_uses_twilio_env(self, monkeypatch):
        monkeypatch.setenv("TWILIO_PHONE_NUMBER", "+15559876543")
        number = assign_protected_number(uuid4())
        assert number == "+15559876543"

    def test_no_hardcoded_number_in_source(self):
        source = Path(__file__).resolve().parents[1] / "care_circle" / "protected_number.py"
        content = source.read_text()
        assert "+15551234567" not in content
        assert "+1 (555)" not in content


class TestCareCircleEndpoints:
    def test_activate_protected_number(self, client, mock_user, auth_headers):
        activated_at = datetime.now(timezone.utc)

        async def fake_activate(user):
            user.protected_phone_encrypted = "enc-number"
            user.protected_number_activated_at = activated_at
            return user

        with patch("backend.care_circle.router.get_current_user", return_value=mock_user):
            with patch("backend.care_circle.router.get_db", return_value=AsyncMock()):
                with patch("backend.care_circle.router.CareCircleRepository") as repo_cls:
                    repo = repo_cls.return_value
                    repo.activate_protected_number = AsyncMock(side_effect=fake_activate)
                    repo.get_protected_number_info = AsyncMock(
                        return_value={
                            "protected_number": "+15551234567",
                            "protected_number_formatted": "+1 (555) 123-4567",
                            "activated_at": activated_at.isoformat(),
                            "onboarding_completed_at": None,
                            "onboarding_deferred_at": None,
                        }
                    )
                    app.dependency_overrides[
                        __import__(
                            "backend.auth.dependencies", fromlist=["get_current_user"]
                        ).get_current_user
                    ] = lambda: mock_user
                    app.dependency_overrides[
                        __import__(
                            "backend.database.connection", fromlist=["get_db"]
                        ).get_db
                    ] = lambda: AsyncMock()

                    response = client.post(
                        "/v1/care-circle/protected-number/activate",
                        headers=auth_headers,
                    )

        app.dependency_overrides.clear()
        assert response.status_code == 200
        data = response.json()
        assert data["protected_number_formatted"]
        assert data["activated_at"]

    def test_create_trusted_contact_validates_phone(self, client, mock_user, auth_headers):
        app.dependency_overrides[
            __import__("backend.auth.dependencies", fromlist=["get_current_user"]).get_current_user
        ] = lambda: mock_user
        app.dependency_overrides[
            __import__("backend.database.connection", fromlist=["get_db"]).get_db
        ] = lambda: AsyncMock()

        response = client.post(
            "/v1/care-circle/trusted-contacts",
            headers=auth_headers,
            json={"first_name": "Jamie", "phone": "bad", "is_selected": True},
        )
        app.dependency_overrides.clear()
        assert response.status_code == 422

    def test_share_event_status_update(self, client, mock_user, auth_headers):
        contact_id = uuid4()
        mock_contact = MagicMock()
        mock_contact.id = contact_id
        mock_contact.share_event = MagicMock()
        mock_contact.share_event.message_template = "default"
        mock_contact.share_event.custom_message_encrypted = None
        mock_contact.share_event.sharing_status = "share_opened"
        mock_contact.share_event.last_share_action_at = datetime.now(timezone.utc)

        with patch("backend.care_circle.router.CareCircleRepository") as repo_cls:
            repo = repo_cls.return_value
            repo.get_contact = AsyncMock(return_value=mock_contact)
            repo.upsert_share_event = AsyncMock(return_value=mock_contact.share_event)
            repo.serialize_contact = MagicMock(
                return_value={
                    "id": contact_id,
                    "first_name": "Jamie",
                    "phone": "+15551234567",
                    "phone_formatted": "+1 (555) 123-4567",
                    "relationship": None,
                    "is_selected": True,
                    "share_event": {
                        "message_template": "default",
                        "custom_message": None,
                        "message_preview": "Hi Jamie",
                        "sharing_status": "share_opened",
                        "last_share_action_at": datetime.now(timezone.utc).isoformat(),
                    },
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            )

            app.dependency_overrides[
                __import__("backend.auth.dependencies", fromlist=["get_current_user"]).get_current_user
            ] = lambda: mock_user
            app.dependency_overrides[
                __import__("backend.database.connection", fromlist=["get_db"]).get_db
            ] = lambda: AsyncMock()

            response = client.put(
                f"/v1/care-circle/share-events/{contact_id}",
                headers=auth_headers,
                json={"sharing_status": "share_opened"},
            )

        app.dependency_overrides.clear()
        assert response.status_code == 200
        assert response.json()["sharing_status"] == "share_opened"
