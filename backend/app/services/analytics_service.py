"""Analytics service — delegates to repository."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import analytics_repo
from app.schemas.analytics import CategoryAnalyticsResponse, MonthlyAnalyticsResponse


async def get_category_analytics(db: AsyncSession) -> CategoryAnalyticsResponse:
    return await analytics_repo.get_category_analytics(db)


async def get_monthly_analytics(db: AsyncSession) -> MonthlyAnalyticsResponse:
    return await analytics_repo.get_monthly_analytics(db)
