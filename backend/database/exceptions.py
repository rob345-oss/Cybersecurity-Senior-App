"""Custom database exception classes for better error handling."""

from __future__ import annotations


class DatabaseError(Exception):
    """Base exception for all database-related errors."""
    
    def __init__(self, message: str, original_error: Exception | None = None):
        super().__init__(message)
        self.message = message
        self.original_error = original_error


class DatabaseConnectionError(DatabaseError):
    """Raised when database connection fails."""
    
    def __init__(self, message: str = "Failed to connect to database", original_error: Exception | None = None):
        super().__init__(message, original_error)


class DatabaseIntegrityError(DatabaseError):
    """Raised when database integrity constraint is violated (e.g., unique constraint, foreign key)."""
    
    def __init__(self, message: str = "Database integrity constraint violated", original_error: Exception | None = None):
        super().__init__(message, original_error)


class DatabaseNotFoundError(DatabaseError):
    """Raised when a requested record is not found in the database."""
    
    def __init__(self, message: str = "Record not found", original_error: Exception | None = None):
        super().__init__(message, original_error)


class DatabaseTransactionError(DatabaseError):
    """Raised when a database transaction fails."""
    
    def __init__(self, message: str = "Database transaction failed", original_error: Exception | None = None):
        super().__init__(message, original_error)

