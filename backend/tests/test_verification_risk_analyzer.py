"""Unit tests for trusted contact verification risk analyzer."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.verification.risk_analyzer import (
    analyze_verification_risk,
    score_to_verification_level,
)


class TestScoreBands:
    def test_low(self):
        assert score_to_verification_level(0) == "low"
        assert score_to_verification_level(29) == "low"

    def test_medium(self):
        assert score_to_verification_level(30) == "medium"
        assert score_to_verification_level(54) == "medium"

    def test_high(self):
        assert score_to_verification_level(55) == "high"
        assert score_to_verification_level(79) == "high"

    def test_critical(self):
        assert score_to_verification_level(80) == "critical"
        assert score_to_verification_level(100) == "critical"


class TestRiskRules:
    def test_no_indicators_is_low(self):
        result = analyze_verification_risk(
            description="A neighbor left a note about borrowing a ladder tomorrow."
        )
        assert result.risk_score == 0
        assert result.risk_level == "low"
        assert any("No strong scam warning signs" in r for r in result.risk_reasons)

    def test_gift_card_request(self):
        result = analyze_verification_risk(
            description="They asked me to buy gift cards and read the numbers."
        )
        assert result.risk_score >= 25
        assert "Requests payment with gift cards" in result.risk_reasons

    def test_crypto_request(self):
        result = analyze_verification_risk(
            description="Please send bitcoin to this wallet address now."
        )
        assert "Requests cryptocurrency payment" in result.risk_reasons

    def test_wire_transfer(self):
        result = analyze_verification_risk(
            description="You need to do a wire transfer to Western Union."
        )
        assert "Requests a wire transfer" in result.risk_reasons

    def test_urgent_language(self):
        result = analyze_verification_risk(
            description="This is urgent. Act now or your account will be suspended."
        )
        assert "Uses urgent or threatening language" in result.risk_reasons

    def test_government_impersonation(self):
        result = analyze_verification_risk(
            description="This is the IRS. Your social security number is flagged."
        )
        assert "Claims to be from a government agency" in result.risk_reasons

    def test_bank_impersonation(self):
        result = analyze_verification_risk(
            description="Calling from bank fraud about your account compromised."
        )
        assert (
            "Claims to be from a bank or financial institution" in result.risk_reasons
        )

    def test_remote_access(self):
        result = analyze_verification_risk(
            description="Install TeamViewer so I can fix your computer with remote access."
        )
        assert "Requests remote computer access" in result.risk_reasons

    def test_password_or_code(self):
        result = analyze_verification_risk(
            description="Tell me the verification code that was just texted to you."
        )
        assert "Requests passwords or verification codes" in result.risk_reasons

    def test_family_emergency(self):
        result = analyze_verification_risk(
            description="Grandma, this is your grandson. I'm in jail and need bail money."
        )
        assert "Claims a family emergency" in result.risk_reasons

    def test_keep_secret(self):
        result = analyze_verification_risk(
            description="Please keep this a secret and don't tell anyone."
        )
        assert "Asks to keep the interaction secret" in result.risk_reasons

    def test_high_risk_stack_is_critical(self):
        result = analyze_verification_risk(
            description=(
                "This is the IRS. Your account will be suspended immediately. "
                "Buy gift cards and send bitcoin. Install AnyDesk for remote access "
                "and tell me the verification code. Keep this a secret."
            ),
            amount_requested=1000,
            interaction_type="payment_request",
        )
        assert result.risk_score >= 80
        assert result.risk_level == "critical"
        assert "definitely" not in result.summary.lower()
        assert "trust" in result.summary.lower()

    def test_does_not_claim_definite_fraud(self):
        result = analyze_verification_risk(
            description="Send gift cards and your password right now."
        )
        combined = " ".join(result.risk_reasons) + " " + result.summary
        assert "definitely a scam" not in combined.lower()
        assert "definitely fraudulent" not in combined.lower()

    def test_requested_action_is_scanned(self):
        result = analyze_verification_risk(
            description="Someone called me.",
            requested_action="They want a wire transfer today.",
        )
        assert "Requests a wire transfer" in result.risk_reasons

    def test_score_clamped_to_100(self):
        result = analyze_verification_risk(
            description=(
                "gift card crypto bitcoin wire transfer western union urgent immediately "
                "arrest IRS social security bank fraud TeamViewer remote access password "
                "verification code OTP family emergency grandson jail bail keep this a secret "
                "don't tell anyone"
            ),
            amount_requested=5000,
            interaction_type="payment_request",
        )
        assert result.risk_score == 100
