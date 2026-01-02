"""User repository for type-safe database operations."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.exceptions import DatabaseNotFoundError
from backend.database.models import EmailVerification, User
from backend.database.service import DatabaseService


class UserRepository:
    """Repository for User model operations."""
    
    def __init__(self, db_service: DatabaseService):
        """
        Initialize user repository.
        
        Args:
            db_service: DatabaseService instance
        """
        self.db_service = db_service
    
    async def find_by_id(self, user_id: UUID) -> User:
        """
        Find user by ID, raising exception if not found.
        
        Args:
            user_id: User UUID
            
        Returns:
            User object
            
        Raises:
            DatabaseNotFoundError: If user not found
            DatabaseError: For other database errors
        """
        user = await self.db_service.get_user_by_id(user_id)
        if user is None:
            raise DatabaseNotFoundError(f"User with ID {user_id} not found")
        return user
    
    async def find_by_id_optional(self, user_id: UUID) -> Optional[User]:
        """
        Find user by ID, returning None if not found.
        
        Args:
            user_id: User UUID
            
        Returns:
            User object or None
        """
        return await self.db_service.get_user_by_id(user_id)
    
    async def find_by_encrypted_email(self, email_encrypted: str) -> Optional[User]:
        """
        Find user by encrypted email.
        
        Args:
            email_encrypted: Encrypted email address
            
        Returns:
            User object or None if not found
        """
        return await self.db_service.get_user_by_encrypted_email(email_encrypted)
    
    async def create(
        self,
        email_encrypted: str,
        password_hash: str,
        full_name_encrypted: Optional[str] = None,
        phone_encrypted: Optional[str] = None,
        email_verified: bool = False,
    ) -> User:
        """
        Create a new user.
        
        Args:
            email_encrypted: Encrypted email address
            password_hash: Hashed password
            full_name_encrypted: Optional encrypted full name
            phone_encrypted: Optional encrypted phone number
            email_verified: Whether email is verified
            
        Returns:
            Created User object
        """
        return await self.db_service.create_user(
            email_encrypted=email_encrypted,
            password_hash=password_hash,
            full_name_encrypted=full_name_encrypted,
            phone_encrypted=phone_encrypted,
            email_verified=email_verified,
        )
    
    async def update(self, user: User) -> User:
        """
        Update an existing user.
        
        Args:
            user: User object with updated fields
            
        Returns:
            Updated User object
        """
        return await self.db_service.update_user(user)
    
    async def find_all(self) -> list[User]:
        """
        Find all users (use with caution).
        
        Returns:
            List of all User objects
        """
        return await self.db_service.get_all_users()


class EmailVerificationRepository:
    """Repository for EmailVerification model operations."""
    
    def __init__(self, db_service: DatabaseService):
        """
        Initialize email verification repository.
        
        Args:
            db_service: DatabaseService instance
        """
        self.db_service = db_service
    
    async def find_by_token_hash(
        self,
        token_hash: str,
        unused_only: bool = True,
    ) -> Optional[EmailVerification]:
        """
        Find email verification by token hash.
        
        Args:
            token_hash: Hashed verification token
            unused_only: If True, only return unused verifications
            
        Returns:
            EmailVerification object or None if not found
        """
        return await self.db_service.get_email_verification_by_token_hash(
            token_hash=token_hash,
            unused_only=unused_only,
        )
    
    async def create(
        self,
        user_id: UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> EmailVerification:
        """
        Create a new email verification record.
        
        Args:
            user_id: User UUID
            token_hash: Hashed verification token
            expires_at: Expiration datetime
            
        Returns:
            Created EmailVerification object
        """
        return await self.db_service.create_email_verification(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
    
    async def mark_as_used(
        self,
        verification: EmailVerification,
        used_at: datetime,
    ) -> EmailVerification:
        """
        Mark email verification as used.
        
        Args:
            verification: EmailVerification object
            used_at: Datetime when verification was used
            
        Returns:
            Updated EmailVerification object
        """
        return await self.db_service.mark_verification_as_used(
            verification=verification,
            used_at=used_at,
        )

