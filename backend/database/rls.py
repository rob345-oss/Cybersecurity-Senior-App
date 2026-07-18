"""Helpers for Postgres Row Level Security session context."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def set_current_user_id(session: AsyncSession, user_id: UUID) -> None:
    """
    Set app.current_user_id on the DB session so RLS policies apply.

    Uses session-scoped set_config (is_local=false) so the value survives
    commit boundaries within the same request connection.
    """
    await session.execute(
        text("SELECT set_config('app.current_user_id', :uid, false)"),
        {"uid": str(user_id)},
    )


async def clear_current_user_id(session: AsyncSession) -> None:
    """Clear the RLS user context for the current session."""
    await session.execute(
        text("SELECT set_config('app.current_user_id', '', false)")
    )
