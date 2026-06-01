"""FastAPI routes for Twilio Voice and browser call UI."""

from __future__ import annotations

import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect, status
from fastapi.responses import Response
from pydantic import BaseModel, Field
from twilio.request_validator import RequestValidator
from twilio.rest import Client as TwilioClient

from backend.auth.dependencies import get_current_user
from backend.auth.jwt_handler import verify_token
from backend.database.models import User
from backend.voice.call_registry import call_registry
from backend.voice.config import get_voice_config, is_twilio_configured, webhook_url
from backend.voice.media_stream import twilio_media_stream_endpoint
from backend.voice.risk_pipeline import process_transcript_chunk
from backend.voice.tokens import create_voice_access_token
from backend.voice.twiml import inbound_twiml, outbound_twiml

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/voice", tags=["voice"])


class VoiceTokenResponse(BaseModel):
    token: str
    identity: str


class OutboundCallRequest(BaseModel):
    to: str = Field(..., min_length=10, max_length=20, description="E.164 phone number")
    session_id: Optional[str] = None


class OutboundCallResponse(BaseModel):
    call_sid: str
    session_id: str


class ActiveCallResponse(BaseModel):
    call_sid: str
    session_id: str
    direction: str
    status: str
    from_number: str
    to_number: str


def _get_memory_store():
    from backend.main import store
    return store


def _validate_twilio_request(request: Request) -> bool:
    cfg = get_voice_config()
    if not cfg["auth_token"]:
        return False
    validator = RequestValidator(cfg["auth_token"])
    signature = request.headers.get("X-Twilio-Signature", "")
    url = str(request.url)
    form = dict(request.query_params)
    if request.method == "POST":
        # Body parsed separately in route handlers
        return True  # validated in route with form dict
    return validator.validate(url, form, signature)


async def _validate_twilio_form(request: Request, form: dict) -> None:
    cfg = get_voice_config()
    if not cfg["auth_token"]:
        raise HTTPException(status_code=503, detail="Twilio not configured")
    validator = RequestValidator(cfg["auth_token"])
    signature = request.headers.get("X-Twilio-Signature", "")
    url = str(request.url)
    if not validator.validate(url, form, signature):
        raise HTTPException(status_code=403, detail="Invalid Twilio signature")


async def _user_from_ws_token(token: Optional[str]) -> str:
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    payload = verify_token(token, token_type="access")
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid token")
    return str(payload["sub"])


@router.post("/token", response_model=VoiceTokenResponse)
async def voice_token(current_user: User = Depends(get_current_user)) -> VoiceTokenResponse:
    from backend.voice.config import is_voice_enabled, is_twilio_token_ready, missing_twilio_config_detail

    if not is_voice_enabled():
        raise HTTPException(
            status_code=503,
            detail="Twilio Voice is disabled. Set TWILIO_ENABLED=true in your .env file.",
        )
    if not is_twilio_token_ready():
        raise HTTPException(status_code=503, detail=missing_twilio_config_detail())
    identity = str(current_user.id)
    jwt_token = create_voice_access_token(identity)
    return VoiceTokenResponse(token=jwt_token, identity=identity)


@router.post("/outbound", response_model=OutboundCallResponse)
async def start_outbound_call(
    body: OutboundCallRequest,
    current_user: User = Depends(get_current_user),
) -> OutboundCallResponse:
    if not is_twilio_configured():
        raise HTTPException(status_code=503, detail="Twilio Voice is not configured")

    cfg = get_voice_config()
    store = _get_memory_store()
    user_id = str(current_user.id)

    if body.session_id:
        session_id = body.session_id
        if not store.get_session(session_id):
            raise HTTPException(status_code=404, detail="Session not found")
    else:
        record = store.start_session(user_id, "twilio-voice", "callguard")
        session_id = record.session_id

    to_number = body.to.strip()
    if not to_number.startswith("+"):
        to_number = f"+{to_number.lstrip('+')}"

    client = TwilioClient(cfg["account_sid"], cfg["auth_token"])
    call = client.calls.create(
        to=to_number,
        from_=cfg["phone_number"],
        url=webhook_url("/v1/voice/webhooks/outbound") + f"?To={to_number}&SessionId={session_id}&UserId={user_id}",
        status_callback=webhook_url("/v1/voice/webhooks/status"),
        status_callback_event=["initiated", "ringing", "answered", "completed"],
        status_callback_method="POST",
    )

    await call_registry.register(
        call_sid=call.sid,
        user_id=user_id,
        session_id=session_id,
        direction="outbound",
        from_number=cfg["phone_number"],
        to_number=to_number,
    )

    return OutboundCallResponse(call_sid=call.sid, session_id=session_id)


