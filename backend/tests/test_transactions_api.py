"""
Tests for GET /api/transactions and GET /api/transactions/{id}.

Uses a live PostgreSQL connection (the seeded test DB).
All tests read from the existing 10,000-record dataset.
"""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def get(path: str, params: dict = None):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        return await client.get(path, params=params or {})


# ---------------------------------------------------------------------------
# Pagination
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_default_page_returns_25_items() -> None:
    r = await get("/api/transactions")
    assert r.status_code == 200
    body = r.json()
    assert body["page"] == 1
    assert body["page_size"] == 25
    assert len(body["items"]) == 25
    assert body["total"] == 10000


@pytest.mark.asyncio
async def test_custom_page_size() -> None:
    r = await get("/api/transactions", {"page_size": 10})
    assert r.status_code == 200
    assert len(r.json()["items"]) == 10


@pytest.mark.asyncio
async def test_second_page_has_different_items() -> None:
    r1 = await get("/api/transactions", {"page": 1, "page_size": 5})
    r2 = await get("/api/transactions", {"page": 2, "page_size": 5})
    ids1 = {i["id"] for i in r1.json()["items"]}
    ids2 = {i["id"] for i in r2.json()["items"]}
    assert ids1.isdisjoint(ids2)


@pytest.mark.asyncio
async def test_total_pages_computed_correctly() -> None:
    r = await get("/api/transactions", {"page_size": 100})
    body = r.json()
    assert body["total_pages"] == 100  # 10000 / 100


@pytest.mark.asyncio
async def test_page_size_max_200() -> None:
    r = await get("/api/transactions", {"page_size": 201})
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_search_by_merchant() -> None:
    r = await get("/api/transactions", {"search": "Domino"})
    assert r.status_code == 200
    body = r.json()
    assert body["total"] > 0
    for item in body["items"]:
        assert "domino" in item["merchant"].lower()


@pytest.mark.asyncio
async def test_search_by_source_id() -> None:
    r = await get("/api/transactions", {"search": "TXN2025000002"})
    assert r.status_code == 200
    # Should find at least the known record
    assert r.json()["total"] >= 1


@pytest.mark.asyncio
async def test_search_no_results() -> None:
    r = await get("/api/transactions", {"search": "ZZZNONEXISTENTMERCHANT"})
    assert r.status_code == 200
    assert r.json()["total"] == 0
    assert r.json()["items"] == []


# ---------------------------------------------------------------------------
# Category filter
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_filter_by_category() -> None:
    r = await get("/api/transactions", {"category": "Food & Dining", "page_size": 5})
    assert r.status_code == 200
    body = r.json()
    assert body["total"] > 0
    for item in body["items"]:
        assert item["category"] == "Food & Dining"


@pytest.mark.asyncio
async def test_uncategorized_filter() -> None:
    r = await get("/api/transactions", {"category": "Uncategorized"})
    assert r.status_code == 200
    # Dataset has 250 null/empty → Uncategorized
    assert r.json()["total"] >= 200


# ---------------------------------------------------------------------------
# Status filter
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_filter_by_status_success() -> None:
    r = await get("/api/transactions", {"status": "SUCCESS"})
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 8800  # 8775 SUCCESS + 25 normalized success
    for item in body["items"]:
        assert item["status"] == "SUCCESS"


@pytest.mark.asyncio
async def test_filter_by_status_failed() -> None:
    r = await get("/api/transactions", {"status": "FAILED"})
    assert r.status_code == 200
    assert r.json()["total"] == 700


@pytest.mark.asyncio
async def test_filter_by_status_pending() -> None:
    r = await get("/api/transactions", {"status": "PENDING"})
    assert r.status_code == 200
    assert r.json()["total"] == 500


@pytest.mark.asyncio
async def test_invalid_status_returns_422() -> None:
    r = await get("/api/transactions", {"status": "CANCELLED"})
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# Amount filters
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_min_amount_filter() -> None:
    r = await get("/api/transactions", {"min_amount": "10000", "page_size": 5})
    assert r.status_code == 200
    for item in r.json()["items"]:
        assert float(item["amount"]) >= 10000


