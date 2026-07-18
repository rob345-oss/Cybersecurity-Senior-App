"""Repository for trusted contacts, verification requests, and notifications."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

from backend.database.exceptions import DatabaseNotFoundError
from backend.database.models import (
    InAppNotification,
    TrustedContact,
    TrustedVerificationRequest,
)
from backend.database.service import DatabaseService, handle_database_error


class TrustedContactRepository:
    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service

    async def list_for_user(self, user_id: UUID) -> List[TrustedContact]:
        try:
            result = await self.db_service.session.execute(
                select(TrustedContact)
                .where(TrustedContact.user_id == user_id)
                .options(selectinload(TrustedContact.contact_user))
                .order_by(TrustedContact.created_at.desc())
            )
            return list(result.scalars().all())
        except Exception as e:
            raise handle_database_error(e, "list_trusted_contacts") from e

    async def get_by_id(self, contact_id: UUID) -> Optional[TrustedContact]:
        try:
            result = await self.db_service.session.execute(
                select(TrustedContact)
                .where(TrustedContact.id == contact_id)
                .options(selectinload(TrustedContact.contact_user))
            )
            return result.scalar_one_or_none()
        except Exception as e:
            raise handle_database_error(e, f"get_trusted_contact({contact_id})") from e

    async def create(
        self,
        user_id: UUID,
        contact_user_id: UUID,
        label: Optional[str] = None,
    ) -> TrustedContact:
        try:
            contact = TrustedContact(
                user_id=user_id,
                contact_user_id=contact_user_id,
                label=label,
            )
            self.db_service.session.add(contact)
            await self.db_service.session.commit()
            await self.db_service.session.refresh(contact)
            loaded = await self.get_by_id(contact.id)
            return loaded or contact
        except Exception as e:
            await self.db_service.session.rollback()
            raise handle_database_error(e, "create_trusted_contact") from e


class VerificationRequestRepository:
    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service

    def _base_query(self):
        return select(TrustedVerificationRequest).options(
            selectinload(TrustedVerificationRequest.submitter),
            selectinload(TrustedVerificationRequest.trusted_contact).selectinload(
                TrustedContact.contact_user
            ),
        )

    async def create(
        self,
        *,
        user_id: UUID,
        trusted_contact_id: UUID,
        interaction_type: str,
        description: str,
        sender_name: Optional[str] = None,
        sender_contact: Optional[str] = None,
        requested_action: Optional[str] = None,
        amount_requested: Optional[Decimal] = None,
        risk_score: Optional[int] = None,
        risk_reasons: Optional[list] = None,
        status: str = "pending",
    ) -> TrustedVerificationRequest:
        try:
            request = TrustedVerificationRequest(
                user_id=user_id,
                trusted_contact_id=trusted_contact_id,
                interaction_type=interaction_type,
                description=description,
                sender_name=sender_name,
                sender_contact=sender_contact,
                requested_action=requested_action,
                amount_requested=amount_requested,
                risk_score=risk_score,
                risk_reasons=risk_reasons or [],
                status=status,
            )
            self.db_service.session.add(request)
            await self.db_service.session.commit()
            await self.db_service.session.refresh(request)
            loaded = await self.get_by_id(request.id)
            return loaded or request
        except Exception as e:
            await self.db_service.session.rollback()
            raise handle_database_error(e, "create_verification_request") from e

    async def get_by_id(self, request_id: UUID) -> Optional[TrustedVerificationRequest]:
        try:
            result = await self.db_service.session.execute(
                self._base_query().where(TrustedVerificationRequest.id == request_id)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            raise handle_database_error(
                e, f"get_verification_request({request_id})"
            ) from e

    async def get_by_id_or_raise(self, request_id: UUID) -> TrustedVerificationRequest:
        request = await self.get_by_id(request_id)
        if request is None:
            raise DatabaseNotFoundError(f"Verification request {request_id} not found")
        return request

    async def list_for_submitter(
        self, user_id: UUID
    ) -> List[TrustedVerificationRequest]:
        try:
            result = await self.db_service.session.execute(
                self._base_query()
                .where(TrustedVerificationRequest.user_id == user_id)
                .order_by(TrustedVerificationRequest.created_at.desc())
            )
            return list(result.scalars().all())
        except Exception as e:
            raise handle_database_error(e, "list_verification_for_submitter") from e

    async def list_for_reviewer(
        self, reviewer_user_id: UUID
    ) -> List[TrustedVerificationRequest]:
        try:
            result = await self.db_service.session.execute(
                self._base_query()
                .join(
                    TrustedContact,
                    TrustedVerificationRequest.trusted_contact_id == TrustedContact.id,
                )
                .where(TrustedContact.contact_user_id == reviewer_user_id)
                .order_by(
                    TrustedVerificationRequest.risk_score.desc().nullslast(),
                    TrustedVerificationRequest.created_at.desc(),
                )
            )
            return list(result.scalars().all())
        except Exception as e:
            raise handle_database_error(e, "list_verification_for_reviewer") from e

    async def list_all_for_user(
        self, user_id: UUID
    ) -> List[TrustedVerificationRequest]:
        try:
            result = await self.db_service.session.execute(
                self._base_query()
                .outerjoin(
                    TrustedContact,
                    TrustedVerificationRequest.trusted_contact_id == TrustedContact.id,
                )
                .where(
                    or_(
                        TrustedVerificationRequest.user_id == user_id,
                        TrustedContact.contact_user_id == user_id,
                    )
                )
                .order_by(TrustedVerificationRequest.created_at.desc())
            )
            return list(result.scalars().unique().all())
        except Exception as e:
            raise handle_database_error(e, "list_verification_all_for_user") from e

    async def save(
        self, request: TrustedVerificationRequest
    ) -> TrustedVerificationRequest:
        try:
            request.updated_at = datetime.now(timezone.utc)
            await self.db_service.session.commit()
            await self.db_service.session.refresh(request)
            loaded = await self.get_by_id(request.id)
            return loaded or request
        except Exception as e:
            await self.db_service.session.rollback()
            raise handle_database_error(
                e, f"save_verification_request({request.id})"
            ) from e


class NotificationRepository:
    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service

    async def list_for_user(
        self, user_id: UUID, limit: int = 50
    ) -> List[InAppNotification]:
        try:
            result = await self.db_service.session.execute(
                select(InAppNotification)
                .where(InAppNotification.user_id == user_id)
                .order_by(InAppNotification.created_at.desc())
                .limit(limit)
            )
            return list(result.scalars().all())
        except Exception as e:
            raise handle_database_error(e, "list_notifications") from e
