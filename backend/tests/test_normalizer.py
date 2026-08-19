"""
Tests for all normalization functions in app/services/normalizer.py.

Covers every timestamp format observed in the real dataset:
  1. Epoch milliseconds
  2. ISO 8601 with Z suffix
  3. ISO 8601 with timezone offset
  4. Date-only (YYYY-MM-DD)
  5. DD/MM/YYYY [HH:MM:SS]

Also covers:
  - String amounts (with/without symbols)
  - Negative amounts
  - Status casing normalization
  - Category null/empty → "Uncategorized"
"""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

import pytest

from app.services.normalizer import (
    UNCATEGORIZED,
    normalize_amount,
    normalize_category,
    normalize_status,
    normalize_timestamp,
)


# ---------------------------------------------------------------------------
# Timestamp normalization
# ---------------------------------------------------------------------------


class TestNormalizeTimestamp:
    def test_epoch_milliseconds(self) -> None:
        """Epoch ms → UTC datetime (seen in dataset: 1768265109000)."""
        result = normalize_timestamp(1768265109000)
        assert result.tzinfo is not None
        assert result.tzinfo == timezone.utc
        # 1768265109000 ms = 1768265109 seconds
        expected = datetime.fromtimestamp(1768265109.0, tz=timezone.utc)
        assert result == expected

    def test_epoch_milliseconds_float(self) -> None:
        result = normalize_timestamp(1768265109000.0)
        assert result.tzinfo == timezone.utc

    def test_iso_z_suffix(self) -> None:
        """ISO Z → UTC (most common format in dataset)."""
        result = normalize_timestamp("2025-10-03T21:03:27Z")
        assert result == datetime(2025, 10, 3, 21, 3, 27, tzinfo=timezone.utc)

    def test_iso_offset_positive(self) -> None:
        """ISO with +05:30 offset → converted to UTC."""
        result = normalize_timestamp("2026-03-25T06:08:03+05:30")
        # 06:08:03 +05:30 = 00:38:03 UTC
        expected = datetime(2026, 3, 25, 0, 38, 3, tzinfo=timezone.utc)
        assert result == expected

    def test_iso_offset_zero(self) -> None:
        """ISO with +00:00 offset → UTC unchanged."""
        result = normalize_timestamp("2026-06-20T15:02:43+00:00")
        assert result == datetime(2026, 6, 20, 15, 2, 43, tzinfo=timezone.utc)

    def test_date_only_yyyy_mm_dd(self) -> None:
        """Date-only strings are assumed midnight UTC."""
        result = normalize_timestamp("2025-07-03")
        assert result == datetime(2025, 7, 3, 0, 0, 0, tzinfo=timezone.utc)

    def test_dd_mm_yyyy_with_time(self) -> None:
        """DD/MM/YYYY HH:MM:SS format seen in dataset."""
        result = normalize_timestamp("12/10/2025 16:24:49")
        # 12 October 2025 (dayfirst), no tz → UTC
        assert result.year == 2025
        assert result.month == 10
        assert result.day == 12
        assert result.hour == 16
        assert result.minute == 24
        assert result.tzinfo == timezone.utc

    def test_result_is_always_utc(self) -> None:
        """All formats must return UTC-aware datetimes."""
        formats = [
            1768265109000,
            "2025-10-03T21:03:27Z",
            "2026-03-25T06:08:03+05:30",
            "2025-07-03",
            "12/10/2025 16:24:49",
        ]
        for ts in formats:
            result = normalize_timestamp(ts)
            assert result.tzinfo is not None, f"Not tz-aware for: {ts}"
            assert result.utcoffset().total_seconds() == 0, f"Not UTC for: {ts}"

    def test_none_raises(self) -> None:
        with pytest.raises(ValueError):
            normalize_timestamp(None)


# ---------------------------------------------------------------------------
# Amount normalization
# ---------------------------------------------------------------------------


class TestNormalizeAmount:
    def test_float_amount(self) -> None:
        result = normalize_amount(912.62)
        assert result == Decimal("912.62")

    def test_integer_amount(self) -> None:
        result = normalize_amount(5000)
        assert result == Decimal("5000")

    def test_string_numeric(self) -> None:
        result = normalize_amount("1295.35")
        assert result == Decimal("1295.35")

    def test_string_with_rupee_symbol(self) -> None:
        result = normalize_amount("₹2500.00")
        assert result == Decimal("2500.00")

    def test_string_with_commas(self) -> None:
        result = normalize_amount("1,00,000.50")
        assert result == Decimal("100000.50")

    def test_negative_amount_preserved(self) -> None:
        """Negative amounts (refunds) must not be discarded."""
        result = normalize_amount(-500.0)
        assert result == Decimal("-500.0")
        assert result < 0

    def test_large_amount_preserved(self) -> None:
        """Unusually large amounts must be preserved."""
        result = normalize_amount(99999999.99)
        assert result == Decimal("99999999.99")

    def test_none_raises(self) -> None:
        with pytest.raises(ValueError):
            normalize_amount(None)

    def test_invalid_string_raises(self) -> None:
        with pytest.raises(ValueError):
            normalize_amount("not-a-number")


# ---------------------------------------------------------------------------
# Status normalization
# ---------------------------------------------------------------------------


class TestNormalizeStatus:
    def test_uppercase_success(self) -> None:
        assert normalize_status("SUCCESS") == "SUCCESS"

    def test_lowercase_success(self) -> None:
        """25 records in dataset have 'success' (lowercase)."""
        assert normalize_status("success") == "SUCCESS"

    def test_mixed_case(self) -> None:
        assert normalize_status("Success") == "SUCCESS"

    def test_failed(self) -> None:
        assert normalize_status("FAILED") == "FAILED"

    def test_pending(self) -> None:
        assert normalize_status("PENDING") == "PENDING"

    def test_whitespace_stripped(self) -> None:
        assert normalize_status("  SUCCESS  ") == "SUCCESS"

    def test_unknown_status_raises(self) -> None:
        with pytest.raises(ValueError):
            normalize_status("CANCELLED")

    def test_none_raises(self) -> None:
        with pytest.raises(ValueError):
            normalize_status(None)


# ---------------------------------------------------------------------------
# Category normalization
# ---------------------------------------------------------------------------


class TestNormalizeCategory:
    def test_valid_category_unchanged(self) -> None:
        assert normalize_category("Food & Dining") == "Food & Dining"

    def test_none_becomes_uncategorized(self) -> None:
        """200 null categories in dataset."""
        assert normalize_category(None) == UNCATEGORIZED

    def test_empty_string_becomes_uncategorized(self) -> None:
        """50 empty-string categories in dataset."""
        assert normalize_category("") == UNCATEGORIZED

    def test_whitespace_only_becomes_uncategorized(self) -> None:
        assert normalize_category("   ") == UNCATEGORIZED

    def test_whitespace_stripped_from_valid(self) -> None:
        assert normalize_category("  Health  ") == "Health"
