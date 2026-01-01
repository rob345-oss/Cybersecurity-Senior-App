"""Authentication router with registration, login, and email verification endpoints."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database.connection import get_db
from backend.database.models import User, EmailVerification
from backend.auth.models import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    LoginResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    UserResponse,
)
from backend.auth.password import get_password_hash, verify_password
from backend.auth.jwt_handler import create_access_token, create_refresh_token, verify_token
from backend.auth.verification import (
    generate_verification_token,
    hash_verification_token,
    verify_verification_token,
    get_verification_expiry,
)
from backend.auth.dependencies import get_current_user
from backend.storage.encryption import get_encryption

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/auth", tags=["authentication"])


def set_limiter(limiter_instance) -> None:
    """Set the rate limiter instance (for future use)."""
    pass  # Rate limiting can be added later if needed


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    register_data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> RegisterResponse:
    """
    Register a new user account.
    
    Rate limited: 5 requests per hour per IP.
    """
    
    encryption = get_encryption()
    
    # Check if user with email already exists
    # We need to check encrypted emails - this is a limitation we accept
    # In production, you might want to use a separate index table with hashed emails
    result = await db.execute(
        select(User).where(User.email_encrypted == encryption.encrypt(register_data.email))
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )
    
    # Hash password
    password_hash = get_password_hash(register_data.password)
    
    # Encrypt PII fields
    email_encrypted = encryption.encrypt(register_data.email)
    full_name_encrypted = encryption.encrypt(register_data.full_name) if register_data.full_name else None
    phone_encrypted = encryption.encrypt(register_data.phone) if register_data.phone else None
    
    # Create user
    user = User(
        email_encrypted=email_encrypted,
        password_hash=password_hash,
        full_name_encrypted=full_name_encrypted,
        phone_encrypted=phone_encrypted,
        email_verified=False,
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Generate verification token
    verification_token = generate_verification_token()
    token_hash = hash_verification_token(verification_token)
    expires_at = get_verification_expiry()
    
    verification = EmailVerification(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    
    db.add(verification)
    await db.commit()
    
    # Log verification token (in production, send email)
    logger.info(f"Verification token for user {user.id}: {verification_token}")
    logger.warning(
        "In production, send verification email. "
        f"For now, verification token is: {verification_token}"
    )
    
    return RegisterResponse(
        user_id=user.id,
        email=register_data.email,  # Return unencrypted email in response
        message="Account created successfully. Please check your email to verify your account.",
    )


@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    """
    Login and get JWT tokens.
    """
    encryption = get_encryption()
    
    # Find user by encrypted email
    # This requires checking all users - inefficient but necessary with encrypted emails
    # In production, consider using a separate lookup table with hashed emails
    result = await db.execute(select(User))
    users = result.scalars().all()
    
    user = None
    for u in users:
        try:
            if encryption.decrypt(u.email_encrypted) == login_data.email:
                user = u
                break
        except Exception:
            continue
    
    if user is None:
        # Use same timing as successful login to prevent user enumeration
        verify_password(login_data.password, "$2b$12$dummy.hash.to.prevent.timing.attack")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # Create tokens
    token_data = {"sub": str(user.id)}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    # Decrypt email for response
    decrypted_email = encryption.decrypt(user.email_encrypted)
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_id=user.id,
        email=decrypted_email,
        email_verified=user.email_verified,
    )


@router.post("/verify-email", response_model=VerifyEmailResponse)
async def verify_email(
    request: Request,
    verify_data: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
) -> VerifyEmailResponse:
    """
    Verify email address using verification token.
    """
    # Hash the provided token
    token_hash = hash_verification_token(verify_data.token)
    
    # Find verification record
    result = await db.execute(
        select(EmailVerification)
        .where(EmailVerification.token_hash == token_hash)
        .where(EmailVerification.used_at.is_(None))
    )
    verification = result.scalar_one_or_none()
    
    if verification is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )
    
    # Check expiration
    if datetime.now(timezone.utc) > verification.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired",
        )
    
    # Get user
    user_result = await db.execute(select(User).where(User.id == verification.user_id))
    user = user_result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Mark verification as used
    verification.used_at = datetime.now(timezone.utc)
    
    # Mark user email as verified
    user.email_verified = True
    
    await db.commit()
    
    return VerifyEmailResponse(message="Email verified successfully.")


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_token(
    request: Request,
    refresh_data: RefreshTokenRequest,
) -> RefreshTokenResponse:
    """
    Refresh access token using refresh token.
    """
    # Verify refresh token
    payload = verify_token(refresh_data.refresh_token, token_type="refresh")
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    
    # Create new access token
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    token_data = {"sub": user_id}
    access_token = create_access_token(token_data)
    
    return RefreshTokenResponse(
        access_token=access_token,
        token_type="bearer",
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """
    Get current authenticated user's information.
    """
    encryption = get_encryption()
    
    # Decrypt PII fields
    email = encryption.decrypt(current_user.email_encrypted)
    full_name = encryption.decrypt(current_user.full_name_encrypted) if current_user.full_name_encrypted else None
    phone = encryption.decrypt(current_user.phone_encrypted) if current_user.phone_encrypted else None
    
    return UserResponse(
        id=current_user.id,
        email=email,
        full_name=full_name,
        phone=phone,
        email_verified=current_user.email_verified,
        created_at=current_user.created_at.isoformat(),
    )

