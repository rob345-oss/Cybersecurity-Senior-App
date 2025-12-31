from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from uuid import uuid4
import threading
import time
import os

from backend.models import EventIn, EventOut, ModuleName, RiskResponse, SessionSummary


@dataclass
class SessionRecord:
    session_id: str
    module: ModuleName
    user_id: str
    device_id: str
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
        Initialize MemoryStore with optional session TTL.
        
        Args:
            session_ttl_hours: Session time-to-live in hours. If None, uses SESSION_TTL_HOURS
                              environment variable (default: 24 hours). Set to 0 to disable expiration.
        """
        self._sessions: Dict[str, SessionRecord] = {}
        
        # Get TTL from parameter or environment variable, default to 24 hours
        if session_ttl_hours is not None:
            self.session_ttl_hours = session_ttl_hours
        else:
            self.session_ttl_hours = int(os.getenv("SESSION_TTL_HOURS", "24"))
        
        # Start background cleanup thread if TTL is enabled
        self._cleanup_running = False
        self._cleanup_thread: Optional[threading.Thread] = None
        if self.session_ttl_hours > 0:
            self.start_cleanup_task()

    def start_session(self, user_id: str, device_id: str, module: ModuleName) -> SessionRecord:
        session_id = str(uuid4())
        now = datetime.now(timezone.utc)
        record = SessionRecord(
            session_id=session_id,
            module=module,
            user_id=user_id,
            device_id=device_id,
            created_at=now,
            last_accessed_at=now,
        )
        self._sessions[session_id] = record
        return record

    def get_session(self, session_id: str) -> Optional[SessionRecord]:
        record = self._sessions.get(session_id)
        if record:
            # Update last accessed time
            record.last_accessed_at = datetime.now(timezone.utc)
        return record

    def append_event(self, session_id: str, event: EventIn) -> Optional[EventOut]:
        record = self._sessions.get(session_id)
        if not record:
            return None
        event_out = EventOut(
            id=str(uuid4()),
            type=event.type,
            payload=event.payload,
            timestamp=event.timestamp,
        )
        record.events.append(event_out)
        return event_out

    def update_last_risk(self, session_id: str, risk: RiskResponse) -> None:
        record = self._sessions.get(session_id)
        if record:
            record.last_risk = risk

    def summarize(self, session_id: str, key_takeaways: List[str]) -> Optional[SessionSummary]:
        record = self._sessions.get(session_id)
        if not record or not record.last_risk:
            return None
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
    
    def cleanup_old_sessions(self, max_age_hours: int = 48) -> int:
        """
        Remove sessions older than max_age_hours, regardless of last access time.
        Useful for cleaning up abandoned sessions.
        
        Args:
            max_age_hours: Maximum age in hours for sessions to keep
            
        Returns:
            Number of sessions removed
        """
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
        
        old_sessions = [
            session_id for session_id, record in self._sessions.items()
            if record.created_at < cutoff_time
        ]
        
        for session_id in old_sessions:
            del self._sessions[session_id]
        
        return len(old_sessions)
    
    def _cleanup_task(self) -> None:
        """Background task that periodically cleans up expired sessions."""
        while self._cleanup_running:
            try:
                # Run cleanup every hour
                time.sleep(3600)
                if self._cleanup_running:
                    expired_count = self.cleanup_expired_sessions()
                    old_count = self.cleanup_old_sessions()
                    if expired_count > 0 or old_count > 0:
                        print(f"Cleanup: Removed {expired_count} expired and {old_count} old sessions")
            except Exception as e:
                print(f"Error in cleanup task: {e}")
    
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
