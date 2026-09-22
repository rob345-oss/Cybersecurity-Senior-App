"""Duplicate contact detection — never silently merges."""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID, uuid4

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.models import ContactDuplicateSuggestion, UserContact

logger = logging.getLogger(__name__)


def _norm_name(name: Optional[str]) -> str:
    if not name:
        return ""
    return re.sub(r"[^a-z0-9 ]", "", name.lower()).strip()


def _name_tokens(name: Optional[str]) -> List[str]:
    return [t for t in _norm_name(name).split() if t and len(t) > 1]


def _names_similar(a: Optional[str], b: Optional[str]) -> bool:
    na, nb = _norm_name(a).replace(" ", ""), _norm_name(b).replace(" ", "")
    if not na or not nb:
        return False
    if na == nb:
        return True
    if na in nb or nb in na:
        return True
    # Token overlap (handles middle initials like "Robert J Smith")
    ta, tb = set(_name_tokens(a)), set(_name_tokens(b))
    if not ta or not tb:
        return False
    return ta.issubset(tb) or tb.issubset(ta)


def _ordered_pair(a: UUID, b: UUID) -> Tuple[UUID, UUID]:
    return (a, b) if str(a) < str(b) else (b, a)


async def refresh_duplicate_suggestions(db: AsyncSession, user_id: UUID) -> int:
    """Scan contacts and upsert pending duplicate suggestions. Returns new pending count."""
    result = await db.execute(
        select(UserContact).where(
            UserContact.user_id == user_id,
            UserContact.merged_into_contact_id.is_(None),
        )
    )
    contacts = list(result.scalars().all())

    # Index by phone / email / google id
    by_phone: Dict[str, List[UserContact]] = {}
    by_email: Dict[str, List[UserContact]] = {}
    by_google: Dict[str, List[UserContact]] = {}

    for c in contacts:
        if c.normalized_phone:
            by_phone.setdefault(c.normalized_phone, []).append(c)
        for extra in c.additional_phone_numbers or []:
            n = extra.get("normalized") if isinstance(extra, dict) else None
            if n:
                by_phone.setdefault(n, []).append(c)
        if c.email:
            by_email.setdefault(c.email.lower().strip(), []).append(c)
        if c.google_contact_id:
            by_google.setdefault(c.google_contact_id, []).append(c)

    candidates: Dict[Tuple[UUID, UUID], str] = {}

    def add_pair(a: UserContact, b: UserContact, reason: str) -> None:
        if a.id == b.id:
            return
        pair = _ordered_pair(a.id, b.id)
        candidates.setdefault(pair, reason)

    for group in by_phone.values():
        for i, a in enumerate(group):
            for b in group[i + 1 :]:
                if _names_similar(a.display_name, b.display_name) or True:
                    # Same normalized phone is enough to suggest review
                    reason = "same_phone"
                    if _names_similar(a.display_name, b.display_name):
                        reason = "same_phone_similar_name"
                    add_pair(a, b, reason)

    for group in by_email.values():
        for i, a in enumerate(group):
            for b in group[i + 1 :]:
                add_pair(a, b, "same_email")

    for group in by_google.values():
        for i, a in enumerate(group):
            for b in group[i + 1 :]:
                add_pair(a, b, "same_google_id")

    # Load existing suggestions
    existing_result = await db.execute(
        select(ContactDuplicateSuggestion).where(
            ContactDuplicateSuggestion.user_id == user_id
        )
    )
    existing = {
        (s.contact_id_a, s.contact_id_b): s for s in existing_result.scalars().all()
    }

    created = 0
    now = datetime.now(timezone.utc)
    active_candidate_keys = set(candidates.keys())
    for (id_a, id_b), reason in candidates.items():
        key = (id_a, id_b)
        if key in existing:
            sug = existing[key]
            if sug.status == "dismissed":
                continue
            if sug.status == "merged":
                continue
            sug.reason = reason
            sug.status = "pending"
            sug.updated_at = now
            continue
        db.add(
            ContactDuplicateSuggestion(
                id=uuid4(),
                user_id=user_id,
                contact_id_a=id_a,
                contact_id_b=id_b,
                reason=reason,
                status="pending",
            )
        )
        created += 1

    # Clear stale pending suggestions that are no longer duplicate candidates
    # (including pairs that reference a contact already merged away).
    for key, sug in existing.items():
        if sug.status != "pending":
            continue
        if key in active_candidate_keys:
            continue
        sug.status = "dismissed"
        sug.updated_at = now

    await db.commit()
    pending_count_result = await db.execute(
        select(ContactDuplicateSuggestion).where(
            ContactDuplicateSuggestion.user_id == user_id,
            ContactDuplicateSuggestion.status == "pending",
        )
    )
    return len(list(pending_count_result.scalars().all()))


async def list_pending_duplicates(
    db: AsyncSession, user_id: UUID
) -> List[Dict[str, Any]]:
    result = await db.execute(
        select(ContactDuplicateSuggestion).where(
            ContactDuplicateSuggestion.user_id == user_id,
            ContactDuplicateSuggestion.status == "pending",
        )
    )
    suggestions = list(result.scalars().all())
    if not suggestions:
        return []

    contact_ids = {s.contact_id_a for s in suggestions} | {s.contact_id_b for s in suggestions}
    contacts_result = await db.execute(
        select(UserContact).where(
            UserContact.user_id == user_id,
            UserContact.id.in_(contact_ids),
        )
    )
    by_id = {c.id: c for c in contacts_result.scalars().all()}

    out: List[Dict[str, Any]] = []
    for s in suggestions:
        a = by_id.get(s.contact_id_a)
        b = by_id.get(s.contact_id_b)
        if not a or not b:
            continue
        out.append(
            {
                "id": str(s.id),
                "reason": s.reason,
                "contact_a": _contact_brief(a),
                "contact_b": _contact_brief(b),
            }
        )
    return out


