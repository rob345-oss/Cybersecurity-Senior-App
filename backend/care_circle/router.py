"""CareCircle share onboarding API routes."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth.dependencies import get_current_user
from backend.care_circle.models import (
    BulkSelectRequest,
    OnboardingActionResponse,
    ProtectedNumberResponse,
    ShareEventUpdateRequest,
    ShareOnboardingSummaryResponse,
    ShareEventResponse,
    TrustedContactCreateRequest,
    TrustedContactResponse,
    TrustedContactUpdateRequest,
)
from backend.care_circle.repository import CareCircleRepository
from backend.database.connection import get_db
from backend.database.models import User

router = APIRouter(prefix="/v1/care-circle", tags=["care-circle"])


def _repo(db: AsyncSession) -> CareCircleRepository:
    return CareCircleRepository(db)


@router.post("/protected-number/activate", response_model=ProtectedNumberResponse)
async def activate_protected_number(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProtectedNumberResponse:
    repo = _repo(db)
    user = await repo.activate_protected_number(current_user)
    info = await repo.get_protected_number_info(user)
    return ProtectedNumberResponse(**info)


@router.get("/protected-number", response_model=ProtectedNumberResponse)
async def get_protected_number(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProtectedNumberResponse:
    repo = _repo(db)
    info = await repo.get_protected_number_info(current_user)
    if not info["protected_number"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Protected number not activated yet",
        )
    return ProtectedNumberResponse(**info)


@router.get("/trusted-contacts", response_model=list[TrustedContactResponse])
async def list_trusted_contacts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TrustedContactResponse]:
    repo = _repo(db)
    contacts = await repo.list_contacts(current_user.id)
    return [
        TrustedContactResponse(**repo.serialize_contact(current_user, c)) for c in contacts
    ]


@router.post("/trusted-contacts", response_model=TrustedContactResponse, status_code=201)
async def create_trusted_contact(
    body: TrustedContactCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TrustedContactResponse:
    repo = _repo(db)
    contact = await repo.create_contact(
        current_user,
        first_name=body.first_name,
        phone=body.phone,
        relationship=body.relationship,
        is_selected=body.is_selected,
    )
    return TrustedContactResponse(**repo.serialize_contact(current_user, contact))


@router.put("/trusted-contacts/bulk-select")
async def bulk_select_contacts(
    body: BulkSelectRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    repo = _repo(db)
    updated = await repo.bulk_select(current_user.id, body.is_selected)
    return {"updated": updated}


@router.put("/trusted-contacts/{contact_id}", response_model=TrustedContactResponse)
async def update_trusted_contact(
    contact_id: UUID,
    body: TrustedContactUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TrustedContactResponse:
    repo = _repo(db)
    contact = await repo.get_contact(current_user.id, contact_id)
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    contact = await repo.update_contact(
        contact,
        first_name=body.first_name,
        phone=body.phone,
        relationship=body.relationship,
        is_selected=body.is_selected,
    )
    contact = await repo.get_contact(current_user.id, contact_id)
    return TrustedContactResponse(**repo.serialize_contact(current_user, contact))  # type: ignore[arg-type]


@router.delete("/trusted-contacts/{contact_id}", status_code=204)
async def delete_trusted_contact(
    contact_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    repo = _repo(db)
    contact = await repo.get_contact(current_user.id, contact_id)
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    await repo.delete_contact(contact)


@router.put("/share-events/{contact_id}", response_model=ShareEventResponse)
async def update_share_event(
    contact_id: UUID,
    body: ShareEventUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ShareEventResponse:
    repo = _repo(db)
    contact = await repo.get_contact(current_user.id, contact_id)
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    clear_custom = body.custom_message == "" and body.message_template is not None
    await repo.upsert_share_event(
        current_user,
        contact,
        message_template=body.message_template,
        custom_message=body.custom_message if body.custom_message else None,
        sharing_status=body.sharing_status,
        clear_custom_message=clear_custom,
    )
    contact = await repo.get_contact(current_user.id, contact_id)
    data = repo.serialize_contact(current_user, contact)  # type: ignore[arg-type]
    if not data["share_event"]:
        raise HTTPException(status_code=500, detail="Share event missing")
    return ShareEventResponse(**data["share_event"])


@router.get("/share-onboarding/summary", response_model=ShareOnboardingSummaryResponse)
async def get_share_onboarding_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ShareOnboardingSummaryResponse:
    repo = _repo(db)
    summary = await repo.get_summary(current_user)
    return ShareOnboardingSummaryResponse(**summary)


@router.post("/share-onboarding/complete", response_model=OnboardingActionResponse)
async def complete_share_onboarding(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OnboardingActionResponse:
    repo = _repo(db)
    user = await repo.complete_onboarding(current_user)
    return OnboardingActionResponse(
        message="Share onboarding marked complete",
        completed_at=user.share_onboarding_completed_at.isoformat()
        if user.share_onboarding_completed_at
        else None,
    )


@router.post("/share-onboarding/defer", response_model=OnboardingActionResponse)
async def defer_share_onboarding(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OnboardingActionResponse:
    repo = _repo(db)
    user = await repo.defer_onboarding(current_user)
    return OnboardingActionResponse(
        message="Share onboarding deferred",
        deferred_at=user.share_onboarding_deferred_at.isoformat()
        if user.share_onboarding_deferred_at
        else None,
    )
