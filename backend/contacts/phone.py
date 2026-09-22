"""Phone number normalization to E.164 for contact matching."""

from __future__ import annotations

import os
import re
from typing import Iterable, List, Optional

import phonenumbers
from phonenumbers import NumberParseException


def get_default_phone_region() -> str:
    return os.getenv("DEFAULT_PHONE_REGION", "US").upper()


def normalize_phone(
    raw: Optional[str],
    default_region: Optional[str] = None,
) -> Optional[str]:
    """Normalize a phone number to E.164 when possible.

    Returns None when the input cannot be parsed as a valid number.
    Matching must not depend on visual formatting alone.
    """
    if raw is None:
        return None

    text = str(raw).strip()
    if not text:
        return None

    # Strip common extension markers for primary matching
    text = re.split(r"(?i)\s*(?:ext\.?|x|extension)\s*\d+\s*$", text)[0].strip()
    if not text:
        return None

    region = (default_region or get_default_phone_region()).upper()

    try:
        parsed = phonenumbers.parse(text, region)
    except NumberParseException:
        # Retry with leading + if digits-only international-looking number
        digits = re.sub(r"\D", "", text)
        if not digits:
            return None
        try:
            parsed = phonenumbers.parse(f"+{digits}", None)
        except NumberParseException:
            return None

    if not phonenumbers.is_possible_number(parsed):
        return None

    # Prefer valid numbers; still accept possible numbers with country code
    if not phonenumbers.is_valid_number(parsed):
        if not parsed.country_code:
            return None

    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


def normalize_phone_list(
    numbers: Iterable[Optional[str]],
    default_region: Optional[str] = None,
) -> List[str]:
    """Normalize many numbers, dropping invalids and duplicates while preserving order."""
    seen = set()
    result: List[str] = []
    for raw in numbers:
        normalized = normalize_phone(raw, default_region=default_region)
        if normalized and normalized not in seen:
            seen.add(normalized)
            result.append(normalized)
    return result


def phones_match(
    a: Optional[str],
    b: Optional[str],
    default_region: Optional[str] = None,
) -> bool:
    """Return True when two phone strings normalize to the same E.164 value."""
    na = normalize_phone(a, default_region=default_region)
    nb = normalize_phone(b, default_region=default_region)
    return bool(na and nb and na == nb)
