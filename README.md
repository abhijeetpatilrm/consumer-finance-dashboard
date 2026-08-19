# Consumer Finance Dashboard

A full-stack personal finance dashboard — **Phase 1 Foundation**.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11+, SQLAlchemy 2 (async) |
| Database | PostgreSQL 16 |
| Migrations | Alembic |
| ORM | SQLAlchemy 2 (asyncpg runtime, psycopg2 for migrations) |

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.11+
- Node.js 18+

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Configure environment
cp .env.example .env

# Run migrations
alembic upgrade head

# Seed the database (10,000 transactions)
python scripts/seed.py

# Start the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs  
Health check: http://localhost:8000/api/health

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Start dev server
npm run dev
```

Frontend: http://localhost:3000

---

## Project Structure

```
consumer-finance-dashboard/
├── backend/
│   ├── alembic/              # Database migrations
│   │   └── versions/         # Migration files
│   ├── app/
│   │   ├── api/routes/       # FastAPI route handlers
│   │   ├── core/             # Configuration (env vars)
│   │   ├── db/               # Engine, session, base
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── repositories/     # Data access layer (Phase 2)
│   │   ├── schemas/          # Pydantic schemas (Phase 2)
│   │   └── services/         # Business logic
│   │       ├── normalizer.py # Data normalization pipeline
│   │       └── rewards.py    # Coin calculation rules
│   ├── scripts/
│   │   └── seed.py           # JSON → PostgreSQL import
│   └── tests/
├── data/
│   └── Transactions_.json    # Original dataset (read-only)
├── docs/
│   ├── DATA_QUALITY.md       # Dataset quality findings
│   └── DECISIONS.md          # Architectural decisions
├── frontend/
│   ├── app/                  # Next.js App Router
│   ├── components/
│   │   ├── layout/           # Sidebar, TopNav
│   │   └── ui/               # Design system primitives
│   └── lib/
│       └── api.ts            # API client
└── docker-compose.yml
```

---

## Running Tests

```bash
cd backend
source .venv/bin/activate
pytest tests/ -v
```

---

## Documentation

- [Data Quality Findings](docs/DATA_QUALITY.md)
- [Architectural Decisions](docs/DECISIONS.md)
- [API Docs](http://localhost:8000/docs) (server must be running)
