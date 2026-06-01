"""Process voice transcripts through CallGuard and push updates to browsers."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from backend.models import EventIn, RiskResponse
from backend.risk_engine import callguard
from backend.voice.call_registry import CallRecord, call_registry
from backend.voice.transcript_signals import detect_signals, merge_signals

logger = logging.getLogger(__name__)


def _get_memory_store():
    from backend.main import store
    return store


async def process_transcript_chunk(
    record: CallRecord,
    text: str,
    *,
    is_final: bool = True,
) -> Optional[RiskResponse]:
    """Append transcript, run CallGuard, persist session events, broadcast to browser."""
    if not text or not text.strip():
        return None

    store = _get_memory_store()
    full_text = await call_registry.append_transcript(record.call_sid, text.strip())

    transcript_signals = detect_signals(full_text)
    manual = list(record.manual_signals)
    all_signals = merge_signals(transcript_signals, manual)

    # Persist transcript event
    session = store.get_session(record.session_id)
    if session:
        event = EventIn(
            type="transcript",
            payload={
                "text": text.strip(),
                "full_transcript": full_text,
                "is_final": is_final,
                "detected_signals": transcript_signals,
            },
            timestamp=datetime.now(timezone.utc),
        )
        store.append_event(record.session_id, event)

        # Persist new signal events for auto-detected signals
        existing_signal_keys = {
            e.payload.get("signal_key")
            for e in session.events
            if e.type == "signal" and isinstance(e.payload, dict)
        }
        for signal_key in transcript_signals:
            if signal_key not in existing_signal_keys:
                store.append_event(
                    record.session_id,
                    EventIn(
                        type="signal",
                        payload={"signal_key": signal_key, "source": "transcript"},
                        timestamp=datetime.now(timezone.utc),
                    ),
                )

    call_context: Dict[str, Any] = {
        "transcript": full_text,
        "caller_id": record.from_number or record.to_number,
        "call_direction": record.direction,
    }
    risk = callguard.assess(all_signals, call_context=call_context)
    if session:
        store.update_last_risk(record.session_id, risk)

    await call_registry.broadcast(
        record.call_sid,
        {
            "type": "risk_update",
            "risk": risk.model_dump(),
            "transcript": full_text,
            "chunk": text.strip(),
            "signals": all_signals,
            "detected_signals": transcript_signals,
            "session_id": record.session_id,
            "call_sid": record.call_sid,
        },
    )
    return risk


async def reassess_active_call(record: CallRecord) -> Optional[RiskResponse]:
    """Re-run CallGuard for an active call (e.g. after manual signal toggle)."""
    full_text = record.full_transcript
    transcript_signals = detect_signals(full_text) if full_text else []
    manual = list(record.manual_signals)
    all_signals = merge_signals(transcript_signals, manual)

    call_context: Dict[str, Any] = {
        "transcript": full_text,
        "caller_id": record.from_number or record.to_number,
        "call_direction": record.direction,
    }
    risk = callguard.assess(all_signals, call_context=call_context)
    store = _get_memory_store()
    if store.get_session(record.session_id):
        store.update_last_risk(record.session_id, risk)

    await call_registry.broadcast(
        record.call_sid,
        {
            "type": "risk_update",
            "risk": risk.model_dump(),
            "transcript": full_text,
            "chunk": "",
            "signals": all_signals,
            "detected_signals": transcript_signals,
            "session_id": record.session_id,
            "call_sid": record.call_sid,
        },
    )
    return risk


async def register_manual_signal_for_session(session_id: str, signal_key: str) -> None:
    """Called when UI adds manual signal during active voice call."""
    record = await call_registry.get_by_session(session_id)
    if record:
        await call_registry.add_manual_signal(record.call_sid, signal_key)
        await reassess_active_call(record)
