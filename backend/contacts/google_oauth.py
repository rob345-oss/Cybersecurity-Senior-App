"""Google Contacts OAuth and People API client.

Tokens are encrypted at rest and never returned to the frontend.
"""

from __future__ import annotations

import logging
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID, uuid4
from urllib.parse import urlencode

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.contacts.constants import GOOGLE_CONTACTS_SCOPE, SENIOR_ERRORS
from backend.database.models import GoogleContactsConnection, OAuthState
from backend.storage.encryption import decrypt_sensitive_field, encrypt_sensitive_field

logger = logging.getLogger(__name__)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
PEOPLE_CONNECTIONS_URL = "https://people.googleapis.com/v1/people/me/connections"

TOKEN_REFRESH_SKEW_SECONDS = 60
OAUTH_STATE_TTL_MINUTES = 15


def _client_id() -> Optional[str]:
    return os.getenv("GOOGLE_CLIENT_ID") or None


def _client_secret() -> Optional[str]:
    return os.getenv("GOOGLE_CLIENT_SECRET") or None


def _redirect_uri() -> Optional[str]:
    return os.getenv("GOOGLE_CONTACTS_REDIRECT_URI") or None


def _frontend_contacts_url() -> str:
    base = os.getenv("NEXT_PUBLIC_APP_URL") or os.getenv("FRONTEND_URL") or "http://localhost:3000"
    return f"{base.rstrip('/')}/dashboard/contacts"


def google_contacts_configured() -> bool:
    return bool(_client_id() and _client_secret() and _redirect_uri())


async def create_oauth_state(db: AsyncSession, user_id: UUID) -> str:
    state = secrets.token_urlsafe(32)
    row = OAuthState(
        id=uuid4(),
        state=state,
        user_id=user_id,
        provider="google_contacts",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=OAUTH_STATE_TTL_MINUTES),
    )
    db.add(row)
    await db.commit()
    return state


async def consume_oauth_state(db: AsyncSession, state: str) -> Optional[UUID]:
    result = await db.execute(
        select(OAuthState).where(
            OAuthState.state == state,
            OAuthState.provider == "google_contacts",
        )
    )
    row = result.scalar_one_or_none()
    if not row:
        return None
    now = datetime.now(timezone.utc)
    if row.used_at is not None:
        return None
    expires = row.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < now:
        return None
    row.used_at = now
    await db.commit()
    return row.user_id


def build_authorize_url(state: str) -> str:
    if not google_contacts_configured():
        raise RuntimeError(SENIOR_ERRORS["not_configured"])

    params = {
        "client_id": _client_id(),
        "redirect_uri": _redirect_uri(),
        "response_type": "code",
        "scope": GOOGLE_CONTACTS_SCOPE,
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "false",
        "state": state,
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


async def exchange_code_for_tokens(code: str) -> Dict[str, Any]:
    if not google_contacts_configured():
        raise RuntimeError(SENIOR_ERRORS["not_configured"])

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": _client_id(),
                "client_secret": _client_secret(),
                "redirect_uri": _redirect_uri(),
                "grant_type": "authorization_code",
            },
        )
    if response.status_code != 200:
        logger.warning("Google token exchange failed status=%s", response.status_code)
        raise RuntimeError(SENIOR_ERRORS["google_denied"])
    return response.json()


async def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": _client_id(),
                "client_secret": _client_secret(),
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
    if response.status_code != 200:
        logger.warning("Google token refresh failed status=%s", response.status_code)
        raise RuntimeError("invalid_grant")
    return response.json()


async def fetch_google_account_email(access_token: str) -> Optional[str]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if response.status_code != 200:
        return None
    data = response.json()
    return data.get("email")


async def get_or_create_connection(
    db: AsyncSession, user_id: UUID
) -> GoogleContactsConnection:
    result = await db.execute(
        select(GoogleContactsConnection).where(GoogleContactsConnection.user_id == user_id)
    )
    conn = result.scalar_one_or_none()
    if conn:
        return conn
    conn = GoogleContactsConnection(
        id=uuid4(),
        user_id=user_id,
        status="disconnected",
        scopes="",
    )
    db.add(conn)
    await db.commit()
    await db.refresh(conn)
    return conn


