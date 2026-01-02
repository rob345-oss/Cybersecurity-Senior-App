from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID
import os
import logging
import re

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from urllib.parse import urlparse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

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
from backend.database.connection import check_database_connection, init_db
from backend.database.exceptions import DatabaseConnectionError
from backend.database.models import User
from backend.auth.router import router as auth_router, set_limiter
from backend.auth.dependencies import get_current_user

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("Checking database connection...")
    # Make database connection optional in development
    skip_db_check = os.getenv("SKIP_DB_CHECK", "false").lower() == "true"
    
    try:
        # Check database connection before proceeding
        is_connected = await check_database_connection()
        if not is_connected:
            if skip_db_check:
                logger.warning("Database connection failed, but SKIP_DB_CHECK is enabled. Continuing without database.")
            else:
                raise DatabaseConnectionError(
                    "Failed to connect to database. Please check your DATABASE_URL and ensure PostgreSQL is running. "
                    "To skip database check in development, set SKIP_DB_CHECK=true in your .env file."
                )
        else:
            logger.info("Database connection verified")
            logger.info("Initializing database...")
            try:
                await init_db()
                logger.info("Database initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize database: {e}", exc_info=True)
                if not skip_db_check:
                    raise
    except DatabaseConnectionError as e:
        if skip_db_check:
            logger.warning(f"Database connection failed, but SKIP_DB_CHECK is enabled: {e}")
        else:
            logger.error(f"Database connection failed: {e}")
            raise
    except Exception as e:
        if skip_db_check:
            logger.warning(f"Unexpected error checking database connection (SKIP_DB_CHECK enabled): {e}")
        else:
            logger.error(f"Unexpected error checking database connection: {e}", exc_info=True)
            raise DatabaseConnectionError(f"Database connection check failed: {e}") from e
    
    yield
    
    # Shutdown (if needed)
    logger.info("Shutting down...")


