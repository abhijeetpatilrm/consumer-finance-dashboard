# Data Quality Findings — Transactions_.json

Generated from analysis of 10,000 transaction records.

---

## Summary

| Metric | Value |
|---|---|
| Total records | 10,000 |
| All currencies | INR (100%) |
| Unique source IDs | 9,960 |
| Duplicate source IDs | 40 records (see below) |

---

## 1. Timestamp Format Diversity

The dataset contains **5 distinct timestamp formats**:

| Format | Count | Example | Normalization |
|---|---|---|---|
| ISO 8601 with Z suffix | 5,476 | `2025-10-03T21:03:27Z` | Parse directly → UTC |
| ISO 8601 with UTC offset | 1,961 | `2026-03-25T06:08:03+05:30` | Convert to UTC |
| Epoch milliseconds (integer) | 1,007 | `1768265109000` | `/ 1000 → UTC datetime` |
| Date-only (YYYY-MM-DD) | 715 | `2025-07-03` | Assumed midnight UTC |
| DD/MM/YYYY [HH:MM:SS] | 841 | `12/10/2025 16:24:49` | Parsed dayfirst, assumed UTC |

**Risk**: Date-only values lose time-of-day precision. All are stored as midnight UTC.

**Risk**: DD/MM/YYYY timestamps without timezone are assumed UTC. If the source system is IST, these would be off by 5h30m. Without more context this is the safest assumption.

---

## 2. Status Casing Inconsistency

| Value in source | Count | Normalized to |
|---|---|---|
| `SUCCESS` | 8,775 | `SUCCESS` |
| `FAILED` | 700 | `FAILED` |
| `PENDING` | 500 | `PENDING` |
| `success` | 25 | `SUCCESS` |

The lowercase `success` variant is silently normalized to `SUCCESS` during import.

---

## 3. Category — Null and Empty Values

| Issue | Count | Action |
|---|---|---|
| `null` / missing category | 200 | Set to `"Uncategorized"` |
| Empty string `""` | 50 | Set to `"Uncategorized"` |
| Valid categories | 9,750 | Preserved as-is |

Total unique category values in source: 12 (including null/empty treated as one bucket).

---

## 4. Amount Encoding

| Issue | Count | Action |
|---|---|---|
| Float (standard) | 9,980 | `Decimal(str(value))` |
| String representation | 20 | Strip symbols/whitespace, parse as Decimal |
| Negative amounts | 148 | **Preserved** — represent refunds/credits |

All amounts stored as `NUMERIC(15, 2)` to avoid floating-point errors.

---

## 5. Duplicate Source IDs

The `id` field in the source JSON is **not unique**:

- **40 records** share an ID with at least one other record.
- Sample duplicate IDs: `TXN2025000336`, `TXN2025000371`, `TXN2025009277`, etc.

**Decision**: All records are inserted. The internal DB primary key (`id`, auto-increment) is the true unique identifier. The source `id` is stored in `source_id` (non-unique column).

---

## 6. Records Preserved / Lost

| Status | Count |
|---|---|
| Successfully imported | 10,000 (target) |
| Records dropped | 0 (design goal) |

Every valid source record is inserted, including duplicates, negatives, and records with non-standard timestamp formats.