async def store_tokens(
    db: AsyncSession,
    user_id: UUID,
    token_payload: Dict[str, Any],
    account_email: Optional[str] = None,
) -> GoogleContactsConnection:
    conn = await get_or_create_connection(db, user_id)
    access_token = token_payload.get("access_token")
    refresh_token = token_payload.get("refresh_token")
    expires_in = int(token_payload.get("expires_in") or 3600)
    scope = token_payload.get("scope") or GOOGLE_CONTACTS_SCOPE

    if access_token:
        conn.access_token_encrypted = encrypt_sensitive_field(access_token)
        conn.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    if refresh_token:
        conn.refresh_token_encrypted = encrypt_sensitive_field(refresh_token)
    if account_email:
        conn.google_account_email_encrypted = encrypt_sensitive_field(account_email)

    conn.scopes = scope
    conn.status = "connected"
    conn.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(conn)
    logger.info("google_contacts_connected user_id=%s", user_id)
    return conn


async def mark_needs_reconnect(db: AsyncSession, user_id: UUID) -> None:
    result = await db.execute(
        select(GoogleContactsConnection).where(GoogleContactsConnection.user_id == user_id)
    )
    conn = result.scalar_one_or_none()
    if not conn:
        return
    conn.status = "needs_reconnect"
    conn.updated_at = datetime.now(timezone.utc)
    await db.commit()
    logger.info("google_contacts_needs_reconnect user_id=%s", user_id)


async def disconnect_google(db: AsyncSession, user_id: UUID) -> None:
    result = await db.execute(
        select(GoogleContactsConnection).where(GoogleContactsConnection.user_id == user_id)
    )
    conn = result.scalar_one_or_none()
    if not conn:
        return
    conn.refresh_token_encrypted = None
    conn.access_token_encrypted = None
    conn.token_expires_at = None
    conn.sync_cursor = None
    conn.status = "disconnected"
    conn.updated_at = datetime.now(timezone.utc)
    await db.commit()
    logger.info("google_contacts_disconnected user_id=%s", user_id)


async def get_valid_access_token(
    db: AsyncSession, user_id: UUID
) -> Tuple[Optional[str], Optional[GoogleContactsConnection]]:
    result = await db.execute(
        select(GoogleContactsConnection).where(GoogleContactsConnection.user_id == user_id)
    )
    conn = result.scalar_one_or_none()
    if not conn or conn.status == "disconnected":
        return None, conn

    access = (
        decrypt_sensitive_field(conn.access_token_encrypted)
        if conn.access_token_encrypted
        else None
    )
    refresh = (
        decrypt_sensitive_field(conn.refresh_token_encrypted)
        if conn.refresh_token_encrypted
        else None
    )

    expires_at = conn.token_expires_at
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    needs_refresh = (
        not access
        or not expires_at
        or expires_at <= datetime.now(timezone.utc) + timedelta(seconds=TOKEN_REFRESH_SKEW_SECONDS)
    )

    if needs_refresh:
        if not refresh:
            await mark_needs_reconnect(db, user_id)
            return None, conn
        try:
            payload = await refresh_access_token(refresh)
            access = payload.get("access_token")
            if not access:
                await mark_needs_reconnect(db, user_id)
                return None, conn
            conn.access_token_encrypted = encrypt_sensitive_field(access)
            expires_in = int(payload.get("expires_in") or 3600)
            conn.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            if payload.get("refresh_token"):
                conn.refresh_token_encrypted = encrypt_sensitive_field(payload["refresh_token"])
            conn.status = "connected"
            conn.updated_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(conn)
        except RuntimeError:
            await mark_needs_reconnect(db, user_id)
            return None, conn

    return access, conn


async def list_people_connections(access_token: str) -> List[Dict[str, Any]]:
    """Fetch all Google contacts via People API (paginated)."""
    people: List[Dict[str, Any]] = []
    page_token: Optional[str] = None

    async with httpx.AsyncClient(timeout=60.0) as client:
        while True:
            params: Dict[str, Any] = {
                "personFields": "names,emailAddresses,phoneNumbers,photos,metadata",
                "pageSize": 1000,
            }
            if page_token:
                params["pageToken"] = page_token

            response = await client.get(
                PEOPLE_CONNECTIONS_URL,
                headers={"Authorization": f"Bearer {access_token}"},
                params=params,
            )
            if response.status_code == 401:
                raise RuntimeError("invalid_grant")
            if response.status_code >= 500:
                raise RuntimeError(SENIOR_ERRORS["google_unavailable"])
            if response.status_code != 200:
                logger.warning("People API error status=%s", response.status_code)
                raise RuntimeError(SENIOR_ERRORS["sync_failed"])

            data = response.json()
            people.extend(data.get("connections") or [])
            page_token = data.get("nextPageToken")
            if not page_token:
                break

    return people


def frontend_redirect(query: str) -> str:
    return f"{_frontend_contacts_url()}?{query}"
