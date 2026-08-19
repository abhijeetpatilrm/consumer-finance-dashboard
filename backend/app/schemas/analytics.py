"""Pydantic schemas for Analytics API responses."""

from __future__ import annotations

from decimal import Decimal
from typing import List

from pydantic import BaseModel


class CategorySpend(BaseModel):
    """Spending totals grouped by category (SUCCESS transactions, amount > 0 only)."""

    category: str
    total_amount: Decimal
    transaction_count: int


class CategoryAnalyticsResponse(BaseModel):
    items: List[CategorySpend]
    total_categories: int


class MonthlySpend(BaseModel):
    """Spending totals grouped by calendar month."""

    year: int
    month: int
    month_label: str        # e.g. "Jul 2025"
    total_amount: Decimal
    transaction_count: int


class MonthlyAnalyticsResponse(BaseModel):
    items: List[MonthlySpend]
