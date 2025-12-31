"""Integration tests for API endpoints, edge cases, and session management."""
import sys
from pathlib import Path
from datetime import datetime, timezone
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

# Add backend to path
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.main import app
from backend.storage.memory import MemoryStore


@pytest.fixture
def client():
    """Create a test client with a fresh store instance."""
    # Create a new store instance for testing
    from backend import main
    main.store = MemoryStore(session_ttl_hours=0)  # Disable TTL for tests
    return TestClient(app)


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


# ============================================================================
# Integration Tests for Full API Endpoints
# ============================================================================

class TestMoneyGuardEndpoints:
    """Test MoneyGuard API endpoints."""
    
    def test_moneyguard_assess_success(self, client, headers):
        """Test successful MoneyGuard assessment."""
        response = client.post(
            "/v1/moneyguard/assess",
            json={
                "amount": 500.0,
                "payment_method": "zelle",
                "recipient": "John Doe",
                "reason": "Invoice payment",
                "did_they_contact_you_first": False,
                "urgency_present": True,
                "asked_to_keep_secret": False,
                "asked_for_verification_code": False,
                "asked_for_remote_access": False,
                "impersonation_type": "none",
            },
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert "level" in data
        assert "reasons" in data
        assert "next_action" in data
        assert "recommended_actions" in data
        assert 0 <= data["score"] <= 100
        assert data["level"] in ["low", "medium", "high"]
    
    def test_moneyguard_safe_steps(self, client, headers):
        """Test MoneyGuard safe steps endpoint."""
        response = client.post(
            "/v1/moneyguard/safe_steps",
            json={},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        assert "steps" in data or len(data) > 0


class TestInboxGuardEndpoints:
    """Test InboxGuard API endpoints."""
    
    def test_inboxguard_analyze_text_success(self, client, headers):
        """Test successful InboxGuard text analysis."""
        response = client.post(
            "/v1/inboxguard/analyze_text",
            json={
                "text": "Urgent: Verify your account immediately!",
                "channel": "email",
            },
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert "level" in data
        assert "reasons" in data
        assert 0 <= data["score"] <= 100
    
    def test_inboxguard_analyze_url_success(self, client, headers):
        """Test successful InboxGuard URL analysis."""
        response = client.post(
            "/v1/inboxguard/analyze_url",
            json={
                "url": "https://example.com/path",
            },
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert "level" in data
        assert "reasons" in data
        assert 0 <= data["score"] <= 100


class TestIdentityWatchEndpoints:
    """Test IdentityWatch API endpoints."""
    
    def test_identitywatch_profile_create(self, client, headers):
        """Test creating an IdentityWatch profile."""
        response = client.post(
            "/v1/identitywatch/profile",
            json={
                "emails": ["test@example.com"],
                "phones": ["+1234567890"],
                "full_name": "John Doe",
                "state": "CA",
            },
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "profile_id" in data
        assert "created" in data
    
    def test_identitywatch_check_risk(self, client, headers):
        """Test IdentityWatch risk check."""
        # First create a profile
        profile_response = client.post(
            "/v1/identitywatch/profile",
            json={
                "emails": ["test@example.com"],
                "phones": ["+1234567890"],
            },
            headers=headers,
        )
        profile_id = profile_response.json()["profile_id"]
        
        # Then check risk
        response = client.post(
            "/v1/identitywatch/check_risk",
            json={
                "profile_id": profile_id,
                "signals": {
                    "account_opened": True,
                    "suspicious_inquiry": False,
                },
            },
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert "level" in data
        assert "reasons" in data
        assert 0 <= data["score"] <= 100


# ============================================================================
# Edge Cases Tests (Empty Inputs, Invalid Data)
# ============================================================================

class TestEdgeCases:
    """Test edge cases and invalid inputs."""
    
    def test_moneyguard_empty_amount(self, client, headers):
        """Test MoneyGuard with missing amount."""
        response = client.post(
            "/v1/moneyguard/assess",
            json={
                "payment_method": "zelle",
                "recipient": "John",
                "reason": "Test",
                "did_they_contact_you_first": False,
                "urgency_present": False,
                "asked_to_keep_secret": False,
                "asked_for_verification_code": False,
                "asked_for_remote_access": False,
                "impersonation_type": "none",
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error
    
    def test_moneyguard_negative_amount(self, client, headers):
        """Test MoneyGuard with negative amount."""
        response = client.post(
            "/v1/moneyguard/assess",
            json={
                "amount": -100,
                "payment_method": "zelle",
                "recipient": "John",
                "reason": "Test",
                "did_they_contact_you_first": False,
                "urgency_present": False,
                "asked_to_keep_secret": False,
                "asked_for_verification_code": False,
                "asked_for_remote_access": False,
                "impersonation_type": "none",
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error
    
    def test_moneyguard_too_large_amount(self, client, headers):
        """Test MoneyGuard with amount exceeding limit."""
        response = client.post(
            "/v1/moneyguard/assess",
            json={
                "amount": 2000000000,  # Exceeds 1 billion limit
                "payment_method": "zelle",
                "recipient": "John",
                "reason": "Test",
                "did_they_contact_you_first": False,
                "urgency_present": False,
                "asked_to_keep_secret": False,
                "asked_for_verification_code": False,
                "asked_for_remote_access": False,
                "impersonation_type": "none",
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error
    
    def test_inboxguard_empty_text(self, client, headers):
        """Test InboxGuard with empty text."""
        response = client.post(
            "/v1/inboxguard/analyze_text",
            json={
                "text": "",
                "channel": "email",
            },
            headers=headers,
        )
        # Empty text might be valid (could be a legitimate empty message)
        # But let's check it doesn't crash
        assert response.status_code in [200, 422]
    
    def test_inboxguard_missing_text(self, client, headers):
        """Test InboxGuard with missing text field."""
        response = client.post(
            "/v1/inboxguard/analyze_text",
            json={
                "channel": "email",
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error
    
    def test_inboxguard_empty_url(self, client, headers):
        """Test InboxGuard with empty URL."""
        response = client.post(
            "/v1/inboxguard/analyze_url",
            json={
                "url": "",
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error
    
    def test_inboxguard_invalid_url_no_scheme(self, client, headers):
        """Test InboxGuard with URL missing scheme."""
        response = client.post(
            "/v1/inboxguard/analyze_url",
            json={
                "url": "example.com",
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error
    
    def test_inboxguard_invalid_url_no_domain(self, client, headers):
        """Test InboxGuard with URL missing domain."""
        response = client.post(
            "/v1/inboxguard/analyze_url",
            json={
                "url": "https://",
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error
    
    def test_inboxguard_invalid_url_scheme(self, client, headers):
        """Test InboxGuard with invalid URL scheme."""
        response = client.post(
            "/v1/inboxguard/analyze_url",
            json={
                "url": "ftp://example.com",
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error
    
    def test_identitywatch_empty_emails(self, client, headers):
        """Test IdentityWatch with empty emails list."""
        response = client.post(
            "/v1/identitywatch/profile",
            json={
                "emails": [],
                "phones": ["+1234567890"],
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error
    
    def test_identitywatch_empty_phones(self, client, headers):
        """Test IdentityWatch with empty phones list."""
        response = client.post(
            "/v1/identitywatch/profile",
            json={
                "emails": ["test@example.com"],
                "phones": [],
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error
    
    def test_identitywatch_invalid_email(self, client, headers):
        """Test IdentityWatch with invalid email format."""
        response = client.post(
            "/v1/identitywatch/profile",
            json={
                "emails": ["invalid-email"],
                "phones": ["+1234567890"],
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error
    
    def test_identitywatch_empty_email(self, client, headers):
        """Test IdentityWatch with empty email string."""
        response = client.post(
            "/v1/identitywatch/profile",
            json={
                "emails": [""],
                "phones": ["+1234567890"],
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error
    
    def test_identitywatch_invalid_phone_too_short(self, client, headers):
        """Test IdentityWatch with phone number too short."""
        response = client.post(
            "/v1/identitywatch/profile",
            json={
                "emails": ["test@example.com"],
                "phones": ["123"],
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error
    
    def test_identitywatch_empty_phone(self, client, headers):
        """Test IdentityWatch with empty phone string."""
        response = client.post(
            "/v1/identitywatch/profile",
            json={
                "emails": ["test@example.com"],
                "phones": [""],
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error
    
    def test_identitywatch_check_risk_nonexistent_profile(self, client, headers):
        """Test IdentityWatch risk check with non-existent profile."""
        response = client.post(
            "/v1/identitywatch/check_risk",
            json={
                "profile_id": "nonexistent-profile-id",
                "signals": {"account_opened": True},
            },
            headers=headers,
        )
        assert response.status_code == 404  # Not found


# ============================================================================
# Session Management Tests
# ============================================================================

class TestSessionManagement:
    """Test session management endpoints."""
    
    def test_start_session_success(self, client, headers):
        """Test starting a new session."""
        user_id = str(uuid4())
        response = client.post(
            "/v1/session/start",
            json={
                "user_id": user_id,
                "device_id": "device-123",
                "module": "callguard",
            },
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert isinstance(data["session_id"], str)
    
    def test_start_session_all_modules(self, client, headers):
        """Test starting sessions for all modules."""
        user_id = str(uuid4())
        modules = ["callguard", "moneyguard", "inboxguard", "identitywatch"]
        
        for module in modules:
            response = client.post(
                "/v1/session/start",
                json={
                    "user_id": user_id,
                    "device_id": "device-123",
                    "module": module,
                },
                headers=headers,
            )
            assert response.status_code == 200
            assert "session_id" in response.json()
    
    def test_append_event_success(self, client, headers):
        """Test appending an event to a session."""
        # Start a session
        user_id = str(uuid4())
        session_response = client.post(
            "/v1/session/start",
            json={
                "user_id": user_id,
                "device_id": "device-123",
                "module": "callguard",
            },
            headers=headers,
        )
        session_id = session_response.json()["session_id"]
        
        # Append an event
        response = client.post(
            f"/v1/session/{session_id}/event",
            json={
                "type": "signal",
                "payload": {"signal_key": "verification_code_request"},
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert "level" in data
        assert "reasons" in data
    
    def test_append_event_nonexistent_session(self, client, headers):
        """Test appending event to non-existent session."""
        fake_session_id = str(uuid4())
        response = client.post(
            f"/v1/session/{fake_session_id}/event",
            json={
                "type": "signal",
                "payload": {"signal_key": "verification_code_request"},
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
            headers=headers,
        )
        assert response.status_code == 404
    
    def test_get_session_success(self, client, headers):
        """Test retrieving a session."""
        # Start a session
        user_id = str(uuid4())
        session_response = client.post(
            "/v1/session/start",
            json={
                "user_id": user_id,
                "device_id": "device-123",
                "module": "callguard",
            },
            headers=headers,
        )
        session_id = session_response.json()["session_id"]
        
        # Append an event
        client.post(
            f"/v1/session/{session_id}/event",
            json={
                "type": "signal",
                "payload": {"signal_key": "verification_code_request"},
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
            headers=headers,
        )
        
        # Get session
        response = client.get(
            f"/v1/session/{session_id}",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert "last_risk" in data
        assert isinstance(data["events"], list)
        assert len(data["events"]) > 0
        assert data["last_risk"] is not None
    
    def test_get_session_nonexistent(self, client, headers):
        """Test retrieving non-existent session."""
        fake_session_id = str(uuid4())
        response = client.get(
            f"/v1/session/{fake_session_id}",
            headers=headers,
        )
        assert response.status_code == 404
    
    def test_end_session_success(self, client, headers):
        """Test ending a session."""
        # Start a session
        user_id = str(uuid4())
        session_response = client.post(
            "/v1/session/start",
            json={
                "user_id": user_id,
                "device_id": "device-123",
                "module": "callguard",
            },
            headers=headers,
        )
        session_id = session_response.json()["session_id"]
        
        # Append an event to generate risk
        client.post(
            f"/v1/session/{session_id}/event",
            json={
                "type": "signal",
                "payload": {"signal_key": "verification_code_request"},
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
            headers=headers,
        )
        
        # End session
        response = client.post(
            f"/v1/session/{session_id}/end",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "module" in data
        assert "created_at" in data
        assert "last_risk" in data
        assert "key_takeaways" in data
        assert data["session_id"] == session_id
    
    def test_end_session_nonexistent(self, client, headers):
        """Test ending non-existent session."""
        fake_session_id = str(uuid4())
        response = client.post(
            f"/v1/session/{fake_session_id}/end",
            headers=headers,
        )
        assert response.status_code == 404
    
    def test_end_session_no_risk(self, client, headers):
        """Test ending session with no risk assessment."""
        # Start a session
        user_id = str(uuid4())
        session_response = client.post(
            "/v1/session/start",
            json={
                "user_id": user_id,
                "device_id": "device-123",
                "module": "callguard",
            },
            headers=headers,
        )
        session_id = session_response.json()["session_id"]
        
        # Try to end without any events (no risk assessment)
        response = client.post(
            f"/v1/session/{session_id}/end",
            headers=headers,
        )
        assert response.status_code == 404  # No risk score available
    
    def test_session_full_lifecycle(self, client, headers):
        """Test complete session lifecycle."""
        user_id = str(uuid4())
        
        # 1. Start session
        start_response = client.post(
            "/v1/session/start",
            json={
                "user_id": user_id,
                "device_id": "device-123",
                "module": "moneyguard",
            },
            headers=headers,
        )
        assert start_response.status_code == 200
        session_id = start_response.json()["session_id"]
        
        # 2. Append multiple events
        for i in range(3):
            event_response = client.post(
                f"/v1/session/{session_id}/event",
                json={
                    "type": "assess",
                    "payload": {
                        "amount": 100.0 * (i + 1),
                        "payment_method": "zelle",
                        "recipient": f"Recipient {i}",
                        "reason": "Test",
                        "did_they_contact_you_first": False,
                        "flags": {
                            "urgency_present": i % 2 == 0,
                            "asked_to_keep_secret": False,
                            "asked_for_verification_code": False,
                            "asked_for_remote_access": False,
                            "impersonation_type": "none",
                        },
                    },
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
                headers=headers,
            )
            assert event_response.status_code == 200
        
        # 3. Get session
        get_response = client.get(
            f"/v1/session/{session_id}",
            headers=headers,
        )
        assert get_response.status_code == 200
        session_data = get_response.json()
        assert len(session_data["events"]) == 3
        assert session_data["last_risk"] is not None
        
        # 4. End session
        end_response = client.post(
            f"/v1/session/{session_id}/end",
            headers=headers,
        )
        assert end_response.status_code == 200
        summary = end_response.json()
        assert summary["session_id"] == session_id
        assert len(summary["key_takeaways"]) > 0
    
    def test_session_with_moneyguard_assess(self, client, headers):
        """Test MoneyGuard assess with session_id."""
        # Start a session
        user_id = str(uuid4())
        session_response = client.post(
            "/v1/session/start",
            json={
                "user_id": user_id,
                "device_id": "device-123",
                "module": "moneyguard",
            },
            headers=headers,
        )
        session_id = session_response.json()["session_id"]
        
        # Use MoneyGuard assess with session_id
        response = client.post(
            "/v1/moneyguard/assess",
            json={
                "amount": 500.0,
                "payment_method": "zelle",
                "recipient": "John Doe",
                "reason": "Invoice payment",
                "did_they_contact_you_first": False,
                "urgency_present": True,
                "asked_to_keep_secret": False,
                "asked_for_verification_code": False,
                "asked_for_remote_access": False,
                "impersonation_type": "none",
                "session_id": session_id,
            },
            headers=headers,
        )
        assert response.status_code == 200
        
        # Verify event was added to session
        get_response = client.get(
            f"/v1/session/{session_id}",
            headers=headers,
        )
        assert get_response.status_code == 200
        session_data = get_response.json()
        assert len(session_data["events"]) > 0
    
    def test_session_invalid_module(self, client, headers):
        """Test starting session with invalid module."""
        user_id = str(uuid4())
        response = client.post(
            "/v1/session/start",
            json={
                "user_id": user_id,
                "device_id": "device-123",
                "module": "invalid_module",
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error
    
    def test_session_missing_fields(self, client, headers):
        """Test starting session with missing required fields."""
        response = client.post(
            "/v1/session/start",
            json={
                "user_id": str(uuid4()),
                # Missing device_id and module
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error

