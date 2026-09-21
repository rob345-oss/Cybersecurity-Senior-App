"""Google Contacts synchronization into user_contacts.

Does not remove trusted protection when a Google contact temporarily disappears.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.contacts.constants import SENIOR_ERRORS
from backend.contacts.duplicates import refresh_duplicate_suggestions
from backend.contacts.google_oauth import (
    get_valid_access_token,
    list_people_connections,
    mark_needs_reconnect,
)
from backend.contacts.phone import normalize_phone, normalize_phone_list
from backend.database.models import GoogleContactsConnection, UserContact
from backend.utils import sanitize_input

logger = logging.getLogger(__name__)


def _resource_name_to_id(resource_name: Optional[str]) -> Optional[str]:
    if not resource_name:
        return None
    # people/c123...
    if "/" in resource_name:
        return resource_name.split("/", 1)[1]
    return resource_name


def parse_person(person: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Extract display fields from a People API person resource."""
    names = person.get("names") or []
    primary_name = next((n for n in names if n.get("metadata", {}).get("primary")), None)
    name = primary_name or (names[0] if names else {})

    display_name = sanitize_input(
        name.get("displayName")
        or " ".join(
            filter(
                None,
                [name.get("givenName"), name.get("familyName")],
            )
        )
        or "Unknown",
        max_length=512,
    )
    first_name = sanitize_input(name.get("givenName") or "", max_length=256) or None
    last_name = sanitize_input(name.get("familyName") or "", max_length=256) or None

    phones_raw: List[str] = []
    for phone in person.get("phoneNumbers") or []:
        value = phone.get("value") or phone.get("canonicalForm")
        if value:
            phones_raw.append(value)

    emails = person.get("emailAddresses") or []
    primary_email = next((e for e in emails if e.get("metadata", {}).get("primary")), None)
    email_obj = primary_email or (emails[0] if emails else {})
    email = sanitize_input(email_obj.get("value") or "", max_length=512) or None

    photos = person.get("photos") or []
    photo = next((p for p in photos if p.get("metadata", {}).get("primary")), None)
    photo = photo or (photos[0] if photos else {})
    photo_url = photo.get("url") if photo and not photo.get("default") else None

    google_id = _resource_name_to_id(person.get("resourceName"))
    if not google_id:
        return None

    normalized_list = normalize_phone_list(phones_raw)
    primary_display = phones_raw[0] if phones_raw else None
    primary_normalized = normalized_list[0] if normalized_list else None

    additional = [
        {"raw": phones_raw[i] if i < len(phones_raw) else n, "normalized": n}
        for i, n in enumerate(normalized_list)
    ]

    return {
        "google_contact_id": google_id,
        "display_name": display_name,
        "first_name": first_name,
        "last_name": last_name,
        "primary_phone": primary_display,
        "normalized_phone": primary_normalized,
        "additional_phone_numbers": additional,
        "email": email,
        "photo_url": photo_url,
    }


async def sync_google_contacts(db: AsyncSession, user_id: UUID) -> Dict[str, Any]:
    access_token, conn = await get_valid_access_token(db, user_id)
    if not access_token or not conn:
        if conn and conn.status == "needs_reconnect":
            raise RuntimeError(SENIOR_ERRORS["needs_reconnect"])
        raise RuntimeError(SENIOR_ERRORS["needs_reconnect"])

    try:
        people = await list_people_connections(access_token)
    except RuntimeError as exc:
        if str(exc) == "invalid_grant":
            await mark_needs_reconnect(db, user_id)
            raise RuntimeError(SENIOR_ERRORS["needs_reconnect"]) from exc
        raise

    now = datetime.now(timezone.utc)
    seen_google_ids: Set[str] = set()
    created = 0
    updated = 0

    result = await db.execute(
        select(UserContact).where(
            UserContact.user_id == user_id,
            UserContact.source == "google",
            UserContact.merged_into_contact_id.is_(None),
        )
    )
    existing_by_google: Dict[str, UserContact] = {
        c.google_contact_id: c for c in result.scalars().all() if c.google_contact_id
    }

    for person in people:
        parsed = parse_person(person)
        if not parsed:
            continue
        google_id = parsed["google_contact_id"]
        seen_google_ids.add(google_id)

        existing = existing_by_google.get(google_id)
        if existing:
            existing.display_name = parsed["display_name"]
            existing.first_name = parsed["first_name"]
            existing.last_name = parsed["last_name"]
            existing.primary_phone = parsed["primary_phone"]
            existing.normalized_phone = parsed["normalized_phone"]
            existing.additional_phone_numbers = parsed["additional_phone_numbers"]
            existing.email = parsed["email"]
            existing.photo_url = parsed["photo_url"]
            existing.source_contact_deleted = False
            existing.last_synced_at = now
            existing.updated_at = now
            updated += 1
        else:
            contact = UserContact(
                id=uuid4(),
                user_id=user_id,
                google_contact_id=google_id,
                display_name=parsed["display_name"],
                first_name=parsed["first_name"],
                last_name=parsed["last_name"],
                primary_phone=parsed["primary_phone"],
                normalized_phone=parsed["normalized_phone"],
                additional_phone_numbers=parsed["additional_phone_numbers"],
                email=parsed["email"],
                photo_url=parsed["photo_url"],
                source="google",
                is_trusted=False,
                source_contact_deleted=False,
                last_synced_at=now,
            )
            db.add(contact)
            created += 1

    deleted_flagged = 0
    for google_id, contact in existing_by_google.items():
        if google_id not in seen_google_ids and not contact.source_contact_deleted:
            contact.source_contact_deleted = True
            contact.updated_at = now
            deleted_flagged += 1

    conn.last_synced_at = now
    conn.status = "connected"
    conn.updated_at = now
    await db.commit()

    duplicates = await refresh_duplicate_suggestions(db, user_id)

    logger.info(
        "google_contacts_synced user_id=%s created=%s updated=%s deleted_flagged=%s",
        user_id,
        created,
        updated,
        deleted_flagged,
    )

    return {
        "created": created,
        "updated": updated,
        "deleted_flagged": deleted_flagged,
        "total_fetched": len(people),
        "duplicates_found": duplicates,
        "last_synced_at": now.isoformat(),
    }
