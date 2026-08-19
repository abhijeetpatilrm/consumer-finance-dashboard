from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from sqlalchemy import DateTime, Index, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Transaction(Base):
    """
    Represents a financial transaction.

    Design decisions:
    - `id` is an auto-increment internal PK (never exposed as the source ID).
    - `source_id` stores the original `id` from the JSON; NOT unique because the
      dataset contains duplicate source IDs which must be preserved.
    - `amount` uses NUMERIC(15,2) to avoid floating-point rounding errors.
    - `transacted_at` is TIMESTAMPTZ — all timestamps are normalized to UTC at
      import time regardless of their original format.
    - `category` defaults to "Uncategorized" for null/empty source values.
    - `status` is normalized to UPPERCASE at import time.
    """

    __tablename__ = "transactions"

    # Internal PK
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Original source ID from dataset (not unique — duplicates are preserved)
    source_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)

    # Transaction details
    merchant: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(128), nullable=False, default="Uncategorized")
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="INR")
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    payment_method: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Normalized timestamp (UTC)
    transacted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )

    # Record insertion timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationship to rewards
    rewards: Mapped[List["Reward"]] = relationship(
        back_populates="transaction", lazy="selectin"
    )

    # Composite indexes for common query patterns
    __table_args__ = (
        Index("ix_transactions_status_transacted_at", "status", "transacted_at"),
        Index("ix_transactions_category_transacted_at", "category", "transacted_at"),
    )

    def __repr__(self) -> str:
        return (
            f"<Transaction id={self.id} source_id={self.source_id!r} "
            f"amount={self.amount} status={self.status!r}>"
        )
