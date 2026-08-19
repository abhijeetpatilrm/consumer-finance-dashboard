#!/usr/bin/env python3
"""
Seed script: imports Transactions_.json into PostgreSQL.

Usage (from backend/ directory):
    python scripts/seed.py [--data-path PATH]

Default data path: ../data/Transactions_.json

Behavior:
- Reads the original JSON without modifying it.
- Normalizes all records (timestamps, amounts, status, category).
- Inserts every record including duplicate source IDs.
- Reports per-record errors without aborting the full import.
- Prints a summary at the end.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from decimal import Decimal

# ---------------------------------------------------------------------------
# Path setup — allow running from backend/ or repo root
# ---------------------------------------------------------------------------

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

import os
# Load .env if present
from dotenv import load_dotenv  # type: ignore

load_dotenv(BACKEND_DIR / ".env")

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.services.normalizer import (
    normalize_amount,
    normalize_category,
    normalize_status,
    normalize_timestamp,
)

# ---------------------------------------------------------------------------
# Use sync engine for seeding (simpler, no async needed)
# ---------------------------------------------------------------------------

engine = create_engine(
    settings.SYNC_DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


# ---------------------------------------------------------------------------
# Batch size for bulk inserts
# ---------------------------------------------------------------------------

BATCH_SIZE = 500


def load_json(path: Path) -> list[dict]:
    print(f"Loading dataset from: {path}")
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"  → {len(data):,} records loaded")
    return data


def seed(data_path: Path) -> None:
    records = load_json(data_path)

    inserted = 0
    skipped = 0
    errors: list[tuple[int, str, str]] = []

    batch: list[dict] = []

    with SessionLocal() as session:
        for idx, raw in enumerate(records):
            try:
                ts = normalize_timestamp(raw.get("timestamp"))
                amount = normalize_amount(raw.get("amount"))
                status = normalize_status(raw.get("status"))
                category = normalize_category(raw.get("category"))

                row = {
                    "source_id": str(raw.get("id", "")),
                    "merchant": str(raw.get("merchant", "")).strip(),
                    "category": category,
                    "amount": amount,
                    "currency": str(raw.get("currency", "INR")).strip(),
                    "status": status,
                    "payment_method": raw.get("payment_method"),
                    "transacted_at": ts,
                }
                batch.append(row)

            except Exception as exc:
                errors.append((idx, str(raw.get("id", "?")), str(exc)))
                skipped += 1
                continue

            if len(batch) >= BATCH_SIZE:
                session.execute(
                    text(
                        """
                        INSERT INTO transactions
                            (source_id, merchant, category, amount, currency,
                             status, payment_method, transacted_at)
                        VALUES
                            (:source_id, :merchant, :category, :amount, :currency,
                             :status, :payment_method, :transacted_at)
                        """
                    ),
                    batch,
                )
                session.commit()
                inserted += len(batch)
                print(f"  → Inserted batch: {inserted:,} so far …", end="\r")
                batch = []

        # Final batch
        if batch:
            session.execute(
                text(
                    """
                    INSERT INTO transactions
                        (source_id, merchant, category, amount, currency,
                         status, payment_method, transacted_at)
                    VALUES
                        (:source_id, :merchant, :category, :amount, :currency,
                         :status, :payment_method, :transacted_at)
                    """
                ),
                batch,
            )
            session.commit()
            inserted += len(batch)

    print()
    print("=" * 60)
    print(f"Seed complete")
    print(f"  Inserted : {inserted:,}")
    print(f"  Skipped  : {skipped:,}")
    print(f"  Total    : {len(records):,}")

    if errors:
        print(f"\n  Errors ({len(errors)}):")
        for idx, source_id, msg in errors[:20]:
            print(f"    [{idx}] id={source_id!r}: {msg}")
        if len(errors) > 20:
            print(f"    ... and {len(errors) - 20} more")

    if inserted != len(records) - skipped:
        print("\nWARNING: inserted count mismatch!", file=sys.stderr)
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed transactions from JSON into PostgreSQL")
    parser.add_argument(
        "--data-path",
        type=Path,
        default=BACKEND_DIR.parent / "data" / "Transactions_.json",
        help="Path to Transactions_.json",
    )
    args = parser.parse_args()

    if not args.data_path.exists():
        print(f"ERROR: dataset not found at {args.data_path}", file=sys.stderr)
        sys.exit(1)

    seed(args.data_path)


if __name__ == "__main__":
    main()
