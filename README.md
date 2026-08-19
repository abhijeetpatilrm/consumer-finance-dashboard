# Consumer Finance Dashboard

Full-stack financial dashboard — FastAPI backend + Next.js frontend.

---

## Architecture

```
consumer-finance-dashboard/
├── backend/      FastAPI + SQLAlchemy 2 + Alembic + PostgreSQL
├── frontend/     Next.js 15 + TypeScript + Tailwind CSS 4
├── data/         Raw dataset (Transactions_.json)
└── docs/         Data quality findings, engineering decisions
```

---

## Quick Start

### Prerequisites
- Python 3.9+ with venv
- PostgreSQL 16 (via `brew install postgresql@16`)
- Node.js 20+

### Backend

```bash
# Start PostgreSQL
brew services start postgresql@16

# Create DB (first time only)
psql postgres -c "CREATE USER finance_user WITH PASSWORD 'finance_pass';"
psql postgres -c "CREATE DATABASE finance_db OWNER finance_user;"
psql finance_db -c "GRANT ALL ON SCHEMA public TO finance_user;"

cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

# Copy and edit environment
cp .env.example .env

# Run migrations
alembic upgrade head

# Seed data (idempotent — safe to re-run)
python scripts/seed.py

# Start API server
uvicorn app.main:app --reload
```

API available at `http://localhost:8000`  
Swagger docs at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

UI available at `http://localhost:3000`

---

## API Reference

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Liveness + DB connectivity check |

### Transactions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/transactions` | Paginated, filtered, sorted list |
| GET | `/api/transactions/{id}` | Single transaction by internal ID |

**Query parameters for `GET /api/transactions`:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number (1-indexed) |
| `page_size` | int | 25 | Items per page (max 200) |
| `search` | string | — | Search merchant name or transaction ID |
| `category` | string | — | Exact category filter |
| `status` | enum | — | `SUCCESS`, `FAILED`, or `PENDING` |
| `min_amount` | decimal | — | Minimum amount (inclusive) |
| `max_amount` | decimal | — | Maximum amount (inclusive) |
| `start_date` | datetime | — | Start date filter (ISO 8601) |
| `end_date` | datetime | — | End date filter (ISO 8601) |
| `sort_by` | enum | `timestamp` | `timestamp`, `amount`, `merchant`, `category`, `status` |
| `sort_order` | enum | `desc` | `asc` or `desc` |

**Response shape:**
```json
{
  "items": [...],
  "page": 1,
  "page_size": 25,
  "total": 10000,
  "total_pages": 400
}
```

**Errors:**
- `422` — invalid parameter value or inverted range
- `404` — transaction not found

### Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics/category` | Spending grouped by category |
| GET | `/api/analytics/monthly` | Spending grouped by month |

> **Spending semantics:** Only `SUCCESS` transactions with positive amounts are counted. `FAILED`, `PENDING`, and negative amounts (refunds) are excluded.

**Category response:**
```json
{
  "items": [
    { "category": "Groceries", "total_amount": "1002558.84", "transaction_count": 838 }
  ],
  "total_categories": 11
}
```

**Monthly response:**
```json
{
  "items": [
    { "year": 2025, "month": 7, "month_label": "Jul 2025", "total_amount": "4672083.99", "transaction_count": 723 }
  ]
}
```

### Rewards

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/rewards` | Active reward catalogue |
| GET | `/api/rewards/balance` | Current coin balance |
| POST | `/api/rewards/{reward_id}/redeem` | Redeem a catalogue item |

**Reward rules:**
- 1 coin per ₹100 of a `SUCCESS` transaction (floor division)
- Maximum 50 coins per transaction
- `FAILED` / `PENDING` → 0 coins
- Negative amounts → 0 coins

**Redemption:**
- Atomic: `SELECT FOR UPDATE` prevents race conditions / double-spend
- Returns `400` if balance is insufficient
- Returns `404` if reward ID not found or inactive
- Returns `422` if request body is invalid

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

All 100 tests must pass (45 Phase 1 + 55 Phase 2).

---

## Documentation

- [`docs/DATA_QUALITY.md`](docs/DATA_QUALITY.md) — data anomalies found in the dataset
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — engineering and schema decisions
