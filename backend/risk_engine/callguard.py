from __future__ import annotations

from typing import Dict, List

from backend.models import RecommendedAction, SafeScript, RiskResponse
from backend.risk_engine.base import build_risk_response

SIGNAL_WEIGHTS = {
    "urgency": 10,
    "bank_impersonation": 25,
    "government_impersonation": 25,
    "tech_support": 20,
    "remote_access_request": 30,
    "verification_code_request": 35,
    "gift_cards": 30,
    "crypto_payment": 30,
    "threats_or_arrest": 25,
    "too_good_to_be_true": 15,
    "asks_to_keep_secret": 15,
    "caller_id_mismatch": 20,
}

SAFE_SCRIPTS = {
    "bank_impersonation": SafeScript(
        say_this="I will call the bank back using the number on my card.",
        if_they_push_back="I don't share information on inbound calls. I'll reach out directly.",
    ),
    "government_impersonation": SafeScript(
        say_this="I don't handle legal matters over the phone. I will contact the agency directly.",
        if_they_push_back="Please send official mail. I won't continue this call.",
    ),
    "tech_support": SafeScript(
        say_this="I don't grant remote access. I'll contact support using the official site.",
        if_they_push_back="No remote access. I'm ending the call now.",
    ),
    "verification_code_request": SafeScript(
        say_this="I never share verification codes.",
        if_they_push_back="Without that, I can't proceed. Goodbye.",
    ),
    "gift_cards": SafeScript(
        say_this="I don't pay with gift cards.",
        if_they_push_back="That payment method isn't acceptable. I'm ending this call.",
    ),
}


def assess(signals: List[str]) -> RiskResponse:
    score = 0
    reasons: List[str] = []
    highest_signal = None
    for signal in signals:
        weight = SIGNAL_WEIGHTS.get(signal, 0)
        if weight:
            score += weight
            reasons.append(f"Signal detected: {signal.replace('_', ' ')}")
        if not highest_signal or weight > SIGNAL_WEIGHTS.get(highest_signal, 0):
            highest_signal = signal

    recommended_actions = [
        RecommendedAction(
            id="pause-call",
            title="Pause and verify",
            detail="Take a breath, avoid sharing info, and verify the caller independently.",
        ),
        RecommendedAction(
            id="hang-up",
            title="Hang up if pressured",
            detail="If they demand urgency or secrecy, end the call and call back using a trusted number.",
        ),
    ]

    safe_script = SAFE_SCRIPTS.get(highest_signal) if highest_signal else None
    next_action = "Verify the caller using an official phone number before sharing anything."
    metadata: Dict[str, str] = {"primary_signal": highest_signal or "none"}

    return build_risk_response(
        score=score,
        reasons=reasons or ["No high-risk signals detected."],
        next_action=next_action,
        recommended_actions=recommended_actions,
        safe_script=safe_script,
        metadata=metadata,
    )
