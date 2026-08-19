"""Initial schema: users, transactions, rewards, redemptions

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-19

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # users
    # ------------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # ------------------------------------------------------------------
    # transactions
    # ------------------------------------------------------------------
    op.create_table(
        "transactions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("source_id", sa.String(length=64), nullable=False),
        sa.Column("merchant", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=128), nullable=False),
        sa.Column("amount", sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("payment_method", sa.String(length=64), nullable=True),
        sa.Column("transacted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_transactions_source_id"), "transactions", ["source_id"], unique=False)
    op.create_index(op.f("ix_transactions_status"), "transactions", ["status"], unique=False)
    op.create_index(
        op.f("ix_transactions_transacted_at"), "transactions", ["transacted_at"], unique=False
    )
    op.create_index(
        "ix_transactions_status_transacted_at",
        "transactions",
        ["status", "transacted_at"],
        unique=False,
    )
    op.create_index(
        "ix_transactions_category_transacted_at",
        "transactions",
        ["category", "transacted_at"],
        unique=False,
    )

    # ------------------------------------------------------------------
    # rewards
    # ------------------------------------------------------------------
    op.create_table(
        "rewards",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("transaction_id", sa.Integer(), nullable=False),
        sa.Column("coins", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["transaction_id"], ["transactions.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_rewards_user_id"), "rewards", ["user_id"], unique=False)
    op.create_index(op.f("ix_rewards_transaction_id"), "rewards", ["transaction_id"], unique=False)

    # ------------------------------------------------------------------
    # redemptions
    # ------------------------------------------------------------------
    op.create_table(
        "redemptions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("coins_used", sa.Integer(), nullable=False),
        sa.Column("description", sa.String(length=512), nullable=True),
        sa.Column(
            "redeemed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_redemptions_user_id"), "redemptions", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_table("redemptions")
    op.drop_index(op.f("ix_rewards_transaction_id"), table_name="rewards")
    op.drop_index(op.f("ix_rewards_user_id"), table_name="rewards")
    op.drop_table("rewards")
    op.drop_index("ix_transactions_category_transacted_at", table_name="transactions")
    op.drop_index("ix_transactions_status_transacted_at", table_name="transactions")
    op.drop_index(op.f("ix_transactions_transacted_at"), table_name="transactions")
    op.drop_index(op.f("ix_transactions_status"), table_name="transactions")
    op.drop_index(op.f("ix_transactions_source_id"), table_name="transactions")
    op.drop_table("transactions")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
