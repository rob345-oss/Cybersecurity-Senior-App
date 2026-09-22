"""Contacts Sync and Trusted Callers package.

CareCircle may later reference the same contact records. Trusted Caller status
and CareCircle permissions remain separate security concepts.
"""

from backend.contacts.phone import normalize_phone, normalize_phone_list

__all__ = [
    "normalize_phone",
    "normalize_phone_list",
]
