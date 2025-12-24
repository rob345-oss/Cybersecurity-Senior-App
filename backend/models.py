from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


RiskLevel = Literal["low", "medium", "high"]
ModuleName = Literal["callguard", "moneyguard", "inboxguard", "identitywatch"]


class RecommendedAction(BaseModel):
    id: str
    title: str
    detail: str


class SafeScript(BaseModel):
    say_this: str
    if_they_push_back: str


class RiskResponse(BaseModel):
    score: int = Field(ge=0, le=100)
    level: RiskLevel
    reasons: List[str]
    next_action: str
    recommended_actions: List[RecommendedAction]
    safe_script: Optional[SafeScript] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SessionStartRequest(BaseModel):
    user_id: UUID
    device_id: str
    module: ModuleName
    context: Optional[Dict[str, Any]] = None


class SessionStartResponse(BaseModel):
    session_id: str


class EventIn(BaseModel):
    type: str
    payload: Dict[str, Any]
    timestamp: datetime


class EventOut(BaseModel):
    id: str
    type: str
    payload: Dict[str, Any]
    timestamp: datetime


class SessionSummary(BaseModel):
    session_id: str
    module: ModuleName
    created_at: datetime
    last_risk: RiskResponse
    key_takeaways: List[str]


class SessionDetail(BaseModel):
    events: List[EventOut]
    last_risk: Optional[RiskResponse]
