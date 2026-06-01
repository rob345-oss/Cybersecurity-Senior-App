"""In-memory registry for active voice calls and browser WebSocket subscribers."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

from fastapi import WebSocket


@dataclass
class CallRecord:
    call_sid: str
    user_id: str
    session_id: str
    direction: str  # inbound | outbound
    from_number: str = ""
    to_number: str = ""
    status: str = "initiated"
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    manual_signals: Set[str] = field(default_factory=set)
    full_transcript: str = ""
    browser_sockets: Set[WebSocket] = field(default_factory=set)


class CallRegistry:
    def __init__(self) -> None:
        self._by_call_sid: Dict[str, CallRecord] = {}
        self._by_user_id: Dict[str, Set[str]] = {}
        self._by_session_id: Dict[str, str] = {}
        self._lock = asyncio.Lock()

    async def register(
        self,
        call_sid: str,
        user_id: str,
        session_id: str,
        direction: str,
        from_number: str = "",
        to_number: str = "",
    ) -> CallRecord:
        async with self._lock:
            record = CallRecord(
                call_sid=call_sid,
                user_id=user_id,
                session_id=session_id,
                direction=direction,
                from_number=from_number,
                to_number=to_number,
            )
            self._by_call_sid[call_sid] = record
            self._by_user_id.setdefault(user_id, set()).add(call_sid)
            self._by_session_id[session_id] = call_sid
            return record

    async def get(self, call_sid: str) -> Optional[CallRecord]:
        return self._by_call_sid.get(call_sid)

    async def get_by_session(self, session_id: str) -> Optional[CallRecord]:
        call_sid = self._by_session_id.get(session_id)
        if not call_sid:
            return None
        return self._by_call_sid.get(call_sid)

    async def list_for_user(self, user_id: str) -> List[CallRecord]:
        sids = self._by_user_id.get(user_id, set())
        return [self._by_call_sid[sid] for sid in sids if sid in self._by_call_sid]

    async def add_manual_signal(self, call_sid: str, signal_key: str) -> None:
        record = self._by_call_sid.get(call_sid)
        if record:
            record.manual_signals.add(signal_key)

    async def append_transcript(self, call_sid: str, text: str) -> str:
        record = self._by_call_sid.get(call_sid)
        if not record:
            return text
        if record.full_transcript:
            record.full_transcript = f"{record.full_transcript} {text}".strip()
        else:
            record.full_transcript = text.strip()
        return record.full_transcript

    async def subscribe_browser(self, session_id: str, websocket: WebSocket) -> Optional[CallRecord]:
        record = await self.get_by_session(session_id)
        if record:
            record.browser_sockets.add(websocket)
        return record

    async def unsubscribe_browser(self, session_id: str, websocket: WebSocket) -> None:
        record = await self.get_by_session(session_id)
        if record and websocket in record.browser_sockets:
            record.browser_sockets.discard(websocket)

    async def broadcast(self, call_sid: str, message: Dict[str, Any]) -> None:
        record = self._by_call_sid.get(call_sid)
        if not record:
            return
        dead: List[WebSocket] = []
        for ws in list(record.browser_sockets):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            record.browser_sockets.discard(ws)

    async def update_status(self, call_sid: str, status: str) -> None:
        record = self._by_call_sid.get(call_sid)
        if record:
            record.status = status

    async def remove(self, call_sid: str) -> None:
        async with self._lock:
            record = self._by_call_sid.pop(call_sid, None)
            if not record:
                return
            self._by_session_id.pop(record.session_id, None)
            user_sids = self._by_user_id.get(record.user_id)
            if user_sids:
                user_sids.discard(call_sid)
                if not user_sids:
                    del self._by_user_id[record.user_id]


call_registry = CallRegistry()
