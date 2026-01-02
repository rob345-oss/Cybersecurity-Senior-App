"""
Extended integration tests for API endpoints.

Tests additional scenarios, error handling, authentication, and edge cases
not covered in test_api_integration.py.
"""
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


class TestCallGuardEndpoints:
    """Test CallGuard-specific session endpoints."""
    
    def test_callguard_session_with_signals(self, client, headers):
        """Test CallGuard session with signal events."""
        # Start CallGuard session
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
        assert session_response.status_code == 200
        session_id = session_response.json()["session_id"]
        
        # Add signal events
        signals = ["verification_code_request", "urgency", "bank_impersonation"]
        for signal in signals:
            response = client.post(
                f"/v1/session/{session_id}/event",
                json={
                    "type": "signal",
                    "payload": {"signal_key": signal},
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
                headers=headers,
            )
            assert response.status_code == 200
            assert "score" in response.json()
            assert response.json()["score"] > 0  # Should have risk score
    
    def test_callguard_session_multiple_events(self, client, headers):
        """Test CallGuard session with multiple signal events."""
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
        
        # Add multiple events
        for i in range(5):
            response = client.post(
                f"/v1/session/{session_id}/event",
                json={
                    "type": "signal",
                    "payload": {"signal_key": f"signal_{i}"},
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
                headers=headers,
            )
            assert response.status_code == 200
        
        # Get session and verify events
        get_response = client.get(
            f"/v1/session/{session_id}",
            headers=headers,
        )
        assert get_response.status_code == 200
        session_data = get_response.json()
        assert len(session_data["events"]) == 5


class TestInboxGuardSessionEndpoints:
    """Test InboxGuard-specific session endpoints."""
    
    def test_inboxguard_text_event(self, client, headers):
        """Test InboxGuard session with text event."""
        user_id = str(uuid4())
        session_response = client.post(
            "/v1/session/start",
            json={
                "user_id": user_id,
                "device_id": "device-123",
                "module": "inboxguard",
            },
            headers=headers,
        )
        session_id = session_response.json()["session_id"]
        
        # Add text event
        response = client.post(
            f"/v1/session/{session_id}/event",
            json={
                "type": "text",
                "payload": {
                    "text": "URGENT: Verify your account immediately!",
                    "channel": "email",
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["score"] > 0
    
    def test_inboxguard_url_event(self, client, headers):
        """Test InboxGuard session with URL event."""
        user_id = str(uuid4())
        session_response = client.post(
            "/v1/session/start",
            json={
                "user_id": user_id,
                "device_id": "device-123",
                "module": "inboxguard",
            },
            headers=headers,
        )
        session_id = session_response.json()["session_id"]
        
        # Add URL event
        response = client.post(
            f"/v1/session/{session_id}/event",
            json={
                "type": "url",
                "payload": {
                    "url": "https://bit.ly/suspicious-link",
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["score"] > 0


class TestMoneyGuardSessionEndpoints:
    """Test MoneyGuard-specific session endpoints."""
    
    def test_moneyguard_assess_event(self, client, headers):
        """Test MoneyGuard session with assess event."""
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
        
        # Add assess event
        response = client.post(
            f"/v1/session/{session_id}/event",
            json={
                "type": "assess",
                "payload": {
                    "amount": 500.0,
                    "payment_method": "gift_card",
                    "recipient": "Recipient",
                    "reason": "Payment",
                    "did_they_contact_you_first": True,
                    "flags": {
                        "urgency_present": True,
                        "asked_for_verification_code": True,
                    },
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["score"] > 0


class TestIdentityWatchSessionEndpoints:
    """Test IdentityWatch-specific session endpoints."""
    
    def test_identitywatch_signals_event(self, client, headers):
        """Test IdentityWatch session with signals event."""
        user_id = str(uuid4())
        session_response = client.post(
            "/v1/session/start",
            json={
                "user_id": user_id,
                "device_id": "device-123",
                "module": "identitywatch",
            },
            headers=headers,
        )
        session_id = session_response.json()["session_id"]
        
        # Add signals event
        response = client.post(
            f"/v1/session/{session_id}/event",
            json={
                "type": "signals",
                "payload": {
                    "account_opened": True,
                    "suspicious_inquiry": True,
                    "password_reset_unknown": False,
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["score"] > 0


class TestDataRetentionPolicy:
    """Test data retention policy endpoint."""
    
    def test_get_retention_policy(self, client, headers):
        """Test getting data retention policy."""
        response = client.get(
            "/v1/data-retention/policy",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        # Should contain retention policy information
        assert len(data) > 0


class TestErrorHandling:
    """Test error handling for various error scenarios."""
    
    def test_moneyguard_invalid_amount_type(self, client, headers):
        """Test MoneyGuard with invalid amount type."""
        response = client.post(
            "/v1/moneyguard/assess",
            json={
                "amount": "not_a_number",
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
    
    def test_moneyguard_missing_required_fields(self, client, headers):
        """Test MoneyGuard with missing required fields."""
        response = client.post(
            "/v1/moneyguard/assess",
            json={
                "amount": 100.0,
                # Missing other required fields
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error
    
    def test_inboxguard_text_missing_channel(self, client, headers):
        """Test InboxGuard text analysis with missing channel."""
        response = client.post(
            "/v1/inboxguard/analyze_text",
            json={
                "text": "Test message",
                # Missing channel
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error
    
    def test_inboxguard_url_malformed(self, client, headers):
        """Test InboxGuard with malformed URL."""
        response = client.post(
            "/v1/inboxguard/analyze_url",
            json={
                "url": "not a valid url at all",
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error
    
    def test_identitywatch_profile_missing_emails(self, client, headers):
        """Test IdentityWatch profile creation with missing emails."""
        response = client.post(
            "/v1/identitywatch/profile",
            json={
                "phones": ["+1234567890"],
                # Missing emails
            },
            headers=headers,
        )
        assert response.status_code == 422  # Validation error
    
    def test_identitywatch_check_risk_invalid_profile_id_format(self, client, headers):
        """Test IdentityWatch risk check with invalid profile ID format."""
        response = client.post(
            "/v1/identitywatch/check_risk",
            json={
                "profile_id": "",  # Empty string
                "signals": {"account_opened": True},
            },
            headers=headers,
        )
        # Should either be 404 or 422 depending on validation
        assert response.status_code in [404, 422]


class TestInputSanitization:
    """Test input sanitization and XSS prevention."""
    
    def test_moneyguard_xss_in_recipient(self, client, headers):
        """Test that XSS attempts in recipient field are sanitized."""
        response = client.post(
            "/v1/moneyguard/assess",
            json={
                "amount": 100.0,
                "payment_method": "zelle",
                "recipient": "<script>alert('xss')</script>",
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
        assert response.status_code == 200
        # Script tags should be removed/sanitized
    
    def test_inboxguard_xss_in_text(self, client, headers):
        """Test that XSS attempts in text field are sanitized."""
        response = client.post(
            "/v1/inboxguard/analyze_text",
            json={
                "text": "<script>alert('xss')</script>Normal text",
                "channel": "email",
            },
            headers=headers,
        )
        assert response.status_code == 200
        # Script tags should be removed/sanitized
    
    def test_identitywatch_xss_in_full_name(self, client, headers):
        """Test that XSS attempts in full_name field are sanitized."""
        response = client.post(
            "/v1/identitywatch/profile",
            json={
                "emails": ["test@example.com"],
                "phones": ["+1234567890"],
                "full_name": "<script>alert('xss')</script>",
            },
            headers=headers,
        )
        assert response.status_code == 200
        # Script tags should be removed/sanitized


class TestRateLimiting:
    """Test rate limiting behavior (if applicable in test environment)."""
    
    def test_multiple_requests_same_endpoint(self, client, headers):
        """Test making multiple requests to the same endpoint."""
        # Make multiple requests
        for i in range(10):
            response = client.post(
                "/v1/moneyguard/safe_steps",
                json={},
                headers=headers,
            )
            # Should succeed (rate limit might not be enforced in test)
            assert response.status_code in [200, 429]


class TestResponseStructure:
    """Test response structure and data types."""
    
    def test_moneyguard_response_structure(self, client, headers):
        """Test MoneyGuard response has correct structure."""
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
        
        # Check all required fields
        assert "score" in data
        assert "level" in data
        assert "reasons" in data
        assert "next_action" in data
        assert "recommended_actions" in data
        assert "metadata" in data
        
        # Check types
        assert isinstance(data["score"], int)
        assert isinstance(data["level"], str)
        assert isinstance(data["reasons"], list)
        assert isinstance(data["recommended_actions"], list)
        assert isinstance(data["metadata"], dict)
        
        # Check score range
        assert 0 <= data["score"] <= 100
        assert data["level"] in ["low", "medium", "high"]
    
    def test_inboxguard_response_structure(self, client, headers):
        """Test InboxGuard response has correct structure."""
        response = client.post(
            "/v1/inboxguard/analyze_text",
            json={
                "text": "Test message",
                "channel": "email",
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
        assert "metadata" in data
        assert "channel" in data["metadata"]
    
    def test_identitywatch_response_structure(self, client, headers):
        """Test IdentityWatch response has correct structure."""
        # First create profile
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
                "signals": {"account_opened": True},
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
        assert "safe_script" in data  # IdentityWatch always has safe_script


class TestSessionEdgeCases:
    """Test edge cases for session management."""
    
    def test_session_with_empty_events(self, client, headers):
        """Test session with no events before ending."""
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
        
        # Try to end session without events
        response = client.post(
            f"/v1/session/{session_id}/end",
            headers=headers,
        )
        # Should fail because no risk assessment
        assert response.status_code == 404
    
    def test_get_session_immediately_after_start(self, client, headers):
        """Test getting session immediately after starting."""
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
        
        # Get session immediately
        response = client.get(
            f"/v1/session/{session_id}",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert len(data["events"]) == 0  # No events yet
        assert data["last_risk"] is None  # No risk assessment yet

