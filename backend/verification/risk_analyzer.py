"""Rule-based scam risk analyzer for trusted contact verification."""

from __future__ import annotations

import re
from typing import List, Literal, Optional, Sequence

from pydantic import BaseModel, Field

VerificationRiskLevel = Literal["low", "medium", "high", "critical"]

# Additive point weights for clear scam indicators
RISK_RULES: Sequence[tuple[str, int, Sequence[str]]] = (
    (
        "Requests payment with gift cards",
        25,
        (
            r"\bgift\s*cards?\b",
            r"\bitunes\b",
            r"\bgoogle\s*play\s*card\b",
            r"\bsteam\s*card\b",
            r"\bvisa\s*gift\b",
        ),
    ),
    (
        "Requests cryptocurrency payment",
        25,
        (
            r"\bcrypto(currency)?\b",
            r"\bbitcoin\b",
            r"\bbtc\b",
            r"\bethereum\b",
            r"\busdt\b",
            r"\bwallet\s*address\b",
        ),
    ),
    (
        "Requests a wire transfer",
        20,
        (
            r"\bwire\s*transfer\b",
            r"\bwestern\s*union\b",
            r"\bmoneygram\b",
            r"\bbank\s*transfer\b",
            r"\bswift\b",
        ),
    ),
    (
        "Uses urgent or threatening language",
        15,
        (
            r"\burgent\b",
            r"\bimmediately\b",
            r"\bright\s*now\b",
            r"\bact\s*now\b",
            r"\bwithin\s*\d+\s*(minutes?|hours?)\b",
            r"\bthreaten",
            r"\barrest\b",
            r"\blegal\s*action\b",
            r"\baccount\s*will\s*be\s*(closed|suspended|frozen)\b",
        ),
    ),
    (
        "Claims to be from a government agency",
        20,
        (
            r"\birs\b",
            r"\bsocial\s*security\b",
            r"\bssa\b",
            r"\bmedicare\b",
            r"\bgovernment\b",
            r"\bfederal\s*agent\b",
            r"\btax\s*(office|department|authority)\b",
        ),
    ),
    (
        "Claims to be from a bank or financial institution",
        15,
        (
            r"\byour\s*bank\b",
            r"\bbank\s*(fraud|security|support)\b",
            r"\bcredit\s*union\b",
            r"\baccount\s*(compromised|hacked|locked)\b",
            r"\bcard\s*(suspended|blocked)\b",
        ),
    ),
    (
        "Requests remote computer access",
        25,
        (
            r"\banydesk\b",
            r"\bteamviewer\b",
            r"\bremote\s*(access|desktop|control)\b",
            r"\bscreen\s*share\b",
            r"\blogmein\b",
            r"\binstall\s*(this|the)\s*(software|program|app)\b",
        ),
    ),
    (
        "Requests passwords or verification codes",
        25,
        (
            r"\bpassword\b",
            r"\bpasscode\b",
            r"\bpin\b",
            r"\bverification\s*code\b",
            r"\bone[-\s]?time\s*(code|password|passcode)\b",
            r"\botp\b",
            r"\b2fa\b",
            r"\bauthentication\s*code\b",
            r"\bsocial\s*security\s*number\b",
            r"\bssn\b",
        ),
    ),
    (
        "Claims a family emergency",
        20,
        (
            r"\bfamily\s*emergency\b",
            r"\bgrand(son|daughter|child)\b",
            r"\bin\s*(jail|trouble|hospital)\b",
            r"\bbail\b",
            r"\bdon'?t\s*tell\s*(mom|dad|your\s*(parents|family))\b",
        ),
    ),
    (
        "Asks to keep the interaction secret",
        15,
        (
            r"\bkeep\s*(this|it)\s*(a\s*)?secret\b",
            r"\bdon'?t\s*tell\s*anyone\b",
            r"\bdon'?t\s*talk\s*to\b",
            r"\bbetween\s*us\b",
            r"\bconfidential\b",
        ),
    ),
)


class VerificationRiskResult(BaseModel):
    """Result of rule-based verification risk analysis."""

    risk_score: int = Field(ge=0, le=100)
    risk_level: VerificationRiskLevel
    risk_reasons: List[str]
    summary: str


def score_to_verification_level(score: int) -> VerificationRiskLevel:
    if score >= 80:
        return "critical"
    if score >= 55:
        return "high"
    if score >= 30:
        return "medium"
    return "low"


def _combine_text(
    description: str,
    requested_action: Optional[str],
    sender_name: Optional[str],
    sender_contact: Optional[str],
) -> str:
    parts = [description or ""]
    if requested_action:
        parts.append(requested_action)
    if sender_name:
        parts.append(sender_name)
    if sender_contact:
        parts.append(sender_contact)
    return " ".join(parts).lower()


def analyze_verification_risk(
    *,
    description: str,
    requested_action: Optional[str] = None,
    sender_name: Optional[str] = None,
    sender_contact: Optional[str] = None,
    amount_requested: Optional[float] = None,
    interaction_type: Optional[str] = None,
) -> VerificationRiskResult:
    """
    Score a suspicious interaction using transparent keyword rules.

    Does not claim the interaction is definitely fraudulent — a trusted contact
    must confirm that.
    """
    text = _combine_text(description, requested_action, sender_name, sender_contact)
    score = 0
    reasons: List[str] = []

    for reason, points, patterns in RISK_RULES:
        if any(re.search(pattern, text, flags=re.IGNORECASE) for pattern in patterns):
            score += points
            reasons.append(reason)

    if amount_requested is not None and amount_requested >= 500:
        score += 10
        reasons.append("Large amount of money was requested")

    if interaction_type == "payment_request" and amount_requested is not None:
        score += 5
        if "Payment request interaction" not in reasons:
            reasons.append("This was reported as a payment request")

    score = max(0, min(100, score))
    level = score_to_verification_level(score)

    if not reasons:
        reasons = ["No strong scam warning signs were found in the details provided"]
        summary = (
            "Based on the details shared, we did not find strong warning signs. "
            "A trusted contact can still help you double-check before you take action."
        )
    elif level in ("high", "critical"):
        summary = (
            "Several warning signs were found. Do not send money, share a verification "
            "code, install software, or give remote access until someone you trust has "
            "reviewed this request. This is not a final decision that it is a scam."
        )
    else:
        summary = (
            "Some possible warning signs were found. Please wait for your trusted "
            "contact to review before you take further action."
        )

    return VerificationRiskResult(
        risk_score=score,
        risk_level=level,
        risk_reasons=reasons,
        summary=summary,
    )
