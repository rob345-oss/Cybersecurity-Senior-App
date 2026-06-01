"""TwiML builders for Twilio Voice webhooks."""

from __future__ import annotations

from xml.sax.saxutils import escape

from backend.voice.config import get_voice_config, webhook_url


def _stream_start_xml() -> str:
    stream_url = webhook_url("/v1/voice/webhooks/media").replace("https://", "wss://").replace("http://", "ws://")
    return f'<Start><Stream url="{escape(stream_url)}" /></Start>'


def inbound_twiml(client_identity: str, require_pin: bool = False) -> str:
    """Connect inbound PSTN caller to a browser Client."""
    cfg = get_voice_config()
    stream = _stream_start_xml()

    if require_pin and cfg["voice_pin"]:
        action = webhook_url("/v1/voice/webhooks/incoming/verify")
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="6" action="{escape(action)}" method="POST">
    <Say>Enter your security pin.</Say>
  </Gather>
  <Say>We did not receive your pin. Goodbye.</Say>
  <Hangup/>
</Response>"""

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  {stream}
  <Dial callerId="{escape(cfg["phone_number"])}">
    <Client>{escape(client_identity)}</Client>
  </Dial>
</Response>"""


def outbound_twiml(to_number: str) -> str:
    """Dial PSTN number from browser-initiated outbound (TwiML App voice URL)."""
    cfg = get_voice_config()
    stream = _stream_start_xml()
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  {stream}
  <Dial callerId="{escape(cfg["phone_number"])}">
    <Number>{escape(to_number)}</Number>
  </Dial>
</Response>"""


def outbound_rest_twiml(client_identity: str, to_number: str) -> str:
    """REST-initiated outbound: connect PSTN to browser client."""
    cfg = get_voice_config()
    stream = _stream_start_xml()
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  {stream}
  <Dial callerId="{escape(cfg["phone_number"])}">
    <Number>{escape(to_number)}</Number>
  </Dial>
</Response>"""
