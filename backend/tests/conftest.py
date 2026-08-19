"""
pytest conftest — override get_db with NullPool sessions.

asyncpg connection pools bind to the event loop of the connection's creation.
When pytest-asyncio creates a new loop per test function, pooled connections
from a previous test raise "Task attached to a different loop".

Fix: override FastAPI's get_db dependency with a function that opens a fresh
NullPool connection for each test invocation. No pooling = no cross-loop leaks.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.db.session import get_db
from app.main import app


def _make_nullpool_session_factory():
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        poolclass=NullPool,
    )
    return async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )


_session_factory = _make_nullpool_session_factory()


async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
    """NullPool session — fresh connection per test invocation."""
    async with _session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@pytest.fixture(scope="session", autouse=True)
def override_get_db_dependency():
    """Replace the get_db FastAPI dependency for all tests."""
    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()


