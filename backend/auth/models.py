"""Pydantic models for authentication requests and responses."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator
import re

from backend.utils import sanitize_input


def validate_password_strength(password: str) -> str:
    """
    Validate password strength.
    
    Requirements:
    - Minimum 12 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    
    Args:
        password: Password to validate
        
    Returns:
        Validated password
        
    Raises:
        ValueError: If password doesn't meet requirements
    """
    if len(password) < 12:
        raise ValueError("Password must be at least 12 characters long")
    
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
    
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter")
    
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit")
    
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", password):
        raise ValueError("Password must contain at least one special character")
    
    return password


class RegisterRequest(BaseModel):
    """User registration request."""

    email: EmailStr
    password: str = Field(..., min_length=12)
    full_name: str = Field(..., min_length=1, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        return validate_password_strength(v)

    @field_validator("full_name", "phone")
    @classmethod
    def sanitize_fields(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize string fields."""
        if v is None:
            return None
        return sanitize_input(v, max_length=200)


class RegisterResponse(BaseModel):
    """User registration response."""

    user_id: UUID
    email: str
    message: str = "Account created successfully. Please check your email to verify your account."


class LoginRequest(BaseModel):
    """User login request."""

    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """User login response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: UUID
    email: str
    email_verified: bool


class VerifyEmailRequest(BaseModel):
    """Email verification request."""

    token: str = Field(..., min_length=1)


class VerifyEmailResponse(BaseModel):
    """Email verification response."""

    message: str = "Email verified successfully."


class RefreshTokenRequest(BaseModel):
    """Token refresh request."""

    refresh_token: str


class RefreshTokenResponse(BaseModel):
    """Token refresh response."""

    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """User information response."""

    id: UUID
    email: str
    full_name: Optional[str]
    phone: Optional[str]
    email_verified: bool
    created_at: str

