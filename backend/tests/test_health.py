"""Tests for the /api/health endpoint."""

from __future__ import annotations

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch

from app.main import app


@pytest.mark.asyncio
async def test_health_returns_200() -> None:
    """Health endpoint should return HTTP 200."""
    # Mock the DB session so we don't need a live database
    async def mock_get_db():
        mock_session = AsyncMock()
        mock_session.execute = AsyncMock()
        yield mock_session

    with patch("app.api.routes.health.get_db", mock_get_db):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/api/health")

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_health_response_shape() -> None:
    """Health response should contain 'status' and 'db' keys."""
    async def mock_get_db():
        mock_session = AsyncMock()
        mock_session.execute = AsyncMock()
        yield mock_session

    with patch("app.api.routes.health.get_db", mock_get_db):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/api/health")

    body = response.json()
    assert "status" in body
    assert "db" in body
    assert body["status"] == "ok"
