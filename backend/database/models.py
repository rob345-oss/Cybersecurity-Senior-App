"""SQLAlchemy database models."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
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
    protected_phone_encrypted = Column(String(512), nullable=True)

    # Authentication fields
    password_hash = Column(String(255), nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)

    # Protected number and share onboarding
    protected_number_activated_at = Column(DateTime(timezone=True), nullable=True)
    share_onboarding_completed_at = Column(DateTime(timezone=True), nullable=True)
    share_onboarding_deferred_at = Column(DateTime(timezone=True), nullable=True)

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
    trusted_contacts = relationship(
        "TrustedContact", back_populates="user", cascade="all, delete-orphan"
    )
    contact_share_events = relationship(
        "ContactShareEvent", back_populates="user", cascade="all, delete-orphan"
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
        return f"<EmailVerification(id={self.id}, user_id={self.user_id}, used={self.used_at is not None})>"


class TrustedContact(Base):
    """Trusted contact for CareCircle / share onboarding."""

    __tablename__ = "trusted_contacts"

    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    first_name_encrypted = Column(String(512), nullable=False)
    phone_encrypted = Column(String(512), nullable=False)
    relationship_encrypted = Column(String(512), nullable=True)
    is_selected = Column(Boolean, default=True, nullable=False)

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

    user = relationship("User", back_populates="trusted_contacts")
    share_event = relationship(
        "ContactShareEvent",
        back_populates="trusted_contact",
        cascade="all, delete-orphan",
        uselist=False,
    )

    def __repr__(self) -> str:
        return f"<TrustedContact(id={self.id}, user_id={self.user_id})>"


class ContactShareEvent(Base):
    """Per-contact share onboarding state."""

    __tablename__ = "contact_share_events"
    __table_args__ = (
        UniqueConstraint("trusted_contact_id", name="uq_contact_share_events_trusted_contact"),
    )

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

    message_template = Column(String(32), nullable=False, default="default")
    custom_message_encrypted = Column(String(2048), nullable=True)
    sharing_status = Column(String(32), nullable=False, default="not_started")
    last_share_action_at = Column(DateTime(timezone=True), nullable=True)

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

    user = relationship("User", back_populates="contact_share_events")
    trusted_contact = relationship("TrustedContact", back_populates="share_event")

    def __repr__(self) -> str:
        return f"<ContactShareEvent(id={self.id}, status={self.sharing_status})>"
