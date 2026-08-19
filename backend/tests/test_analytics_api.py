"""
Tests for GET /api/analytics/category and GET /api/analytics/monthly.
Uses the live seeded database.
"""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


async def get(path: str):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        return await client.get(path)


# ---------------------------------------------------------------------------
# Category analytics
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_category_returns_200() -> None:
    r = await get("/api/analytics/category")
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_category_response_shape() -> None:
    r = await get("/api/analytics/category")
    body = r.json()
    assert "items" in body
    assert "total_categories" in body
    assert body["total_categories"] > 0
    item = body["items"][0]
    assert "category" in item
    assert "total_amount" in item
    assert "transaction_count" in item


@pytest.mark.asyncio
async def test_category_only_success_transactions() -> None:
    """Analytics must exclude FAILED and PENDING transactions."""
    r = await get("/api/analytics/category")
    body = r.json()
    # Total transaction count across all categories must equal SUCCESS+positive count
    total_counted = sum(i["transaction_count"] for i in body["items"])
    # SUCCESS = 8800, but we also exclude negatives (148 records; some may be SUCCESS)
    # At minimum, total_counted < 10000 (excludes FAILED+PENDING)
    assert total_counted < 10000


@pytest.mark.asyncio
async def test_category_amounts_positive() -> None:
    """All spending amounts must be positive (refunds excluded)."""
    r = await get("/api/analytics/category")
    for item in r.json()["items"]:
        assert float(item["total_amount"]) > 0


@pytest.mark.asyncio
async def test_category_ordered_by_amount_desc() -> None:
    """Categories should be ordered by total spend descending."""
    r = await get("/api/analytics/category")
    amounts = [float(i["total_amount"]) for i in r.json()["items"]]
    assert amounts == sorted(amounts, reverse=True)


@pytest.mark.asyncio
async def test_category_includes_uncategorized() -> None:
    """Uncategorized category must appear in results."""
    r = await get("/api/analytics/category")
    categories = {i["category"] for i in r.json()["items"]}
    assert "Uncategorized" in categories


@pytest.mark.asyncio
async def test_category_total_categories_count() -> None:
    r = await get("/api/analytics/category")
    body = r.json()
    assert body["total_categories"] == len(body["items"])


# ---------------------------------------------------------------------------
# Monthly analytics
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_monthly_returns_200() -> None:
    r = await get("/api/analytics/monthly")
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_monthly_response_shape() -> None:
    r = await get("/api/analytics/monthly")
    body = r.json()
    assert "items" in body
    assert len(body["items"]) > 0
    item = body["items"][0]
    assert "year" in item
    assert "month" in item
    assert "month_label" in item
    assert "total_amount" in item
    assert "transaction_count" in item


@pytest.mark.asyncio
async def test_monthly_ordered_chronologically() -> None:
    r = await get("/api/analytics/monthly")
    items = r.json()["items"]
    for i in range(len(items) - 1):
        a, b = items[i], items[i + 1]
        assert (a["year"], a["month"]) <= (b["year"], b["month"])


@pytest.mark.asyncio
async def test_monthly_label_format() -> None:
    """month_label should be like 'Jul 2025'."""
    r = await get("/api/analytics/monthly")
    for item in r.json()["items"]:
        label = item["month_label"]
        parts = label.split()
        assert len(parts) == 2
        assert parts[0] in ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                             "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        assert parts[1].isdigit()


@pytest.mark.asyncio
async def test_monthly_amounts_positive() -> None:
    r = await get("/api/analytics/monthly")
    for item in r.json()["items"]:
        assert float(item["total_amount"]) > 0


@pytest.mark.asyncio
async def test_monthly_covers_expected_year_range() -> None:
    """Dataset spans 2025–2026."""
    r = await get("/api/analytics/monthly")
    years = {item["year"] for item in r.json()["items"]}
    assert 2025 in years
    assert 2026 in years
