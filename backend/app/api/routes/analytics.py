"""Analytics API — spending by category and by month."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.analytics import CategoryAnalyticsResponse, MonthlyAnalyticsResponse
from app.services import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get(
    "/category",
    response_model=CategoryAnalyticsResponse,
    summary="Spending by category",
)
async def category_analytics(db: AsyncSession = Depends(get_db)) -> CategoryAnalyticsResponse:
    """
    Returns total spending grouped by category, ordered by spend descending.

    Spending semantics: SUCCESS transactions with positive amounts only.
    Runs a single PostgreSQL GROUP BY — no Python-side aggregation.
    """
    return await analytics_service.get_category_analytics(db)


@router.get(
    "/monthly",
    response_model=MonthlyAnalyticsResponse,
    summary="Spending by month",
)
async def monthly_analytics(db: AsyncSession = Depends(get_db)) -> MonthlyAnalyticsResponse:
    """
    Returns total spending grouped by calendar month (year+month), ordered chronologically.

    Spending semantics: SUCCESS transactions with positive amounts only.
    """
    return await analytics_service.get_monthly_analytics(db)

