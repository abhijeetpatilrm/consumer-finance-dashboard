"""
Rewards service — orchestrates catalogue, balance, and atomic redemption.

Business logic lives here; repository handles raw DB operations.
"""

from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import rewards_repo
from app.schemas.rewards import (
    RedemptionOut,
    RewardCatalogueResponse,
    UserBalance,
)


async def list_catalogue(db: AsyncSession) -> RewardCatalogueResponse:
    items = await rewards_repo.get_active_catalogue(db)
    return RewardCatalogueResponse(
        items=[
            {
                "id": item.id,
                "name": item.name,
                "description": item.description,
                "cost_coins": item.cost_coins,
                "is_active": item.is_active,
            }
            for item in items
        ]
    )


async def get_user_balance(db: AsyncSession, user_id: int) -> UserBalance:
    balance_row = await rewards_repo.get_balance(db, user_id)
    if balance_row is None:
        raise HTTPException(status_code=404, detail=f"No balance found for user {user_id}")
    return UserBalance(user_id=user_id, balance=balance_row.balance)


async def redeem_reward(
    db: AsyncSession,
    user_id: int,
    reward_id: int,
) -> RedemptionOut:
    """
    Atomically redeem a catalogue item for the given user.

    Flow:
      1. Validate catalogue item exists and is active → 404 if not
      2. Lock balance row (SELECT FOR UPDATE)
      3. Check sufficient balance → 400 if not
      4. Deduct coins + insert redemption record
      5. Commit (handled by session dependency)

    Raises:
        HTTPException 404: item not found or inactive
        HTTPException 400: insufficient balance
    """
    item = await rewards_repo.get_catalogue_item(db, reward_id)
    if item is None or not item.is_active:
        raise HTTPException(
            status_code=404,
            detail=f"Reward {reward_id} not found or not available",
        )

    try:
        redemption = await rewards_repo.redeem_coins(db, user_id=user_id, catalogue_item=item)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return RedemptionOut(
        id=redemption.id,
        user_id=redemption.user_id,
        catalogue_item_id=redemption.catalogue_item_id,
        coins_used=redemption.coins_used,
        description=redemption.description,
        redeemed_at=redemption.redeemed_at,
        reward_name=item.name,
    )
