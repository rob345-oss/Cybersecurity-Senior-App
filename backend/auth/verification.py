"""Email verification token generation and hashing."""

from __future__ import annotations

import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

# Email verification token expiration (hours)
VERIFICATION_EXPIRY_HOURS = int(os.getenv("EMAIL_VERIFICATION_EXPIRY_HOURS", "24"))


def generate_verification_token() -> str:
    """
    Generate a cryptographically secure random token for email verification.
    
    Returns:
        Random token string (32 bytes, base64 encoded = 44 characters)
    """
    return secrets.token_urlsafe(32)


def hash_verification_token(token: str) -> str:
    """
    Hash a verification token using SHA-256.
    Store only the hash in the database for security.
    
    Args:
        token: Plain text verification token
        
    Returns:
        SHA-256 hash of the token (hex digest, 64 characters)
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def verify_verification_token(token: str, token_hash: str) -> bool:
    """
    Verify a verification token against its hash.
    
    Args:
        token: Plain text token to verify
        token_hash: Stored hash to compare against
        
    Returns:
        True if token matches hash, False otherwise
    """
    computed_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    return secrets.compare_digest(computed_hash, token_hash)


def get_verification_expiry() -> datetime:
    """
    Get the expiration datetime for a verification token.
    
    Returns:
        Datetime when the token will expire
    """
    return datetime.now(timezone.utc) + timedelta(hours=VERIFICATION_EXPIRY_HOURS)

