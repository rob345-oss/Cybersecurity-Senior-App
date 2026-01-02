from __future__ import annotations

import re
from typing import Dict, List
from urllib.parse import urlparse

from backend.models import RecommendedAction, RiskResponse
from backend.risk_engine.base import build_risk_response

URGENCY_TERMS = {"immediately", "final notice", "today", "urgent", "asap", "emergency", "act now", "limited time"}
PAYMENT_TERMS = {"gift card", "wire", "crypto", "payment", "invoice", "western union", "moneygram", "bitcoin", "ethereum"}
OTP_TERMS = {"code", "otp", "verification", "verify", "one-time code", "verification code"}
IMPERSONATION_TERMS = {"irs", "usps", "fedex", "bank", "paypal", "microsoft", "medicare", "social security", "ssa", "treasury", "fbi", "police", "sheriff"}
# Common scam pattern terms
GRANDPARENT_SCAM_TERMS = {"grandchild", "grandson", "granddaughter", "in jail", "hospital", "car accident", "bail money", "lawyer", "attorney"}
ROMANCE_SCAM_TERMS = {"my love", "sweetheart", "darling", "emergency money", "travel expenses", "visa fees", "customs", "stranded"}
LOTTERY_SCAM_TERMS = {"you've won", "prize winner", "lottery", "sweepstakes", "jackpot", "claim your prize", "processing fee", "tax payment", "upfront payment"}
INVESTMENT_SCAM_TERMS = {"guaranteed return", "risk-free", "once in a lifetime", "exclusive opportunity", "limited offer", "act fast", "get rich quick"}
CHARITY_SCAM_TERMS = {"disaster relief", "hurricane", "flood", "wildfire", "donate now", "help victims", "urgent donation", "crisis fund"}
CONTRACTOR_SCAM_TERMS = {"damage inspection", "roof repair", "driveway", "siding", "cash discount", "today only", "leftover materials"}
MEDICARE_SCAM_TERMS = {"medicare number", "benefits verification", "new card", "medicare id", "coverage issue"}
URL_SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly"}


def _extract_urls(text: str) -> List[str]:
    return re.findall(r"https?://\S+", text)


def _url_flags(url: str) -> List[str]:
    flags = []
    parsed = urlparse(url)
    domain = parsed.netloc.lower()
    if not domain:
        return ["No domain found"]
    if domain in URL_SHORTENERS:
        flags.append("URL shortener used")
    if re.search(r"\d+\.\d+\.\d+\.\d+", domain):
        flags.append("IP address used in URL")
    if domain.count("-") >= 2:
        flags.append("Multiple hyphens in domain")
    if domain.count(".") >= 3:
        flags.append("Long subdomain chain")
    if any(keyword in url.lower() for keyword in ["login", "verify", "secure", "account", "update"]):
        flags.append("Contains sensitive action keywords")
    if "xn--" in domain:
        flags.append("Punycode domain detected")
    tld = domain.split(".")[-1]
    if len(tld) > 3:
        flags.append("Unusual TLD length")
    return flags


def analyze_text(text: str, channel: str) -> RiskResponse:
    score = 0
    reasons: List[str] = []
    lower = text.lower()

    if any(term in lower for term in URGENCY_TERMS):
        score += 20
        reasons.append("Urgency language detected")
    if any(term in lower for term in PAYMENT_TERMS):
        score += 20
        reasons.append("Payment request detected")
    if any(term in lower for term in OTP_TERMS):
        score += 25
        reasons.append("Verification code request detected")
    if "attachment" in lower:
        score += 10
        reasons.append("Attachment mentioned")
    entities = [term for term in IMPERSONATION_TERMS if term in lower]
    if entities:
        score += 20
        reasons.append("Impersonation terms detected")
    
    # Common scam pattern detection
    if any(term in lower for term in GRANDPARENT_SCAM_TERMS):
        score += 25
        reasons.append("Grandparent/Family Emergency scam indicators detected")
    if any(term in lower for term in ROMANCE_SCAM_TERMS):
        score += 23
        reasons.append("Romance scam indicators detected")
    if any(term in lower for term in LOTTERY_SCAM_TERMS):
        score += 28
        reasons.append("Lottery/Sweepstakes scam indicators detected")
    if any(term in lower for term in INVESTMENT_SCAM_TERMS):
        score += 25
        reasons.append("Investment scam indicators detected")
    if any(term in lower for term in CHARITY_SCAM_TERMS):
        score += 20
        reasons.append("Charity scam indicators detected")
    if any(term in lower for term in CONTRACTOR_SCAM_TERMS):
        score += 22
        reasons.append("Contractor scam indicators detected")
    if any(term in lower for term in MEDICARE_SCAM_TERMS):
        score += 24
        reasons.append("Medicare scam indicators detected")

    extracted_urls = _extract_urls(text)
    url_flags: List[str] = []
    for url in extracted_urls:
        url_flags.extend(_url_flags(url))
    if url_flags:
        score += 15
        reasons.append("Suspicious URLs detected")

    recommended_actions = [
        RecommendedAction(
            id="dont-click",
            title="Do not click",
            detail="Avoid clicking links or opening attachments in the message.",
        ),
        RecommendedAction(
            id="official-app",
            title="Open the official app/site",
            detail="Navigate to the service using a trusted app or bookmarked site.",
        ),
        RecommendedAction(
            id="report",
            title="Report as junk",
            detail="Use your carrier or email provider reporting tools.",
        ),
    ]

    metadata = {
        "extracted_urls": extracted_urls,
        "detected_entities": entities,
        "red_flags": reasons,
        "channel": channel,
    }

    return build_risk_response(
        score=score,
        reasons=reasons or ["No obvious red flags detected."],
        next_action="Avoid responding until you verify the sender through official channels.",
        recommended_actions=recommended_actions,
        metadata=metadata,
    )


def analyze_url(url: str) -> RiskResponse:
    flags = _url_flags(url)
    score = 15 * len(flags)
    if not flags:
        flags = ["No obvious URL red flags detected."]

    parsed = urlparse(url)
    domain = parsed.netloc.lower()

    recommended_actions = [
        RecommendedAction(
            id="manual",
            title="Open manually",
            detail="Type the known URL into your browser instead of clicking.",
        ),
        RecommendedAction(
            id="verify-sender",
            title="Verify the sender",
            detail="Confirm the message with the organization using an official contact method.",
        ),
    ]

    metadata = {
        "domain": domain,
        "looks_like_spoof": any("Punycode" in flag or "hyphens" in flag for flag in flags),
        "url_red_flags": flags,
    }

    return build_risk_response(
        score=score,
        reasons=flags,
        next_action="Avoid clicking. Validate the URL through official channels.",
        recommended_actions=recommended_actions,
        metadata=metadata,
    )
