from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional
from uuid import uuid4

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


class MemoryStore:
    def __init__(self) -> None:
        self._sessions: Dict[str, SessionRecord] = {}

    def start_session(self, user_id: str, device_id: str, module: ModuleName) -> SessionRecord:
        session_id = str(uuid4())
        record = SessionRecord(
            session_id=session_id,
            module=module,
            user_id=user_id,
            device_id=device_id,
            created_at=datetime.utcnow(),
        )
        self._sessions[session_id] = record
        return record

    def get_session(self, session_id: str) -> Optional[SessionRecord]:
        return self._sessions.get(session_id)

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
