"""Tests for vCard parsing and duplicate helpers (no live Google)."""

from __future__ import annotations

import pytest

from backend.contacts.vcard import parse_vcard_text
from backend.contacts.duplicates import _names_similar, _ordered_pair
from uuid import uuid4


SAMPLE_VCARD = """BEGIN:VCARD
VERSION:3.0
FN:Mary Smith
N:Smith;Mary;;;
TEL;TYPE=CELL:+1 301-555-0192
EMAIL:mary@example.com
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Robert Smith
TEL:(301) 555-0192
END:VCARD
"""


def test_parse_vcard_preview():
    contacts = parse_vcard_text(SAMPLE_VCARD)
    assert len(contacts) == 2
    assert contacts[0]["display_name"] == "Mary Smith"
    assert contacts[0]["normalized_phone"] == "+13015550192"
    assert contacts[0]["has_phone"] is True


def test_rejects_script_payload():
    with pytest.raises(ValueError):
        parse_vcard_text("BEGIN:VCARD\nFN:<script>alert(1)</script>\nEND:VCARD")


def test_names_similar():
    assert _names_similar("Robert Smith", "Robert J. Smith")
    assert _names_similar("Mary Smith", "Mary Smith")
    assert not _names_similar("Alice", "Bob")


def test_ordered_pair_stable():
    a = uuid4()
    b = uuid4()
    assert _ordered_pair(a, b) == _ordered_pair(b, a)
