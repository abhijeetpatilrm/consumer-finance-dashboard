"""
Analytics repository — DB-level aggregations only.

No transactions are loaded into Python. All GROUP BY, SUM, COUNT
run in PostgreSQL via SQLAlchemy Core expressions.

Spending semantics:
  - Only SUCCESS transactions are included.
  - Negative amounts (refunds) are excluded.
  This is documented in docs/DECISIONS.md.
"""

from __future__ import annotations

from typing import List

from sqlalchemy import String, cast, extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction
from app.schemas.analytics import (
    CategoryAnalyticsResponse,
    CategorySpend,
    MonthlyAnalyticsResponse,
    MonthlySpend,
)

# Only SUCCESS transactions with positive amounts count as "spending"
_SPENDING_FILTER = (Transaction.status == "SUCCESS") & (Transaction.amount > 0)

_MONTH_NAMES = [
    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]


async def get_category_analytics(db: AsyncSession) -> CategoryAnalyticsResponse:
    """
    Returns spending totals grouped by category, ordered by total_amount desc.
    Runs a single PostgreSQL GROUP BY query.
    """
    q = (
        select(
            Transaction.category,
            func.sum(Transaction.amount).label("total_amount"),
            func.count(Transaction.id).label("transaction_count"),
        )
        .where(_SPENDING_FILTER)
        .group_by(Transaction.category)
        .order_by(func.sum(Transaction.amount).desc())
    )

    rows = (await db.execute(q)).all()

    items: List[CategorySpend] = [
        CategorySpend(
            category=row.category,
            total_amount=row.total_amount,
            transaction_count=row.transaction_count,
        )
        for row in rows
    ]

    return CategoryAnalyticsResponse(items=items, total_categories=len(items))


async def get_monthly_analytics(db: AsyncSession) -> MonthlyAnalyticsResponse:
    """
    Returns spending totals grouped by year+month, ordered chronologically.
    Uses PostgreSQL extract() — no Python-side date arithmetic.
    """
    year_col = extract("year", Transaction.transacted_at).label("year")
    month_col = extract("month", Transaction.transacted_at).label("month")

    q = (
        select(
            year_col,
            month_col,
            func.sum(Transaction.amount).label("total_amount"),
            func.count(Transaction.id).label("transaction_count"),
        )
        .where(_SPENDING_FILTER)
        .group_by(year_col, month_col)
        .order_by(year_col, month_col)
    )

    rows = (await db.execute(q)).all()

    items: List[MonthlySpend] = [
        MonthlySpend(
            year=int(row.year),
            month=int(row.month),
            month_label=f"{_MONTH_NAMES[int(row.month)]} {int(row.year)}",
            total_amount=row.total_amount,
            transaction_count=row.transaction_count,
        )
        for row in rows
    ]

    return MonthlyAnalyticsResponse(items=items)
