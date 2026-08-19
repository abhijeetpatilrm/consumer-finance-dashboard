# Architectural & Data Decisions

---

## 1. Monorepo Layout

**Decision**: Single repository with `frontend/`, `backend/`, `data/`, `docs/` top-level directories.

**Rationale**: Simplifies development, keeps frontend and backend versioned together, and avoids managing multiple repositories for a single product at this scale.

---

## 2. Transaction Primary Key Strategy

**Decision**: Internal auto-increment `id` (INT) as the true primary key. Source JSON `id` stored separately in `source_id` (VARCHAR, non-unique).

**Rationale**: The source dataset contains 40 records with duplicate IDs. Using the source ID as a PK would cause constraint violations and silently drop records. All 10,000 source records must be preserved.

---

## 3. Amount Data Type

**Decision**: `NUMERIC(15, 2)` for all amounts.

**Rationale**: Floating-point types (FLOAT, DOUBLE) cannot represent decimal fractions exactly, leading to rounding errors in financial calculations. `NUMERIC` provides exact arithmetic.

Precision `15, 2` accommodates the largest observed amounts (₹99,999.99 range) with room for growth.

---

## 4. Timestamp Normalization

**Decision**: All timestamps are converted to UTC at import time and stored as `TIMESTAMPTZ`.

**Rationale**: The source data contains 5 different timestamp formats. Normalizing to UTC at the boundary prevents timezone confusion in all downstream queries and analytics.

**Trade-off**: Date-only timestamps (e.g., `2025-07-03`) lose sub-day precision; stored as midnight UTC. DD/MM/YYYY timestamps without explicit timezone are assumed UTC.

---

## 5. Status Normalization

**Decision**: Stored as uppercase canonical strings (`SUCCESS`, `FAILED`, `PENDING`).

**Rationale**: 25 records in the dataset have lowercase `success`. Normalizing at import prevents inconsistent query results and the need for case-insensitive comparisons everywhere.

---

## 6. Category Normalization

**Decision**: Null/empty/whitespace-only category values → `"Uncategorized"`.

**Rationale**: 250 records (200 null + 50 empty string) have no category. Storing as NULL would require all queries to handle NULL separately. Using a sentinel string `"Uncategorized"` simplifies filtering and display.

---

## 7. Rewards Formula (Phase 1 Foundation)

**Decision**: Centralized in `backend/app/services/rewards.py` with named constants.

**Rules**:
- **1 coin per completed ₹100** of transaction amount (floor division)
- **Maximum 50 coins** per qualifying transaction
- **FAILED** transactions → 0 coins
- **PENDING** transactions → 0 coins
- **Negative or zero amounts** (refunds) → 0 coins

**Example calculations**:
| Amount | Status | Coins |
|---|---|---|
| ₹912.62 | SUCCESS | 9 |
| ₹5,446.06 | FAILED | 0 |
| ₹143.00 | SUCCESS | 1 |
| ₹35,220.00 | SUCCESS | 50 (capped) |
| −₹500.00 | SUCCESS | 0 |

**Rationale for centralization**: Business rules change frequently. Isolating in a single module with named constants means future changes require editing one file, not multiple route handlers or database triggers.

---

## 8. Database Connection Strategy

**Decision**: Two connection strings — async (`asyncpg`) for the FastAPI app, sync (`psycopg2`) for Alembic migrations and the seed script.

**Rationale**: Alembic's standard API is synchronous; `asyncpg` cannot be used directly with it without the `alembic-utils` extension. The seed script also benefits from simpler synchronous batching.

---

## 9. Seed Script Behavior

**Decision**: Insert all records including duplicates; report errors per-record without aborting.

**Rationale**: The requirement explicitly states "preserve all source transaction records" and "do not assume source transaction IDs are unique." Aborting on the first error would prevent 9,999 valid records from being imported if one record is malformed.

---

## 10. Docker Compose for PostgreSQL

**Decision**: Provide `docker-compose.yml` for local PostgreSQL. Not required for production.

**Rationale**: Eliminates "works on my machine" database setup issues. Developers can `docker-compose up -d` and be ready in seconds.
