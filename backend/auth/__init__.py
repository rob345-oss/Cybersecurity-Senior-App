"""Authentication package for JWT, password hashing, and user authentication."""

from backend.auth.dependencies import get_current_user
from backend.auth.jwt_handler import create_access_token, create_refresh_token, verify_token
from backend.auth.password import verify_password, get_password_hash

__all__ = [
    "get_current_user",
    "create_access_token",
    "create_refresh_token",
    "verify_token",
    "verify_password",
    "get_password_hash",
]

