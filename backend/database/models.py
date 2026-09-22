"""SQLAlchemy database models."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PostgresUUID
from sqlalchemy.orm import relationship as sa_relationship

from backend.database.connection import Base


class User(Base):
    """User model with encrypted PII fields."""

    __tablename__ = "users"

    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)

    email_encrypted = Column(String(512), unique=True, nullable=False, index=True)
    full_name_encrypted = Column(String(512), nullable=True)
    phone_encrypted = Column(String(512), nullable=True)

    password_hash = Column(String(255), nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)

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

    email_verifications = sa_relationship(
        "EmailVerification", back_populates="user", cascade="all, delete-orphan"
    )
    google_contacts_connection = sa_relationship(
        "GoogleContactsConnection",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    contacts = sa_relationship(
        "UserContact", back_populates="user", cascade="all, delete-orphan"
    )
    trusted_callers = sa_relationship(
        "TrustedCaller", back_populates="user", cascade="all, delete-orphan"
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
    token_hash = Column(String(64), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = sa_relationship("User", back_populates="email_verifications")

    def __repr__(self) -> str:
        return (
            f"<EmailVerification(id={self.id}, user_id={self.user_id}, "
            f"used={self.used_at is not None})>"
        )


class GoogleContactsConnection(Base):
    """Encrypted Google Contacts OAuth credentials for a user."""

    __tablename__ = "google_contacts_connections"

    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    google_account_email_encrypted = Column(String(512), nullable=True)
    refresh_token_encrypted = Column(Text, nullable=True)
    access_token_encrypted = Column(Text, nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    scopes = Column(String(512), nullable=False, default="")
    status = Column(String(32), nullable=False, default="disconnected")
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    sync_cursor = Column(Text, nullable=True)

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

    user = sa_relationship("User", back_populates="google_contacts_connection")


class UserContact(Base):
    """Imported or manually created contact for a user.

    CareCircle may later reference user_contacts.id. Trusted Caller status and
    CareCircle permissions must remain separate security concepts.
    """

    __tablename__ = "user_contacts"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "google_contact_id", name="uq_user_contacts_google_id"
        ),
        Index("ix_user_contacts_user_normalized_phone", "user_id", "normalized_phone"),
        Index("ix_user_contacts_user_is_trusted", "user_id", "is_trusted"),
        Index("ix_user_contacts_user_google_id", "user_id", "google_contact_id"),
    )

    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    google_contact_id = Column(String(255), nullable=True)
    display_name = Column(String(512), nullable=False, default="")
    first_name = Column(String(256), nullable=True)
    last_name = Column(String(256), nullable=True)
    primary_phone = Column(String(64), nullable=True)
    # Plaintext E.164 for indexed telephony matching (scoped by user_id)
    normalized_phone = Column(String(32), nullable=True, index=True)
    additional_phone_numbers = Column(JSONB, nullable=False, default=list)
    email = Column(String(512), nullable=True)
    photo_url = Column(Text, nullable=True)
    source = Column(String(32), nullable=False, default="manual")
    is_trusted = Column(Boolean, nullable=False, default=False)
    trust_level = Column(String(32), nullable=True)
    relationship = Column(String(64), nullable=True)
    source_contact_deleted = Column(Boolean, nullable=False, default=False)
    merged_into_contact_id = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("user_contacts.id", ondelete="SET NULL"),
        nullable=True,
    )
    last_synced_at = Column(DateTime(timezone=True), nullable=True)

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

    user = sa_relationship("User", back_populates="contacts")
    trusted_caller_records = sa_relationship(
        "TrustedCaller", back_populates="contact", cascade="all, delete-orphan"
    )


class TrustedCaller(Base):
    """Explicit trusted-caller protection linked to a contact."""

    __tablename__ = "trusted_callers"
    __table_args__ = (
        Index(
            "ix_trusted_callers_user_normalized_phone",
            "user_id",
            "normalized_phone",
        ),
        Index("ix_trusted_callers_contact_id", "contact_id"),
    )

    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    contact_id = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("user_contacts.id", ondelete="CASCADE"),
        nullable=False,
    )
    normalized_phone = Column(String(32), nullable=False)
    trust_status = Column(String(32), nullable=False, default="active")
    relationship = Column(String(64), nullable=True)
    notes = Column(Text, nullable=True)

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

    user = sa_relationship("User", back_populates="trusted_callers")
    contact = sa_relationship("UserContact", back_populates="trusted_caller_records")


class ContactDuplicateSuggestion(Base):
    """User-reviewable duplicate contact pairs (never silently merged)."""

    __tablename__ = "contact_duplicate_suggestions"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "contact_id_a",
            "contact_id_b",
            name="uq_contact_duplicate_pair",
        ),
    )

    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    contact_id_a = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("user_contacts.id", ondelete="CASCADE"),
        nullable=False,
    )
    contact_id_b = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("user_contacts.id", ondelete="CASCADE"),
        nullable=False,
    )
    reason = Column(String(128), nullable=False)
    status = Column(String(32), nullable=False, default="pending")

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


class OAuthState(Base):
    """Short-lived CSRF state for Google Contacts OAuth."""

    __tablename__ = "oauth_states"

    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    state = Column(String(128), nullable=False, unique=True, index=True)
    user_id = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    provider = Column(String(64), nullable=False, default="google_contacts")
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
