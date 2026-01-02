"""JWT token generation and verification."""

from __future__ import annotations

import os
import sys
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt

# JWT configuration
# For testing, allow a default test key if JWT_SECRET_KEY is not set
# In production, JWT_SECRET_KEY must be set explicitly
def _is_test_environment() -> bool:
    """Check if we're running in a test environment."""
    # Check for pytest in sys.modules (pytest is usually imported before this module)
    if "pytest" in sys.modules:
        return True
    # Check for pytest environment variable
    if os.getenv("PYTEST_CURRENT_TEST"):
        return True
    # Check command line arguments for test-related commands
    if any("test" in arg.lower() or "pytest" in arg.lower() for arg in sys.argv):
        return True
    # Check if any test file is in the call stack (for direct test execution)
    import inspect
    try:
        frame = inspect.currentframe()
        if frame:
            for f in inspect.getouterframes(frame, 0):
                if "test" in f.filename.lower() and f.filename.endswith(".py"):
                    return True
    except Exception:
        pass
    return False

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")
if not JWT_SECRET_KEY:
    if _is_test_environment():
        # Use a default test key for testing environments
        JWT_SECRET_KEY = "test-secret-key-for-testing-only-do-not-use-in-production-" + "x" * 32
        import warnings
        warnings.warn(
            "JWT_SECRET_KEY not set, using test key. This should only happen in test environments.",
            UserWarning
        )
    else:
        raise ValueError(
            "JWT_SECRET_KEY environment variable must be set. "
            "Generate a secure key with: python -c 'import secrets; print(secrets.token_urlsafe(64))'"
        )

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Data to encode in the token (typically {"sub": user_id})
        expires_delta: Optional expiration time delta. If not provided, uses default.
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        data: Data to encode in the token (typically {"sub": user_id})
        
    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token string to verify
        token_type: Expected token type ("access" or "refresh")
        
    Returns:
        Decoded token payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        # Verify token type
        if payload.get("type") != token_type:
            return None
        
        return payload
    except JWTError:
        return None

