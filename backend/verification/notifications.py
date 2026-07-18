"""Notification service interface and adapters for Trusted Contact Verification."""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional, Protocol
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.models import InAppNotification

logger = logging.getLogger(__name__)


class NotificationService(Protocol):
    """Protocol for multi-channel notifications."""

    async def notify_in_app(
        self,
        user_id: UUID,
        *,
        type: str,
        title: str,
        body: str,
        payload: Optional[Dict[str, Any]] = None,
    ) -> InAppNotification: ...

    async def notify_email(
        self,
        to_email: str,
        *,
        subject: str,
        body: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None: ...

    async def notify_sms(
        self,
        to_phone: str,
        *,
        body: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None: ...


class SendGridEmailAdapter:
    """SendGrid adapter stub — logs when not configured."""

    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key or os.getenv("SENDGRID_API_KEY")

    async def send(self, to_email: str, subject: str, body: str) -> None:
        if not self.api_key:
            logger.info(
                "SendGridEmailAdapter: SENDGRID_API_KEY not configured; "
                "skipping email to %s subject=%s",
                to_email,
                subject,
            )
            return
        # Live SendGrid delivery is intentionally not wired in this release.
        logger.info(
            "SendGridEmailAdapter: would send email to %s subject=%s",
            to_email,
            subject,
        )


class TwilioSmsAdapter:
    """Twilio SMS adapter stub — logs when not configured."""

    def __init__(
        self,
        account_sid: Optional[str] = None,
        auth_token: Optional[str] = None,
        from_number: Optional[str] = None,
    ) -> None:
        self.account_sid = account_sid or os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = auth_token or os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = from_number or os.getenv("TWILIO_FROM_NUMBER")

    async def send(self, to_phone: str, body: str) -> None:
        if not (self.account_sid and self.auth_token and self.from_number):
            logger.info(
                "TwilioSmsAdapter: Twilio credentials not configured; "
                "skipping SMS to %s",
                to_phone,
            )
            return
        logger.info("TwilioSmsAdapter: would send SMS to %s", to_phone)


class CompositeNotificationService:
    """In-app notifications with optional email/SMS adapters."""

    def __init__(
        self,
        session: AsyncSession,
        email_adapter: Optional[SendGridEmailAdapter] = None,
        sms_adapter: Optional[TwilioSmsAdapter] = None,
    ) -> None:
        self.session = session
        self.email_adapter = email_adapter or SendGridEmailAdapter()
        self.sms_adapter = sms_adapter or TwilioSmsAdapter()

    async def notify_in_app(
        self,
        user_id: UUID,
        *,
        type: str,
        title: str,
        body: str,
        payload: Optional[Dict[str, Any]] = None,
    ) -> InAppNotification:
        notification = InAppNotification(
            user_id=user_id,
            type=type,
            title=title,
            body=body,
            payload=payload or {},
        )
        self.session.add(notification)
        await self.session.commit()
        await self.session.refresh(notification)
        logger.info(
            "In-app notification created id=%s user_id=%s type=%s",
            notification.id,
            user_id,
            type,
        )
        return notification

    async def notify_email(
        self,
        to_email: str,
        *,
        subject: str,
        body: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        await self.email_adapter.send(to_email, subject, body)

    async def notify_sms(
        self,
        to_phone: str,
        *,
        body: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        await self.sms_adapter.send(to_phone, body)
