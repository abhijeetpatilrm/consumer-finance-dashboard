#!/usr/bin/env python3
"""
Seed script: imports Transactions_.json into PostgreSQL.
Idempotent — safe to re-run. Phase 2 additions:
  - Creates demo user (id=1) if not present
  - Seeds reward catalogue (5 items) if not present
  - Computes and persists coin balances from all SUCCESS transactions

Usage (from backend/ directory):
    python scripts/seed.py [--data-path PATH]
"""

from __future__ import annotations

import argparse
import json
import sys
from decimal import Decimal
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv  # type: ignore

load_dotenv(BACKEND_DIR / ".env")

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.services.normalizer import (
    normalize_amount,
    normalize_category,
    normalize_status,
    normalize_timestamp,
)
from app.services.rewards import calculate_coins

engine = create_engine(settings.SYNC_DATABASE_URL, echo=False, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

BATCH_SIZE = 500

# ---------------------------------------------------------------------------
# Reward catalogue items to seed
# ---------------------------------------------------------------------------

CATALOGUE_ITEMS = [
    {"name": "₹100 Cashback", "description": "Get ₹100 cashback on your next purchase", "cost_coins": 10},
    {"name": "₹250 Cashback", "description": "Get ₹250 cashback on your next purchase", "cost_coins": 25},
    {"name": "₹500 Cashback", "description": "Get ₹500 cashback on your next purchase", "cost_coins": 50},
    {"name": "Free Delivery Voucher", "description": "Free delivery on your next order", "cost_coins": 5},
    {"name": "Lounge Access Pass", "description": "Airport lounge access (single visit)", "cost_coins": 40},
]


def seed_demo_user(session) -> int:
    """Create demo user if not present. Returns user_id."""
    result = session.execute(
        text("SELECT id FROM users WHERE email = 'demo@finlens.app'")
    ).fetchone()
    if result:
        print(f"  → Demo user already exists (id={result[0]})")
        return result[0]

    session.execute(
        text("INSERT INTO users (email, name) VALUES ('demo@finlens.app', 'Demo User') RETURNING id")
    )
    session.commit()
    result = session.execute(
        text("SELECT id FROM users WHERE email = 'demo@finlens.app'")
    ).fetchone()
    user_id = result[0]
    print(f"  → Created demo user (id={user_id})")
    return user_id


def seed_catalogue(session) -> None:
    """Seed reward catalogue items if not already present."""
    for item in CATALOGUE_ITEMS:
        existing = session.execute(
            text("SELECT id FROM reward_catalogue WHERE name = :name"),
            {"name": item["name"]},
        ).fetchone()
        if not existing:
            session.execute(
                text(
                    "INSERT INTO reward_catalogue (name, description, cost_coins, is_active) "
                    "VALUES (:name, :description, :cost_coins, true)"
                ),
                item,
            )
    session.commit()
    count = session.execute(text("SELECT COUNT(*) FROM reward_catalogue")).scalar()
    print(f"  → Reward catalogue: {count} items")


def seed_transactions(session, data_path: Path) -> None:
    """Insert all transaction records (idempotent: truncate then re-insert if needed)."""
    existing = session.execute(text("SELECT COUNT(*) FROM transactions")).scalar()
    if existing > 0:
        print(f"  → Transactions already seeded ({existing:,} rows). Skipping.")
        return

    print(f"Loading dataset from: {data_path}")
    with data_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"  → {len(data):,} records loaded")

    inserted = skipped = 0
    batch = []
    errors = []

    for idx, raw in enumerate(data):
        try:
            row = {
                "source_id": str(raw.get("id", "")),
                "merchant": str(raw.get("merchant", "")).strip(),
                "category": normalize_category(raw.get("category")),
                "amount": normalize_amount(raw.get("amount")),
                "currency": str(raw.get("currency", "INR")).strip(),
                "status": normalize_status(raw.get("status")),
                "payment_method": raw.get("payment_method"),
                "transacted_at": normalize_timestamp(raw.get("timestamp")),
            }
            batch.append(row)
        except Exception as exc:
            errors.append((idx, raw.get("id"), str(exc)))
            skipped += 1
            continue

        if len(batch) >= BATCH_SIZE:
            session.execute(
                text(
                    "INSERT INTO transactions (source_id, merchant, category, amount, currency,"
                    " status, payment_method, transacted_at) VALUES (:source_id, :merchant,"
                    " :category, :amount, :currency, :status, :payment_method, :transacted_at)"
                ),
                batch,
            )
            session.commit()
            inserted += len(batch)
            print(f"  → Inserted batch: {inserted:,} so far …", end="\r")
            batch = []

    if batch:
        session.execute(
            text(
                "INSERT INTO transactions (source_id, merchant, category, amount, currency,"
                " status, payment_method, transacted_at) VALUES (:source_id, :merchant,"
                " :category, :amount, :currency, :status, :payment_method, :transacted_at)"
            ),
            batch,
        )
        session.commit()
        inserted += len(batch)

    print()
    print(f"  Inserted: {inserted:,}  Skipped: {skipped}")

    if errors:
        for e in errors[:5]:
            print(f"    Error [{e[0]}] id={e[1]}: {e[2]}")


def seed_coin_balances(session, user_id: int) -> None:
    """
    Compute coin balance from all SUCCESS transactions and persist for demo user.
    Idempotent: updates balance if already exists.
    """
    rows = session.execute(
        text("SELECT amount, status FROM transactions")
    ).fetchall()

    total_coins = sum(calculate_coins(Decimal(str(r.amount)), r.status) for r in rows)

    existing = session.execute(
        text("SELECT user_id FROM user_coin_balance WHERE user_id = :uid"),
        {"uid": user_id},
    ).fetchone()

    if existing:
        session.execute(
            text(
                "UPDATE user_coin_balance SET balance = :balance, updated_at = now() "
                "WHERE user_id = :uid"
            ),
            {"balance": total_coins, "uid": user_id},
        )
    else:
        session.execute(
            text(
                "INSERT INTO user_coin_balance (user_id, balance) VALUES (:uid, :balance)"
            ),
            {"uid": user_id, "balance": total_coins},
        )

    session.commit()
    print(f"  → Coin balance set: {total_coins:,} coins for user_id={user_id}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the finance database")
    parser.add_argument(
        "--data-path",
        type=Path,
        default=BACKEND_DIR.parent / "data" / "Transactions_.json",
    )
    args = parser.parse_args()

    if not args.data_path.exists():
        print(f"ERROR: dataset not found at {args.data_path}", file=sys.stderr)
        sys.exit(1)

    with SessionLocal() as session:
        print("\n── Step 1: Demo user ──────────────────────────────")
        user_id = seed_demo_user(session)

        print("\n── Step 2: Transactions ───────────────────────────")
        seed_transactions(session, args.data_path)

        print("\n── Step 3: Reward catalogue ───────────────────────")
        seed_catalogue(session)

        print("\n── Step 4: Coin balances ──────────────────────────")
        seed_coin_balances(session, user_id)

    print("\n✓ Seed complete\n")


if __name__ == "__main__":
    main()
