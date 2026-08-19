from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Reward(Base):
    """
    Coins awarded for a qualifying transaction.

    Formula (centralized in services/rewards.py):
    - 1 coin per completed ₹100
    - maximum 50 coins per transaction
    - FAILED / PENDING → 0 coins
    - negative / refund-like amounts → 0 coins
    """

    __tablename__ = "rewards"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    transaction_id: Mapped[int] = mapped_column(
        ForeignKey("transactions.id"), nullable=False, index=True
    )
    coins: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="rewards")
    transaction: Mapped["Transaction"] = relationship(back_populates="rewards")

    def __repr__(self) -> str:
        return f"<Reward id={self.id} user_id={self.user_id} coins={self.coins}>"
