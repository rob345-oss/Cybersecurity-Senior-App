"""API integration tests for Trusted Contact Verification endpoints."""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import pytest

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

os.environ.setdefault(
    "JWT_SECRET_KEY", "test-secret-key-for-verification-api-tests-only"
)
os.environ.setdefault("SKIP_DB_CHECK", "true")
os.environ.setdefault("ENABLE_DATA_ENCRYPTION", "false")


@pytest.fixture
def client():
    from fastapi.testclient import TestClient
    from backend.main import app
    from backend.verification.router import get_verification_service
    from backend.verification.schemas import (
        RiskAnalysisResponse,
        TrustedContactResponse,
        VerificationRequestResponse,
    )
    from backend.auth.dependencies import get_current_user

    user_a = SimpleNamespace(id=uuid4(), email_encrypted="a", full_name_encrypted=None)
    user_b = SimpleNamespace(id=uuid4(), email_encrypted="b", full_name_encrypted=None)
    outsider = SimpleNamespace(
        id=uuid4(), email_encrypted="c", full_name_encrypted=None
    )

    request_id = uuid4()
    contact_id = uuid4()
    now = datetime.now(timezone.utc)

    sample_request = VerificationRequestResponse(
        id=request_id,
        user_id=user_a.id,
        trusted_contact_id=contact_id,
        interaction_type="call",
        sender_name="Unknown caller",
        sender_contact="555-0100",
        description="Asked for gift cards urgently",
        requested_action="Buy gift cards",
        amount_requested=None,
        screenshot_url=None,
        risk_score=85,
        risk_level="critical",
        risk_reasons=[
            "Requests payment with gift cards",
            "Uses urgent or threatening language",
        ],
        status="pending",
        reviewer_notes=None,
        reviewed_at=None,
        created_at=now,
        updated_at=now,
        submitter_name="Alice",
        submitter_email="alice@example.com",
        trusted_contact_label="Daughter",
        is_stale=False,
    )

    sample_contact = TrustedContactResponse(
        id=contact_id,
        user_id=user_a.id,
        contact_user_id=user_b.id,
        contact_email="bob@example.com",
        contact_name="Bob",
        label="Daughter",
        created_at=now,
    )

    class FakeService:
        def __init__(self, user):
            self.user = user

        async def prepare(self):
            return None

        async def list_contacts(self):
            if self.user.id == user_a.id:
                return [sample_contact]
            return []

        async def add_contact(self, body):
            return sample_contact

        async def create_request(self, body):
            return sample_request

        async def list_requests(self, role="all"):
            if self.user.id in (user_a.id, user_b.id):
                return [sample_request]
            return []

        async def get_request(self, rid):
            from fastapi import HTTPException

            if self.user.id not in (user_a.id, user_b.id):
                raise HTTPException(
                    status_code=403, detail="You do not have access to this request"
                )
            if rid != request_id:
                raise HTTPException(status_code=404, detail="Request not found")
            return sample_request

        async def review_request(self, rid, body):
            from fastapi import HTTPException

            if self.user.id != user_b.id:
                raise HTTPException(
                    status_code=403,
                    detail="Only the assigned trusted contact can review this request",
                )
            updated = sample_request.model_copy(
                update={
                    "status": body.status,
                    "reviewer_notes": body.reviewer_notes,
                    "reviewed_at": now,
                }
            )
            return updated

        async def run_risk_analysis(self, rid):
            from fastapi import HTTPException

            if self.user.id not in (user_a.id, user_b.id):
                raise HTTPException(
                    status_code=403, detail="You do not have access to this request"
                )
            return RiskAnalysisResponse(
                risk_score=85,
                risk_level="critical",
                risk_reasons=sample_request.risk_reasons,
                summary="Several warning signs were found.",
            )

        async def upload_screenshot(self, rid, file):
            return sample_request.model_copy(
                update={"screenshot_url": "/uploads/verification/test.png"}
            )

    current = {"user": user_a}

    async def override_user():
        return current["user"]

    async def override_service():
        return FakeService(current["user"])

    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_verification_service] = override_service

    test_client = TestClient(app)
    test_client.user_a = user_a
    test_client.user_b = user_b
    test_client.outsider = outsider
    test_client.request_id = request_id
    test_client.contact_id = contact_id
    test_client.set_user = lambda u: current.update(user=u)

    yield test_client
    app.dependency_overrides.clear()


def test_create_verification_request(client):
    client.set_user(client.user_a)
    response = client.post(
        "/v1/verification-requests",
        json={
            "trusted_contact_id": str(client.contact_id),
            "interaction_type": "call",
            "description": "Asked for gift cards urgently",
            "sender_name": "Unknown caller",
            "requested_action": "Buy gift cards",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "pending"
    assert data["risk_score"] == 85


def test_list_verification_requests(client):
    client.set_user(client.user_a)
    response = client.get("/v1/verification-requests?role=submitted")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_verification_request(client):
    client.set_user(client.user_b)
    response = client.get(f"/v1/verification-requests/{client.request_id}")
    assert response.status_code == 200
    assert response.json()["id"] == str(client.request_id)


def test_cross_family_cannot_get_request(client):
    client.set_user(client.outsider)
    response = client.get(f"/v1/verification-requests/{client.request_id}")
    assert response.status_code == 403


def test_review_by_trusted_contact(client):
    client.set_user(client.user_b)
    response = client.patch(
        f"/v1/verification-requests/{client.request_id}/review",
        json={"status": "confirmed_scam", "reviewer_notes": "Do not send money."},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "confirmed_scam"


def test_review_blocked_for_other_family(client):
    client.set_user(client.outsider)
    response = client.patch(
        f"/v1/verification-requests/{client.request_id}/review",
        json={"status": "likely_safe"},
    )
    assert response.status_code == 403


def test_risk_analysis_endpoint(client):
    client.set_user(client.user_a)
    response = client.post(
        f"/v1/verification-requests/{client.request_id}/risk-analysis"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "critical"
    assert data["risk_score"] == 85


def test_list_trusted_contacts(client):
    client.set_user(client.user_a)
    response = client.get("/v1/trusted-contacts")
    assert response.status_code == 200
    assert response.json()[0]["label"] == "Daughter"


def test_create_trusted_contact(client):
    client.set_user(client.user_a)
    response = client.post(
        "/v1/trusted-contacts",
        json={"contact_email": "bob@example.com", "label": "Daughter"},
    )
    assert response.status_code == 201
    assert response.json()["contact_user_id"] == str(client.user_b.id)


def test_unauthenticated_request_rejected(client):
    from backend.main import app
    from backend.auth.dependencies import get_current_user
    from backend.verification.router import get_verification_service

    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_verification_service, None)
    response = client.get("/v1/verification-requests")
    assert response.status_code in (401, 403)
