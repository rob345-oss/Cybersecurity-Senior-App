"""Message templates for share onboarding."""

from __future__ import annotations

from typing import Literal, Optional

MessageTemplateKey = Literal["default", "short", "warm", "security_focused"]

TEMPLATE_KEYS: tuple[str, ...] = ("default", "short", "warm", "security_focused")


def build_personalized_message(
    *,
    user_first_name: str,
    contact_first_name: str,
    protected_number: str,
    template: MessageTemplateKey = "default",
) -> str:
    """Build a personalized share message from a template key."""
    user = user_first_name.strip() or "me"
    contact = contact_first_name.strip() or "there"
    number = protected_number.strip()

    if template == "short":
        return (
            f"Hi {contact}—it's {user}. I have a new protected number through Titanium Guardian: "
            f"{number}. Please save it and use it when you need to reach me. "
            f"Please don't share it without asking me first."
        )
    if template == "warm":
        return (
            f"Hi {contact}, it's {user}. I wanted to let you know I now have a protected phone number "
            f"through Titanium Guardian: {number}. Your existing number for me still works for now, "
            f"but I'd appreciate you saving this new one and starting to use it when you can. "
            f"This helps me stay safer from unwanted calls. Please don't share it with others without "
            f"checking with me first."
        )
    if template == "security_focused":
        return (
            f"Hi {contact}—it's {user}. For my safety, I have a new protected phone number through "
            f"Titanium Guardian: {number}. Please save it in your contacts and use it instead of my "
            f"old number when possible. Please do not share this number with anyone else without "
            f"my permission."
        )

    return (
        f"Hi {contact}—it's {user}. I have a new protected phone number through Titanium Guardian: "
        f"{number}. Please save it in your contacts. You can still reach me at my old number for now, "
        f"but I'd like you to start using this one. Please don't share it without asking me first."
    )


def resolve_message(
    *,
    user_first_name: str,
    contact_first_name: str,
    protected_number: str,
    template: MessageTemplateKey,
    custom_message: Optional[str] = None,
) -> str:
    """Return custom message if provided, otherwise build from template."""
    if custom_message and custom_message.strip():
        return custom_message.strip()
    return build_personalized_message(
        user_first_name=user_first_name,
        contact_first_name=contact_first_name,
        protected_number=protected_number,
        template=template,
    )
