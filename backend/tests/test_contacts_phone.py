"""Tests for phone number normalization."""

from __future__ import annotations

import os

import pytest

from backend.contacts.phone import normalize_phone, normalize_phone_list, phones_match


def test_us_formats_normalize_to_same_e164():
    assert normalize_phone("+1 301 555 1234") == "+13015551234"
    assert normalize_phone("301-555-1234") == "+13015551234"
    assert normalize_phone("(301) 555-1234") == "+13015551234"
    assert normalize_phone("301.555.1234") == "+13015551234"


def test_european_number():
    assert normalize_phone("+34 612 345 678") == "+34612345678"
    assert normalize_phone("+44 20 7946 0958") == "+442079460958"


def test_phones_match_ignores_formatting():
    assert phones_match("(301) 555-1234", "+1-301-555-1234")
    assert not phones_match("301-555-1234", "301-555-9999")


def test_invalid_returns_none():
    assert normalize_phone("") is None
    assert normalize_phone(None) is None
    assert normalize_phone("not-a-phone") is None
    assert normalize_phone("123") is None


def test_normalize_phone_list_dedupes():
    result = normalize_phone_list(
        ["(301) 555-1234", "301-555-1234", "+13015551234", "bad"]
    )
    assert result == ["+13015551234"]


def test_default_region_env(monkeypatch):
    monkeypatch.setenv("DEFAULT_PHONE_REGION", "ES")
    # National Spanish mobile without country code
    assert normalize_phone("612345678") == "+34612345678"
