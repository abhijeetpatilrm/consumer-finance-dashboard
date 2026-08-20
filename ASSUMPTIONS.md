# Product & Engineering Assumptions

During the development of FinLens, several ambiguities in the assignment brief and the provided dataset (`Transactions_.json`) required concrete engineering and product decisions. 

Below are the genuine assumptions made, driven by data quality analysis and product requirements.

---

## 1. Handling Duplicate Source IDs
**Context:** The source JSON dataset contains 10,000 records, but 40 of those records share duplicate `id` fields (e.g., `TXN2025000336`).
**Assumption:** The requirement to "preserve all source transaction records" overrides the assumption that `id` must be unique.
**Rationale:** In real-world financial systems, duplicate IDs from third-party APIs can occur due to pagination bugs or retry logic on the provider's end. Dropping them could mean dropping legitimate user transactions.
**Product Consequence:** I used an internal PostgreSQL auto-incrementing integer `id` as the true primary key, while storing the JSON ID as a non-unique `source_id`.

## 2. Default Timezone for Ambiguous Timestamps
**Context:** The dataset contains 5 different timestamp formats. While ISO 8601 strings and Epoch milliseconds provide clear UTC/offset data, 715 records are date-only (e.g., `2025-07-03`) and 841 use a `DD/MM/YYYY HH:MM:SS` format without timezone information.
**Assumption:** All ambiguous timestamps are assumed to be in UTC.
**Rationale:** Without a user-specific timezone or system locality defined in the brief, assuming UTC is the industry standard approach for storage. 
**Product Consequence:** Date-only values are stored as midnight UTC. Downstream aggregations for the monthly analytics chart group these dates consistently.

## 3. Treatment of Negative Amounts
**Context:** 148 transaction records have negative amounts.
**Assumption:** Negative amounts represent refunds, reversals, or credits to the user's account, and should be treated as valid financial events rather than data errors.
**Rationale:** The brief did not specify filtering out refunds. Discarding them would artificially inflate the total spend analytics.
**Product Consequence:** Negative amounts are preserved and stored as `NUMERIC(15, 2)`. They are excluded from earning Rewards (you don't earn coins on a refund), but are correctly factored into the "Total Spend" KPI and category aggregations.

## 4. Missing Category Classifications
**Context:** 200 records have a `null` category, and 50 records have an empty string `""`.
**Assumption:** These are valid transactions that simply lacked classification metadata from the merchant.
**Rationale:** Storing them as actual `NULL` in the database complicates SQL aggregation, frontend rendering, and filtering logic significantly.
**Product Consequence:** All missing or empty categories are normalized to a sentinel string `"Uncategorized"` upon ingestion. This allows users to easily filter and view their uncategorized spending directly in the UI.

## 5. Case-Insensitive Transaction Status
**Context:** 25 records have the status `"success"` (lowercase), while the majority use `"SUCCESS"`.
**Assumption:** The casing inconsistency is a data-entry or system-export artifact, not a meaningful distinction in transaction state.
**Rationale:** Handling case-insensitivity on every query degrades database performance and complicates Enum mapping.
**Product Consequence:** All statuses are normalized to uppercase (`SUCCESS`, `FAILED`, `PENDING`) during database insertion, ensuring strict Enum compliance.
