"""Authorization tests for trusted contact verification access control."""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _user(user_id=None):
    return SimpleNamespace(
        id=user_id or uuid4(),
        email_encrypted="enc",
        full_name_encrypted=None,
    )


def _contact(owner_id, reviewer_id, contact_id=None):
    return SimpleNamespace(
        id=contact_id or uuid4(),
        user_id=owner_id,
        contact_user_id=reviewer_id,
        label="Daughter",
        contact_user=_user(reviewer_id),
        created_at=datetime.now(timezone.utc),
    )


def _request(submitter_id, contact, request_id=None, status="pending"):
    return SimpleNamespace(
        id=request_id or uuid4(),
        user_id=submitter_id,
        trusted_contact_id=contact.id,
        trusted_contact=contact,
        submitter=_user(submitter_id),
        interaction_type="call",
        sender_name="Unknown",
        sender_contact="555-0100",
        description="Suspicious call",
        requested_action="Send money",
        amount_requested=None,
        screenshot_url=None,
        risk_score=70,
        risk_reasons=["Uses urgent or threatening language"],
        status=status,
        reviewer_notes=None,
        reviewed_at=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def encryption():
    enc = MagicMock()
    enc.decrypt.side_effect = lambda v: "user@example.com" if v else None
    return enc


@pytest.mark.asyncio
async def test_submitter_can_view_own_request(encryption):
    from backend.verification.service import VerificationService

    submitter = _user()
    reviewer = _user()
    contact = _contact(submitter.id, reviewer.id)
    request = _request(submitter.id, contact)

    session = AsyncMock()
    with patch(
        "backend.verification.service.get_encryption", return_value=encryption
    ), patch(
        "backend.verification.service.set_current_user_id", new_callable=AsyncMock
    ):
        service = VerificationService(session, submitter)
        service.request_repo = MagicMock()
        service.request_repo.get_by_id_or_raise = AsyncMock(return_value=request)

        result = await service.get_request(request.id)
        assert result.id == request.id
        assert result.user_id == submitter.id


@pytest.mark.asyncio
async def test_assigned_reviewer_can_view_request(encryption):
    from backend.verification.service import VerificationService

    submitter = _user()
    reviewer = _user()
    contact = _contact(submitter.id, reviewer.id)
    request = _request(submitter.id, contact)

    session = AsyncMock()
    with patch(
        "backend.verification.service.get_encryption", return_value=encryption
    ), patch(
        "backend.verification.service.set_current_user_id", new_callable=AsyncMock
    ):
        service = VerificationService(session, reviewer)
        service.request_repo = MagicMock()
        service.request_repo.get_by_id_or_raise = AsyncMock(return_value=request)

        result = await service.get_request(request.id)
        assert result.id == request.id


@pytest.mark.asyncio
async def test_other_family_cannot_view_request(encryption):
    from fastapi import HTTPException
    from backend.verification.service import VerificationService

    submitter = _user()
    reviewer = _user()
    outsider = _user()
    contact = _contact(submitter.id, reviewer.id)
    request = _request(submitter.id, contact)

    session = AsyncMock()
    with patch(
        "backend.verification.service.get_encryption", return_value=encryption
    ), patch(
        "backend.verification.service.set_current_user_id", new_callable=AsyncMock
    ):
        service = VerificationService(session, outsider)
        service.request_repo = MagicMock()
        service.request_repo.get_by_id_or_raise = AsyncMock(return_value=request)

        with pytest.raises(HTTPException) as exc:
            await service.get_request(request.id)
        assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_only_assigned_reviewer_can_review(encryption):
    from fastapi import HTTPException
    from backend.verification.service import VerificationService
    from backend.verification.schemas import VerificationReviewRequest

    submitter = _user()
    reviewer = _user()
    outsider = _user()
    contact = _contact(submitter.id, reviewer.id)
    request = _request(submitter.id, contact)

    session = AsyncMock()
    with patch(
        "backend.verification.service.get_encryption", return_value=encryption
    ), patch(
        "backend.verification.service.set_current_user_id", new_callable=AsyncMock
    ):
        service = VerificationService(session, outsider)
        service.request_repo = MagicMock()
        service.request_repo.get_by_id_or_raise = AsyncMock(return_value=request)

        with pytest.raises(HTTPException) as exc:
            await service.review_request(
                request.id,
                VerificationReviewRequest(
                    status="confirmed_scam", reviewer_notes="Scam"
                ),
            )
        assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_submitter_cannot_review_own_request(encryption):
    from fastapi import HTTPException
    from backend.verification.service import VerificationService
    from backend.verification.schemas import VerificationReviewRequest

    submitter = _user()
    reviewer = _user()
    contact = _contact(submitter.id, reviewer.id)
    request = _request(submitter.id, contact)

    session = AsyncMock()
    with patch(
        "backend.verification.service.get_encryption", return_value=encryption
    ), patch(
        "backend.verification.service.set_current_user_id", new_callable=AsyncMock
    ):
        service = VerificationService(session, submitter)
        service.request_repo = MagicMock()
        service.request_repo.get_by_id_or_raise = AsyncMock(return_value=request)

        with pytest.raises(HTTPException) as exc:
            await service.review_request(
                request.id,
                VerificationReviewRequest(status="likely_safe"),
            )
        assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_reviewer_can_mark_needs_discussion(encryption):
    from backend.verification.service import VerificationService
    from backend.verification.schemas import VerificationReviewRequest

    submitter = _user()
    reviewer = _user()
    contact = _contact(submitter.id, reviewer.id)
    request = _request(submitter.id, contact)

    session = AsyncMock()
    with patch(
        "backend.verification.service.get_encryption", return_value=encryption
    ), patch(
        "backend.verification.service.set_current_user_id", new_callable=AsyncMock
    ):
        service = VerificationService(session, reviewer)
        service.request_repo = MagicMock()
        service.request_repo.get_by_id_or_raise = AsyncMock(return_value=request)
        service.request_repo.save = AsyncMock(side_effect=lambda r: r)
        service.notifications = MagicMock()
        service.notifications.notify_in_app = AsyncMock()

        result = await service.review_request(
            request.id,
            VerificationReviewRequest(
                status="needs_discussion",
                reviewer_notes="Call me before doing anything.",
            ),
        )
        assert result.status == "needs_discussion"
        service.notifications.notify_in_app.assert_awaited()
