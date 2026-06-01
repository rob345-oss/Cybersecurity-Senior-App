#!/usr/bin/env python3
"""Print Twilio Voice env readiness (run from repo root)."""

from pathlib import Path
import sys

# Load root .env
root = Path(__file__).resolve().parents[1]
env_file = root / ".env"
if env_file.exists():
    from dotenv import load_dotenv
    load_dotenv(env_file)

sys.path.insert(0, str(root))

from backend.voice.config import get_voice_config, is_twilio_token_ready, missing_twilio_config_detail


def main() -> None:
    cfg = get_voice_config()
    print("Twilio Voice environment check\n")
    print(f"  TWILIO_ENABLED:        {cfg['enabled']}")
    print(f"  TWILIO_ACCOUNT_SID:    {'set' if cfg['account_sid'] else 'MISSING'}")
    print(f"  TWILIO_AUTH_TOKEN:     {'set' if cfg['auth_token'] else 'MISSING'}")
    print(f"  TWILIO_PHONE_NUMBER:   {cfg['phone_number'] or 'MISSING'}")
    print(f"  TWILIO_API_KEY:        {'set' if cfg['api_key'] else 'MISSING'}")
    print(f"  TWILIO_API_SECRET:     {'set' if cfg['api_secret'] else 'MISSING'}")
    print(f"  TWILIO_TWIML_APP_SID:  {cfg['twiml_app_sid'] or 'MISSING'}")
    print(f"  PUBLIC_API_URL:        {cfg['public_api_url'] or 'MISSING'}")
    print(f"  TWILIO_DEFAULT_USER_ID: {cfg['default_user_id'] or '(optional)'}")
    print()
    if is_twilio_token_ready():
        print("OK — Browser Voice SDK (/v1/voice/token) is ready.")
    else:
        print("NOT READY -", missing_twilio_config_detail())
        print("\nSee docs/TWILIO_VOICE_SETUP.md for step-by-step Console setup.")
        sys.exit(1)


if __name__ == "__main__":
    main()
