"""Database package for SQLAlchemy models and connection management."""

from backend.database.connection import get_db, init_db
from backend.database.models import (
    EmailVerification,
    InAppNotification,
    TrustedContact,
    TrustedVerificationRequest,
    User,
)

__all__ = [
    "get_db",
    "init_db",
    "User",
    "EmailVerification",
    "TrustedContact",
    "TrustedVerificationRequest",
    "InAppNotification",
]
