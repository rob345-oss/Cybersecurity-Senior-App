"""Twilio Voice access token generation."""

from __future__ import annotations

from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VoiceGrant

from backend.voice.config import get_voice_config, is_twilio_token_ready, missing_twilio_config_detail


def create_voice_access_token(identity: str) -> str:
    """Issue a Voice SDK access token for the given user identity (user UUID string)."""
    if not is_twilio_token_ready():
        raise RuntimeError(missing_twilio_config_detail())

    cfg = get_voice_config()
    token = AccessToken(
        cfg["account_sid"],
        cfg["api_key"],
        cfg["api_secret"],
        identity=identity,
    )
    voice_grant = VoiceGrant(
        outgoing_application_sid=cfg["twiml_app_sid"],
        incoming_allow=True,
    )
    token.add_grant(voice_grant)
    return token.to_jwt()
