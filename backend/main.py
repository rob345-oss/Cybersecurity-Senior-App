from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID
import os
import logging

from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from urllib.parse import urlparse
import re

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from backend.models import (
    EventIn,
    ModuleName,
    RiskResponse,
    SessionDetail,
    SessionStartRequest,
    SessionStartResponse,
    SessionSummary,
)
from backend.risk_engine import callguard, identitywatch, inboxguard, moneyguard
from backend.storage.memory import MemoryStore

app = FastAPI(
    title="Titanium Guardian API",
    version="0.1.0",
    description="Cybersecurity risk assessment API for detecting and preventing fraud, phishing, and social engineering attacks. Provides risk scoring and actionable recommendations for CallGuard, MoneyGuard, InboxGuard, and IdentityWatch modules.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"] ,
)

store = MemoryStore()

# API Key Authentication
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)
API_KEY = os.getenv("API_KEY", "")


def verify_api_key(api_key: Optional[str] = Security(API_KEY_HEADER)) -> str:
    """Verify the API key from the request header."""
    if not API_KEY:
        # If no API key is set in environment, skip validation (for development)
        return ""
    
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="API key is required. Please provide X-API-Key header."
        )
    
    if api_key != API_KEY:
        raise HTTPException(
            status_code=403,
            detail="Invalid API key."
        )
    
    return api_key


class MoneyGuardAssessRequest(BaseModel):
    amount: float = Field(..., ge=0, le=1000000000, description="Amount must be between 0 and 1,000,000,000")
    payment_method: str
    recipient: str
    reason: str
    did_they_contact_you_first: bool
    urgency_present: bool
    asked_to_keep_secret: bool
    asked_for_verification_code: bool
    asked_for_remote_access: bool
    impersonation_type: str
    session_id: Optional[str] = None


class MoneyGuardSafeStepsRequest(BaseModel):
    session_id: Optional[str] = None


class InboxGuardTextRequest(BaseModel):
    text: str
    channel: str


class InboxGuardURLRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("URL cannot be empty")
        # Basic URL validation
        parsed = urlparse(v)
        if not parsed.scheme:
            raise ValueError("URL must include a scheme (http:// or https://)")
        if not parsed.netloc:
            raise ValueError("URL must include a domain")
        # Check for valid scheme
        if parsed.scheme not in ("http", "https"):
            raise ValueError("URL scheme must be http or https")
        return v


class IdentityWatchProfileRequest(BaseModel):
    emails: List[str] = Field(..., min_length=1, description="At least one email is required")
    phones: List[str] = Field(..., min_length=1, description="At least one phone number is required")
    full_name: Optional[str] = None
    state: Optional[str] = None

    @field_validator("emails")
    @classmethod
    def validate_emails(cls, v: List[str]) -> List[str]:
        email_pattern = re.compile(
            r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        )
        for email in v:
            if not email or not email.strip():
                raise ValueError("Email cannot be empty")
            if not email_pattern.match(email.strip()):
                raise ValueError(f"Invalid email format: {email}")
        return [email.strip() for email in v]

    @field_validator("phones")
    @classmethod
    def validate_phones(cls, v: List[str]) -> List[str]:
        # Remove common phone number formatting characters
        phone_pattern = re.compile(r"^[\d\s\-\+\(\)]{10,20}$")
        for phone in v:
            if not phone or not phone.strip():
                raise ValueError("Phone number cannot be empty")
            # Remove formatting for validation
            cleaned = re.sub(r"[\s\-\(\)]", "", phone.strip())
            if not cleaned.startswith("+") and len(cleaned) < 10:
                raise ValueError(f"Phone number too short: {phone}")
            if not phone_pattern.match(phone.strip()):
                raise ValueError(f"Invalid phone number format: {phone}")
        return [phone.strip() for phone in v]


class IdentityWatchProfileResponse(BaseModel):
    profile_id: str
    created: datetime


class IdentityWatchRiskRequest(BaseModel):
    profile_id: str
    signals: Dict[str, bool]


_profiles: Dict[str, IdentityWatchProfileRequest] = {}


@app.post("/v1/session/start", response_model=SessionStartResponse)
def start_session(
    request: SessionStartRequest,
    api_key: str = Depends(verify_api_key)
) -> SessionStartResponse:
    record = store.start_session(str(request.user_id), request.device_id, request.module)
    return SessionStartResponse(session_id=record.session_id)


