from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserCoinBalance(Base):
    """
    Persisted coin balance for a user. Single source of truth.

    Updated atomically via SELECT FOR UPDATE during redemption.
    Seeded from existing transactions during the seed script.
    """

    __tablename__ = "user_coin_balance"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), primary_key=True, nullable=False
    )
    balance: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship("User")

    def __repr__(self) -> str:
        return f"<UserCoinBalance user_id={self.user_id} balance={self.balance}>"
