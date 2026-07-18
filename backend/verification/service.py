"""Business logic for Trusted Contact Verification."""

from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.exceptions import DatabaseIntegrityError, DatabaseNotFoundError
from backend.database.models import TrustedContact, TrustedVerificationRequest, User
from backend.database.repositories.user_repository import UserRepository
from backend.database.repositories.verification_repository import (
    NotificationRepository,
    TrustedContactRepository,
    VerificationRequestRepository,
)
from backend.database.rls import set_current_user_id
from backend.database.service import DatabaseService
from backend.storage.encryption import get_encryption
from backend.verification.notifications import CompositeNotificationService
from backend.verification.risk_analyzer import (
    analyze_verification_risk,
    score_to_verification_level,
)
from backend.verification.schemas import (
    ListRole,
    RiskAnalysisResponse,
    TrustedContactCreateRequest,
    TrustedContactResponse,
    VerificationRequestCreate,
    VerificationRequestResponse,
    VerificationReviewRequest,
)

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(
    os.getenv("VERIFICATION_UPLOAD_DIR", "uploads/verification")
).resolve()
ALLOWED_SCREENSHOT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}
MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024
STALE_AFTER = timedelta(minutes=30)


class VerificationService:
    def __init__(self, session: AsyncSession, current_user: User):
        self.session = session
        self.current_user = current_user
        self.db_service = DatabaseService(session=session)
        self.user_repo = UserRepository(self.db_service)
        self.contact_repo = TrustedContactRepository(self.db_service)
        self.request_repo = VerificationRequestRepository(self.db_service)
        self.notification_repo = NotificationRepository(self.db_service)
        self.notifications = CompositeNotificationService(session)
        self.encryption = get_encryption()

    async def prepare(self) -> None:
        await set_current_user_id(self.session, self.current_user.id)

    def _decrypt_user(
        self, user: Optional[User]
    ) -> tuple[Optional[str], Optional[str]]:
        if user is None:
            return None, None
        email = None
        name = None
        try:
            email = self.encryption.decrypt(user.email_encrypted)
        except Exception:
            email = None
        if user.full_name_encrypted:
            try:
                name = self.encryption.decrypt(user.full_name_encrypted)
            except Exception:
                name = None
        return email, name

    def _is_stale(self, created_at: datetime) -> bool:
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) - created_at > STALE_AFTER

    def to_request_response(
        self, request: TrustedVerificationRequest
    ) -> VerificationRequestResponse:
        submitter_email, submitter_name = self._decrypt_user(request.submitter)
        risk_level = None
        if request.risk_score is not None:
            risk_level = score_to_verification_level(request.risk_score)
        label = None
        if request.trusted_contact is not None:
            label = request.trusted_contact.label
        return VerificationRequestResponse(
            id=request.id,
            user_id=request.user_id,
            trusted_contact_id=request.trusted_contact_id,
            interaction_type=request.interaction_type,  # type: ignore[arg-type]
            sender_name=request.sender_name,
            sender_contact=request.sender_contact,
            description=request.description,
            requested_action=request.requested_action,
            amount_requested=request.amount_requested,
            screenshot_url=request.screenshot_url,
            risk_score=request.risk_score,
            risk_level=risk_level,
            risk_reasons=list(request.risk_reasons or []),
            status=request.status,  # type: ignore[arg-type]
            reviewer_notes=request.reviewer_notes,
            reviewed_at=request.reviewed_at,
            created_at=request.created_at,
            updated_at=request.updated_at,
            submitter_name=submitter_name,
            submitter_email=submitter_email,
            trusted_contact_label=label,
            is_stale=self._is_stale(request.created_at) and request.status == "pending",
        )

    def to_contact_response(self, contact: TrustedContact) -> TrustedContactResponse:
        email, name = self._decrypt_user(contact.contact_user)
        return TrustedContactResponse(
            id=contact.id,
            user_id=contact.user_id,
            contact_user_id=contact.contact_user_id,
            contact_email=email,
            contact_name=name,
            label=contact.label,
            created_at=contact.created_at,
        )

    async def _find_user_by_email(self, email: str) -> Optional[User]:
        users = await self.db_service.get_all_users()
        for user in users:
            try:
                if (
                    self.encryption.decrypt(user.email_encrypted).lower()
                    == email.lower()
                ):
                    return user
            except Exception:
                continue
        return None

    def _can_view(self, request: TrustedVerificationRequest) -> bool:
        if request.user_id == self.current_user.id:
            return True
        tc = request.trusted_contact
        return tc is not None and tc.contact_user_id == self.current_user.id

    def _can_review(self, request: TrustedVerificationRequest) -> bool:
        tc = request.trusted_contact
        return tc is not None and tc.contact_user_id == self.current_user.id

    async def list_contacts(self) -> List[TrustedContactResponse]:
        contacts = await self.contact_repo.list_for_user(self.current_user.id)
        return [self.to_contact_response(c) for c in contacts]

    async def add_contact(
        self, data: TrustedContactCreateRequest
    ) -> TrustedContactResponse:
        contact_user = await self._find_user_by_email(data.contact_email.strip())
        if contact_user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No registered user found with that email address",
            )
        if contact_user.id == self.current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot add yourself as a trusted contact",
            )
        try:
            contact = await self.contact_repo.create(
                user_id=self.current_user.id,
                contact_user_id=contact_user.id,
                label=data.label,
            )
        except DatabaseIntegrityError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="That person is already in your CareCircle",
            ) from e

        await self.notifications.notify_in_app(
            contact_user.id,
            type="trusted_contact_added",
            title="You were added as a trusted contact",
            body="A family member added you to their CareCircle so they can ask you to review suspicious messages.",
            payload={"trusted_contact_id": str(contact.id)},
        )
        logger.info(
            "Trusted contact created owner=%s contact=%s",
            self.current_user.id,
            contact_user.id,
        )
        return self.to_contact_response(contact)

    async def create_request(
        self, data: VerificationRequestCreate
    ) -> VerificationRequestResponse:
        contact = await self.contact_repo.get_by_id(data.trusted_contact_id)
        if contact is None or contact.user_id != self.current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Trusted contact not found or not assigned to you",
            )

        amount = (
            float(data.amount_requested) if data.amount_requested is not None else None
        )
        risk = analyze_verification_risk(
            description=data.description,
            requested_action=data.requested_action,
            sender_name=data.sender_name,
            sender_contact=data.sender_contact,
            amount_requested=amount,
            interaction_type=data.interaction_type,
        )

        request = await self.request_repo.create(
            user_id=self.current_user.id,
            trusted_contact_id=contact.id,
            interaction_type=data.interaction_type,
            description=data.description,
            sender_name=data.sender_name,
            sender_contact=data.sender_contact,
            requested_action=data.requested_action,
            amount_requested=data.amount_requested,
            risk_score=risk.risk_score,
            risk_reasons=risk.risk_reasons,
            status="pending",
        )

        await self.notifications.notify_in_app(
            contact.contact_user_id,
            type="verification_request_new",
            title="New request needs your review",
            body="A family member asked you to check a suspicious interaction.",
            payload={
                "request_id": str(request.id),
                "risk_score": risk.risk_score,
                "risk_level": risk.risk_level,
            },
        )

        # Best-effort email/SMS adapters (stubs when unconfigured)
        contact_email, _ = self._decrypt_user(contact.contact_user)
        if contact_email:
            await self.notifications.notify_email(
                contact_email,
                subject="Titanium Guardian: please review a family request",
                body=(
                    "A family member submitted a suspicious interaction for your review. "
                    f"Open CareCircle reviews to check request {request.id}."
                ),
            )

        logger.info(
            "Verification request created id=%s user=%s risk=%s",
            request.id,
            self.current_user.id,
            risk.risk_score,
        )
        return self.to_request_response(request)

    async def list_requests(
        self, role: ListRole = "all"
    ) -> List[VerificationRequestResponse]:
        if role == "submitted":
            items = await self.request_repo.list_for_submitter(self.current_user.id)
        elif role == "review":
            items = await self.request_repo.list_for_reviewer(self.current_user.id)
        else:
            items = await self.request_repo.list_all_for_user(self.current_user.id)
        return [self.to_request_response(item) for item in items]

    async def get_request(self, request_id: UUID) -> VerificationRequestResponse:
        try:
            request = await self.request_repo.get_by_id_or_raise(request_id)
        except DatabaseNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Request not found"
            ) from e
        if not self._can_view(request):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this request",
            )
        return self.to_request_response(request)

    async def review_request(
        self, request_id: UUID, data: VerificationReviewRequest
    ) -> VerificationRequestResponse:
        try:
            request = await self.request_repo.get_by_id_or_raise(request_id)
        except DatabaseNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Request not found"
            ) from e
        if not self._can_review(request):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the assigned trusted contact can review this request",
            )

        request.status = data.status
        request.reviewer_notes = data.reviewer_notes
        request.reviewed_at = datetime.now(timezone.utc)
        saved = await self.request_repo.save(request)

        status_labels = {
            "likely_safe": "Likely Safe",
            "suspicious": "Suspicious",
            "confirmed_scam": "Confirmed Scam",
            "needs_discussion": "Needs Discussion",
        }
        label = status_labels.get(data.status, data.status)
        await self.notifications.notify_in_app(
            request.user_id,
            type="verification_request_reviewed",
            title=f"Your request was marked: {label}",
            body="Your trusted contact finished reviewing the interaction you shared.",
            payload={
                "request_id": str(request.id),
                "status": data.status,
            },
        )
        logger.info(
            "Verification request reviewed id=%s by=%s status=%s",
            request.id,
            self.current_user.id,
            data.status,
        )
        return self.to_request_response(saved)

    async def run_risk_analysis(self, request_id: UUID) -> RiskAnalysisResponse:
        try:
            request = await self.request_repo.get_by_id_or_raise(request_id)
        except DatabaseNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Request not found"
            ) from e
        if not self._can_view(request):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this request",
            )

        amount = (
            float(request.amount_requested)
            if request.amount_requested is not None
            else None
        )
        risk = analyze_verification_risk(
            description=request.description,
            requested_action=request.requested_action,
            sender_name=request.sender_name,
            sender_contact=request.sender_contact,
            amount_requested=amount,
            interaction_type=request.interaction_type,
        )
        request.risk_score = risk.risk_score
        request.risk_reasons = risk.risk_reasons
        await self.request_repo.save(request)
        return RiskAnalysisResponse(
            risk_score=risk.risk_score,
            risk_level=risk.risk_level,
            risk_reasons=risk.risk_reasons,
            summary=risk.summary,
        )

    async def upload_screenshot(
        self, request_id: UUID, file: UploadFile
    ) -> VerificationRequestResponse:
        try:
            request = await self.request_repo.get_by_id_or_raise(request_id)
        except DatabaseNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Request not found"
            ) from e
        if request.user_id != self.current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the person who submitted this request can upload a screenshot",
            )

        content_type = (file.content_type or "").lower()
        if content_type not in ALLOWED_SCREENSHOT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Screenshot must be a JPEG, PNG, WEBP, or GIF image",
            )

        data = await file.read()
        if len(data) > MAX_SCREENSHOT_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Screenshot must be 5 MB or smaller",
            )

        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        ext = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif",
        }.get(content_type, ".bin")
        filename = f"{request_id}_{uuid.uuid4().hex}{ext}"
        path = UPLOAD_DIR / filename
        path.write_bytes(data)

        request.screenshot_url = f"/uploads/verification/{filename}"
        saved = await self.request_repo.save(request)
        logger.info("Screenshot uploaded for request %s", request_id)
        return self.to_request_response(saved)
