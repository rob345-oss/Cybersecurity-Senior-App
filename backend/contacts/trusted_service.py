"""Trusted caller lookup service for CallGuard and APIs.

CallGuard consumes this generic service — not Google-specific code.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.contacts.constants import RELATIONSHIP_CATEGORIES, SENIOR_ERRORS
from backend.contacts.phone import normalize_phone, normalize_phone_list
from backend.database.models import TrustedCaller, UserContact
from backend.utils import sanitize_input

logger = logging.getLogger(__name__)


class TrustedCallerService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def is_trusted_caller(
        self, user_id: UUID, incoming_phone: Optional[str]
    ) -> Dict[str, Any]:
        normalized = normalize_phone(incoming_phone)
        if not normalized:
            return {
                "trusted": False,
                "contact_id": None,
                "name": None,
                "relationship": None,
                "source": None,
                "normalized_phone": None,
            }

        # Match trusted_callers.normalized_phone OR contact additional numbers
        result = await self.db.execute(
            select(TrustedCaller, UserContact)
            .join(UserContact, TrustedCaller.contact_id == UserContact.id)
            .where(
                TrustedCaller.user_id == user_id,
                TrustedCaller.trust_status == "active",
                TrustedCaller.normalized_phone == normalized,
            )
            .limit(1)
        )
        row = result.first()

        if not row:
            # Also check additional numbers on trusted contacts
            contacts_result = await self.db.execute(
                select(UserContact).where(
                    UserContact.user_id == user_id,
                    UserContact.is_trusted.is_(True),
                    UserContact.merged_into_contact_id.is_(None),
                )
            )
            for contact in contacts_result.scalars().all():
                numbers = set()
                if contact.normalized_phone:
                    numbers.add(contact.normalized_phone)
                for extra in contact.additional_phone_numbers or []:
                    if isinstance(extra, dict) and extra.get("normalized"):
                        numbers.add(extra["normalized"])
                if normalized in numbers:
                    return {
                        "trusted": True,
                        "contact_id": str(contact.id),
                        "name": contact.display_name,
                        "relationship": contact.relationship,
                        "source": contact.source,
                        "normalized_phone": normalized,
                    }
            return {
                "trusted": False,
                "contact_id": None,
                "name": None,
                "relationship": None,
                "source": None,
                "normalized_phone": normalized,
            }

        tc, contact = row
        return {
            "trusted": True,
            "contact_id": str(contact.id),
            "name": contact.display_name,
            "relationship": tc.relationship or contact.relationship,
            "source": contact.source,
            "normalized_phone": normalized,
            "trusted_caller_id": str(tc.id),
        }

    async def add_trust(
        self,
        user_id: UUID,
        contact_id: UUID,
        relationship: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> TrustedCaller:
        contact = await self._get_owned_contact(user_id, contact_id)
        if not contact.normalized_phone:
            # Try first additional
            for extra in contact.additional_phone_numbers or []:
                if isinstance(extra, dict) and extra.get("normalized"):
                    contact.normalized_phone = extra["normalized"]
                    contact.primary_phone = extra.get("raw") or contact.primary_phone
                    break
        if not contact.normalized_phone:
            raise ValueError(SENIOR_ERRORS["phone_invalid"])

        if relationship:
            relationship = sanitize_input(relationship, max_length=64)
            if relationship not in RELATIONSHIP_CATEGORIES and relationship:
                # Allow custom but prefer known categories
                pass

        # Reactivate existing or create
        existing = await self.db.execute(
            select(TrustedCaller).where(
                TrustedCaller.user_id == user_id,
                TrustedCaller.contact_id == contact.id,
            )
        )
        tc = existing.scalar_one_or_none()
        now = datetime.now(timezone.utc)
        if tc:
            tc.trust_status = "active"
            tc.normalized_phone = contact.normalized_phone
            if relationship is not None:
                tc.relationship = relationship
                contact.relationship = relationship
            if notes is not None:
                tc.notes = sanitize_input(notes, max_length=2000)
            tc.updated_at = now
        else:
            # Check duplicate phone among active trusted
            dup = await self.db.execute(
                select(TrustedCaller).where(
                    TrustedCaller.user_id == user_id,
                    TrustedCaller.normalized_phone == contact.normalized_phone,
                    TrustedCaller.trust_status == "active",
                )
            )
            if dup.scalar_one_or_none():
                raise ValueError(SENIOR_ERRORS["duplicate_trusted"])

            tc = TrustedCaller(
                id=uuid4(),
                user_id=user_id,
                contact_id=contact.id,
                normalized_phone=contact.normalized_phone,
                trust_status="active",
                relationship=relationship or contact.relationship,
                notes=sanitize_input(notes or "", max_length=2000) or None,
            )
            self.db.add(tc)

        contact.is_trusted = True
        if relationship:
            contact.relationship = relationship
        contact.updated_at = now
        await self.db.commit()
        await self.db.refresh(tc)
        logger.info("trusted_caller_added user_id=%s contact_id=%s", user_id, contact_id)
        return tc

    async def remove_trust(self, user_id: UUID, contact_id: UUID) -> None:
        contact = await self._get_owned_contact(user_id, contact_id)
        result = await self.db.execute(
            select(TrustedCaller).where(
                TrustedCaller.user_id == user_id,
                TrustedCaller.contact_id == contact.id,
                TrustedCaller.trust_status == "active",
            )
        )
        now = datetime.now(timezone.utc)
        for tc in result.scalars().all():
            tc.trust_status = "removed"
            tc.updated_at = now
        contact.is_trusted = False
        contact.updated_at = now
        await self.db.commit()
        logger.info("trusted_caller_removed user_id=%s contact_id=%s", user_id, contact_id)

    async def bulk_add_trust(
        self,
        user_id: UUID,
        contact_ids: List[UUID],
        relationship: Optional[str] = None,
    ) -> int:
        added = 0
        for cid in contact_ids:
            try:
                await self.add_trust(user_id, cid, relationship=relationship)
                added += 1
            except ValueError:
                continue
            except LookupError:
                continue
        return added

    async def bulk_remove_trust(self, user_id: UUID, contact_ids: List[UUID]) -> int:
        removed = 0
        for cid in contact_ids:
            try:
                await self.remove_trust(user_id, cid)
                removed += 1
            except LookupError:
                continue
        return removed

    async def list_trusted(self, user_id: UUID) -> List[Dict[str, Any]]:
        result = await self.db.execute(
            select(TrustedCaller, UserContact)
            .join(UserContact, TrustedCaller.contact_id == UserContact.id)
            .where(
                TrustedCaller.user_id == user_id,
                TrustedCaller.trust_status == "active",
            )
            .order_by(UserContact.display_name.asc())
        )
        out = []
        for tc, contact in result.all():
            out.append(
                {
                    "id": str(tc.id),
                    "contact_id": str(contact.id),
                    "name": contact.display_name,
                    "phone": contact.primary_phone,
                    "normalized_phone": tc.normalized_phone,
                    "relationship": tc.relationship or contact.relationship,
                    "notes": tc.notes,
                    "source": contact.source,
                    "photo_url": contact.photo_url,
                    "source_contact_deleted": contact.source_contact_deleted,
                }
            )
        return out

    async def create_manual_trusted(
        self,
        user_id: UUID,
        name: str,
        phone: str,
        relationship: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        normalized = normalize_phone(phone)
        if not normalized:
            raise ValueError(SENIOR_ERRORS["phone_invalid"])

        # Duplicate check
        dup = await self.db.execute(
            select(TrustedCaller).where(
                TrustedCaller.user_id == user_id,
                TrustedCaller.normalized_phone == normalized,
                TrustedCaller.trust_status == "active",
            )
        )
        if dup.scalar_one_or_none():
            raise ValueError(SENIOR_ERRORS["duplicate_trusted"])

        display = sanitize_input(name, max_length=512) or "Unknown"
        contact = UserContact(
            id=uuid4(),
            user_id=user_id,
            display_name=display,
            primary_phone=phone.strip(),
            normalized_phone=normalized,
            additional_phone_numbers=[{"raw": phone.strip(), "normalized": normalized}],
            source="manual",
            is_trusted=True,
            relationship=relationship,
        )
        self.db.add(contact)
        await self.db.flush()

        tc = TrustedCaller(
            id=uuid4(),
            user_id=user_id,
            contact_id=contact.id,
            normalized_phone=normalized,
            trust_status="active",
            relationship=relationship,
            notes=sanitize_input(notes or "", max_length=2000) or None,
        )
        self.db.add(tc)
        await self.db.commit()
        await self.db.refresh(contact)
        await self.db.refresh(tc)
        return {
            "contact_id": str(contact.id),
            "trusted_caller_id": str(tc.id),
            "name": contact.display_name,
            "normalized_phone": normalized,
            "relationship": relationship,
        }

    async def _get_owned_contact(self, user_id: UUID, contact_id: UUID) -> UserContact:
        result = await self.db.execute(
            select(UserContact).where(
                UserContact.id == contact_id,
                UserContact.user_id == user_id,
                UserContact.merged_into_contact_id.is_(None),
            )
        )
        contact = result.scalar_one_or_none()
        if not contact:
            raise LookupError(SENIOR_ERRORS["not_found"])
        return contact


async def is_trusted_caller(
    db: AsyncSession, user_id: UUID, incoming_phone: Optional[str]
) -> Dict[str, Any]:
    return await TrustedCallerService(db).is_trusted_caller(user_id, incoming_phone)