def _contact_brief(c: UserContact) -> Dict[str, Any]:
    return {
        "id": str(c.id),
        "display_name": c.display_name,
        "primary_phone": c.primary_phone,
        "normalized_phone": c.normalized_phone,
        "email": c.email,
        "photo_url": c.photo_url,
        "source": c.source,
        "is_trusted": c.is_trusted,
    }


async def merge_contacts(
    db: AsyncSession,
    user_id: UUID,
    suggestion_id: UUID,
    keep_contact_id: UUID,
) -> UserContact:
    """Explicit user-approved merge. Marks the other contact as merged."""
    result = await db.execute(
        select(ContactDuplicateSuggestion).where(
            ContactDuplicateSuggestion.id == suggestion_id,
            ContactDuplicateSuggestion.user_id == user_id,
            ContactDuplicateSuggestion.status == "pending",
        )
    )
    suggestion = result.scalar_one_or_none()
    if not suggestion:
        raise LookupError("duplicate_not_found")

    ids = {suggestion.contact_id_a, suggestion.contact_id_b}
    if keep_contact_id not in ids:
        raise ValueError("keep_contact_must_be_in_pair")

    drop_id = (ids - {keep_contact_id}).pop()

    contacts_result = await db.execute(
        select(UserContact).where(
            UserContact.user_id == user_id,
            UserContact.id.in_([keep_contact_id, drop_id]),
        )
    )
    contacts = {c.id: c for c in contacts_result.scalars().all()}
    keep = contacts.get(keep_contact_id)
    drop = contacts.get(drop_id)
    if not keep or not drop:
        raise LookupError("contact_not_found")

    # Merge missing fields into keep
    if not keep.email and drop.email:
        keep.email = drop.email
    if not keep.photo_url and drop.photo_url:
        keep.photo_url = drop.photo_url
    if not keep.relationship and drop.relationship:
        keep.relationship = drop.relationship
    if keep.is_trusted or drop.is_trusted:
        keep.is_trusted = True

    # Merge phone lists
    phones = list(keep.additional_phone_numbers or [])
    existing_norms = {
        p.get("normalized") for p in phones if isinstance(p, dict)
    }
    if keep.normalized_phone:
        existing_norms.add(keep.normalized_phone)
    for p in drop.additional_phone_numbers or []:
        if isinstance(p, dict) and p.get("normalized") not in existing_norms:
            phones.append(p)
            existing_norms.add(p.get("normalized"))
    if drop.normalized_phone and drop.normalized_phone not in existing_norms:
        phones.append(
            {"raw": drop.primary_phone, "normalized": drop.normalized_phone}
        )
    keep.additional_phone_numbers = phones
    if not keep.normalized_phone and drop.normalized_phone:
        keep.normalized_phone = drop.normalized_phone
        keep.primary_phone = drop.primary_phone

    drop.merged_into_contact_id = keep.id
    drop.updated_at = datetime.now(timezone.utc)
    keep.updated_at = datetime.now(timezone.utc)

    # Preserve Google identity on the surviving contact so the next sync updates
    # the keeper instead of inserting a duplicate that hits UNIQUE(user_id, google_contact_id).
    if drop.google_contact_id:
        if not keep.google_contact_id:
            keep.google_contact_id = drop.google_contact_id
            if keep.source == "manual":
                keep.source = drop.source or keep.source
        drop.google_contact_id = None

    # Move trusted_caller rows from drop to keep, keeping a single active row.
    from backend.database.models import TrustedCaller

    keep_tc_result = await db.execute(
        select(TrustedCaller).where(
            TrustedCaller.user_id == user_id,
            TrustedCaller.contact_id == keep.id,
            TrustedCaller.trust_status == "active",
        )
    )
    keep_active = list(keep_tc_result.scalars().all())
    primary_tc = keep_active[0] if keep_active else None
    for extra in keep_active[1:]:
        extra.trust_status = "removed"
        extra.updated_at = datetime.now(timezone.utc)

    tc_result = await db.execute(
        select(TrustedCaller).where(
            TrustedCaller.user_id == user_id,
            TrustedCaller.contact_id == drop.id,
            TrustedCaller.trust_status == "active",
        )
    )
    for tc in tc_result.scalars().all():
        if primary_tc is None:
            tc.contact_id = keep.id
            if keep.normalized_phone:
                tc.normalized_phone = keep.normalized_phone
            tc.updated_at = datetime.now(timezone.utc)
            primary_tc = tc
        else:
            tc.trust_status = "removed"
            tc.updated_at = datetime.now(timezone.utc)

    if primary_tc and keep.normalized_phone:
        primary_tc.normalized_phone = keep.normalized_phone
        primary_tc.contact_id = keep.id
        primary_tc.updated_at = datetime.now(timezone.utc)

    suggestion.status = "merged"
    suggestion.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(keep)
    logger.info(
        "contacts_merged user_id=%s keep=%s drop=%s", user_id, keep.id, drop.id
    )
    return keep
