"""Tests for the rewards calculation service."""

from __future__ import annotations

from decimal import Decimal

import pytest

from app.services.rewards import MAX_COINS_PER_TRANSACTION, calculate_coins


class TestCalculateCoins:
    def test_success_100_inr_earns_1_coin(self) -> None:
        assert calculate_coins(Decimal("100"), "SUCCESS") == 1

    def test_success_99_inr_earns_0_coins(self) -> None:
        """Floor division — ₹99 does not complete a ₹100 unit."""
        assert calculate_coins(Decimal("99.99"), "SUCCESS") == 0

    def test_success_500_inr_earns_5_coins(self) -> None:
        assert calculate_coins(Decimal("500"), "SUCCESS") == 5

    def test_max_cap_applied(self) -> None:
        """Amounts > ₹5000 are capped at 50 coins."""
        assert calculate_coins(Decimal("99999"), "SUCCESS") == MAX_COINS_PER_TRANSACTION

    def test_exactly_5000_inr_earns_50_coins(self) -> None:
        assert calculate_coins(Decimal("5000"), "SUCCESS") == 50

    def test_failed_transaction_earns_zero(self) -> None:
        assert calculate_coins(Decimal("5000"), "FAILED") == 0

    def test_pending_transaction_earns_zero(self) -> None:
        assert calculate_coins(Decimal("5000"), "PENDING") == 0

    def test_negative_amount_earns_zero(self) -> None:
        """Negative (refund-like) amounts earn 0."""
        assert calculate_coins(Decimal("-500"), "SUCCESS") == 0

    def test_zero_amount_earns_zero(self) -> None:
        assert calculate_coins(Decimal("0"), "SUCCESS") == 0

    def test_lowercase_status_handled(self) -> None:
        """Status normalization is applied inside calculate_coins."""
        assert calculate_coins(Decimal("500"), "success") == 5

    def test_float_input_works(self) -> None:
        assert calculate_coins(912.62, "SUCCESS") == 9

    def test_int_input_works(self) -> None:
        assert calculate_coins(300, "SUCCESS") == 3
