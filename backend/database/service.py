"""Database service layer with clean CRUD operations and error handling."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, OperationalError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.connection import AsyncSessionLocal
from backend.database.exceptions import (
    DatabaseConnectionError,
    DatabaseError,
    DatabaseIntegrityError,
    DatabaseNotFoundError,
    DatabaseTransactionError,
)
from backend.database.models import EmailVerification, User

logger = logging.getLogger(__name__)


def handle_database_error(error: Exception, operation: str) -> DatabaseError:
    """
    Translate SQLAlchemy exceptions to custom database exceptions.
    
    Args:
        error: The original exception
        operation: Description of the operation that failed
        
    Returns:
        Appropriate DatabaseError subclass
    """
    if isinstance(error, IntegrityError):
        # Extract constraint name if available
        error_msg = str(error.orig) if hasattr(error, "orig") else str(error)
        if "unique" in error_msg.lower() or "duplicate" in error_msg.lower():
            return DatabaseIntegrityError(
                f"Duplicate entry: {operation}",
                original_error=error
            )
        elif "foreign key" in error_msg.lower():
            return DatabaseIntegrityError(
                f"Referential integrity violation: {operation}",
                original_error=error
            )
        else:
            return DatabaseIntegrityError(
                f"Integrity constraint violated: {operation}",
                original_error=error
            )
    elif isinstance(error, OperationalError):
        return DatabaseConnectionError(
            f"Database connection error during {operation}",
            original_error=error
        )
    elif isinstance(error, SQLAlchemyError):
        return DatabaseTransactionError(
            f"Database transaction error during {operation}",
            original_error=error
        )
    else:
        return DatabaseError(
            f"Unexpected database error during {operation}",
            original_error=error
        )


class DatabaseService:
    """Service layer for database operations with comprehensive error handling."""
    
    def __init__(self, session: Optional[AsyncSession] = None):
        """
        Initialize database service.
        
        Args:
            session: Optional database session. If not provided, creates a new one.
        """
        self._session = session
        self._own_session = session is None
    
    async def __aenter__(self):
        """Async context manager entry."""
        if self._own_session:
            self._session = AsyncSessionLocal()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self._own_session and self._session:
            await self._session.close()
    
    @property
    def session(self) -> AsyncSession:
        """Get the database session."""
        if self._session is None:
            raise DatabaseError("Database session not initialized")
        return self._session
    
    # User operations
    
    async def create_user(
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
            
        Raises:
            DatabaseIntegrityError: If user with email already exists
            DatabaseError: For other database errors
        """
        try:
            user = User(
                email_encrypted=email_encrypted,
                password_hash=password_hash,
                full_name_encrypted=full_name_encrypted,
                phone_encrypted=phone_encrypted,
                email_verified=email_verified,
            )
            self.session.add(user)
            await self.session.commit()
            await self.session.refresh(user)
            logger.info(f"Created user with ID: {user.id}")
            return user
        except IntegrityError as e:
            await self.session.rollback()
            raise handle_database_error(e, "create_user") from e
        except Exception as e:
            await self.session.rollback()
            raise handle_database_error(e, "create_user") from e
    
    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """
        Get user by ID.
        
        Args:
            user_id: User UUID
            
        Returns:
            User object or None if not found
            
        Raises:
            DatabaseError: For database errors
        """
        try:
            result = await self.session.execute(
                select(User).where(User.id == user_id)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            raise handle_database_error(e, f"get_user_by_id({user_id})") from e
    
    async def get_user_by_encrypted_email(self, email_encrypted: str) -> Optional[User]:
        """
        Get user by encrypted email.
        
        Args:
            email_encrypted: Encrypted email address
            
        Returns:
            User object or None if not found
            
        Raises:
            DatabaseError: For database errors
        """
        try:
            result = await self.session.execute(
                select(User).where(User.email_encrypted == email_encrypted)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            raise handle_database_error(e, "get_user_by_encrypted_email") from e
    
    async def get_all_users(self) -> list[User]:
        """
        Get all users (use with caution, mainly for login email lookup).
        
        Returns:
            List of all User objects
            
        Raises:
            DatabaseError: For database errors
        """
        try:
            result = await self.session.execute(select(User))
            return list(result.scalars().all())
        except Exception as e:
            raise handle_database_error(e, "get_all_users") from e
    
    async def update_user(self, user: User) -> User:
        """
        Update an existing user.
        
        Args:
            user: User object with updated fields
            
        Returns:
            Updated User object
            
        Raises:
            DatabaseError: For database errors
        """
        try:
            await self.session.commit()
            await self.session.refresh(user)
            logger.info(f"Updated user with ID: {user.id}")
            return user
        except Exception as e:
            await self.session.rollback()
            raise handle_database_error(e, f"update_user({user.id})") from e
    
    # EmailVerification operations
    
    async def create_email_verification(
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
            
        Raises:
            DatabaseIntegrityError: If token_hash already exists
            DatabaseError: For other database errors
        """
        try:
            verification = EmailVerification(
                user_id=user_id,
                token_hash=token_hash,
                expires_at=expires_at,
            )
            self.session.add(verification)
            await self.session.commit()
            await self.session.refresh(verification)
            logger.info(f"Created email verification for user {user_id}")
            return verification
        except IntegrityError as e:
            await self.session.rollback()
            raise handle_database_error(e, "create_email_verification") from e
        except Exception as e:
            await self.session.rollback()
            raise handle_database_error(e, "create_email_verification") from e
    
    async def get_email_verification_by_token_hash(
        self,
        token_hash: str,
        unused_only: bool = True,
    ) -> Optional[EmailVerification]:
        """
        Get email verification by token hash.
        
        Args:
            token_hash: Hashed verification token
            unused_only: If True, only return unused verifications
            
        Returns:
            EmailVerification object or None if not found
            
        Raises:
            DatabaseError: For database errors
        """
        try:
            query = select(EmailVerification).where(
                EmailVerification.token_hash == token_hash
            )
            if unused_only:
                query = query.where(EmailVerification.used_at.is_(None))
            
            result = await self.session.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            raise handle_database_error(e, "get_email_verification_by_token_hash") from e
    
    async def mark_verification_as_used(
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
            
        Raises:
            DatabaseError: For database errors
        """
        try:
            verification.used_at = used_at
            await self.session.commit()
            await self.session.refresh(verification)
            logger.info(f"Marked verification {verification.id} as used")
            return verification
        except Exception as e:
            await self.session.rollback()
            raise handle_database_error(e, f"mark_verification_as_used({verification.id})") from e

