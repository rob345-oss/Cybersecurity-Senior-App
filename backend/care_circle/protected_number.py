"""Protected number assignment for share onboarding."""

from __future__ import annotations

import hashlib
import os
from uuid import UUID

from backend.care_circle.phone_utils import format_phone_for_display, normalize_phone


def assign_protected_number(user_id: UUID) -> str:
    """
    Assign a protected phone number for the user.

    Uses TWILIO_PHONE_NUMBER when configured; otherwise a deterministic
    server-side placeholder derived from the user ID (never hardcoded in frontend).
    """
    twilio_number = os.getenv("TWILIO_PHONE_NUMBER", "").strip()
    if twilio_number:
        return normalize_phone(twilio_number)

    digest = hashlib.sha256(str(user_id).encode()).hexdigest()
    # Derive 10 digits for a +1 placeholder number
    digits = "".join(str(int(c, 16) % 10) for c in digest[:10])
    return f"+1{digits}"


def get_formatted_protected_number(raw_number: str) -> str:
    """Format stored protected number for display."""
    return format_phone_for_display(raw_number)
