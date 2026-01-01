"""
Encryption utilities for sensitive data in storage.

This module provides encryption and decryption functions for sensitive data
such as user IDs, device IDs, email addresses, and phone numbers.
"""

from __future__ import annotations

import base64
import os
from typing import Optional

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


class DataEncryption:
    """Handles encryption and decryption of sensitive data."""
    
    def __init__(self, encryption_key: Optional[str] = None) -> None:
        """
        Initialize encryption handler.
        
        Args:
            encryption_key: Optional encryption key from environment variable.
                          If not provided, will use ENCRYPTION_KEY env var or generate a new key.
                          Warning: Using a generated key will not decrypt previously encrypted data.
        """
        if encryption_key is None:
            encryption_key = os.getenv("ENCRYPTION_KEY")
        
        if encryption_key:
            # Use provided key (should be a base64-encoded Fernet key)
            try:
                self.cipher_suite = Fernet(encryption_key.encode())
            except Exception as e:
                raise ValueError(f"Invalid encryption key format: {e}")
        else:
            # Generate a key from a password using PBKDF2
            # This is less secure but better than no encryption
            # For production, ENCRYPTION_KEY should always be set
            password = os.getenv("ENCRYPTION_PASSWORD", "default-password-change-in-production")
            salt = os.getenv("ENCRYPTION_SALT", "default-salt-change-in-production").encode()
            
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
            self.cipher_suite = Fernet(key)
        
        self._encryption_enabled = os.getenv("ENABLE_DATA_ENCRYPTION", "true").lower() == "true"
    
    def encrypt(self, data: str) -> str:
        """
        Encrypt sensitive data.
        
        Args:
            data: Plain text data to encrypt
            
        Returns:
            Encrypted data as base64-encoded string, or original data if encryption is disabled
        """
        if not self._encryption_enabled or not data:
            return data
        
        try:
            encrypted_bytes = self.cipher_suite.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted_bytes).decode()
        except Exception as e:
            # Log error but don't fail - return original data if encryption fails
            import logging
            logging.warning(f"Encryption failed: {e}. Returning unencrypted data.")
            return data
    
    def decrypt(self, encrypted_data: str) -> str:
        """
        Decrypt sensitive data.
        
        Args:
            encrypted_data: Encrypted data as base64-encoded string
            
        Returns:
            Decrypted plain text data, or original data if decryption fails or encryption is disabled
        """
        if not self._encryption_enabled or not encrypted_data:
            return encrypted_data
        
        # Check if data looks encrypted (base64-encoded and longer than original)
        # Simple heuristic: if it's not base64 or fails to decrypt, return as-is
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted_bytes = self.cipher_suite.decrypt(encrypted_bytes)
            return decrypted_bytes.decode()
        except Exception:
            # Data might not be encrypted (backwards compatibility)
            # Return as-is
            return encrypted_data


# Global encryption instance
_encryption_instance: Optional[DataEncryption] = None


def get_encryption() -> DataEncryption:
    """Get or create the global encryption instance."""
    global _encryption_instance
    if _encryption_instance is None:
        _encryption_instance = DataEncryption()
    return _encryption_instance


def encrypt_sensitive_field(value: str) -> str:
    """Convenience function to encrypt a sensitive field."""
    return get_encryption().encrypt(value)


def decrypt_sensitive_field(value: str) -> str:
    """Convenience function to decrypt a sensitive field."""
    return get_encryption().decrypt(value)

