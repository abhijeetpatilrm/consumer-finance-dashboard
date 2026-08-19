"""
Rewards repository — catalogue listing, balance reads, and atomic redemption.

Redemption uses SELECT FOR UPDATE on user_coin_balance to prevent
race conditions / double-spend in concurrent requests.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.redemption import Redemption
from app.models.reward_catalogue import RewardCatalogue
from app.models.user_coin_balance import UserCoinBalance


# ---------------------------------------------------------------------------
# Catalogue
# ---------------------------------------------------------------------------


async def get_active_catalogue(db: AsyncSession) -> List[RewardCatalogue]:
    """Return all active catalogue items ordered by cost ascending."""
    result = await db.execute(
        select(RewardCatalogue)
        .where(RewardCatalogue.is_active.is_(True))
        .order_by(RewardCatalogue.cost_coins)
    )
    return list(result.scalars().all())


async def get_catalogue_item(
    db: AsyncSession, item_id: int
) -> Optional[RewardCatalogue]:
    result = await db.execute(
        select(RewardCatalogue).where(RewardCatalogue.id == item_id)
    )
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Balance
# ---------------------------------------------------------------------------


async def get_balance(db: AsyncSession, user_id: int) -> Optional[UserCoinBalance]:
    result = await db.execute(
        select(UserCoinBalance).where(UserCoinBalance.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_balance_for_update(
    db: AsyncSession, user_id: int
) -> Optional[UserCoinBalance]:
    """
    Lock the balance row for the duration of the current transaction.
    Prevents concurrent redemptions from reading stale balances.
    Uses PostgreSQL's FOR UPDATE row-level lock.
    """
    result = await db.execute(
        select(UserCoinBalance)
        .where(UserCoinBalance.user_id == user_id)
        .with_for_update()
    )
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Atomic redemption
# ---------------------------------------------------------------------------


async def redeem_coins(
    db: AsyncSession,
    user_id: int,
    catalogue_item: RewardCatalogue,
) -> Redemption:
    """
    Atomically deduct coins and create a redemption record.

    Steps (all within caller's transaction):
      1. Lock balance row (FOR UPDATE)
      2. Validate sufficient balance  → raises ValueError if not
      3. Deduct coins from balance
      4. Insert Redemption record
      5. Caller commits (or rolls back on exception)

    Raises:
        ValueError: if balance is insufficient.
        LookupError: if balance row doesn't exist.
    """
    balance_row = await get_balance_for_update(db, user_id)

    if balance_row is None:
        raise LookupError(f"No coin balance found for user_id={user_id}")

    if balance_row.balance < catalogue_item.cost_coins:
        raise ValueError(
            f"Insufficient balance: have {balance_row.balance} coins, "
            f"need {catalogue_item.cost_coins}"
        )

    # Deduct coins
    balance_row.balance -= catalogue_item.cost_coins
    balance_row.updated_at = datetime.now(tz=timezone.utc)
    db.add(balance_row)

    # Insert redemption record
    redemption = Redemption(
        user_id=user_id,
        catalogue_item_id=catalogue_item.id,
        coins_used=catalogue_item.cost_coins,
        description=f"Redeemed: {catalogue_item.name}",
    )
    db.add(redemption)
    await db.flush()  # get redemption.id without committing

    return redemption
