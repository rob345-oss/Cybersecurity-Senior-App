from __future__ import annotations

from typing import Dict, List

from backend.models import RecommendedAction, SafeScript, RiskResponse
from backend.risk_engine.base import build_risk_response

SIGNAL_WEIGHTS = {
    "password_reset_unknown": 25,
    "account_opened": 40,
    "suspicious_inquiry": 40,
    "reused_passwords": 15,
    "clicked_suspicious_link": 20,
    "ssn_requested_unexpectedly": 25,
}


def assess(signals: Dict[str, bool]) -> RiskResponse:
    score = 0
    reasons: List[str] = []

    for key, weight in SIGNAL_WEIGHTS.items():
        if signals.get(key):
            score += weight
            reasons.append(key.replace("_", " "))

    recommended_actions = [
        RecommendedAction(
            id="freeze-credit",
            title="Freeze your credit",
            detail="Place a free credit freeze with the major bureaus.",
        ),
        RecommendedAction(
            id="enable-2fa",
            title="Enable 2FA",
            detail="Turn on multi-factor authentication for key accounts.",
        ),
        RecommendedAction(
            id="change-passwords",
            title="Change passwords",
            detail="Update passwords on critical accounts and use a manager.",
        ),
        RecommendedAction(
            id="check-credit",
            title="Check your credit report",
            detail="Review recent inquiries and accounts you don't recognize.",
        ),
    ]

    safe_script = SafeScript(
        say_this="I'm calling to report potential fraud and request next steps.",
        if_they_push_back="Please note this as suspected identity misuse and escalate if needed.",
    )

    metadata = {
        "suggested_freeze_steps": [
            "Freeze credit with Equifax, Experian, and TransUnion.",
            "Create a PIN for lifting the freeze later.",
        ],
        "suggested_password_steps": [
            "Change passwords starting with email and banking.",
            "Enable passkeys or authenticator apps where possible.",
        ],
        "monitoring_steps": [
            "Set alerts for new credit inquiries.",
            "Review bank statements weekly for unusual activity.",
        ],
    }

    return build_risk_response(
        score=score,
        reasons=reasons or ["No high-risk identity signals selected."],
        next_action="Start with a credit freeze and password reset if any suspicion remains.",
        recommended_actions=recommended_actions,
        safe_script=safe_script,
        metadata=metadata,
    )
