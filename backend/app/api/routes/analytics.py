"""Analytics router stub — full implementation in Phase 2."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("", summary="Analytics summary (stub)")
async def analytics_summary() -> dict:
    return {"message": "Analytics API — coming in Phase 2"}
