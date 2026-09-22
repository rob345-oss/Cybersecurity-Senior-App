"""Trusted caller service and CallGuard soft-trust tests."""

from __future__ import annotations

from uuid import uuid4

import pytest

from backend.risk_engine import callguard
from backend.voice.call_registry import CallRecord
from backend.voice.risk_pipeline import _peer_phone_for_trust


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


@pytest.mark.parametrize(
    "signal",
    [
        "remote_access_request",
        "gift_cards",
        "crypto_payment",
        "asks_to_keep_secret",
        "threats_or_arrest",
    ],
)
def test_callguard_does_not_soften_real_high_severity_keys(signal: str):
    """Trusted softening must recognize the keys CallGuard actually emits."""
    context = {
        "caller_id": "+13015550192",
        "trusted_caller": {
            "trusted": True,
            "name": "Mary Smith",
            "relationship": "Daughter",
            "source": "google",
        },
    }
    trusted_soft = callguard.assess(["urgency"], call_context=context, use_ai=False)
    with_signal = callguard.assess([signal, "urgency"], call_context=context, use_ai=False)
    baseline = callguard.assess([signal, "urgency"], use_ai=False)

    # No −25 soft-cap when a real high-severity signal is present.
    assert with_signal.score >= baseline.score - 1
    assert with_signal.score > trusted_soft.score
    # Softened copy replaces next_action with "This looks like {name}..."
    assert not (with_signal.next_action or "").startswith("This looks like Mary Smith")


def test_untrusted_context_unchanged():
    response = callguard.assess([], call_context={"caller_id": "+15551212"}, use_ai=False)
    assert not response.metadata.get("trusted_caller", {}).get("trusted")


def test_outbound_peer_phone_uses_to_number():
    outbound = CallRecord(
        call_sid="CA1",
        session_id="s1",
        user_id=str(uuid4()),
        direction="outbound",
        from_number="+15550001111",  # Twilio line
        to_number="+13015550192",  # trusted callee
    )
    inbound = CallRecord(
        call_sid="CA2",
        session_id="s2",
        user_id=str(uuid4()),
        direction="inbound",
        from_number="+13015550192",
        to_number="+15550001111",
    )
    assert _peer_phone_for_trust(outbound) == "+13015550192"
    assert _peer_phone_for_trust(inbound) == "+13015550192"
