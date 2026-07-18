"""FastAPI routes for Trusted Contact Verification."""

from __future__ import annotations

import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth.dependencies import get_current_user
from backend.database.connection import get_db
from backend.database.models import User
from backend.verification.schemas import (
    ListRole,
    NotificationResponse,
    RiskAnalysisResponse,
    TrustedContactCreateRequest,
    TrustedContactResponse,
    VerificationRequestCreate,
    VerificationRequestResponse,
    VerificationReviewRequest,
)
from backend.verification.service import VerificationService
from backend.database.repositories.verification_repository import NotificationRepository
from backend.database.service import DatabaseService
from backend.database.rls import set_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter(tags=["verification"])


async def get_verification_service(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VerificationService:
    service = VerificationService(db, current_user)
    await service.prepare()
    return service


@router.get("/v1/trusted-contacts", response_model=List[TrustedContactResponse])
async def list_trusted_contacts(
    service: VerificationService = Depends(get_verification_service),
) -> List[TrustedContactResponse]:
    try:
        return await service.list_contacts()
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to list trusted contacts: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list trusted contacts",
        ) from e


@router.post(
    "/v1/trusted-contacts",
    response_model=TrustedContactResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_trusted_contact(
    body: TrustedContactCreateRequest,
    service: VerificationService = Depends(get_verification_service),
) -> TrustedContactResponse:
    try:
        return await service.add_contact(body)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create trusted contact: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create trusted contact",
        ) from e


@router.post(
    "/v1/verification-requests",
    response_model=VerificationRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_verification_request(
    body: VerificationRequestCreate,
    service: VerificationService = Depends(get_verification_service),
) -> VerificationRequestResponse:
    try:
        return await service.create_request(body)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create verification request: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create verification request",
        ) from e


@router.get(
    "/v1/verification-requests",
    response_model=List[VerificationRequestResponse],
)
async def list_verification_requests(
    role: ListRole = Query(default="all"),
    service: VerificationService = Depends(get_verification_service),
) -> List[VerificationRequestResponse]:
    try:
        return await service.list_requests(role=role)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to list verification requests: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list verification requests",
        ) from e


@router.get(
    "/v1/verification-requests/{request_id}",
    response_model=VerificationRequestResponse,
)
async def get_verification_request(
    request_id: UUID,
    service: VerificationService = Depends(get_verification_service),
) -> VerificationRequestResponse:
    try:
        return await service.get_request(request_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get verification request: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get verification request",
        ) from e


@router.patch(
    "/v1/verification-requests/{request_id}/review",
    response_model=VerificationRequestResponse,
)
async def review_verification_request(
    request_id: UUID,
    body: VerificationReviewRequest,
    service: VerificationService = Depends(get_verification_service),
) -> VerificationRequestResponse:
    try:
        return await service.review_request(request_id, body)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to review verification request: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to review verification request",
        ) from e


@router.post(
    "/v1/verification-requests/{request_id}/risk-analysis",
    response_model=RiskAnalysisResponse,
)
async def analyze_verification_request_risk(
    request_id: UUID,
    service: VerificationService = Depends(get_verification_service),
) -> RiskAnalysisResponse:
    try:
        return await service.run_risk_analysis(request_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to analyze verification risk: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze verification risk",
        ) from e


@router.post(
    "/v1/verification-requests/{request_id}/screenshot",
    response_model=VerificationRequestResponse,
)
async def upload_verification_screenshot(
    request_id: UUID,
    file: UploadFile = File(...),
    service: VerificationService = Depends(get_verification_service),
) -> VerificationRequestResponse:
    try:
        return await service.upload_screenshot(request_id, file)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to upload screenshot: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload screenshot",
        ) from e


@router.get("/v1/notifications", response_model=List[NotificationResponse])
async def list_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[NotificationResponse]:
    try:
        await set_current_user_id(db, current_user.id)
        async with DatabaseService(session=db) as db_service:
            repo = NotificationRepository(db_service)
            items = await repo.list_for_user(current_user.id)
            return [NotificationResponse.model_validate(item) for item in items]
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to list notifications: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list notifications",
        ) from e
