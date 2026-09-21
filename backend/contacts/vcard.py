"""Safe vCard (.vcf) import with preview — never executes file contents."""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from backend.contacts.constants import SENIOR_ERRORS
from backend.contacts.phone import normalize_phone
from backend.database.models import UserContact
from backend.utils import sanitize_input

logger = logging.getLogger(__name__)

MAX_VCARD_BYTES = 2 * 1024 * 1024  # 2 MB
MAX_CONTACTS_PER_IMPORT = 2000


def _unfold(text: str) -> str:
    # RFC 6350 line unfolding
    return re.sub(r"\r\n[ \t]|\n[ \t]", "", text.replace("\r\n", "\n"))


def _parse_property_line(line: str) -> Tuple[str, Dict[str, str], str]:
    """Parse NAME;PARAM=VAL:value into (name, params, value)."""
    if ":" not in line:
        return "", {}, ""
    left, value = line.split(":", 1)
    parts = left.split(";")
    name = parts[0].upper()
    # Strip group prefix FOO.TEL
    if "." in name:
        name = name.split(".", 1)[1]
    params: Dict[str, str] = {}
    for p in parts[1:]:
        if "=" in p:
            k, v = p.split("=", 1)
            params[k.upper()] = v
        else:
            params[p.upper()] = "TRUE"
    # Unescape common vCard escapes
    value = (
        value.replace("\\n", "\n")
        .replace("\\,", ",")
        .replace("\\;", ";")
        .replace("\\\\", "\\")
    )
    return name, params, value


def parse_vcard_text(raw: str) -> List[Dict[str, Any]]:
    if len(raw.encode("utf-8", errors="ignore")) > MAX_VCARD_BYTES:
        raise ValueError(SENIOR_ERRORS["invalid_vcard"])

    text = _unfold(raw)
    # Reject obvious non-vcard scripting payloads
    if re.search(r"<(script|iframe|object|embed)\b", text, re.I):
        raise ValueError(SENIOR_ERRORS["invalid_vcard"])

    cards: List[Dict[str, Any]] = []
    current: Optional[Dict[str, Any]] = None

    for line in text.split("\n"):
        line = line.strip("\r")
        if not line:
            continue
        name, params, value = _parse_property_line(line)
        if name == "BEGIN" and value.upper() == "VCARD":
            current = {
                "display_name": "",
                "first_name": None,
                "last_name": None,
                "phones": [],
                "email": None,
            }
            continue
        if current is None:
            continue
        if name == "END" and value.upper() == "VCARD":
            if current.get("display_name") or current.get("phones"):
                cards.append(current)
            current = None
            continue
        if name == "FN":
            current["display_name"] = sanitize_input(value, max_length=512)
        elif name == "N":
            parts = value.split(";")
            family = sanitize_input(parts[0] if parts else "", max_length=256) or None
            given = sanitize_input(parts[1] if len(parts) > 1 else "", max_length=256) or None
            current["last_name"] = family
            current["first_name"] = given
            if not current["display_name"]:
                current["display_name"] = sanitize_input(
                    " ".join(filter(None, [given, family])) or "Unknown",
                    max_length=512,
                )
        elif name == "TEL":
            phone = value.strip()
            if phone:
                current["phones"].append(phone)
        elif name == "EMAIL" and not current.get("email"):
            current["email"] = sanitize_input(value, max_length=512) or None

    if len(cards) > MAX_CONTACTS_PER_IMPORT:
        raise ValueError(SENIOR_ERRORS["invalid_vcard"])

    # Attach normalized phones for preview
    preview: List[Dict[str, Any]] = []
    for card in cards:
        norms = []
        for p in card["phones"]:
            n = normalize_phone(p)
            norms.append({"raw": p, "normalized": n})
        primary = norms[0] if norms else None
        preview.append(
            {
                "display_name": card["display_name"] or "Unknown",
                "first_name": card["first_name"],
                "last_name": card["last_name"],
                "email": card["email"],
                "primary_phone": primary["raw"] if primary else None,
                "normalized_phone": primary["normalized"] if primary else None,
                "additional_phone_numbers": norms,
                "has_phone": bool(primary and primary["normalized"]),
            }
        )
    return preview


async def import_vcard_contacts(
    db: AsyncSession,
    user_id: UUID,
    raw: str,
    *,
    confirm: bool = False,
) -> Dict[str, Any]:
    preview = parse_vcard_text(raw)
    if not confirm:
        return {
            "preview": True,
            "count": len(preview),
            "with_phone": sum(1 for c in preview if c["has_phone"]),
            "contacts": preview[:100],
            "truncated": True if len(preview) > 100 else False,
        }

    now = datetime.now(timezone.utc)
    created = 0
    for item in preview:
        contact = UserContact(
            id=uuid4(),
            user_id=user_id,
            display_name=item["display_name"],
            first_name=item["first_name"],
            last_name=item["last_name"],
            primary_phone=item["primary_phone"],
            normalized_phone=item["normalized_phone"],
            additional_phone_numbers=item["additional_phone_numbers"],
            email=item["email"],
            source="imported_vcard",
            is_trusted=False,
            last_synced_at=now,
        )
        db.add(contact)
        created += 1

    await db.commit()
    logger.info("vcard_imported user_id=%s created=%s", user_id, created)
    return {
        "preview": False,
        "imported": created,
        "with_phone": sum(1 for c in preview if c["has_phone"]),
    }
