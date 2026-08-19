"""Rewards router stub — full implementation in Phase 2."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/api/rewards", tags=["rewards"])


@router.get("", summary="Rewards summary (stub)")
async def rewards_summary() -> dict:
    return {"message": "Rewards API — coming in Phase 2"}
