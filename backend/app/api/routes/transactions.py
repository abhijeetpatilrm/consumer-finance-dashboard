"""Transactions API — list, filter, search, sort, paginate, detail."""

from __future__ import annotations

from decimal import Decimal
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.db.session import get_db
from app.schemas.transaction import (
    PaginatedTransactions,
    SortField,
    SortOrder,
    TransactionOut,
    TransactionStatus,
)
from app.services import transaction_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("", response_model=PaginatedTransactions, summary="List transactions")
async def list_transactions(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=25, ge=1, le=200, description="Items per page"),
    search: Optional[str] = Query(default=None, max_length=100, description="Search merchant or transaction ID"),
    category: Optional[str] = Query(default=None, description="Filter by exact category"),
    status: Optional[TransactionStatus] = Query(default=None, description="Filter by status"),
    min_amount: Optional[Decimal] = Query(default=None, description="Minimum amount (inclusive)"),
    max_amount: Optional[Decimal] = Query(default=None, description="Maximum amount (inclusive)"),
    start_date: Optional[datetime] = Query(default=None, description="Start date (ISO 8601)"),
    end_date: Optional[datetime] = Query(default=None, description="End date (ISO 8601)"),
    sort_by: SortField = Query(default=SortField.timestamp, description="Field to sort by"),
    sort_order: SortOrder = Query(default=SortOrder.desc, description="Sort direction"),
    db: AsyncSession = Depends(get_db),
) -> PaginatedTransactions:
    """
    Paginated list of transactions with server-side filtering and sorting.

    All filtering runs in PostgreSQL — no rows are fetched then filtered in Python.
    """
    return await transaction_service.list_transactions(
        db,
        page=page,
        page_size=page_size,
        search=search,
        category=category,
        status=status.value if status else None,
        min_amount=min_amount,
        max_amount=max_amount,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get("/{transaction_id}", response_model=TransactionOut, summary="Get transaction by ID")
async def get_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
) -> TransactionOut:
    """Return a single transaction by its internal database ID. Returns 404 if not found."""
    return await transaction_service.get_transaction(db, transaction_id)

