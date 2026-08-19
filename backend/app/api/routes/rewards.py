"""Rewards API — catalogue, balance, and atomic redemption."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.rewards import RedemptionOut, RewardCatalogueResponse, UserBalance
from app.services import rewards_service

# Demo user ID — no auth in Phase 2.
# All reward endpoints operate for this user.
DEMO_USER_ID = 1

router = APIRouter(prefix="/api/rewards", tags=["rewards"])


@router.get("", response_model=RewardCatalogueResponse, summary="List reward catalogue")
async def list_rewards(db: AsyncSession = Depends(get_db)) -> RewardCatalogueResponse:
    """
    Returns all active items in the reward catalogue with their coin costs.
    """
    return await rewards_service.list_catalogue(db)


@router.get("/balance", response_model=UserBalance, summary="Get coin balance")
async def get_balance(db: AsyncSession = Depends(get_db)) -> UserBalance:
    """
    Returns the current coin balance for the demo user.
    Balance is persisted in the database — never computed on the fly from transactions.
    """
    return await rewards_service.get_user_balance(db, DEMO_USER_ID)


@router.post(
    "/{reward_id}/redeem",
    response_model=RedemptionOut,
    status_code=200,
    summary="Redeem a reward",
)
async def redeem_reward(
    reward_id: int = Path(description="Catalogue item ID to redeem"),
    db: AsyncSession = Depends(get_db),
) -> RedemptionOut:
    """
    Atomically redeem a catalogue item for the demo user.

    Steps performed inside a single database transaction:
    1. Validate reward exists and is active → 404 if not
    2. Lock coin balance row (SELECT FOR UPDATE)
    3. Check sufficient balance → 400 if not
    4. Deduct coins from balance
    5. Insert redemption record
    6. Commit

    The coin balance supplied by the client is never trusted.
    Race conditions / double-spend are prevented by FOR UPDATE locking.
    """
    return await rewards_service.redeem_reward(db, user_id=DEMO_USER_ID, reward_id=reward_id)

