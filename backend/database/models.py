"""SQLAlchemy database models."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PostgresUUID
from sqlalchemy.orm import relationship

from backend.database.connection import Base


class User(Base):
    """User model with encrypted PII fields."""

    __tablename__ = "users"

    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)

    # Encrypted PII fields (stored as encrypted strings)
    email_encrypted = Column(String(512), unique=True, nullable=False, index=True)
    full_name_encrypted = Column(String(512), nullable=True)
    phone_encrypted = Column(String(512), nullable=True)

    # Authentication fields
    password_hash = Column(String(255), nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    email_verifications = relationship(
        "EmailVerification", back_populates="user", cascade="all, delete-orphan"
    )
    trusted_contacts_owned = relationship(
        "TrustedContact",
        back_populates="owner",
        foreign_keys="TrustedContact.user_id",
        cascade="all, delete-orphan",
    )
    trusted_contact_memberships = relationship(
        "TrustedContact",
        back_populates="contact_user",
        foreign_keys="TrustedContact.contact_user_id",
        cascade="all, delete-orphan",
    )
    verification_requests = relationship(
        "TrustedVerificationRequest",
        back_populates="submitter",
        foreign_keys="TrustedVerificationRequest.user_id",
        cascade="all, delete-orphan",
    )
    in_app_notifications = relationship(
        "InAppNotification",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email_verified={self.email_verified})>"


class EmailVerification(Base):
    """Email verification token model."""

    __tablename__ = "email_verifications"

    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Token is hashed before storage (SHA-256 hash)
    token_hash = Column(String(64), nullable=False, unique=True, index=True)

    # Expiration
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)

    # Usage tracking
    used_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="email_verifications")

    def __repr__(self) -> str:
        return (
            f"<EmailVerification(id={self.id}, user_id={self.user_id}, "
            f"used={self.used_at is not None})>"
        )


class TrustedContact(Base):
    """Link between a user and a trusted family member / caregiver."""

    __tablename__ = "trusted_contacts"
    __table_args__ = (
        UniqueConstraint("user_id", "contact_user_id", name="uq_trusted_contacts_pair"),
        CheckConstraint(
            "user_id <> contact_user_id", name="ck_trusted_contacts_not_self"
        ),
    )

    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    contact_user_id = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    label = Column(String(100), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    owner = relationship(
        "User", back_populates="trusted_contacts_owned", foreign_keys=[user_id]
    )
    contact_user = relationship(
        "User",
        back_populates="trusted_contact_memberships",
        foreign_keys=[contact_user_id],
    )
    verification_requests = relationship(
        "TrustedVerificationRequest",
        back_populates="trusted_contact",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return (
            f"<TrustedContact(id={self.id}, user_id={self.user_id}, "
            f"contact_user_id={self.contact_user_id})>"
        )


class TrustedVerificationRequest(Base):
    """Suspicious interaction submitted for trusted-contact review."""

    __tablename__ = "trusted_verification_requests"

    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    trusted_contact_id = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("trusted_contacts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    interaction_type = Column(String(50), nullable=False)
    sender_name = Column(String(200), nullable=True)
    sender_contact = Column(String(200), nullable=True)
    description = Column(Text, nullable=False)
    requested_action = Column(Text, nullable=True)
    amount_requested = Column(Numeric(12, 2), nullable=True)
    screenshot_url = Column(String(1024), nullable=True)
    risk_score = Column(Integer, nullable=True)
    risk_reasons: Any = Column(JSONB, nullable=False, default=list)
    status = Column(String(50), nullable=False, default="pending", index=True)
    reviewer_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    submitter = relationship(
        "User", back_populates="verification_requests", foreign_keys=[user_id]
    )
    trusted_contact = relationship(
        "TrustedContact", back_populates="verification_requests"
    )

    def __repr__(self) -> str:
        return (
            f"<TrustedVerificationRequest(id={self.id}, status={self.status}, "
            f"risk_score={self.risk_score})>"
        )


class InAppNotification(Base):
    """In-app notification for verification and CareCircle events."""

    __tablename__ = "in_app_notifications"

    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)
    payload: Any = Column(JSONB, nullable=False, default=dict)
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    user = relationship("User", back_populates="in_app_notifications")

    def __repr__(self) -> str:
        return f"<InAppNotification(id={self.id}, type={self.type}, user_id={self.user_id})>"
