from backend.risk_engine import callguard, identitywatch, inboxguard, moneyguard


def test_callguard_high_risk():
    risk = callguard.assess(["verification_code_request", "remote_access_request"])
    assert risk.score >= 60
    assert risk.level in {"medium", "high"}


def test_moneyguard_rules():
    payload = {
        "amount": 800,
        "payment_method": "gift_card",
        "recipient": "Alex",
        "reason": "Invoice",
        "did_they_contact_you_first": True,
        "flags": {
            "asked_for_verification_code": True,
            "asked_for_remote_access": False,
            "asked_to_keep_secret": True,
            "urgency_present": True,
            "impersonation_type": "bank",
        },
    }
    risk = moneyguard.assess(payload)
    assert risk.score >= 90
    assert risk.level == "high"


def test_inboxguard_text_flags():
    text = "Final notice: verify your account immediately at https://bit.ly/fake-login"
    risk = inboxguard.analyze_text(text, "sms")
    assert risk.score >= 40
    assert "Urgency language detected" in risk.reasons


def test_inboxguard_url_flags():
    risk = inboxguard.analyze_url("http://xn--paypa1-login.example.com/verify")
    assert risk.score >= 15
    assert any("Punycode" in reason or "hyphens" in reason for reason in risk.reasons)


def test_identitywatch_scoring():
    signals = {
        "account_opened": True,
        "suspicious_inquiry": True,
        "password_reset_unknown": False,
        "reused_passwords": False,
        "clicked_suspicious_link": False,
        "ssn_requested_unexpectedly": False,
    }
    risk = identitywatch.assess(signals)
    assert risk.score >= 80
    assert risk.level == "high"
