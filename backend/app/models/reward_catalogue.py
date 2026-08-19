from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RewardCatalogue(Base):
    """
    Items available for coin redemption.

    Seeded with a default catalogue; new items can be added without code changes.
    cost_coins is the price to redeem this reward.
    """

    __tablename__ = "reward_catalogue"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    cost_coins: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    redemptions: Mapped[List["Redemption"]] = relationship(
        back_populates="catalogue_item", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<RewardCatalogue id={self.id} name={self.name!r} cost={self.cost_coins}>"
