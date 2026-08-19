from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", summary="Health check")
async def health_check(db: AsyncSession = Depends(get_db)) -> dict:
    """
    Returns application and database health status.

    Checks:
    - Application is running
    - Database connection is live
    """
    try:
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as exc:
        db_status = f"error: {exc}"

    return {
        "status": "ok",
        "db": db_status,
    }
