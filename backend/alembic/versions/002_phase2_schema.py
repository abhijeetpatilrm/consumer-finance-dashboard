"""Phase 2: reward_catalogue + user_coin_balance tables

Revision ID: 002_phase2_schema
Revises: 001_initial_schema
Create Date: 2026-08-19
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002_phase2_schema"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # reward_catalogue — items available for redemption
    # ------------------------------------------------------------------
    op.create_table(
        "reward_catalogue",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=512), nullable=True),
        sa.Column("cost_coins", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_reward_catalogue_is_active"), "reward_catalogue", ["is_active"], unique=False
    )

    # ------------------------------------------------------------------
    # user_coin_balance — persisted balance, single source of truth
    # ------------------------------------------------------------------
    op.create_table(
        "user_coin_balance",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("balance", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("user_id"),
    )

    # ------------------------------------------------------------------
    # redemptions: add catalogue_item_id FK
    # ------------------------------------------------------------------
    op.add_column(
        "redemptions",
        sa.Column("catalogue_item_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_redemptions_catalogue_item_id",
        "redemptions",
        "reward_catalogue",
        ["catalogue_item_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_redemptions_catalogue_item_id", "redemptions", type_="foreignkey"
    )
    op.drop_column("redemptions", "catalogue_item_id")
    op.drop_table("user_coin_balance")
    op.drop_index(op.f("ix_reward_catalogue_is_active"), table_name="reward_catalogue")
    op.drop_table("reward_catalogue")
