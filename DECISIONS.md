# Technical Decisions

This document outlines the architectural and engineering decisions made during the implementation of FinLens.

---

## 1. Monorepo Architecture
**Decision:** Single repository with `frontend/`, `backend/`, and `data/` directories.
**Why:** Simplifies the development environment, keeps frontend and backend versioned together, and avoids the overhead of managing multiple repositories for a tightly-coupled product at this scale.
**Trade-offs:** Can complicate deployment pipelines slightly (requiring path-filtering for CI/CD), but Render handles monorepos natively via root-directory configuration.

## 2. Server-Side Pagination and Filtering
**Decision:** All filtering, sorting, and pagination of the 10,000+ transaction records are executed at the database level using optimized SQL queries (via SQLAlchemy), rather than fetching everything and virtualizing on the client.
**Why:** Client-side virtualization of 10,000 records scales poorly on mobile devices, consumes excessive memory, and makes payload sizes unmanageable. Database-level pagination ensures constant-time response sizes (e.g., 25 items per page) regardless of total data volume.
**Trade-offs:** Requires a network request for every page change or filter update, but provides a massively more scalable architecture for the future.

## 3. URL-Driven State Management
**Decision:** Frontend filter, sort, and pagination states are synchronized tightly to the URL `searchParams` rather than relying purely on React `useState` or Redux/Zustand.
**Why:** Enables deep-linking. Users can bookmark or share a specific view (e.g., `?category=Food&status=SUCCESS&page=2`), and the browser's Back/Forward buttons work natively with the application state.
**Trade-offs:** Slightly more verbose to wire up `useSearchParams` and handle Next.js client-side router pushes, but results in a significantly more professional UX.

## 4. API Client Abstraction
**Decision:** A centralized, strictly-typed API client (`frontend/lib/api.ts`) is used instead of scattering `fetch()` calls across components.
**Why:** Creates a single source of truth that mirrors the FastAPI Pydantic schemas. If the backend payload changes, only the TypeScript interfaces in `api.ts` need to be updated.
**Trade-offs:** Requires upfront boilerplate to define the interfaces, but prevents silent runtime data-mapping bugs.

## 5. SQL Aggregation for Analytics
**Decision:** Monthly trend and category spending analytics are aggregated directly in PostgreSQL using `GROUP BY` and `SUM()` clauses.
**Why:** Fetching all transactions to group them in Python or JavaScript is extremely inefficient. Pushing the computation to the database guarantees fast, lightweight JSON payloads that just contain the final aggregated numbers.
**Trade-offs:** Adds complexity to the backend Repository layer, requiring custom SQLAlchemy text queries.

## 6. Atomic Reward Redemption
**Decision:** The reward redemption endpoint utilizes PostgreSQL `SELECT ... FOR UPDATE` locking to verify and deduct the coin balance.
**Why:** Prevents critical race conditions (double-spending). If a user rapidly double-clicks the "Redeem" button, the database lock ensures the first request deducts the coins before the second request can evaluate the `balance >= cost` condition.
**Trade-offs:** Locks the user's balance row momentarily, which could block concurrent reads, but since this is scoped strictly per-user, it has zero impact on global database throughput.

## 7. Amount Data Type `NUMERIC(15, 2)`
**Decision:** All currency amounts are stored as `NUMERIC(15, 2)` instead of `FLOAT` or `DOUBLE`.
**Why:** Floating-point types cannot represent decimal fractions exactly, inevitably leading to rounding errors in financial ledgers. `NUMERIC` provides exact arithmetic.
**Trade-offs:** Very slightly slower than hardware-accelerated floats, but mandatory for financial accuracy.

## 8. Graceful Frontend Error Handling (Promise.allSettled)
**Decision:** The dashboard uses `Promise.allSettled()` to fetch its core components (Category Analytics, Monthly Analytics, Rewards Balance) independently.
**Why:** Using `Promise.all()` meant that if the Rewards API failed or went offline, the entire dashboard crashed and refused to render the analytics charts. `allSettled()` isolates the failures so valid data still renders.
**Trade-offs:** Requires slightly more verbose conditional checks when destructuring the resolved promises.
