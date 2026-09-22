"""Repository for CareCircle trusted contacts and share events."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.care_circle.message_templates import resolve_message
from backend.care_circle.phone_utils import format_phone_for_display, normalize_phone
from backend.care_circle.protected_number import assign_protected_number, get_formatted_protected_number
from backend.database.models import ContactShareEvent, TrustedContact, User
from backend.storage.encryption import get_encryption


class CareCircleRepository:
    """Data access for share onboarding."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.encryption = get_encryption()

    def _encrypt(self, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        return self.encryption.encrypt(value)

    def _decrypt(self, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        return self.encryption.decrypt(value)

    def _user_first_name(self, user: User) -> str:
        full_name = self._decrypt(user.full_name_encrypted)
        if full_name and full_name.strip():
            return full_name.strip().split()[0]
        email = self._decrypt(user.email_encrypted) or ""
        return email.split("@")[0] if email else "Friend"

    def _protected_number(self, user: User) -> Optional[str]:
        if not user.protected_phone_encrypted:
            return None
        return self._decrypt(user.protected_phone_encrypted)

    async def activate_protected_number(self, user: User) -> User:
        if user.protected_phone_encrypted and user.protected_number_activated_at:
            return user

        raw_number = assign_protected_number(user.id)
        user.protected_phone_encrypted = self._encrypt(normalize_phone(raw_number))
        user.protected_number_activated_at = datetime.now(timezone.utc)
        user.share_onboarding_deferred_at = None
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def get_protected_number_info(self, user: User) -> dict:
        raw = self._protected_number(user)
        return {
            "protected_number": raw or "",
            "protected_number_formatted": get_formatted_protected_number(raw) if raw else "",
            "activated_at": user.protected_number_activated_at.isoformat()
            if user.protected_number_activated_at
            else None,
            "onboarding_completed_at": user.share_onboarding_completed_at.isoformat()
            if user.share_onboarding_completed_at
            else None,
            "onboarding_deferred_at": user.share_onboarding_deferred_at.isoformat()
            if user.share_onboarding_deferred_at
            else None,
        }

    async def list_contacts(self, user_id: UUID) -> List[TrustedContact]:
        result = await self.session.execute(
            select(TrustedContact)
            .where(TrustedContact.user_id == user_id)
            .options(selectinload(TrustedContact.share_event))
            .order_by(TrustedContact.created_at.asc())
        )
        return list(result.scalars().all())

    async def get_contact(self, user_id: UUID, contact_id: UUID) -> Optional[TrustedContact]:
        result = await self.session.execute(
            select(TrustedContact)
            .where(TrustedContact.user_id == user_id, TrustedContact.id == contact_id)
            .options(selectinload(TrustedContact.share_event))
        )
        return result.scalar_one_or_none()

    async def create_contact(
        self,
        user: User,
        *,
        first_name: str,
        phone: str,
        relationship: Optional[str],
        is_selected: bool,
    ) -> TrustedContact:
        contact = TrustedContact(
            user_id=user.id,
            first_name_encrypted=self._encrypt(first_name.strip()),
            phone_encrypted=self._encrypt(normalize_phone(phone)),
            relationship_encrypted=self._encrypt(relationship.strip()) if relationship else None,
            is_selected=is_selected,
        )
        self.session.add(contact)
        await self.session.flush()

        share_event = ContactShareEvent(
            user_id=user.id,
            trusted_contact_id=contact.id,
            message_template="default",
            sharing_status="not_started",
        )
        self.session.add(share_event)
        await self.session.commit()
        await self.session.refresh(contact)
        return await self.get_contact(user.id, contact.id)  # type: ignore[return-value]

    async def update_contact(
        self,
        contact: TrustedContact,
        *,
        first_name: Optional[str] = None,
        phone: Optional[str] = None,
        relationship: Optional[str] = None,
        is_selected: Optional[bool] = None,
    ) -> TrustedContact:
        if first_name is not None:
            contact.first_name_encrypted = self._encrypt(first_name.strip())
        if phone is not None:
            contact.phone_encrypted = self._encrypt(normalize_phone(phone))
        if relationship is not None:
            contact.relationship_encrypted = (
                self._encrypt(relationship.strip()) if relationship.strip() else None
            )
        if is_selected is not None:
            contact.is_selected = is_selected
        contact.updated_at = datetime.now(timezone.utc)
        await self.session.commit()
        await self.session.refresh(contact)
        return contact

    async def delete_contact(self, contact: TrustedContact) -> None:
        await self.session.delete(contact)
        await self.session.commit()

    async def bulk_select(self, user_id: UUID, is_selected: bool) -> int:
        result = await self.session.execute(
            update(TrustedContact)
            .where(TrustedContact.user_id == user_id)
            .values(is_selected=is_selected, updated_at=datetime.now(timezone.utc))
        )
        await self.session.commit()
        return result.rowcount or 0

    async def upsert_share_event(
        self,
        user: User,
        contact: TrustedContact,
        *,
        message_template: Optional[str] = None,
        custom_message: Optional[str] = None,
        sharing_status: Optional[str] = None,
        clear_custom_message: bool = False,
    ) -> ContactShareEvent:
        if contact.share_event is None:
            event = ContactShareEvent(
                user_id=user.id,
                trusted_contact_id=contact.id,
                message_template=message_template or "default",
                sharing_status=sharing_status or "not_started",
            )
            self.session.add(event)
        else:
            event = contact.share_event

        if message_template is not None:
            event.message_template = message_template
        if clear_custom_message:
            event.custom_message_encrypted = None
        elif custom_message is not None:
            event.custom_message_encrypted = self._encrypt(custom_message)
        if sharing_status is not None:
            event.sharing_status = sharing_status
            event.last_share_action_at = datetime.now(timezone.utc)

        event.updated_at = datetime.now(timezone.utc)
        await self.session.commit()
        await self.session.refresh(event)
        return event

    def serialize_contact(self, user: User, contact: TrustedContact) -> dict:
        phone = self._decrypt(contact.phone_encrypted) or ""
        first_name = self._decrypt(contact.first_name_encrypted) or ""
        relationship = self._decrypt(contact.relationship_encrypted)
        protected_number = self._protected_number(user) or ""
        protected_formatted = (
            get_formatted_protected_number(protected_number) if protected_number else ""
        )

        share_data = None
        if contact.share_event:
            event = contact.share_event
            custom = self._decrypt(event.custom_message_encrypted)
            template = event.message_template or "default"
            preview = resolve_message(
                user_first_name=self._user_first_name(user),
                contact_first_name=first_name,
                protected_number=protected_formatted or protected_number,
                template=template,  # type: ignore[arg-type]
                custom_message=custom,
            )
            share_data = {
                "message_template": template,
                "custom_message": custom,
                "message_preview": preview,
                "sharing_status": event.sharing_status,
                "last_share_action_at": event.last_share_action_at.isoformat()
                if event.last_share_action_at
                else None,
            }

        return {
            "id": contact.id,
            "first_name": first_name,
            "phone": phone,
            "phone_formatted": format_phone_for_display(phone),
            "relationship": relationship,
            "is_selected": contact.is_selected,
            "share_event": share_data,
            "created_at": contact.created_at.isoformat(),
            "updated_at": contact.updated_at.isoformat(),
        }

    async def get_summary(self, user: User) -> dict:
        contacts = await self.list_contacts(user.id)
        selected = [c for c in contacts if c.is_selected]
        prepared = 0
        opened = 0
        confirmed = 0

        for contact in selected:
            if not contact.share_event:
                continue
            status = contact.share_event.sharing_status
            if status in ("prepared", "share_opened", "user_confirmed_shared"):
                prepared += 1
            if status in ("share_opened", "user_confirmed_shared"):
                opened += 1
            if status == "user_confirmed_shared":
                confirmed += 1

        raw = self._protected_number(user)
        remaining = sum(
            1
            for c in selected
            if not c.share_event
            or c.share_event.sharing_status != "user_confirmed_shared"
        )

        return {
            "protected_number_formatted": get_formatted_protected_number(raw) if raw else None,
            "total_contacts": len(contacts),
            "selected_contacts": len(selected),
            "prepared_count": prepared,
            "share_opened_count": opened,
            "user_confirmed_shared_count": confirmed,
            "remaining_contacts": remaining,
            "onboarding_completed": user.share_onboarding_completed_at is not None,
            "onboarding_deferred": user.share_onboarding_deferred_at is not None
            and user.share_onboarding_completed_at is None,
        }

    async def complete_onboarding(self, user: User) -> User:
        user.share_onboarding_completed_at = datetime.now(timezone.utc)
        user.share_onboarding_deferred_at = None
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def defer_onboarding(self, user: User) -> User:
        user.share_onboarding_deferred_at = datetime.now(timezone.utc)
        await self.session.commit()
        await self.session.refresh(user)
        return user
