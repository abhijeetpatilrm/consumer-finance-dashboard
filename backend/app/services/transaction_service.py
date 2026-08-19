"""Transaction service — validates params, delegates to repository."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import transaction_repo
from app.schemas.transaction import (
    PaginatedTransactions,
    SortField,
    SortOrder,
    TransactionOut,
)


async def list_transactions(
    db: AsyncSession,
    page: int,
    page_size: int,
    search: Optional[str],
    category: Optional[str],
    status: Optional[str],
    min_amount: Optional[Decimal],
    max_amount: Optional[Decimal],
    start_date: Optional[datetime],
    end_date: Optional[datetime],
    sort_by: SortField,
    sort_order: SortOrder,
) -> PaginatedTransactions:
    if min_amount is not None and max_amount is not None and min_amount > max_amount:
        raise HTTPException(
            status_code=422,
            detail="min_amount must be less than or equal to max_amount",
        )
    if start_date is not None and end_date is not None and start_date > end_date:
        raise HTTPException(
            status_code=422,
            detail="start_date must be before end_date",
        )

    return await transaction_repo.get_transactions(
        db,
        page=page,
        page_size=page_size,
        search=search,
        category=category,
        status=status,
        min_amount=min_amount,
        max_amount=max_amount,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        sort_order=sort_order,
    )


async def get_transaction(db: AsyncSession, transaction_id: int) -> TransactionOut:
    txn = await transaction_repo.get_transaction_by_id(db, transaction_id)
    if txn is None:
        raise HTTPException(status_code=404, detail=f"Transaction {transaction_id} not found")
    return TransactionOut.model_validate(txn)