@app.post("/v1/session/{session_id}/event", response_model=RiskResponse)
def append_event(
    session_id: str,
    event: EventIn,
    api_key: str = Depends(verify_api_key)
) -> RiskResponse:
    record = store.get_session(session_id)
    if not record:
        raise HTTPException(status_code=404, detail="Session not found")

    store.append_event(session_id, event)
    try:
        logger.info(f"Assessing risk for session {session_id}, module: {record.module}, event type: {event.type}")
        risk = _assess_session_risk(record.module, record.events)
        store.update_last_risk(session_id, risk)
        logger.info(f"Risk assessment completed for session {session_id}, score: {risk.score}")
        return risk
    except Exception as e:
        logger.error(f"Error assessing risk for session {session_id}, module: {record.module}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to assess risk for session. Error: {str(e)}. Please try again or contact support if the issue persists."
        )


@app.post("/v1/session/{session_id}/end", response_model=SessionSummary)
def end_session(
    session_id: str,
    api_key: str = Depends(verify_api_key)
) -> SessionSummary:
    record = store.get_session(session_id)
    if not record or not record.last_risk:
        raise HTTPException(status_code=404, detail="Session not found or no risk score")
    takeaways = record.last_risk.reasons[:3]
    summary = store.summarize(session_id, takeaways)
    if not summary:
        raise HTTPException(status_code=404, detail="Session not found")
    return summary


@app.get("/v1/session/{session_id}", response_model=SessionDetail)
def get_session(
    session_id: str,
    api_key: str = Depends(verify_api_key)
) -> SessionDetail:
    record = store.get_session(session_id)
    if not record:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionDetail(events=record.events, last_risk=record.last_risk)


@app.post("/v1/moneyguard/assess", response_model=RiskResponse)
def moneyguard_assess(
    request: MoneyGuardAssessRequest,
    api_key: str = Depends(verify_api_key)
) -> RiskResponse:
    payload = request.dict(exclude={"session_id"})
    flags = {
        "urgency_present": request.urgency_present,
        "asked_to_keep_secret": request.asked_to_keep_secret,
        "asked_for_verification_code": request.asked_for_verification_code,
        "asked_for_remote_access": request.asked_for_remote_access,
        "impersonation_type": request.impersonation_type,
    }
    payload["flags"] = flags
    payload["did_they_contact_you_first"] = request.did_they_contact_you_first

    if request.session_id:
        record = store.get_session(request.session_id)
        if record:
            event = EventIn(type="assess", payload=payload, timestamp=datetime.now(timezone.utc))
            store.append_event(record.session_id, event)

    try:
        logger.info(f"Assessing MoneyGuard risk: amount={request.amount}, payment_method={request.payment_method}, session_id={request.session_id}")
        risk = moneyguard.assess(payload)
        logger.info(f"MoneyGuard risk assessment completed: score={risk.score}, reasons_count={len(risk.reasons)}")
        return risk
    except ValueError as e:
        logger.warning(f"Invalid input for MoneyGuard assessment: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid request data for MoneyGuard assessment: {str(e)}. Please check your input and try again."
        )
    except Exception as e:
        logger.error(f"Error in MoneyGuard risk assessment: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to assess payment risk. Error: {str(e)}. Please try again or contact support if the issue persists."
        )


@app.post("/v1/moneyguard/safe_steps")
def moneyguard_safe_steps(
    request: MoneyGuardSafeStepsRequest,
    api_key: str = Depends(verify_api_key)
) -> Dict[str, List[Dict[str, str]]]:
    return moneyguard.safe_steps()


@app.post("/v1/inboxguard/analyze_text", response_model=RiskResponse)
def inboxguard_analyze_text(
    request: InboxGuardTextRequest,
    api_key: str = Depends(verify_api_key)
) -> RiskResponse:
    try:
        logger.info(f"Analyzing InboxGuard text: channel={request.channel}, text_length={len(request.text)}")
        risk = inboxguard.analyze_text(request.text, request.channel)
        logger.info(f"InboxGuard text analysis completed: score={risk.score}, reasons_count={len(risk.reasons)}")
        return risk
    except ValueError as e:
        logger.warning(f"Invalid input for InboxGuard text analysis: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid request data for text analysis: {str(e)}. Please check your input and try again."
        )
    except Exception as e:
        logger.error(f"Error in InboxGuard text analysis: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze message text. Error: {str(e)}. Please try again or contact support if the issue persists."
        )


