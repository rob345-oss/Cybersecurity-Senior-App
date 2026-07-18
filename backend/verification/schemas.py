"""Pydantic schemas for Trusted Contact Verification."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from backend.utils import sanitize_input
from backend.verification.risk_analyzer import VerificationRiskLevel

InteractionType = Literal[
    "call", "text", "email", "website", "payment_request", "other"
]

VerificationStatus = Literal[
    "pending",
    "likely_safe",
    "suspicious",
    "confirmed_scam",
    "needs_discussion",
]

ReviewStatus = Literal[
    "likely_safe",
    "suspicious",
    "confirmed_scam",
    "needs_discussion",
]

ListRole = Literal["submitted", "review", "all"]


class TrustedContactCreateRequest(BaseModel):
    contact_email: str = Field(..., min_length=3, max_length=320)
    label: Optional[str] = Field(None, max_length=100)

    @field_validator("contact_email", "label")
    @classmethod
    def sanitize_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return sanitize_input(v, max_length=320)


class TrustedContactResponse(BaseModel):
    id: UUID
    user_id: UUID
    contact_user_id: UUID
    contact_email: Optional[str] = None
    contact_name: Optional[str] = None
    label: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class VerificationRequestCreate(BaseModel):
    trusted_contact_id: UUID
    interaction_type: InteractionType
    description: str = Field(..., min_length=1, max_length=5000)
    sender_name: Optional[str] = Field(None, max_length=200)
    sender_contact: Optional[str] = Field(None, max_length=200)
    requested_action: Optional[str] = Field(None, max_length=2000)
    amount_requested: Optional[Decimal] = Field(None, ge=0, le=Decimal("9999999999.99"))

    @field_validator("description", "sender_name", "sender_contact", "requested_action")
    @classmethod
    def sanitize_text(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return sanitize_input(v, max_length=5000)


class VerificationReviewRequest(BaseModel):
    status: ReviewStatus
    reviewer_notes: Optional[str] = Field(None, max_length=5000)

    @field_validator("reviewer_notes")
    @classmethod
    def sanitize_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return sanitize_input(v, max_length=5000)


class RiskAnalysisResponse(BaseModel):
    risk_score: int
    risk_level: VerificationRiskLevel
    risk_reasons: List[str]
    summary: str


class VerificationRequestResponse(BaseModel):
    id: UUID
    user_id: UUID
    trusted_contact_id: UUID
    interaction_type: InteractionType
    sender_name: Optional[str] = None
    sender_contact: Optional[str] = None
    description: str
    requested_action: Optional[str] = None
    amount_requested: Optional[Decimal] = None
    screenshot_url: Optional[str] = None
    risk_score: Optional[int] = None
    risk_level: Optional[VerificationRiskLevel] = None
    risk_reasons: List[str] = Field(default_factory=list)
    status: VerificationStatus
    reviewer_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    submitter_name: Optional[str] = None
    submitter_email: Optional[str] = None
    trusted_contact_label: Optional[str] = None
    is_stale: bool = False

    model_config = {"from_attributes": True}


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    title: str
    body: str
    payload: dict = Field(default_factory=dict)
    read_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
