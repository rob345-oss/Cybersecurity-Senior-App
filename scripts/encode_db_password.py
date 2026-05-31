#!/usr/bin/env python3
"""URL-encode a database password for PostgreSQL connection strings.

Passwords with special characters (@, #, /, spaces, etc.) must be percent-encoded
when placed in a URL. Non-ASCII characters are encoded as UTF-8 bytes first.
"""

from __future__ import annotations

import argparse
import sys
from urllib.parse import quote


def encode_password(password: str) -> str:
    """Percent-encode password for use in a PostgreSQL URL (UTF-8 safe)."""
    return quote(password, safe="")


def read_password(args: argparse.Namespace) -> str:
    if args.password is not None:
        return args.password
    if not sys.stdin.isatty():
        return sys.stdin.read().rstrip("\n\r")
    raise SystemExit(
        "No password provided. Pass it as an argument or pipe it on stdin.\n"
        "Examples:\n"
        "  python scripts/encode_db_password.py 'my#pass'\n"
        "  python scripts/encode_db_password.py --password 'my#pass'\n"
        '  Read-Host -AsSecureString ... | python scripts/encode_db_password.py'
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="UTF-8 URL-encode a database password for PostgreSQL connection strings."
    )
    parser.add_argument(
        "password",
        nargs="?",
        help="Plain-text password to encode",
    )
    parser.add_argument(
        "--password",
        "-p",
        dest="password_flag",
        help="Plain-text password (alternative to positional argument)",
    )
    parser.add_argument(
        "--build-url",
        metavar="TEMPLATE",
        help=(
            "Build a full DATABASE_URL. Use {password} as placeholder, e.g. "
            "'postgresql://user:{password}@host:5432/postgres'"
        ),
    )
    parser.add_argument(
        "--show-bytes",
        action="store_true",
        help="Also print UTF-8 bytes as hex (for debugging)",
    )
    args = parser.parse_args()

    password = args.password_flag if args.password_flag is not None else args.password
    if password is None:
        password = read_password(args)

    encoded = encode_password(password)

    if args.build_url:
        print(args.build_url.format(password=encoded))
    else:
        print(encoded)

    if args.show_bytes:
        hex_bytes = password.encode("utf-8").hex()
        print(f"utf-8 hex: {hex_bytes}", file=sys.stderr)


if __name__ == "__main__":
    main()
