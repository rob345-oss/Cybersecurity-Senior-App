"""Google OAuth ID token verification."""

from __future__ import annotations

import os

from fastapi import HTTPException, status
from google.auth.transport import requests
from google.oauth2 import id_token


def verify_google_id_token(token: str) -> dict:
    """
    Verify a Google ID token and return its claims.

    Raises:
        HTTPException: If Google OAuth is not configured or the token is invalid.
    """
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign-in is not configured on the server",
        )

    try:
        return id_token.verify_oauth2_token(token, requests.Request(), client_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google sign-in token",
        ) from exc
