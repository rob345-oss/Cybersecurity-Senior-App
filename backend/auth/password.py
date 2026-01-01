"""Password hashing and verification using BCrypt."""

from __future__ import annotations

import bcrypt

# BCrypt cost factor (higher = more secure but slower)
# 12 rounds = ~300ms per hash (good balance)
BCRYPT_ROUNDS = 12


def get_password_hash(password: str) -> str:
    """
    Hash a password using BCrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password as string
    """
    # Generate salt and hash password
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: BCrypt hash to verify against
        
    Returns:
        True if password matches, False otherwise
    """
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )

