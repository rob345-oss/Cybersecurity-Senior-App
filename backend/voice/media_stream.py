"""Twilio Media Streams WebSocket: decode audio, transcribe, run CallGuard."""

from __future__ import annotations

import audioop
import base64
import io
import json
import logging
import wave
from typing import Dict, Optional

from fastapi import WebSocket, WebSocketDisconnect

from backend.voice.call_registry import call_registry
from backend.voice.config import get_voice_config
from backend.voice.risk_pipeline import process_transcript_chunk

logger = logging.getLogger(__name__)

# ~4 seconds of 8kHz mulaw before running STT
MIN_MULAW_BYTES = 8000 * 4


def _mulaw_to_wav_bytes(mulaw_data: bytes) -> bytes:
    pcm = audioop.ulaw2lin(mulaw_data, 2)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(8000)
        wf.writeframes(pcm)
    return buf.getvalue()


async def _transcribe_mulaw_buffer(mulaw_buffer: bytes) -> str:
    cfg = get_voice_config()
    if not cfg["openai_api_key"]:
        return ""

    try:
        from openai import OpenAI

        client = OpenAI(api_key=cfg["openai_api_key"])
        wav_bytes = _mulaw_to_wav_bytes(mulaw_buffer)
        audio_file = io.BytesIO(wav_bytes)
        audio_file.name = "chunk.wav"
        result = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="en",
        )
        return (result.text or "").strip()
    except Exception as e:
        logger.warning("Whisper transcription failed: %s", e)
        return ""


class MediaStreamHandler:
    def __init__(self) -> None:
        self.call_sid: Optional[str] = None
        self.stream_sid: Optional[str] = None
        self._mulaw_buffer = bytearray()
        self._last_transcript_at = 0.0

    async def handle(self, websocket: WebSocket) -> None:
        await websocket.accept()
        try:
            while True:
                raw = await websocket.receive_text()
                message = json.loads(raw)
                event = message.get("event")

                if event == "connected":
                    logger.debug("Media stream connected")

                elif event == "start":
                    self.stream_sid = message.get("streamSid")
                    start = message.get("start", {})
                    self.call_sid = start.get("callSid")
                    logger.info("Media stream started call_sid=%s", self.call_sid)

                elif event == "media":
                    payload = message.get("media", {})
                    chunk_b64 = payload.get("payload", "")
                    if chunk_b64:
                        self._mulaw_buffer.extend(base64.b64decode(chunk_b64))
                        await self._maybe_transcribe()

                elif event == "stop":
                    await self._flush_transcription()
                    break

        except WebSocketDisconnect:
            logger.debug("Media stream disconnected")
        except Exception as e:
            logger.error("Media stream error: %s", e, exc_info=True)
        finally:
            self._mulaw_buffer.clear()

    async def _maybe_transcribe(self) -> None:
        if len(self._mulaw_buffer) < MIN_MULAW_BYTES or not self.call_sid:
            return

        buffer_snapshot = bytes(self._mulaw_buffer)
        self._mulaw_buffer.clear()

        text = await _transcribe_mulaw_buffer(buffer_snapshot)
        if not text:
            return

        record = await call_registry.get(self.call_sid)
        if not record:
            logger.warning("No call record for call_sid=%s", self.call_sid)
            return

        await process_transcript_chunk(record, text, is_final=True)

    async def _flush_transcription(self) -> None:
        if len(self._mulaw_buffer) >= 1600 and self.call_sid:  # at least 0.2s
            buffer_snapshot = bytes(self._mulaw_buffer)
            self._mulaw_buffer.clear()
            text = await _transcribe_mulaw_buffer(buffer_snapshot)
            if text:
                record = await call_registry.get(self.call_sid)
                if record:
                    await process_transcript_chunk(record, text, is_final=True)


async def twilio_media_stream_endpoint(websocket: WebSocket) -> None:
    handler = MediaStreamHandler()
    await handler.handle(websocket)