@app.post("/v1/inboxguard/analyze_url", response_model=RiskResponse)
def inboxguard_analyze_url(
    request: InboxGuardURLRequest,
    api_key: str = Depends(verify_api_key)
) -> RiskResponse:
    try:
        logger.info(f"Analyzing InboxGuard URL: {request.url}")
        risk = inboxguard.analyze_url(request.url)
        logger.info(f"InboxGuard URL analysis completed: score={risk.score}, reasons_count={len(risk.reasons)}")
        return risk
    except ValueError as e:
        logger.warning(f"Invalid input for InboxGuard URL analysis: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid URL for analysis: {str(e)}. Please check the URL format and try again."
        )
    except Exception as e:
        logger.error(f"Error in InboxGuard URL analysis: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze URL. Error: {str(e)}. Please try again or contact support if the issue persists."
        )


@app.post("/v1/identitywatch/profile", response_model=IdentityWatchProfileResponse)
def identitywatch_profile(
    request: IdentityWatchProfileRequest,
    api_key: str = Depends(verify_api_key)
) -> IdentityWatchProfileResponse:
    profile_id = f"profile-{len(_profiles) + 1}"
    _profiles[profile_id] = request
    return IdentityWatchProfileResponse(profile_id=profile_id, created=datetime.now(timezone.utc))


@app.post("/v1/identitywatch/check_risk", response_model=RiskResponse)
def identitywatch_check_risk(
    request: IdentityWatchRiskRequest,
    api_key: str = Depends(verify_api_key)
) -> RiskResponse:
    if request.profile_id not in _profiles:
        raise HTTPException(status_code=404, detail="Profile not found")
    try:
        logger.info(f"Assessing IdentityWatch risk for profile {request.profile_id}, signals_count={len(request.signals)}")
        risk = identitywatch.assess(request.signals)
        logger.info(f"IdentityWatch risk assessment completed: score={risk.score}, reasons_count={len(risk.reasons)}")
        return risk
    except ValueError as e:
        logger.warning(f"Invalid input for IdentityWatch assessment: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid request data for identity risk assessment: {str(e)}. Please check your input and try again."
        )
    except Exception as e:
        logger.error(f"Error in IdentityWatch risk assessment: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to assess identity risk. Error: {str(e)}. Please try again or contact support if the issue persists."
        )


def _assess_session_risk(module: ModuleName, events: List[Any]) -> RiskResponse:
    try:
        if module == "callguard":
            signals = [event.payload.get("signal_key") for event in events if event.type == "signal"]
            signals = [signal for signal in signals if signal]
            logger.debug(f"CallGuard assessment: signals={signals}")
            return callguard.assess(signals)
        if module == "moneyguard":
            latest = next((event for event in reversed(events) if event.type == "assess"), None)
            payload = latest.payload if latest else {}
            logger.debug(f"MoneyGuard assessment: payload_keys={list(payload.keys())}")
            return moneyguard.assess(payload)
        if module == "inboxguard":
            latest = next((event for event in reversed(events) if event.type in {"text", "url"}), None)
            if latest and latest.type == "text":
                text = latest.payload.get("text", "")
                channel = latest.payload.get("channel", "other")
                logger.debug(f"InboxGuard text analysis: channel={channel}, text_length={len(text)}")
                return inboxguard.analyze_text(text, channel)
            if latest and latest.type == "url":
                url = latest.payload.get("url", "")
                logger.debug(f"InboxGuard URL analysis: url={url}")
                return inboxguard.analyze_url(url)
            # No text or URL event found
            logger.warning(f"InboxGuard: No text or URL event found in session events")
            raise ValueError("No text or URL event found in session for InboxGuard analysis")
        if module == "identitywatch":
            latest = next((event for event in reversed(events) if event.type == "signals"), None)
            payload = latest.payload if latest else {}
            logger.debug(f"IdentityWatch assessment: signals_keys={list(payload.keys()) if isinstance(payload, dict) else 'N/A'}")
            return identitywatch.assess(payload)

        # Default fallback
        logger.warning(f"Unknown module '{module}', defaulting to CallGuard with empty signals")
        return callguard.assess([])
    except ValueError as e:
        logger.error(f"Value error in _assess_session_risk for module {module}: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Unexpected error in _assess_session_risk for module {module}: {str(e)}", exc_info=True)
        raise RuntimeError(f"Failed to assess risk for module {module}: {str(e)}") from e
