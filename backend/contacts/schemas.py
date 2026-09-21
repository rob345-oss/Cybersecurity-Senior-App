"""Pydantic schemas for contacts and trusted callers APIs."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ContactOut(BaseModel):
    id: str
    display_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    primary_phone: Optional[str] = None
    normalized_phone: Optional[str] = None
    additional_phone_numbers: List[Dict[str, Any]] = Field(default_factory=list)
    email: Optional[str] = None
    photo_url: Optional[str] = None
    source: str
    is_trusted: bool
    relationship: Optional[str] = None
    source_contact_deleted: bool = False
    last_synced_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class ContactsListResponse(BaseModel):
    contacts: List[ContactOut]
    total: int
    page: int
    page_size: int
    google_status: Optional[str] = None
    last_synced_at: Optional[datetime] = None
    trusted_count: int = 0


class GoogleConnectResponse(BaseModel):
    authorize_url: str


class GoogleStatusResponse(BaseModel):
    status: str
    connected: bool
    account_email: Optional[str] = None
    last_synced_at: Optional[datetime] = None
    contact_count: int = 0
    trusted_count: int = 0


class SyncResponse(BaseModel):
    message: str
    created: int = 0
    updated: int = 0
    deleted_flagged: int = 0
    total_fetched: int = 0
    duplicates_found: int = 0
    last_synced_at: Optional[str] = None


class TrustRequest(BaseModel):
    relationship: Optional[str] = None
    notes: Optional[str] = None


class BulkTrustRequest(BaseModel):
    contact_ids: List[UUID]
    relationship: Optional[str] = None
    action: str = Field(..., pattern="^(add|remove)$")


class BulkTrustResponse(BaseModel):
    message: str
    count: int


class ManualTrustedRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=512)
    phone: str = Field(..., min_length=3, max_length=64)
    relationship: Optional[str] = Field(None, max_length=64)
    notes: Optional[str] = Field(None, max_length=2000)


class TrustedCallerOut(BaseModel):
    id: str
    contact_id: str
    name: str
    phone: Optional[str] = None
    normalized_phone: str
    relationship: Optional[str] = None
    notes: Optional[str] = None
    source: str
    photo_url: Optional[str] = None
    source_contact_deleted: bool = False


class TrustedCheckResponse(BaseModel):
    trusted: bool
    contact_id: Optional[str] = None
    name: Optional[str] = None
    relationship: Optional[str] = None
    source: Optional[str] = None
    normalized_phone: Optional[str] = None


class ContactUpdateRequest(BaseModel):
    relationship: Optional[str] = None
    notes: Optional[str] = None
    is_trusted: Optional[bool] = None


class MergeRequest(BaseModel):
    keep_contact_id: UUID


class DeleteDataRequest(BaseModel):
    confirm: bool = False
    remove_trusted_callers: bool = False


class MessageResponse(BaseModel):
    message: str
    details: Optional[Dict[str, Any]] = None
