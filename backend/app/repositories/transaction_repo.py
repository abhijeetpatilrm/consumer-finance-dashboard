"""
Transaction repository — all database access for transactions.

All filtering, sorting, and pagination is done at the PostgreSQL level.
No rows are loaded into Python memory for client-side filtering.
"""

from __future__ import annotations

import math
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Tuple

from sqlalchemy import Select, asc, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction
from app.schemas.transaction import PaginatedTransactions, SortField, SortOrder, TransactionOut

# ---------------------------------------------------------------------------
# Column map — explicit allowlist prevents SQL injection via sort_by
# ---------------------------------------------------------------------------

_SORT_COLUMNS = {
    SortField.timestamp: Transaction.transacted_at,
    SortField.amount: Transaction.amount,
    SortField.merchant: Transaction.merchant,
    SortField.category: Transaction.category,
    SortField.status: Transaction.status,
}


async def get_transactions(
    db: AsyncSession,
    *,
    page: int = 1,
    page_size: int = 25,
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    min_amount: Optional[Decimal] = None,
    max_amount: Optional[Decimal] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    sort_by: SortField = SortField.timestamp,
    sort_order: SortOrder = SortOrder.desc,
) -> PaginatedTransactions:
    """
    Fetch a paginated, filtered, sorted page of transactions.
    All filtering is pushed to PostgreSQL.
    """
    base_q: Select = select(Transaction)

    # ------------------------------------------------------------------
    # Filters
    # ------------------------------------------------------------------
    if search:
        pattern = f"%{search}%"
        base_q = base_q.where(
            or_(
                Transaction.merchant.ilike(pattern),
                Transaction.source_id.ilike(pattern),
            )
        )

    if category:
        base_q = base_q.where(Transaction.category == category)

    if status:
        base_q = base_q.where(Transaction.status == status.upper())

    if min_amount is not None:
        base_q = base_q.where(Transaction.amount >= min_amount)

    if max_amount is not None:
        base_q = base_q.where(Transaction.amount <= max_amount)

    if start_date is not None:
        base_q = base_q.where(Transaction.transacted_at >= start_date)

    if end_date is not None:
        base_q = base_q.where(Transaction.transacted_at <= end_date)

    # ------------------------------------------------------------------
    # Total count (reuses same WHERE, no LIMIT/OFFSET)
    # ------------------------------------------------------------------
    count_q = select(func.count()).select_from(base_q.subquery())
    total: int = (await db.execute(count_q)).scalar_one()

    # ------------------------------------------------------------------
    # Sorting (column from explicit allowlist)
    # ------------------------------------------------------------------
    sort_col = _SORT_COLUMNS[sort_by]
    order_fn = asc if sort_order == SortOrder.asc else desc

    # Secondary sort by id for stable pagination
    data_q = (
        base_q
        .order_by(order_fn(sort_col), Transaction.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    rows = (await db.execute(data_q)).scalars().all()

    total_pages = max(1, math.ceil(total / page_size)) if total else 1

    return PaginatedTransactions(
        items=[TransactionOut.model_validate(r) for r in rows],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )


async def get_transaction_by_id(
    db: AsyncSession, transaction_id: int
) -> Optional[Transaction]:
    """Fetch single transaction by internal PK. Returns None if not found."""
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    return result.scalar_one_or_none()
