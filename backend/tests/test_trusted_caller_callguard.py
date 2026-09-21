"""Trusted caller service and CallGuard soft-trust tests."""

from __future__ import annotations

from typing import Any, Dict, List
from uuid import uuid4

import pytest

from backend.risk_engine import callguard


def test_callguard_softens_for_trusted_without_high_severity():
    context = {
        "caller_id": "+13015550192",
        "trusted_caller": {
            "trusted": True,
            "name": "Mary Smith",
            "relationship": "Daughter",
            "contact_id": str(uuid4()),
            "source": "google",
        },
    }
    response = callguard.assess(["urgency"], call_context=context, use_ai=False)
    assert response.metadata.get("trusted_caller", {}).get("trusted") is True
    assert any("Trusted Callers" in r for r in response.reasons)
    assert "Mary Smith" in response.next_action or "Daughter" in (response.next_action or "")


def test_callguard_keeps_elevated_risk_with_high_severity_even_if_trusted():
    context = {
        "caller_id": "+13015550192",
        "trusted_caller": {
            "trusted": True,
            "name": "Mary Smith",
            "relationship": "Daughter",
            "source": "google",
        },
    }
    # verification_code_request is high severity — should not soft-cap the same way
    response = callguard.assess(
        ["verification_code_request", "urgency"],
        call_context=context,
        use_ai=False,
    )
    assert response.metadata.get("trusted_caller", {}).get("trusted") is True
    # Score should still reflect high-severity concern (rule-based weights)
    assert response.score >= 35


def test_untrusted_context_unchanged():
    response = callguard.assess([], call_context={"caller_id": "+15551212"}, use_ai=False)
    assert not response.metadata.get("trusted_caller", {}).get("trusted")
