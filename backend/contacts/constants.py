"""Shared constants and relationship categories for contacts."""

from __future__ import annotations

from typing import FrozenSet

RELATIONSHIP_CATEGORIES: FrozenSet[str] = frozenset(
    {
        "Family",
        "Friend",
        "Caregiver",
        "Doctor / Healthcare",
        "Neighbor",
        "Business",
        "Emergency Contact",
        "Other",
    }
)

CONTACT_SOURCES = frozenset({"google", "manual", "imported_vcard"})
TRUST_STATUSES = frozenset({"active", "removed"})
CONNECTION_STATUSES = frozenset({"connected", "needs_reconnect", "disconnected"})

GOOGLE_CONTACTS_SCOPE = "https://www.googleapis.com/auth/contacts.readonly"

SENIOR_ERRORS = {
    "google_cancelled": "Google connection was cancelled. You can try again whenever you are ready.",
    "google_denied": "Permission was not granted. Titanium Guardian cannot see your contacts without your permission.",
    "google_unavailable": "Google is temporarily unavailable. Your existing trusted callers are still protected. Try again in a little while.",
    "needs_reconnect": "Please reconnect your Google account so Titanium Guardian can update your contacts.",
    "sync_failed": "We couldn’t update your contacts. Your existing trusted callers are still protected. Try again.",
    "no_contacts": "We couldn’t find any contacts with phone numbers yet.",
    "not_configured": "Google Contacts is not set up on this server yet. Please contact support.",
    "invalid_vcard": "We couldn’t read that contacts file. Please export a .vcf file and try again.",
    "phone_invalid": "That phone number doesn’t look valid. Please check it and try again.",
    "duplicate_trusted": "That person is already in your Trusted Callers list.",
    "unauthorized": "You don’t have permission to do that.",
    "not_found": "We couldn’t find that contact.",
}
