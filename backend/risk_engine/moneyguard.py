from __future__ import annotations

from typing import Dict, List

from backend.models import RecommendedAction, SafeScript, RiskResponse
from backend.risk_engine.base import build_risk_response

PAYMENT_WEIGHTS = {
    "gift_card": 40,
    "crypto": 35,
    "wire": 25,
    "western_union": 30,
    "moneygram": 30,
    "prepaid_card": 35,
}

IMPERSONATION_WEIGHTS = {
    "bank": 15,
    "government": 15,
    "tech_support": 15,
    "medicare": 20,
    "health_insurance": 20,
    "contractor": 18,
    "charity": 15,
}

SCAM_TYPE_WEIGHTS = {
    "grandparent_scam": 30,
    "family_emergency": 30,
    "romance_scam": 28,
    "lottery_scam": 35,
    "sweepstakes_scam": 35,
    "investment_scam": 32,
    "charity_scam": 22,
    "contractor_scam": 25,
    "home_repair": 25,
    "medicare_scam": 25,
    "tech_support": 20,
}


def assess(payload: Dict[str, object]) -> RiskResponse:
    score = 0
    reasons: List[str] = []

    payment_method = str(payload.get("payment_method", "")).lower()
    if payment_method in PAYMENT_WEIGHTS:
        score += PAYMENT_WEIGHTS[payment_method]
        reasons.append(f"High-risk payment method: {payment_method.replace('_', ' ')}")

    amount = float(payload.get("amount", 0) or 0)
    did_contact = bool(payload.get("did_they_contact_you_first"))
    if did_contact and amount > 500:
        score += 15
        reasons.append("They contacted you first and the amount is large.")

    flags = payload.get("flags", {}) or {}
    if flags.get("asked_for_verification_code"):
        score += 35
        reasons.append("They asked for a verification code.")
    if flags.get("asked_for_remote_access"):
        score += 30
        reasons.append("They asked for remote access.")
    if flags.get("asked_to_keep_secret"):
        score += 20
        reasons.append("They asked you to keep it secret.")
    if flags.get("urgency_present"):
        score += 15
        reasons.append("They created urgency or pressure.")
    
    # Detect common scam patterns in payment requests
    scam_type = str(flags.get("scam_type", "")).lower()
    if scam_type in SCAM_TYPE_WEIGHTS:
        score += SCAM_TYPE_WEIGHTS[scam_type]
        reasons.append(f"Common scam pattern detected: {scam_type.replace('_', ' ')}")
    
    # Additional scam indicators
    if flags.get("upfront_payment_required"):
        score += 25
        reasons.append("Upfront payment required (common in lottery/prize scams)")
    if flags.get("wont_meet_in_person"):
        score += 20
        reasons.append("They refuse to meet in person (common in romance scams)")
    if flags.get("refuses_video_chat"):
        score += 15
        reasons.append("They refuse video chat verification (romance scam red flag)")
    if flags.get("guaranteed_return") and amount > 1000:
        score += 28
        reasons.append("Guaranteed returns with large amount (investment scam indicator)")
    if flags.get("prize_claim_fee"):
        score += 30
        reasons.append("Fee required to claim prize (lottery/sweepstakes scam)")
    if flags.get("emergency_family_member"):
        score += 28
        reasons.append("Emergency involving family member (grandparent scam indicator)")
    if flags.get("contractor_pressure"):
        score += 22
        reasons.append("Contractor creating pressure (home repair scam)")

    impersonation = str(flags.get("impersonation_type", "none")).lower()
    if impersonation in IMPERSONATION_WEIGHTS:
        score += IMPERSONATION_WEIGHTS[impersonation]
        reasons.append(f"Possible {impersonation.replace('_', ' ')} impersonation.")

    recommended_actions = [
        RecommendedAction(
            id="pause-payment",
            title="Pause payment",
            detail="Stop and verify the request using a trusted channel.",
        ),
        RecommendedAction(
            id="call-bank",
            title="Call your bank",
            detail="Use the number on your card to confirm if this request is legitimate.",
        ),
        RecommendedAction(
            id="no-otp",
            title="Never share verification codes",
            detail="Banks and legitimate services will not ask for OTP codes or remote access.",
        ),
    ]

    safe_script = SafeScript(
        say_this="I need to verify this request independently before sending any money.",
        if_they_push_back="I won't proceed without verification. I'll follow up after I confirm.",
    )

    next_action = "Verify the recipient using a trusted number or in-person contact."
    metadata = {
        "amount": amount,
        "payment_method": payment_method,
        "impersonation_type": impersonation,
        "scam_type": scam_type if scam_type else "none",
    }

    return build_risk_response(
        score=score,
        reasons=reasons or ["No high-risk indicators detected."],
        next_action=next_action,
        recommended_actions=recommended_actions,
        safe_script=safe_script,
        metadata=metadata,
    )


def safe_steps() -> Dict[str, List[Dict[str, str]]]:
    checklist = [
        {
            "id": "pause",
            "title": "Pause the payment",
            "detail": "Give yourself time to verify the request.",
        },
        {
            "id": "verify",
            "title": "Verify independently",
            "detail": "Use an official number or app to confirm the request.",
        },
        {
            "id": "invoice",
            "title": "Ask for documentation",
            "detail": "Request a written invoice and validate the business directly.",
        },
    ]
    scripts = [
        {
            "id": "delay",
            "title": "Delay script",
            "detail": "I need to verify this request first. I'll follow up shortly.",
        },
        {
            "id": "no-otp",
            "title": "No OTP script",
            "detail": "I don't share verification codes with anyone.",
        },
    ]
    return {"checklist": checklist, "scripts": scripts}
