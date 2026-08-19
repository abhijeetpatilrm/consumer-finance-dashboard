"""Pydantic schemas for Transaction API responses and query parameters."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class SortField(str, Enum):
    timestamp = "timestamp"
    amount = "amount"
    merchant = "merchant"
    category = "category"
    status = "status"


class SortOrder(str, Enum):
    asc = "asc"
    desc = "desc"


class TransactionStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    PENDING = "PENDING"


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------


class TransactionOut(BaseModel):
    id: int
    source_id: str
    merchant: str
    category: str
    amount: Decimal
    currency: str
    status: str
    payment_method: Optional[str]
    transacted_at: datetime

    model_config = {"from_attributes": True}


class PaginatedTransactions(BaseModel):
    items: List[TransactionOut]
    page: int
    page_size: int
    total: int
    total_pages: int


# ---------------------------------------------------------------------------
# Query parameter model
# ---------------------------------------------------------------------------


class TransactionFilters(BaseModel):
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=25, ge=1, le=200, description="Items per page")

    # Text search across merchant and source_id
    search: Optional[str] = Field(default=None, max_length=100)

    # Exact filters
    category: Optional[str] = Field(default=None, max_length=128)
    status: Optional[TransactionStatus] = None

    # Amount range
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None

    # Date range (ISO strings, parsed to datetime)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    # Sorting
    sort_by: SortField = SortField.timestamp
    sort_order: SortOrder = SortOrder.desc

    @field_validator("search", mode="before")
    @classmethod
    def strip_search(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            return v if v else None
        return v
