"""Sync parsing unit tests (People API person → contact fields)."""

from __future__ import annotations

from backend.contacts.sync import parse_person


def test_parse_person_extracts_fields():
    person = {
        "resourceName": "people/c123abc",
        "names": [
            {
                "displayName": "Mary Smith",
                "givenName": "Mary",
                "familyName": "Smith",
                "metadata": {"primary": True},
            }
        ],
        "phoneNumbers": [
            {"value": "(301) 555-0192", "metadata": {"primary": True}},
            {"value": "+1 301 555 0000"},
        ],
        "emailAddresses": [{"value": "mary@example.com", "metadata": {"primary": True}}],
        "photos": [{"url": "https://example.com/photo.jpg", "metadata": {"primary": True}}],
    }
    parsed = parse_person(person)
    assert parsed is not None
    assert parsed["google_contact_id"] == "c123abc"
    assert parsed["display_name"] == "Mary Smith"
    assert parsed["normalized_phone"] == "+13015550192"
    assert parsed["email"] == "mary@example.com"
    assert len(parsed["additional_phone_numbers"]) >= 1


def test_parse_person_without_resource_returns_none():
    assert parse_person({"names": [{"displayName": "X"}]}) is None
