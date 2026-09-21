"""API-oriented trusted caller matching helpers (in-memory style)."""

from __future__ import annotations

from backend.contacts.phone import normalize_phone
from backend.contacts.trusted_service import TrustedCallerService


def test_normalize_used_by_lookup_contract():
    """Document the matching contract CallGuard relies on."""
    variants = ["+1 301 555 1234", "301-555-1234", "(301) 555-1234"]
    norms = {normalize_phone(v) for v in variants}
    assert len(norms) == 1
    assert norms.pop() == "+13015551234"


def test_senior_error_messages_avoid_jargon():
    from backend.contacts.constants import SENIOR_ERRORS

    for msg in SENIOR_ERRORS.values():
        lowered = msg.lower()
        assert "oauth" not in lowered
        assert "token" not in lowered or "account" in lowered
        assert "api" not in lowered
        assert "people api" not in lowered
