"""Outbound trust lookup must use the callee, not the Twilio caller ID."""

from backend.voice.risk_pipeline import counterparty_phone


def test_outbound_uses_callee_not_twilio_line():
    twilio_line = "+15550001111"
    callee = "+13015550192"
    assert counterparty_phone("outbound", twilio_line, callee) == callee


def test_inbound_uses_caller():
    caller = "+13015550192"
    twilio_line = "+15550001111"
    assert counterparty_phone("inbound", caller, twilio_line) == caller


def test_outbound_falls_back_when_callee_missing():
    assert counterparty_phone("outbound", "+15550001111", "") == "+15550001111"
