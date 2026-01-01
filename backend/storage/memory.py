from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from uuid import uuid4
import threading
import time
import os
import logging

from backend.models import EventIn, EventOut, ModuleName, RiskResponse, SessionSummary
from backend.storage.encryption import get_encryption

logger = logging.getLogger(__name__)


@dataclass
class SessionRecord:
    session_id: str
    module: ModuleName
    user_id: str  # Encrypted at storage level
    device_id: str  # Encrypted at storage level
    created_at: datetime
    events: List[EventOut] = field(default_factory=list)
    last_risk: Optional[RiskResponse] = None
    last_accessed_at: Optional[datetime] = None
    
    def __post_init__(self) -> None:
        """Initialize last_accessed_at if not provided."""
        if self.last_accessed_at is None:
            self.last_accessed_at = self.created_at


class MemoryStore:
    def __init__(self, session_ttl_hours: Optional[int] = None) -> None:
        """
        Initialize MemoryStore with optional session TTL and data retention policies.
        
        Args:
            session_ttl_hours: Session time-to-live in hours. If None, uses SESSION_TTL_HOURS
                              environment variable (default: 24 hours). Set to 0 to disable expiration.
        """
        self._sessions: Dict[str, SessionRecord] = {}
        self._encryption = get_encryption()
        
        # Data retention policy configuration
        # Session TTL: How long inactive sessions are kept
        if session_ttl_hours is not None:
            self.session_ttl_hours = session_ttl_hours
        else:
            self.session_ttl_hours = int(os.getenv("SESSION_TTL_HOURS", "24"))
        
        # Maximum session age: Hard limit for all sessions (default: 48 hours)
        self.max_session_age_hours = int(os.getenv("MAX_SESSION_AGE_HOURS", "48"))
        
        # Event retention: How long to keep events after session end (default: 30 days)
        self.event_retention_days = int(os.getenv("EVENT_RETENTION_DAYS", "30"))
        
        # PII retention: How long to keep PII data (default: 90 days)
        self.pii_retention_days = int(os.getenv("PII_RETENTION_DAYS", "90"))
        
        # Start background cleanup thread if TTL is enabled
        self._cleanup_running = False
        self._cleanup_thread: Optional[threading.Thread] = None
        if self.session_ttl_hours > 0:
            self.start_cleanup_task()
        
        logger.info(
            f"MemoryStore initialized with retention policies: "
            f"session_ttl={self.session_ttl_hours}h, "
            f"max_age={self.max_session_age_hours}h, "
            f"event_retention={self.event_retention_days}d, "
            f"pii_retention={self.pii_retention_days}d"
        )

    def start_session(self, user_id: str, device_id: str, module: ModuleName) -> SessionRecord:
        session_id = str(uuid4())
        now = datetime.now(timezone.utc)
        
        # Encrypt sensitive fields before storage
        encrypted_user_id = self._encryption.encrypt(user_id)
        encrypted_device_id = self._encryption.encrypt(device_id)
        
        record = SessionRecord(
            session_id=session_id,
            module=module,
            user_id=encrypted_user_id,
            device_id=encrypted_device_id,
            created_at=now,
            last_accessed_at=now,
        )
        self._sessions[session_id] = record
        return record
    
    def _get_decrypted_record(self, record: SessionRecord) -> SessionRecord:
        """Get a record with decrypted sensitive fields (for API responses)."""
        # Create a copy with decrypted fields
        decrypted_record = SessionRecord(
            session_id=record.session_id,
            module=record.module,
            user_id=self._encryption.decrypt(record.user_id),
            device_id=self._encryption.decrypt(record.device_id),
            created_at=record.created_at,
            events=record.events,
            last_risk=record.last_risk,
            last_accessed_at=record.last_accessed_at,
        )
        return decrypted_record

    def get_session(self, session_id: str) -> Optional[SessionRecord]:
        record = self._sessions.get(session_id)
        if record:
            # Update last accessed time
            record.last_accessed_at = datetime.now(timezone.utc)
            # Return decrypted record for API use
            return self._get_decrypted_record(record)
        return record

    def append_event(self, session_id: str, event: EventIn) -> Optional[EventOut]:
        record = self._sessions.get(session_id)
        if not record:
            return None
        
        # Encrypt sensitive data in event payload
        encrypted_payload = self._encrypt_event_payload(event.payload)
        
        event_out = EventOut(
            id=str(uuid4()),
            type=event.type,
            payload=encrypted_payload,
            timestamp=event.timestamp,
        )
        record.events.append(event_out)
        return event_out
    
    def _encrypt_event_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Encrypt sensitive fields in event payload."""
        encrypted_payload = payload.copy()
        
        # Fields that may contain sensitive data
        sensitive_keys = ['email', 'emails', 'phone', 'phones', 'phone_number', 
                         'phone_number_formatted', 'caller_id', 'from', 'to',
                         'user_id', 'device_id', 'account_number', 'ssn']
        
        for key in sensitive_keys:
            if key in encrypted_payload:
                value = encrypted_payload[key]
                if isinstance(value, str):
                    encrypted_payload[key] = self._encryption.encrypt(value)
                elif isinstance(value, list):
                    # Encrypt each item in the list if it's a string
                    encrypted_payload[key] = [
                        self._encryption.encrypt(item) if isinstance(item, str) else item
                        for item in value
                    ]
        
        return encrypted_payload
    
    def _decrypt_event_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Decrypt sensitive fields in event payload."""
        decrypted_payload = payload.copy()
        
        sensitive_keys = ['email', 'emails', 'phone', 'phones', 'phone_number', 
                         'phone_number_formatted', 'caller_id', 'from', 'to',
                         'user_id', 'device_id', 'account_number', 'ssn']
        
        for key in sensitive_keys:
            if key in decrypted_payload:
                value = decrypted_payload[key]
                if isinstance(value, str):
                    decrypted_payload[key] = self._encryption.decrypt(value)
                elif isinstance(value, list):
                    # Decrypt each item in the list if it's a string
                    decrypted_payload[key] = [
                        self._encryption.decrypt(item) if isinstance(item, str) else item
                        for item in value
                    ]
        
        return decrypted_payload

    def update_last_risk(self, session_id: str, risk: RiskResponse) -> None:
        record = self._sessions.get(session_id)
        if record:
            record.last_risk = risk

    def summarize(self, session_id: str, key_takeaways: List[str]) -> Optional[SessionSummary]:
        record = self._sessions.get(session_id)
        if not record or not record.last_risk:
            return None
        # Use original record (encrypted) but summary doesn't expose sensitive data
        return SessionSummary(
            session_id=record.session_id,
            module=record.module,
            created_at=record.created_at,
            last_risk=record.last_risk,
            key_takeaways=key_takeaways,
        )
    
    def _is_session_expired(self, record: SessionRecord) -> bool:
        """Check if a session has expired based on TTL."""
        if self.session_ttl_hours <= 0:
            return False  # TTL disabled
        
        if record.last_accessed_at is None:
            return False  # Should not happen, but handle gracefully
        
        expiry_time = record.last_accessed_at + timedelta(hours=self.session_ttl_hours)
        return datetime.now(timezone.utc) > expiry_time
    
    def cleanup_expired_sessions(self) -> int:
        """
        Remove expired sessions from storage.
        
        Returns:
            Number of sessions removed
        """
        if self.session_ttl_hours <= 0:
            return 0  # TTL disabled, nothing to clean
        
        expired_sessions = [
            session_id for session_id, record in self._sessions.items()
            if self._is_session_expired(record)
        ]
        
        for session_id in expired_sessions:
            del self._sessions[session_id]
        
        return len(expired_sessions)
    
    def cleanup_old_sessions(self, max_age_hours: Optional[int] = None) -> int:
        """
        Remove sessions older than max_age_hours, regardless of last access time.
        Useful for cleaning up abandoned sessions.
        
        Args:
            max_age_hours: Maximum age in hours for sessions to keep.
                          If None, uses self.max_session_age_hours.
            
        Returns:
            Number of sessions removed
        """
        if max_age_hours is None:
            max_age_hours = self.max_session_age_hours
        
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
        
        old_sessions = [
            session_id for session_id, record in self._sessions.items()
            if record.created_at < cutoff_time
        ]
        
        for session_id in old_sessions:
            del self._sessions[session_id]
        
        if old_sessions:
            logger.info(f"Cleaned up {len(old_sessions)} sessions older than {max_age_hours} hours")
        
        return len(old_sessions)
    
    def cleanup_old_events(self) -> int:
        """
        Remove events older than the event retention period.
        This implements data retention policy for event data.
        
        Returns:
            Number of events removed across all sessions
        """
        cutoff_time = datetime.now(timezone.utc) - timedelta(days=self.event_retention_days)
        events_removed = 0
        
        for record in self._sessions.values():
            original_count = len(record.events)
            record.events = [
                event for event in record.events
                if event.timestamp > cutoff_time
            ]
            events_removed += original_count - len(record.events)
        
        if events_removed > 0:
            logger.info(f"Cleaned up {events_removed} events older than {self.event_retention_days} days")
        
        return events_removed
    
    def get_retention_policy_summary(self) -> Dict[str, Any]:
        """
        Get a summary of current data retention policies.
        
        Returns:
            Dictionary with retention policy details
        """
        return {
            "session_ttl_hours": self.session_ttl_hours,
            "max_session_age_hours": self.max_session_age_hours,
            "event_retention_days": self.event_retention_days,
            "pii_retention_days": self.pii_retention_days,
            "encryption_enabled": self._encryption._encryption_enabled,
        }
    
    def _cleanup_task(self) -> None:
        """Background task that periodically cleans up expired sessions and enforces retention policies."""
        while self._cleanup_running:
            try:
                # Run cleanup every hour
                time.sleep(3600)
                if self._cleanup_running:
                    expired_count = self.cleanup_expired_sessions()
                    old_count = self.cleanup_old_sessions()
                    events_count = self.cleanup_old_events()
                    if expired_count > 0 or old_count > 0 or events_count > 0:
                        logger.info(
                            f"Data retention cleanup: Removed {expired_count} expired sessions, "
                            f"{old_count} old sessions, and {events_count} old events"
                        )
            except Exception as e:
                logger.error(f"Error in cleanup task: {e}", exc_info=True)
    
    def start_cleanup_task(self) -> None:
        """Start the background cleanup task."""
        if self._cleanup_running:
            return
        
        self._cleanup_running = True
        self._cleanup_thread = threading.Thread(target=self._cleanup_task, daemon=True)
        self._cleanup_thread.start()
    
    def stop_cleanup_task(self) -> None:
        """Stop the background cleanup task."""
        self._cleanup_running = False
        if self._cleanup_thread:
            self._cleanup_thread.join(timeout=5)
    
    def get_session_count(self) -> int:
        """Get the current number of active sessions."""
        return len(self._sessions)
    
    def __del__(self) -> None:
        """Cleanup when store is destroyed."""
        self.stop_cleanup_task()
