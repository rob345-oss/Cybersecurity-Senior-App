"""Twilio Voice configuration from environment variables."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

_ROOT_ENV = Path(__file__).resolve().parents[2] / ".env"


def _load_env() -> None:
    """Load repo-root .env so voice settings match the file on disk (not a stale cache)."""
    if _ROOT_ENV.exists():
        load_dotenv(_ROOT_ENV, override=True)
    else:
        load_dotenv(override=True)


def _env_bool(name: str, default: bool = False) -> bool:
    val = os.getenv(name, "").strip().lower()
    if val in ("1", "true", "yes", "on"):
        return True
    if val in ("0", "false", "no", "off"):
        return False
    return default


def get_voice_config() -> dict:
    _load_env()
    public = (
        os.getenv("PUBLIC_API_URL")
        or os.getenv("NEXT_PUBLIC_API_URL")
        or "http://localhost:8000"
    )
    return {
        "enabled": _env_bool("TWILIO_ENABLED", False),
        "account_sid": os.getenv("TWILIO_ACCOUNT_SID", ""),
        "auth_token": os.getenv("TWILIO_AUTH_TOKEN", ""),
        "api_key": os.getenv("TWILIO_API_KEY", ""),
        "api_secret": os.getenv("TWILIO_API_SECRET", ""),
        "twiml_app_sid": os.getenv("TWILIO_TWIML_APP_SID", ""),
        "phone_number": os.getenv("TWILIO_PHONE_NUMBER", ""),
        "public_api_url": public.rstrip("/"),
        "voice_pin": os.getenv("TWILIO_VOICE_PIN", ""),
        "default_user_id": os.getenv("TWILIO_DEFAULT_USER_ID", ""),
        "verify_enabled": _env_bool("TWILIO_VERIFY_ENABLED", False),
        "verify_service_sid": os.getenv("TWILIO_VERIFY_SERVICE_SID", ""),
        "openai_api_key": os.getenv("OPENAI_API_KEY", ""),
    }


def is_voice_enabled() -> bool:
    return get_voice_config()["enabled"]


def is_twilio_configured() -> bool:
    """Minimum for webhooks + REST; Voice SDK token also needs API key, secret, and TwiML App SID."""
    if not is_voice_enabled():
        return False
    cfg = get_voice_config()
    return bool(
        cfg["account_sid"]
        and cfg["auth_token"]
        and cfg["phone_number"]
    )


def is_twilio_token_ready() -> bool:
    """Required for POST /v1/voice/token (Twilio Voice SDK in the browser)."""
    if not is_twilio_configured():
        return False
    cfg = get_voice_config()
    return bool(cfg["api_key"] and cfg["api_secret"] and cfg["twiml_app_sid"])


def missing_twilio_config_detail() -> str:
    cfg = get_voice_config()
    missing = []
    if not cfg["enabled"]:
        missing.append("TWILIO_ENABLED=true")
    if not cfg["account_sid"]:
        missing.append("TWILIO_ACCOUNT_SID")
    if not cfg["auth_token"]:
        missing.append("TWILIO_AUTH_TOKEN")
    if not cfg["phone_number"]:
        missing.append("TWILIO_PHONE_NUMBER")
    if not cfg["api_key"]:
        missing.append("TWILIO_API_KEY (create under Account > API keys)")
    if not cfg["api_secret"]:
        missing.append("TWILIO_API_SECRET")
    if not cfg["twiml_app_sid"]:
        missing.append("TWILIO_TWIML_APP_SID (Voice > TwiML apps)")
    if missing:
        return "Set: " + ", ".join(missing) + ". See docs/TWILIO_VOICE_SETUP.md."
    return "Twilio Voice is not configured."


def webhook_url(path: str) -> str:
    base = get_voice_config()["public_api_url"]
    return f"{base}{path}"
