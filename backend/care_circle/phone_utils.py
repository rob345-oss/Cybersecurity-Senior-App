"""Phone number validation, normalization, and display formatting."""

from __future__ import annotations

import re
from typing import Optional

PHONE_INPUT_PATTERN = re.compile(r"^[\d\s\-\+\(\)\.]{10,25}$")


def normalize_phone(phone: str) -> str:
    """Normalize phone to digits with optional leading + for international numbers."""
    cleaned = phone.strip()
    has_plus = cleaned.startswith("+")
    digits = re.sub(r"\D", "", cleaned)
    if has_plus:
        return f"+{digits}"
    return digits


def validate_phone(phone: str) -> bool:
    """Validate phone number with international support."""
    if not phone or not phone.strip():
        return False
    if not PHONE_INPUT_PATTERN.match(phone.strip()):
        return False
    normalized = normalize_phone(phone)
    digits = normalized.lstrip("+")
    if len(digits) < 10 or len(digits) > 15:
        return False
    return True


def format_phone_for_display(phone: str) -> str:
    """Format a normalized phone number for readable display."""
    normalized = normalize_phone(phone)
    if normalized.startswith("+1") and len(normalized) == 12:
        digits = normalized[2:]
        return f"+1 ({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    if normalized.startswith("+") and len(normalized) > 4:
        country = normalized[:3] if len(normalized) > 10 else normalized[:2]
        rest = normalized[len(country) :]
        if len(rest) >= 6:
            return f"{country} {rest[:3]} {rest[3:6]} {rest[6:]}"
        return f"{country} {rest}"
    if len(normalized) == 10:
        return f"({normalized[:3]}) {normalized[3:6]}-{normalized[6:]}"
    return normalized


def phone_for_sms_uri(phone: str) -> str:
    """Return phone suitable for sms: URI (digits with optional leading +)."""
    return normalize_phone(phone)
