"""SQLAlchemy database models."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
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
    
    # Authentication fields
    password_hash = Column(String(255), nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    email_verifications = relationship("EmailVerification", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email_verified={self.email_verified})>"


class EmailVerification(Base):
    """Email verification token model."""

    __tablename__ = "email_verifications"

    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(PostgresUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Token is hashed before storage (SHA-256 hash)
    token_hash = Column(String(64), nullable=False, unique=True, index=True)
    
    # Expiration
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # Usage tracking
    used_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="email_verifications")

    def __repr__(self) -> str:
        return f"<EmailVerification(id={self.id}, user_id={self.user_id}, used={self.used_at is not None})>"

