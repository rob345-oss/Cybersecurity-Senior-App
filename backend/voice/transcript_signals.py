"""Map transcript text to CallGuard signal keys."""

from __future__ import annotations

import re
from typing import List, Set

# Phrase patterns -> signal_key (order matters for logging; all matches collected)
SIGNAL_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bverification\s+code\b|\b6[- ]?digit\s+code\b|\bone[- ]time\s+code\b", re.I), "verification_code_request"),
    (re.compile(r"\burgent(ly)?\b|\bimmediately\b|\bright\s+now\b|\btoday\s+only\b", re.I), "urgency"),
    (re.compile(r"\bbank\b|\bcredit\s+union\b|\baccount\s+(is\s+)?(frozen|locked|compromised)\b", re.I), "bank_impersonation"),
    (re.compile(r"\birs\b|\bsocial\s+security\b|\bssa\b|\bgovernment\b|\bfederal\s+agent\b", re.I), "government_impersonation"),
    (re.compile(r"\btech\s+support\b|\bmicrosoft\b|\bapple\s+support\b|\bcomputer\s+virus\b", re.I), "tech_support"),
    (re.compile(r"\bremote\s+access\b|\banydesk\b|\bteamviewer\b|\bscreen\s+share\b", re.I), "remote_access_request"),
    (re.compile(r"\bgift\s+card\b|\bgoogle\s+play\b|\bsteam\s+card\b", re.I), "gift_cards"),
    (re.compile(r"\bbitcoin\b|\bcrypto\b|\busdt\b|\bwire\s+transfer\b", re.I), "crypto_payment"),
    (re.compile(r"\barrest\b|\bwarrant\b|\bpolice\b|\blegal\s+action\b", re.I), "threats_or_arrest"),
    (re.compile(r"\bprize\b|\bwon\b|\blottery\b|\bfree\s+money\b", re.I), "too_good_to_be_true"),
    (re.compile(r"\bdon'?t\s+tell\b|\bkeep\s+(this\s+)?secret\b|\bconfidential\b", re.I), "asks_to_keep_secret"),
    (re.compile(r"\bspoofed\b|\bcaller\s+id\b|\bnot\s+who\s+they\s+claim\b", re.I), "caller_id_mismatch"),
]


def detect_signals(text: str) -> List[str]:
    """Return CallGuard signal keys detected in transcript text."""
    if not text or not text.strip():
        return []
    found: Set[str] = set()
    for pattern, signal_key in SIGNAL_PATTERNS:
        if pattern.search(text):
            found.add(signal_key)
    return sorted(found)


def merge_signals(*signal_lists: List[str]) -> List[str]:
    merged: Set[str] = set()
    for lst in signal_lists:
        merged.update(lst)
    return sorted(merged)
