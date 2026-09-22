"""Database package for SQLAlchemy models and connection management."""

from backend.database.connection import get_db, init_db
from backend.database.models import (
    User,
    EmailVerification,
    GoogleContactsConnection,
    UserContact,
    TrustedCaller,
    ContactDuplicateSuggestion,
    OAuthState,
)

__all__ = [
    "get_db",
    "init_db",
    "User",
    "EmailVerification",
    "GoogleContactsConnection",
    "UserContact",
    "TrustedCaller",
    "ContactDuplicateSuggestion",
    "OAuthState",
]