@router.post("/calls/{call_sid}/end")
async def end_call(
    call_sid: str,
    current_user: User = Depends(get_current_user),
) -> dict:
    if not is_twilio_configured():
        raise HTTPException(status_code=503, detail="Twilio Voice is not configured")

    record = await call_registry.get(call_sid)
    if not record or record.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Call not found")

    cfg = get_voice_config()
    client = TwilioClient(cfg["account_sid"], cfg["auth_token"])
    client.calls(call_sid).update(status="completed")
    await call_registry.remove(call_sid)
    return {"status": "ended", "call_sid": call_sid}


@router.get("/calls/active", response_model=List[ActiveCallResponse])
async def list_active_calls(
    current_user: User = Depends(get_current_user),
) -> List[ActiveCallResponse]:
    records = await call_registry.list_for_user(str(current_user.id))
    return [
        ActiveCallResponse(
            call_sid=r.call_sid,
            session_id=r.session_id,
            direction=r.direction,
            status=r.status,
            from_number=r.from_number,
            to_number=r.to_number,
        )
        for r in records
        if r.status not in ("completed", "failed", "busy", "no-answer", "canceled")
    ]


@router.websocket("/ws")
async def browser_voice_ws(websocket: WebSocket, session_id: str, token: Optional[str] = None):
    payload = verify_token(token or "", token_type="access") if token else None
    if not payload or not payload.get("sub"):
        await websocket.close(code=4401)
        return

    user_id = str(payload["sub"])
    record = await call_registry.get_by_session(session_id)
    if not record or record.user_id != user_id:
        await websocket.close(code=4403)
        return

    await websocket.accept()
    try:
        await call_registry.subscribe_browser(session_id, websocket)
        await websocket.send_json(
            {
                "type": "connected",
                "session_id": session_id,
                "call_sid": record.call_sid,
                "transcript": record.full_transcript,
            }
        )

        while True:
            data = await websocket.receive_json()
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        pass
    finally:
        await call_registry.unsubscribe_browser(session_id, websocket)


@router.websocket("/webhooks/media")
async def media_stream_webhook(websocket: WebSocket):
    await twilio_media_stream_endpoint(websocket)


@router.post("/webhooks/incoming")
async def webhook_incoming(request: Request) -> Response:
    from backend.voice.config import get_voice_config, is_voice_enabled

    if not is_voice_enabled():
        raise HTTPException(status_code=503, detail="Twilio Voice is disabled (TWILIO_ENABLED).")

    form = dict(await request.form())
    await _validate_twilio_form(request, form)

    cfg = get_voice_config()
    call_sid = form.get("CallSid", "")
    client_identity = cfg["default_user_id"] or form.get("Called", "unknown")
    require_pin = bool(cfg["voice_pin"]) and not cfg["default_user_id"]

    if cfg["default_user_id"] and call_sid:
        store = _get_memory_store()
        session = store.start_session(cfg["default_user_id"], "twilio-inbound", "callguard")
        await call_registry.register(
            call_sid=call_sid,
            user_id=cfg["default_user_id"],
            session_id=session.session_id,
            direction="inbound",
            from_number=form.get("From", ""),
            to_number=form.get("To", ""),
        )

    xml = inbound_twiml(client_identity, require_pin=require_pin)
    return Response(content=xml, media_type="application/xml")