app = FastAPI(
    title="Titanium Guardian API",
    version="0.1.0",
    description="Cybersecurity risk assessment API for detecting and preventing fraud, phishing, and social engineering attacks. Provides risk scoring and actionable recommendations for CallGuard, MoneyGuard, InboxGuard, and IdentityWatch modules.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Initialize rate limiter (must be after app creation for proper integration)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS with environment variable support
# CORS_ORIGINS should be a comma-separated list of allowed origins
# If not set or set to "*", allows all origins (development mode)
# Example: CORS_ORIGINS=https://example.com,https://app.example.com
cors_origins_env = os.getenv("CORS_ORIGINS", "*")
if cors_origins_env == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True if "*" not in allowed_origins else False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

from backend.utils import sanitize_input

store = MemoryStore()

# Include auth router
set_limiter(limiter)
app.include_router(auth_router)


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

    @field_validator("payment_method", "recipient", "impersonation_type")
    @classmethod
    def sanitize_string_fields(cls, v: str) -> str:
        """Sanitize string fields to prevent XSS attacks."""
        if not isinstance(v, str):
            return v
        return sanitize_input(v, max_length=500)

    @field_validator("reason")
    @classmethod
    def sanitize_reason(cls, v: str) -> str:
        """Sanitize reason field (can be longer)."""
        if not isinstance(v, str):
            return v
        return sanitize_input(v, max_length=1000)


class MoneyGuardSafeStepsRequest(BaseModel):
    session_id: Optional[str] = None


class InboxGuardTextRequest(BaseModel):
    text: str
    channel: str

    @field_validator("text")
    @classmethod
    def sanitize_text(cls, v: str) -> str:
        """Sanitize text field (allows longer content)."""
        if not isinstance(v, str):
            return v
        return sanitize_input(v, max_length=10000)

    @field_validator("channel")
    @classmethod
    def sanitize_channel(cls, v: str) -> str:
        """Sanitize channel field."""
        if not isinstance(v, str):
            return v
        return sanitize_input(v, max_length=100)


class InboxGuardURLRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("URL cannot be empty")
        # Sanitize first to prevent XSS
        sanitized = sanitize_input(v.strip(), max_length=2000)
        # Basic URL validation
        parsed = urlparse(sanitized)
        if not parsed.scheme:
            raise ValueError("URL must include a scheme (http:// or https://)")
        if not parsed.netloc:
            raise ValueError("URL must include a domain")
        # Check for valid scheme
        if parsed.scheme not in ("http", "https"):
            raise ValueError("URL scheme must be http or https")
        return sanitized


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
        sanitized_emails = []
        for email in v:
            if not email or not email.strip():
                raise ValueError("Email cannot be empty")
            # Sanitize email to prevent XSS
            sanitized = sanitize_input(email.strip(), max_length=254)  # RFC 5321 max length
            if not email_pattern.match(sanitized):
                raise ValueError(f"Invalid email format: {email}")
            sanitized_emails.append(sanitized)
        return sanitized_emails

    @field_validator("phones")
    @classmethod
    def validate_phones(cls, v: List[str]) -> List[str]:
        # Remove common phone number formatting characters
        phone_pattern = re.compile(r"^[\d\s\-\+\(\)]{10,20}$")
        sanitized_phones = []
        for phone in v:
            if not phone or not phone.strip():
                raise ValueError("Phone number cannot be empty")
            # Sanitize phone number
            sanitized = sanitize_input(phone.strip(), max_length=20)
            # Remove formatting for validation
            cleaned = re.sub(r"[\s\-\(\)]", "", sanitized)
            if not cleaned.startswith("+") and len(cleaned) < 10:
                raise ValueError(f"Phone number too short: {phone}")
            if not phone_pattern.match(sanitized):
                raise ValueError(f"Invalid phone number format: {phone}")
            sanitized_phones.append(sanitized)
        return sanitized_phones

    @field_validator("full_name")
    @classmethod
    def sanitize_full_name(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize full_name field."""
        if v is None:
            return None
        return sanitize_input(v, max_length=200)

    @field_validator("state")
    @classmethod
    def sanitize_state(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize state field."""
        if v is None:
            return None
        return sanitize_input(v, max_length=100)


class IdentityWatchProfileResponse(BaseModel):
    profile_id: str
    created: datetime


class IdentityWatchRiskRequest(BaseModel):
    profile_id: str
    signals: Dict[str, bool]


_profiles: Dict[str, IdentityWatchProfileRequest] = {}


@app.post("/v1/session/start", response_model=SessionStartResponse)
@limiter.limit("100/minute")
async def start_session(
    request: Request,
    session_request: SessionStartRequest,
    current_user: User = Depends(get_current_user)
) -> SessionStartResponse:
    record = store.start_session(str(session_request.user_id), session_request.device_id, session_request.module)
    return SessionStartResponse(session_id=record.session_id)


@app.post("/v1/session/{session_id}/event", response_model=RiskResponse)
@limiter.limit("200/minute")
async def append_event(
    request: Request,
    session_id: str,
    event: EventIn,
    current_user: User = Depends(get_current_user)
) -> RiskResponse:
    record = store.get_session(session_id)
    if not record:
        raise HTTPException(status_code=404, detail="Session not found")

    store.append_event(session_id, event)
    try:
        logger.info(f"Assessing risk for session {session_id}, module: {record.module}, event type: {event.type}")
        risk = await _assess_session_risk(record.module, record.events)
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
@limiter.limit("100/minute")
async def end_session(
    request: Request,
    session_id: str,
    current_user: User = Depends(get_current_user)
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
@limiter.limit("200/minute")
async def get_session(
    request: Request,
    session_id: str,
    current_user: User = Depends(get_current_user)
) -> SessionDetail:
    record = store.get_session(session_id)
    if not record:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Decrypt event payloads before returning (events stored with encrypted sensitive fields)
    from backend.storage.encryption import get_encryption
    encryption = get_encryption()
    from backend.models import EventOut
    
    decrypted_events = []
    for event in record.events:
        # Decrypt sensitive fields in the payload dictionary
        if isinstance(event.payload, dict):
            # Use the storage's decrypt method which knows which fields are sensitive
            decrypted_payload = store._decrypt_event_payload(event.payload)
        else:
            decrypted_payload = event.payload
        
        decrypted_event = EventOut(
            id=event.id,
            type=event.type,
            payload=decrypted_payload,
            timestamp=event.timestamp,
        )
        decrypted_events.append(decrypted_event)
    
    return SessionDetail(events=decrypted_events, last_risk=record.last_risk)


@app.post("/v1/moneyguard/assess", response_model=RiskResponse)
@limiter.limit("100/minute")
async def moneyguard_assess(
    request: Request,
    assess_request: MoneyGuardAssessRequest,
    current_user: User = Depends(get_current_user)
) -> RiskResponse:
    payload = assess_request.dict(exclude={"session_id"})
    flags = {
        "urgency_present": assess_request.urgency_present,
        "asked_to_keep_secret": assess_request.asked_to_keep_secret,
        "asked_for_verification_code": assess_request.asked_for_verification_code,
        "asked_for_remote_access": assess_request.asked_for_remote_access,
        "impersonation_type": assess_request.impersonation_type,
    }
    payload["flags"] = flags
    payload["did_they_contact_you_first"] = assess_request.did_they_contact_you_first

    if assess_request.session_id:
        record = store.get_session(assess_request.session_id)
        if record:
            event = EventIn(type="assess", payload=payload, timestamp=datetime.now(timezone.utc))
            store.append_event(record.session_id, event)

    try:
        logger.info(f"Assessing MoneyGuard risk: amount={assess_request.amount}, payment_method={assess_request.payment_method}, session_id={assess_request.session_id}")
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
@limiter.limit("100/minute")
async def moneyguard_safe_steps(
    request: Request,
    steps_request: MoneyGuardSafeStepsRequest,
    current_user: User = Depends(get_current_user)
) -> Dict[str, List[Dict[str, str]]]:
    return moneyguard.safe_steps()


@app.post("/v1/inboxguard/analyze_text", response_model=RiskResponse)
@limiter.limit("100/minute")
async def inboxguard_analyze_text(
    request: Request,
    text_request: InboxGuardTextRequest,
    current_user: User = Depends(get_current_user)
) -> RiskResponse:
    try:
        logger.info(f"Analyzing InboxGuard text: channel={text_request.channel}, text_length={len(text_request.text)}")
        risk = inboxguard.analyze_text(text_request.text, text_request.channel)
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
@limiter.limit("100/minute")
async def inboxguard_analyze_url(
    request: Request,
    url_request: InboxGuardURLRequest,
    current_user: User = Depends(get_current_user)
) -> RiskResponse:
    try:
        logger.info(f"Analyzing InboxGuard URL: {url_request.url}")
        risk = inboxguard.analyze_url(url_request.url)
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
@limiter.limit("50/minute")
async def identitywatch_profile(
    request: Request,
    profile_request: IdentityWatchProfileRequest,
    current_user: User = Depends(get_current_user)
) -> IdentityWatchProfileResponse:
    profile_id = f"profile-{len(_profiles) + 1}"
    _profiles[profile_id] = profile_request
    return IdentityWatchProfileResponse(profile_id=profile_id, created=datetime.now(timezone.utc))


@app.get("/v1/data-retention/policy")
@limiter.limit("50/minute")
async def get_retention_policy(
    request: Request,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get current data retention policy configuration.
    
    This endpoint returns information about how long different types of data
    are retained before being automatically deleted.
    """
    return store.get_retention_policy_summary()


@app.post("/v1/identitywatch/check_risk", response_model=RiskResponse)
@limiter.limit("100/minute")
async def identitywatch_check_risk(
    request: Request,
    risk_request: IdentityWatchRiskRequest,
    current_user: User = Depends(get_current_user)
) -> RiskResponse:
    if risk_request.profile_id not in _profiles:
        raise HTTPException(status_code=404, detail="Profile not found")
    try:
        logger.info(f"Assessing IdentityWatch risk for profile {risk_request.profile_id}, signals_count={len(risk_request.signals)}")
        risk = identitywatch.assess(risk_request.signals)
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


async def _assess_session_risk(module: ModuleName, events: List[Any]) -> RiskResponse:
    """
    Assess risk for a session based on module type and events.
    Decrypts event payloads before passing to risk assessment functions.
    """
    try:
        # Decrypt event payloads before using them for risk assessment
        def get_decrypted_payload(event):
            """Get decrypted payload for an event."""
            if isinstance(event.payload, dict):
                return store._decrypt_event_payload(event.payload)
            return event.payload
        
        if module == "callguard":
            signals = [
                get_decrypted_payload(event).get("signal_key") 
                for event in events if event.type == "signal"
            ]
            signals = [signal for signal in signals if signal]
            logger.debug(f"CallGuard assessment: signals={signals}")
            return callguard.assess(signals)
        if module == "moneyguard":
            latest = next((event for event in reversed(events) if event.type == "assess"), None)
            payload = get_decrypted_payload(latest) if latest else {}
            logger.debug(f"MoneyGuard assessment: payload_keys={list(payload.keys())}")
            return moneyguard.assess(payload)
        if module == "inboxguard":
            latest = next((event for event in reversed(events) if event.type in {"text", "url"}), None)
            if latest and latest.type == "text":
                decrypted_payload = get_decrypted_payload(latest)
                text = decrypted_payload.get("text", "")
                channel = decrypted_payload.get("channel", "other")
                logger.debug(f"InboxGuard text analysis: channel={channel}, text_length={len(text)}")
                return inboxguard.analyze_text(text, channel)
            if latest and latest.type == "url":
                decrypted_payload = get_decrypted_payload(latest)
                url = decrypted_payload.get("url", "")
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
