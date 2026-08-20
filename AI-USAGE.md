# AI Usage & Developer Ownership

In accordance with modern engineering practices, AI tools were utilized to accelerate the development, debugging, and refinement of FinLens. However, the final architecture, implementation logic, and code quality were strictly driven, reviewed, and owned by the developer.

## 1. Tools Used
- **Gemini 3.1 Pro (via Antigravity IDE):** Used extensively as an active pair-programming assistant. Its primary role was generating boilerplate UI layouts, running fast codebase searches, suggesting structural refactors for React components, and executing preliminary QA audits.

## 2. Where AI Was Used
AI assistance actively accelerated development in the following areas:
- **Frontend UI/UX Implementation:** Generating the initial layout skeletons for the Dashboard, Transactions, and Analytics pages, and applying Tailwind CSS utility classes based on the design brief.
- **API Integration:** Scaffolding the `fetch` wrappers and strongly-typed interfaces in `frontend/lib/api.ts`.
- **Debugging & QA:** Quickly surfacing runtime errors, identifying missing properties in TypeScript payloads, and suggesting layout tweaks for responsiveness.

## 3. Real Corrected / Rejected AI Outputs

AI is an assistant, not an oracle. Below are two concrete examples from this project's development history where AI-generated output or diagnosis was incomplete, incorrect, and had to be rejected or manually corrected.

### Example 1 — Broken Regex for Date Formatting

**AI suggested:**
During the UI polish phase, the AI generated a client-side date formatter in `DashboardClient.tsx` intended to append ordinal suffixes (st, nd, rd, th) to dates. It provided the following regex implementation:
`replace(/(\\d+)(?=[^\\d]|$)/, ...)`

**What I found:**
When reviewing the UI, I noticed the dashboard was displaying standard dates (e.g., "August 21, 2026") instead of the requested format ("August 21st, 2026"). The AI had improperly double-escaped the regex literal in the TSX file, causing the JavaScript engine to literally search for a backslash character followed by a 'd', rather than a numeric digit.

**What I changed:**
I manually diagnosed the syntax error via a Node REPL test and replaced the AI's implementation with the correct regex syntax:
`replace(/(\d+)(?=[^\d]|$)/, ...)`

**Why:**
AI models frequently struggle with string escaping rules when generating code strings that contain regular expressions. Manual verification and standard engineering debugging were required to trace the visual bug back to the exact regex syntax error.

### Example 2 — Misdiagnosed Rewards API 404 Error

**AI suggested:**
While debugging an issue where the Rewards API returned a `404 Not Found` exclusively in the production environment, the AI confidently hypothesized that there was a route registration or prefix mismatch in FastAPI (e.g., assuming `rewards.py` was missing the `/api` prefix). It suggested rewriting the backend router mounting logic.

**What I found:**
I rejected this hypothesis and investigated the codebase myself. By running `curl` against the local server and reviewing the `__init__.py` and `rewards.py` routing configurations, I proved the backend code was 100% correct. 

**What I changed:**
Instead of modifying the perfectly valid backend router, I determined the 404 was purely an environmental deployment issue (the production server was running a stale build). I solved the *actual* product problem by making the frontend resilient: I refactored `DashboardClient.tsx` to use `Promise.allSettled()` instead of `Promise.all()`.

**Why:**
AI often hallucinates complex architectural bugs when faced with simple environmental errors. If I had blindly followed the AI's advice, I would have broken a working local backend. By trusting my own investigation, I left the backend intact and implemented a much stronger, fault-tolerant frontend architecture.

## 4. Developer Ownership

AI was utilized strictly as an engineering assistant. It accelerated exploration and implementation, while the final code was actively reviewed, tested, debugged, and owned by me. 

Specifically, I:
- **Reviewed every generated suggestion** to ensure it aligned with the strict TypeScript interfaces and SQLAlchemy models.
- **Made final architectural decisions,** such as pushing data aggregation to the PostgreSQL layer rather than computing it client-side.
- **Integrated and corrected code,** rejecting AI suggestions that violated the project's atomic concurrency requirements or introduced regression risks.
- **Designed the database schemas and verified locking mechanisms** (e.g., `SELECT FOR UPDATE` on the coin balance).

## 5. Verification

All AI-assisted and manually written code was subjected to rigorous validation:
- **Frontend Production Build:** Verified using `npx tsc --noEmit` and `npm run build` to ensure absolute type safety and successful Next.js static/dynamic optimization.
- **Backend Test Suite:** A comprehensive Pytest suite was executed, achieving 100/100 passing tests locally against the core business logic and API endpoints.
- **API Testing:** Manual end-to-end verification of request/response cycles using `curl` and browser dev tools.
- **Database Verification:** Verified Alembic migrations and executed the Python seed script, ensuring all 10,000 ambiguous source records were safely normalized and inserted into PostgreSQL.
