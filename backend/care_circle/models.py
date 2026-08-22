"""Pydantic models for CareCircle share onboarding."""

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from backend.care_circle.message_templates import TEMPLATE_KEYS
from backend.care_circle.phone_utils import validate_phone
from backend.utils import sanitize_input

SharingStatus = Literal[
    "not_started", "prepared", "share_opened", "user_confirmed_shared"
]
MessageTemplateKey = Literal["default", "short", "warm", "security_focused"]


class ProtectedNumberResponse(BaseModel):
    protected_number: str
    protected_number_formatted: str
    activated_at: Optional[str] = None
    onboarding_completed_at: Optional[str] = None
    onboarding_deferred_at: Optional[str] = None


class TrustedContactCreateRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=10, max_length=25)
    relationship: Optional[str] = Field(None, max_length=100)
    is_selected: bool = True

    @field_validator("first_name", "relationship")
    @classmethod
    def sanitize_text(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return sanitize_input(v, max_length=100)

    @field_validator("phone")
    @classmethod
    def validate_phone_field(cls, v: str) -> str:
        if not validate_phone(v):
            raise ValueError("Invalid phone number format")
        return v.strip()


class TrustedContactUpdateRequest(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=25)
    relationship: Optional[str] = Field(None, max_length=100)
    is_selected: Optional[bool] = None

    @field_validator("first_name", "relationship")
    @classmethod
    def sanitize_text(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return sanitize_input(v, max_length=100)

    @field_validator("phone")
    @classmethod
    def validate_phone_field(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not validate_phone(v):
            raise ValueError("Invalid phone number format")
        return v.strip()


class BulkSelectRequest(BaseModel):
    is_selected: bool


class ShareEventUpdateRequest(BaseModel):
    message_template: Optional[MessageTemplateKey] = None
    custom_message: Optional[str] = Field(None, max_length=2000)
    sharing_status: Optional[SharingStatus] = None

    @field_validator("message_template")
    @classmethod
    def validate_template(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if v not in TEMPLATE_KEYS:
            raise ValueError(f"Invalid template. Must be one of: {', '.join(TEMPLATE_KEYS)}")
        return v

    @field_validator("custom_message")
    @classmethod
    def sanitize_custom_message(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return sanitize_input(v, max_length=2000)


class ShareEventResponse(BaseModel):
    message_template: MessageTemplateKey
    custom_message: Optional[str] = None
    message_preview: str
    sharing_status: SharingStatus
    last_share_action_at: Optional[str] = None


class TrustedContactResponse(BaseModel):
    id: UUID
    first_name: str
    phone: str
    phone_formatted: str
    relationship: Optional[str] = None
    is_selected: bool
    share_event: Optional[ShareEventResponse] = None
    created_at: str
    updated_at: str


class ShareOnboardingSummaryResponse(BaseModel):
    protected_number_formatted: Optional[str] = None
    total_contacts: int
    selected_contacts: int
    prepared_count: int
    share_opened_count: int
    user_confirmed_shared_count: int
    remaining_contacts: int
    onboarding_completed: bool
    onboarding_deferred: bool


class OnboardingActionResponse(BaseModel):
    message: str
    completed_at: Optional[str] = None
    deferred_at: Optional[str] = None
