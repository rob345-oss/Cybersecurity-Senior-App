"""Contacts & Trusted Callers API router."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import RedirectResponse
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth.dependencies import get_current_user
from backend.contacts.constants import RELATIONSHIP_CATEGORIES, SENIOR_ERRORS
from backend.contacts.duplicates import list_pending_duplicates, merge_contacts
from backend.contacts.google_oauth import (
    build_authorize_url,
    consume_oauth_state,
    create_oauth_state,
    disconnect_google,
    exchange_code_for_tokens,
    fetch_google_account_email,
    frontend_redirect,
    get_or_create_connection,
    google_contacts_configured,
    store_tokens,
)
from backend.contacts.schemas import (
    BulkTrustRequest,
    BulkTrustResponse,
    ContactOut,
    ContactsListResponse,
    ContactUpdateRequest,
    DeleteDataRequest,
    GoogleConnectResponse,
    GoogleStatusResponse,
    ManualTrustedRequest,
    MergeRequest,
    MessageResponse,
    SyncResponse,
    TrustRequest,
    TrustedCallerOut,
    TrustedCheckResponse,
)
from backend.contacts.sync import sync_google_contacts
from backend.contacts.trusted_service import TrustedCallerService
from backend.contacts.vcard import import_vcard_contacts
from backend.database.connection import get_db
from backend.database.models import (
    GoogleContactsConnection,
    TrustedCaller,
    User,
    UserContact,
)
from backend.storage.encryption import decrypt_sensitive_field
from backend.utils import sanitize_input

logger = logging.getLogger(__name__)

router = APIRouter(tags=["contacts"])


def _contact_out(c: UserContact) -> ContactOut:
    return ContactOut(
        id=str(c.id),
        display_name=c.display_name,
        first_name=c.first_name,
        last_name=c.last_name,
        primary_phone=c.primary_phone,
        normalized_phone=c.normalized_phone,
        additional_phone_numbers=list(c.additional_phone_numbers or []),
        email=c.email,
        photo_url=c.photo_url,
        source=c.source,
        is_trusted=bool(c.is_trusted),
        relationship=c.relationship,
        source_contact_deleted=bool(c.source_contact_deleted),
        last_synced_at=c.last_synced_at,
        created_at=c.created_at,
    )


async def _counts(db: AsyncSession, user_id: UUID) -> tuple[int, int]:
    total = await db.scalar(
        select(func.count())
        .select_from(UserContact)
        .where(
            UserContact.user_id == user_id,
            UserContact.merged_into_contact_id.is_(None),
        )
    )
    trusted = await db.scalar(
        select(func.count())
        .select_from(TrustedCaller)
        .where(
            TrustedCaller.user_id == user_id,
            TrustedCaller.trust_status == "active",
        )
    )
    return int(total or 0), int(trusted or 0)


@router.get("/v1/contacts/status", response_model=GoogleStatusResponse)
async def contacts_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GoogleStatusResponse:
    conn = await get_or_create_connection(db, current_user.id)
    total, trusted = await _counts(db, current_user.id)
    email = None
    if conn.google_account_email_encrypted:
        email = decrypt_sensitive_field(conn.google_account_email_encrypted)
    return GoogleStatusResponse(
        status=conn.status,
        connected=conn.status == "connected",
        account_email=email,
        last_synced_at=conn.last_synced_at,
        contact_count=total,
        trusted_count=trusted,
    )


@router.get("/v1/contacts", response_model=ContactsListResponse)
async def list_contacts(
    q: Optional[str] = Query(None, max_length=200),
    relationship: Optional[str] = Query(None),
    trusted_only: bool = Query(False),
    has_phone: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ContactsListResponse:
    filters = [
        UserContact.user_id == current_user.id,
        UserContact.merged_into_contact_id.is_(None),
    ]
    if trusted_only:
        filters.append(UserContact.is_trusted.is_(True))
    if relationship:
        filters.append(UserContact.relationship == relationship)
    if has_phone is True:
        filters.append(UserContact.normalized_phone.isnot(None))
    if has_phone is False:
        filters.append(UserContact.normalized_phone.is_(None))
    if q:
        term = f"%{sanitize_input(q, max_length=200)}%"
        filters.append(
            or_(
                UserContact.display_name.ilike(term),
                UserContact.primary_phone.ilike(term),
                UserContact.normalized_phone.ilike(term),
                UserContact.email.ilike(term),
                UserContact.relationship.ilike(term),
            )
        )

    total = await db.scalar(
        select(func.count()).select_from(UserContact).where(*filters)
    )
    result = await db.execute(
        select(UserContact)
        .where(*filters)
        .order_by(UserContact.display_name.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    contacts = [_contact_out(c) for c in result.scalars().all()]

    conn_result = await db.execute(
        select(GoogleContactsConnection).where(
            GoogleContactsConnection.user_id == current_user.id
        )
    )
    conn = conn_result.scalar_one_or_none()
    _, trusted_count = await _counts(db, current_user.id)

    return ContactsListResponse(
        contacts=contacts,
        total=int(total or 0),
        page=page,
        page_size=page_size,
        google_status=conn.status if conn else "disconnected",
        last_synced_at=conn.last_synced_at if conn else None,
        trusted_count=trusted_count,
    )


@router.get("/v1/contacts/relationships")
async def list_relationships(
    current_user: User = Depends(get_current_user),
) -> Dict[str, List[str]]:
    return {"relationships": sorted(RELATIONSHIP_CATEGORIES)}


@router.get("/v1/contacts/google/connect", response_model=GoogleConnectResponse)
async def google_connect(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GoogleConnectResponse:
    if not google_contacts_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=SENIOR_ERRORS["not_configured"],
        )
    # Rate limit via app.state if available
    state = await create_oauth_state(db, current_user.id)
    url = build_authorize_url(state)
    logger.info("google_contacts_connect_started user_id=%s", current_user.id)
    return GoogleConnectResponse(authorize_url=url)


@router.get("/v1/contacts/google/callback")
async def google_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    if error:
        msg = (
            SENIOR_ERRORS["google_cancelled"]
            if error == "access_denied"
            else SENIOR_ERRORS["google_denied"]
        )
        return RedirectResponse(frontend_redirect(f"error=1&message={msg}"))

    if not code or not state:
        return RedirectResponse(
            frontend_redirect(f"error=1&message={SENIOR_ERRORS['google_denied']}")
        )

    user_id = await consume_oauth_state(db, state)
    if not user_id:
        return RedirectResponse(
            frontend_redirect(f"error=1&message={SENIOR_ERRORS['google_denied']}")
        )

    try:
        tokens = await exchange_code_for_tokens(code)
        access = tokens.get("access_token")
        email = await fetch_google_account_email(access) if access else None
        await store_tokens(db, user_id, tokens, account_email=email)
        # Auto-sync after connect
        try:
            await sync_google_contacts(db, user_id)
        except Exception as exc:
            logger.warning("auto_sync_failed user_id=%s err=%s", user_id, exc)
            return RedirectResponse(
                frontend_redirect("connected=1&sync_warning=1")
            )
        return RedirectResponse(frontend_redirect("connected=1"))
    except Exception as exc:
        logger.warning("google_callback_failed user_id=%s err=%s", user_id, exc)
        return RedirectResponse(
            frontend_redirect(f"error=1&message={SENIOR_ERRORS['google_denied']}")
        )


@router.post("/v1/contacts/google/sync", response_model=SyncResponse)
async def google_sync(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SyncResponse:
    try:
        result = await sync_google_contacts(db, current_user.id)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("sync_failed user_id=%s", current_user.id)
        raise HTTPException(
            status_code=502, detail=SENIOR_ERRORS["sync_failed"]
        ) from exc

    return SyncResponse(
        message="Your contacts were updated.",
        **{k: result[k] for k in ("created", "updated", "deleted_flagged", "total_fetched", "duplicates_found", "last_synced_at") if k in result},
    )


@router.delete("/v1/contacts/google", response_model=MessageResponse)
async def google_disconnect(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await disconnect_google(db, current_user.id)
    return MessageResponse(
        message="Your Google Contacts account was disconnected. Your trusted callers are still protected unless you delete them.",
        details={"trusted_callers_kept": True},
    )


@router.delete("/v1/contacts/data", response_model=MessageResponse)
async def delete_contact_data(
    body: DeleteDataRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    if not body.confirm:
        total, trusted = await _counts(db, current_user.id)
        return MessageResponse(
            message="Confirm deletion to remove imported contact data.",
            details={
                "contact_count": total,
                "trusted_count": trusted,
                "warning": (
                    "Deleting contacts may remove trusted caller protection if you also choose to remove trusted callers."
                    if trusted
                    else "Imported contacts will be permanently deleted."
                ),
            },
        )

    # Delete google/imported contacts; optionally trusted
    result = await db.execute(
        select(UserContact).where(UserContact.user_id == current_user.id)
    )
    contacts = list(result.scalars().all())
    deleted_contacts = 0
    deleted_trusted = 0
    for c in contacts:
        if c.source == "manual" and c.is_trusted and not body.remove_trusted_callers:
            continue
        if c.is_trusted and not body.remove_trusted_callers:
            # Keep trusted protection as a local contact. Retain google_contact_id so
            # the next Google sync updates this row instead of inserting a clone.
            c.source = "manual"
            c.source_contact_deleted = False
            continue
        await db.delete(c)
        deleted_contacts += 1
        if c.is_trusted:
            deleted_trusted += 1

    if body.remove_trusted_callers:
        tc_result = await db.execute(
            select(TrustedCaller).where(TrustedCaller.user_id == current_user.id)
        )
        for tc in tc_result.scalars().all():
            await db.delete(tc)
            deleted_trusted += 1

    await db.commit()
    logger.info(
        "contacts_data_deleted user_id=%s contacts=%s trusted=%s",
        current_user.id,
        deleted_contacts,
        deleted_trusted,
    )
    return MessageResponse(
        message="Imported contact data was deleted.",
        details={
            "deleted_contacts": deleted_contacts,
            "deleted_trusted": deleted_trusted,
        },
    )


@router.post("/v1/contacts/trust/bulk", response_model=BulkTrustResponse)
async def bulk_trust(
    body: BulkTrustRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BulkTrustResponse:
    service = TrustedCallerService(db)
    if body.action == "add":
        count = await service.bulk_add_trust(
            current_user.id, body.contact_ids, relationship=body.relationship
        )
        return BulkTrustResponse(
            message=f"{count} trusted callers added.",
            count=count,
        )
    count = await service.bulk_remove_trust(current_user.id, body.contact_ids)
    return BulkTrustResponse(
        message=f"{count} people removed from Trusted Callers.",
        count=count,
    )


@router.post("/v1/contacts/manual", response_model=MessageResponse)
async def add_manual_trusted(
    body: ManualTrustedRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    service = TrustedCallerService(db)
    try:
        result = await service.create_manual_trusted(
            current_user.id,
            name=body.name,
            phone=body.phone,
            relationship=body.relationship,
            notes=body.notes,
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return MessageResponse(
        message="Trusted caller added.",
        details=result,
    )


@router.post("/v1/contacts/import/vcard")
async def import_vcard(
    request: Request,
    confirm: bool = Query(False),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith((".vcf", ".vcard")):
        raise HTTPException(400, SENIOR_ERRORS["invalid_vcard"])
    raw_bytes = await file.read()
    if len(raw_bytes) > 2 * 1024 * 1024:
        raise HTTPException(400, SENIOR_ERRORS["invalid_vcard"])
    try:
        text = raw_bytes.decode("utf-8", errors="replace")
        result = await import_vcard_contacts(
            db, current_user.id, text, confirm=confirm
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return result


@router.get("/v1/contacts/duplicates")
async def get_duplicates(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items = await list_pending_duplicates(db, current_user.id)
    return {
        "message": "We found possible duplicates." if items else "No duplicates found.",
        "duplicates": items,
    }


@router.post("/v1/contacts/duplicates/{suggestion_id}/merge", response_model=ContactOut)
async def merge_duplicate(
    suggestion_id: UUID,
    body: MergeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ContactOut:
    try:
        keep = await merge_contacts(
            db, current_user.id, suggestion_id, body.keep_contact_id
        )
    except LookupError as exc:
        raise HTTPException(404, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return _contact_out(keep)


@router.get("/v1/contacts/{contact_id}", response_model=ContactOut)
async def get_contact(
    contact_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ContactOut:
    result = await db.execute(
        select(UserContact).where(
            UserContact.id == contact_id,
            UserContact.user_id == current_user.id,
            UserContact.merged_into_contact_id.is_(None),
        )
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(404, SENIOR_ERRORS["not_found"])
    return _contact_out(contact)


@router.patch("/v1/contacts/{contact_id}", response_model=ContactOut)
async def update_contact(
    contact_id: UUID,
    body: ContactUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ContactOut:
    service = TrustedCallerService(db)
    try:
        contact = await service._get_owned_contact(current_user.id, contact_id)
    except LookupError as exc:
        raise HTTPException(404, str(exc)) from exc

    if body.relationship is not None:
        contact.relationship = sanitize_input(body.relationship, max_length=64) or None
    if body.is_trusted is True:
        await service.add_trust(
            current_user.id, contact_id, relationship=body.relationship
        )
        await db.refresh(contact)
    elif body.is_trusted is False:
        await service.remove_trust(current_user.id, contact_id)
        await db.refresh(contact)
    else:
        contact.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(contact)
    return _contact_out(contact)


@router.post("/v1/contacts/{contact_id}/trust", response_model=MessageResponse)
async def trust_contact(
    contact_id: UUID,
    body: TrustRequest = TrustRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    service = TrustedCallerService(db)
    try:
        await service.add_trust(
            current_user.id,
            contact_id,
            relationship=body.relationship,
            notes=body.notes,
        )
    except LookupError as exc:
        raise HTTPException(404, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return MessageResponse(message="Added to Trusted Callers.")


@router.delete("/v1/contacts/{contact_id}/trust", response_model=MessageResponse)
async def untrust_contact(
    contact_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    service = TrustedCallerService(db)
    try:
        await service.remove_trust(current_user.id, contact_id)
    except LookupError as exc:
        raise HTTPException(404, str(exc)) from exc
    return MessageResponse(message="Removed from Trusted Callers.")


@router.get("/v1/trusted-callers", response_model=List[TrustedCallerOut])
async def list_trusted_callers(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[TrustedCallerOut]:
    service = TrustedCallerService(db)
    rows = await service.list_trusted(current_user.id)
    return [TrustedCallerOut(**r) for r in rows]


@router.get("/v1/trusted-callers/check", response_model=TrustedCheckResponse)
async def check_trusted_caller(
    phone: str = Query(..., min_length=3, max_length=64),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TrustedCheckResponse:
    service = TrustedCallerService(db)
    result = await service.is_trusted_caller(current_user.id, phone)
    return TrustedCheckResponse(**result)


@router.post("/v1/trusted-callers", response_model=MessageResponse)
async def create_trusted_caller(
    body: ManualTrustedRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    return await add_manual_trusted(body, current_user, db)


@router.delete("/v1/trusted-callers/{trusted_id}", response_model=MessageResponse)
async def delete_trusted_caller(
    trusted_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    result = await db.execute(
        select(TrustedCaller).where(
            TrustedCaller.id == trusted_id,
            TrustedCaller.user_id == current_user.id,
        )
    )
    tc = result.scalar_one_or_none()
    if not tc:
        raise HTTPException(404, SENIOR_ERRORS["not_found"])
    service = TrustedCallerService(db)
    await service.remove_trust(current_user.id, tc.contact_id)
    return MessageResponse(message="Removed from Trusted Callers.")
