"""Transaction router stub — full implementation in Phase 2."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("", summary="List transactions (stub)")
async def list_transactions() -> dict:
    return {"message": "Transactions API — coming in Phase 2"}
