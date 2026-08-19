"""
Data normalization utilities for the transaction import pipeline.

Handles the following data-quality issues found in Transactions_.json:
- Timestamp formats: ISO Z, ISO offset, date-only, DD/MM/YYYY, epoch-millisecond
- Amount: numeric float or string representation → Decimal
- Status: mixed casing (e.g. "success") → uppercase canonical form
- Category: null / empty string / missing → "Uncategorized"
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation

from dateutil import parser as dateutil_parser

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

UNCATEGORIZED = "Uncategorized"

# Regex patterns for timestamp detection
_RE_ISO_Z = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
_RE_ISO_OFFSET = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$")
_RE_DATE_ONLY = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_RE_DD_MM_YYYY = re.compile(r"^\d{2}/\d{2}/\d{4}")


# ---------------------------------------------------------------------------
# Timestamp normalization
# ---------------------------------------------------------------------------


def normalize_timestamp(raw: int | float | str | None) -> datetime:
    """
    Convert any of the observed timestamp formats to a UTC-aware datetime.

    Supported formats:
    1. Epoch milliseconds (int/float)          e.g. 1768265109000
    2. ISO 8601 with Z suffix                  e.g. "2025-10-03T21:03:27Z"
    3. ISO 8601 with timezone offset            e.g. "2026-03-25T06:08:03+05:30"
    4. Date-only (YYYY-MM-DD)                  e.g. "2025-07-03"
    5. DD/MM/YYYY [HH:MM:SS]                   e.g. "12/10/2025 16:24:49"

    Date-only values are assumed to be midnight UTC.
    DD/MM/YYYY values without a time component are assumed to be midnight UTC.

    Raises:
        ValueError: if the value cannot be parsed into a datetime.
    """
    if raw is None:
        raise ValueError("timestamp is None")

    # 1. Epoch milliseconds
    if isinstance(raw, (int, float)):
        return datetime.fromtimestamp(raw / 1000.0, tz=timezone.utc)

    raw = raw.strip()

    # 2. ISO Z
    if _RE_ISO_Z.match(raw):
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))

    # 3. ISO with offset
    if _RE_ISO_OFFSET.match(raw):
        dt = datetime.fromisoformat(raw)
        return dt.astimezone(timezone.utc)

    # 4. Date-only YYYY-MM-DD
    if _RE_DATE_ONLY.match(raw):
        dt = datetime.strptime(raw, "%Y-%m-%d")
        return dt.replace(tzinfo=timezone.utc)

    # 5. DD/MM/YYYY [HH:MM:SS]
    if _RE_DD_MM_YYYY.match(raw):
        # dateutil handles "12/10/2025 16:24:49" with dayfirst=True
        dt = dateutil_parser.parse(raw, dayfirst=True)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    # Fallback: try dateutil generic parse
    try:
        dt = dateutil_parser.parse(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception as exc:
        raise ValueError(f"Cannot parse timestamp: {raw!r}") from exc


# ---------------------------------------------------------------------------
# Amount normalization
# ---------------------------------------------------------------------------


def normalize_amount(raw: int | float | str | None) -> Decimal:
    """
    Convert numeric or string amount to Decimal.

    - Strips currency symbols and whitespace from strings.
    - Preserves negative amounts (refunds).
    - Preserves unusually large amounts.

    Raises:
        ValueError: if the value cannot be converted.
    """
    if raw is None:
        raise ValueError("amount is None")

    if isinstance(raw, (int, float)):
        return Decimal(str(raw))

    # String: strip symbols like ₹, $, commas
    cleaned = re.sub(r"[₹$€£,\s]", "", str(raw)).strip()
    try:
        return Decimal(cleaned)
    except InvalidOperation as exc:
        raise ValueError(f"Cannot parse amount: {raw!r}") from exc


# ---------------------------------------------------------------------------
# Status normalization
# ---------------------------------------------------------------------------

_VALID_STATUSES = {"SUCCESS", "FAILED", "PENDING"}


def normalize_status(raw: str | None) -> str:
    """
    Normalize status to uppercase canonical form.

    Observed variants: "SUCCESS", "FAILED", "PENDING", "success" (25 records).

    Raises:
        ValueError: if the normalized value is not a known status.
    """
    if raw is None:
        raise ValueError("status is None")

    normalized = raw.strip().upper()
    if normalized not in _VALID_STATUSES:
        raise ValueError(f"Unknown status: {raw!r} (normalized: {normalized!r})")
    return normalized


# ---------------------------------------------------------------------------
# Category normalization
# ---------------------------------------------------------------------------


def normalize_category(raw: str | None) -> str:
    """
    Normalize category — null/empty/whitespace-only → "Uncategorized".

    Observed issues:
    - 200 null categories
    - 50 empty-string categories
    """
    if not raw or not raw.strip():
        return UNCATEGORIZED
    return raw.strip()
