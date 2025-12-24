from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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

app = FastAPI(title="Titanium Guardian API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"] ,
)

store = MemoryStore()


class MoneyGuardAssessRequest(BaseModel):
    amount: float
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


class IdentityWatchProfileRequest(BaseModel):
    emails: List[str]
    phones: List[str]
    full_name: Optional[str] = None
    state: Optional[str] = None


class IdentityWatchProfileResponse(BaseModel):
    profile_id: str
    created: datetime


class IdentityWatchRiskRequest(BaseModel):
    profile_id: str
    signals: Dict[str, bool]


_profiles: Dict[str, IdentityWatchProfileRequest] = {}


@app.post("/v1/session/start", response_model=SessionStartResponse)
def start_session(request: SessionStartRequest) -> SessionStartResponse:
    record = store.start_session(str(request.user_id), request.device_id, request.module)
    return SessionStartResponse(session_id=record.session_id)


@app.post("/v1/session/{session_id}/event", response_model=RiskResponse)
def append_event(session_id: str, event: EventIn) -> RiskResponse:
    record = store.get_session(session_id)
    if not record:
        raise HTTPException(status_code=404, detail="Session not found")

    store.append_event(session_id, event)
    risk = _assess_session_risk(record.module, record.events)
    store.update_last_risk(session_id, risk)
    return risk


@app.post("/v1/session/{session_id}/end", response_model=SessionSummary)
def end_session(session_id: str) -> SessionSummary:
    record = store.get_session(session_id)
    if not record or not record.last_risk:
        raise HTTPException(status_code=404, detail="Session not found or no risk score")
    takeaways = record.last_risk.reasons[:3]
    summary = store.summarize(session_id, takeaways)
    if not summary:
        raise HTTPException(status_code=404, detail="Session not found")
    return summary


@app.get("/v1/session/{session_id}", response_model=SessionDetail)
def get_session(session_id: str) -> SessionDetail:
    record = store.get_session(session_id)
    if not record:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionDetail(events=record.events, last_risk=record.last_risk)


@app.post("/v1/moneyguard/assess", response_model=RiskResponse)
def moneyguard_assess(request: MoneyGuardAssessRequest) -> RiskResponse:
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
            event = EventIn(type="assess", payload=payload, timestamp=datetime.utcnow())
            store.append_event(record.session_id, event)
    else:
        store.start_session(user_id="00000000-0000-0000-0000-000000000000", device_id="local", module="moneyguard")

    risk = moneyguard.assess(payload)
    return risk


@app.post("/v1/moneyguard/safe_steps")
def moneyguard_safe_steps(request: MoneyGuardSafeStepsRequest) -> Dict[str, List[Dict[str, str]]]:
    return moneyguard.safe_steps()


@app.post("/v1/inboxguard/analyze_text", response_model=RiskResponse)
def inboxguard_analyze_text(request: InboxGuardTextRequest) -> RiskResponse:
    return inboxguard.analyze_text(request.text, request.channel)


@app.post("/v1/inboxguard/analyze_url", response_model=RiskResponse)
def inboxguard_analyze_url(request: InboxGuardURLRequest) -> RiskResponse:
    return inboxguard.analyze_url(request.url)


@app.post("/v1/identitywatch/profile", response_model=IdentityWatchProfileResponse)
def identitywatch_profile(request: IdentityWatchProfileRequest) -> IdentityWatchProfileResponse:
    profile_id = f"profile-{len(_profiles) + 1}"
    _profiles[profile_id] = request
    return IdentityWatchProfileResponse(profile_id=profile_id, created=datetime.utcnow())


@app.post("/v1/identitywatch/check_risk", response_model=RiskResponse)
def identitywatch_check_risk(request: IdentityWatchRiskRequest) -> RiskResponse:
    if request.profile_id not in _profiles:
        raise HTTPException(status_code=404, detail="Profile not found")
    return identitywatch.assess(request.signals)


def _assess_session_risk(module: ModuleName, events: List[Any]) -> RiskResponse:
    if module == "callguard":
        signals = [event.payload.get("signal_key") for event in events if event.type == "signal"]
        signals = [signal for signal in signals if signal]
        return callguard.assess(signals)
    if module == "moneyguard":
        latest = next((event for event in reversed(events) if event.type == "assess"), None)
        payload = latest.payload if latest else {}
        return moneyguard.assess(payload)
    if module == "inboxguard":
        latest = next((event for event in reversed(events) if event.type in {"text", "url"}), None)
        if latest and latest.type == "text":
            return inboxguard.analyze_text(latest.payload.get("text", ""), latest.payload.get("channel", "other"))
        if latest and latest.type == "url":
            return inboxguard.analyze_url(latest.payload.get("url", ""))
    if module == "identitywatch":
        latest = next((event for event in reversed(events) if event.type == "signals"), None)
        payload = latest.payload if latest else {}
        return identitywatch.assess(payload)

    return callguard.assess([])
