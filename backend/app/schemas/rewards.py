"""Pydantic schemas for Rewards API."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class RewardCatalogueItem(BaseModel):
    id: int
    name: str
    description: Optional[str]
    cost_coins: int
    is_active: bool

    model_config = {"from_attributes": True}


class RewardCatalogueResponse(BaseModel):
    items: List[RewardCatalogueItem]


class UserBalance(BaseModel):
    user_id: int
    balance: int


class RedemptionOut(BaseModel):
    id: int
    user_id: int
    catalogue_item_id: Optional[int]
    coins_used: int
    description: Optional[str]
    redeemed_at: datetime
    # Derived fields for convenience
    reward_name: Optional[str] = None

    model_config = {"from_attributes": True}
