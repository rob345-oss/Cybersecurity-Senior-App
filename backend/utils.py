"""Utility functions for input sanitization and validation."""

from __future__ import annotations

import re
from typing import Optional
from html_sanitizer import Sanitizer

# Input sanitizer configuration
# Configure to strip HTML tags and dangerous content while preserving text
# Note: html_sanitizer requires at least one tag, so we use a made-up tag name
# that will never exist in real documents. This effectively removes all HTML tags.
sanitizer = Sanitizer({
    "tags": {"__no_tags_allowed__"},  # Made-up tag name to effectively remove all HTML tags
    "attributes": {},
    "empty": set(),
    "separate": set(),
})


def sanitize_input(text: str, max_length: Optional[int] = None) -> str:
    """
    Sanitize user input by removing HTML tags and dangerous content.
    
    Args:
        text: The input text to sanitize
        max_length: Optional maximum length for the input
        
    Returns:
        Sanitized text
    """
    if not text:
        return ""
    
    # Strip whitespace
    sanitized = text.strip()
    
    # Remove HTML tags and scripts
    sanitized = sanitizer.sanitize(sanitized)
    
    # Remove control characters except newlines and tabs
    sanitized = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', sanitized)
    
    # Limit length if specified
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized

