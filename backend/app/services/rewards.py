"""
Rewards calculation service.

Business rules (centralized here so they can be changed in one place):
- 1 coin per completed ₹100 of transaction amount
- maximum 50 coins per qualifying transaction
- FAILED and PENDING transactions earn 0 coins
- Negative or zero amounts (refunds) earn 0 coins

These rules are documented in docs/DECISIONS.md.
"""

from __future__ import annotations

from decimal import Decimal

# ---------------------------------------------------------------------------
# Configuration — change only here to update business rules
# ---------------------------------------------------------------------------

COINS_PER_100_INR: int = 1
MAX_COINS_PER_TRANSACTION: int = 50
QUALIFYING_STATUSES: frozenset[str] = frozenset({"SUCCESS"})


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def calculate_coins(amount: Decimal | float | int, status: str) -> int:
    """
    Calculate the number of reward coins earned for a transaction.

    Args:
        amount: Transaction amount in INR (may be negative for refunds).
        status: Normalized (uppercase) transaction status.

    Returns:
        Integer coin count (0 or positive). Never negative.
    """
    normalized_status = str(status).strip().upper()

    # Non-qualifying status
    if normalized_status not in QUALIFYING_STATUSES:
        return 0

    # Negative or zero amounts earn nothing
    decimal_amount = Decimal(str(amount))
    if decimal_amount <= 0:
        return 0

    # 1 coin per ₹100 (floor division)
    coins = int(decimal_amount // 100) * COINS_PER_100_INR

    # Cap at maximum
    return min(coins, MAX_COINS_PER_TRANSACTION)