@pytest.mark.asyncio
async def test_max_amount_filter() -> None:
    r = await get("/api/transactions", {"max_amount": "500", "page_size": 5})
    assert r.status_code == 200
    for item in r.json()["items"]:
        assert float(item["amount"]) <= 500


@pytest.mark.asyncio
async def test_amount_range_filter() -> None:
    r = await get("/api/transactions", {"min_amount": "100", "max_amount": "1000", "page_size": 10})
    assert r.status_code == 200
    for item in r.json()["items"]:
        assert 100 <= float(item["amount"]) <= 1000


@pytest.mark.asyncio
async def test_inverted_amount_range_returns_422() -> None:
    r = await get("/api/transactions", {"min_amount": "1000", "max_amount": "100"})
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_negative_amounts_returned() -> None:
    """Dataset has 148 negative amounts — they must be queryable."""
    r = await get("/api/transactions", {"max_amount": "-0.01"})
    assert r.status_code == 200
    assert r.json()["total"] == 148


# ---------------------------------------------------------------------------
# Date filters
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_date_filter_start() -> None:
    r = await get("/api/transactions", {"start_date": "2026-01-01T00:00:00Z"})
    assert r.status_code == 200
    assert r.json()["total"] > 0


@pytest.mark.asyncio
async def test_date_filter_range() -> None:
    r = await get("/api/transactions", {
        "start_date": "2025-07-01T00:00:00Z",
        "end_date": "2025-12-31T23:59:59Z",
    })
    assert r.status_code == 200
    assert r.json()["total"] > 0


@pytest.mark.asyncio
async def test_inverted_date_range_returns_422() -> None:
    r = await get("/api/transactions", {
        "start_date": "2026-01-01T00:00:00Z",
        "end_date": "2025-01-01T00:00:00Z",
    })
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# Sorting
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_sort_by_amount_asc() -> None:
    r = await get("/api/transactions", {"sort_by": "amount", "sort_order": "asc", "page_size": 5})
    assert r.status_code == 200
    amounts = [float(i["amount"]) for i in r.json()["items"]]
    assert amounts == sorted(amounts)


@pytest.mark.asyncio
async def test_sort_by_amount_desc() -> None:
    r = await get("/api/transactions", {"sort_by": "amount", "sort_order": "desc", "page_size": 5})
    assert r.status_code == 200
    amounts = [float(i["amount"]) for i in r.json()["items"]]
    assert amounts == sorted(amounts, reverse=True)


@pytest.mark.asyncio
async def test_sort_by_merchant_asc() -> None:
    r = await get("/api/transactions", {"sort_by": "merchant", "sort_order": "asc", "page_size": 10})
    assert r.status_code == 200
    merchants = [i["merchant"].lower() for i in r.json()["items"]]
    assert merchants == sorted(merchants)


@pytest.mark.asyncio
async def test_invalid_sort_field_returns_422() -> None:
    r = await get("/api/transactions", {"sort_by": "DROP TABLE"})
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# Transaction detail
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_transaction_by_id() -> None:
    # Get first transaction from list
    r_list = await get("/api/transactions", {"page_size": 1})
    first_id = r_list.json()["items"][0]["id"]

    r = await get(f"/api/transactions/{first_id}")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == first_id
    assert "source_id" in body
    assert "merchant" in body
    assert "amount" in body
    assert "status" in body
    assert "transacted_at" in body


@pytest.mark.asyncio
async def test_get_transaction_not_found() -> None:
    r = await get("/api/transactions/999999999")
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# Response shape
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_response_shape() -> None:
    r = await get("/api/transactions")
    body = r.json()
    assert "items" in body
    assert "page" in body
    assert "page_size" in body
    assert "total" in body
    assert "total_pages" in body