@router.post("/webhooks/incoming/verify")
async def webhook_incoming_verify(request: Request) -> Response:
    form = dict(await request.form())
    await _validate_twilio_form(request, form)

    cfg = get_voice_config()
    digits = form.get("Digits", "")
    call_sid = form.get("CallSid", "")

    if digits != cfg["voice_pin"]:
        xml = """<?xml version="1.0" encoding="UTF-8"?>
<Response><Say>Invalid pin. Goodbye.</Say><Hangup/></Response>"""
        return Response(content=xml, media_type="application/xml")

    client_identity = cfg["default_user_id"]
    if not client_identity:
        xml = """<?xml version="1.0" encoding="UTF-8"?>
<Response><Say>Service not configured.</Say><Hangup/></Response>"""
        return Response(content=xml, media_type="application/xml")

    store = _get_memory_store()
    record = store.start_session(client_identity, "twilio-inbound", "callguard")
    await call_registry.register(
        call_sid=call_sid,
        user_id=client_identity,
        session_id=record.session_id,
        direction="inbound",
        from_number=form.get("From", ""),
        to_number=form.get("To", ""),
    )

    from backend.voice.twiml import inbound_twiml
    xml = inbound_twiml(client_identity, require_pin=False)
    return Response(content=xml, media_type="application/xml")


@router.post("/webhooks/outbound")
async def webhook_outbound(request: Request) -> Response:
    form = dict(await request.form())
    await _validate_twilio_form(request, form)

    to_number = (
        request.query_params.get("To")
        or form.get("To", "")
        or form.get("to", "")
    )
    session_id = request.query_params.get("SessionId") or form.get("SessionId", "")
    user_id = request.query_params.get("UserId") or form.get("UserId", "")
    call_sid = form.get("CallSid", "")

    if not to_number:
        to_number = form.get("Called", "")

    if session_id and user_id and call_sid:
        existing = await call_registry.get(call_sid)
        if not existing:
            await call_registry.register(
                call_sid=call_sid,
                user_id=user_id,
                session_id=session_id,
                direction="outbound",
                from_number=form.get("From", ""),
                to_number=to_number,
            )
    elif call_sid and to_number and session_id and user_id:
        cfg = get_voice_config()
        caller = form.get("From", "")
        existing = await call_registry.get(call_sid)
        if not existing:
            await call_registry.register(
                call_sid=call_sid,
                user_id=user_id,
                session_id=session_id,
                direction="outbound",
                from_number=caller or cfg["phone_number"],
                to_number=to_number,
            )

    xml = outbound_twiml(to_number)
    return Response(content=xml, media_type="application/xml")


@router.post("/webhooks/status")
async def webhook_status(request: Request) -> Response:
    form = dict(await request.form())
    await _validate_twilio_form(request, form)

    call_sid = form.get("CallSid", "")
    call_status = form.get("CallStatus", "")

    if call_sid:
        await call_registry.update_status(call_sid, call_status)
        if call_status in ("completed", "failed", "busy", "no-answer", "canceled"):
            record = await call_registry.get(call_sid)
            if record:
                await call_registry.broadcast(
                    call_sid,
                    {"type": "call_ended", "status": call_status, "session_id": record.session_id},
                )
            await call_registry.remove(call_sid)

    return Response(content="", status_code=200)


@router.post("/sessions/{session_id}/register-call")
async def register_browser_call(
    session_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
) -> dict:
    """Register a browser-initiated call (device.connect) with CallSid from client."""
    body = await request.json()
    call_sid = body.get("call_sid", "")
    direction = body.get("direction", "outbound")
    from_number = body.get("from", "")
    to_number = body.get("to", "")

    if not call_sid:
        raise HTTPException(status_code=400, detail="call_sid required")

    store = _get_memory_store()
    if not store.get_session(session_id):
        raise HTTPException(status_code=404, detail="Session not found")

    await call_registry.register(
        call_sid=call_sid,
        user_id=str(current_user.id),
        session_id=session_id,
        direction=direction,
        from_number=from_number,
        to_number=to_number,
    )
    return {"ok": True, "call_sid": call_sid, "session_id": session_id}
