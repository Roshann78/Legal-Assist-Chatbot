"""Tests for session management: TTL expiration, injectable clock, and LRU eviction."""

from __future__ import annotations

import asyncio

import pytest

from legal_rag.api.sessions import InMemorySessionStore, run_periodic_session_cleanup


class MockClock:
    """Injectable monotonic clock for deterministic time manipulation in tests."""

    def __init__(self, start_time: float = 1000.0) -> None:
        self._time = start_time

    def __call__(self) -> float:
        return self._time

    def advance(self, seconds: float) -> None:
        self._time += seconds


@pytest.mark.asyncio
async def test_session_creation_and_retrieval():
    """Verify session is created with secure ID and retrieved correctly."""
    clock = MockClock(1000.0)
    store = InMemorySessionStore(ttl_seconds=300.0, max_sessions=10, time_fn=clock)

    session = await store.create(data={"user": "advocate_1"})
    assert len(session.session_id) >= 32
    assert session.created_at == 1000.0
    assert session.last_accessed_at == 1000.0
    assert session.data["user"] == "advocate_1"

    retrieved = await store.get(session.session_id)
    assert retrieved is not None
    assert retrieved.session_id == session.session_id
    assert retrieved.data["user"] == "advocate_1"


@pytest.mark.asyncio
async def test_session_expires_after_ttl():
    """Verify session is expired and removed lazily without real-time sleep."""
    clock = MockClock(1000.0)
    store = InMemorySessionStore(ttl_seconds=100.0, max_sessions=10, time_fn=clock)

    session = await store.create(data={"state": "active"})

    # Advance time within TTL
    clock.advance(50.0)
    still_active = await store.get(session.session_id)
    assert still_active is not None
    # Access refreshes last_accessed_at
    assert still_active.last_accessed_at == 1050.0

    # Advance beyond TTL (1050 + 101 = 1151 > 1050 + 100)
    clock.advance(101.0)
    expired = await store.get(session.session_id)
    assert expired is None
    assert await store.count() == 0


@pytest.mark.asyncio
async def test_capacity_cap_first_drops_expired_sessions():
    """When at capacity, store first drops expired sessions before evicting active ones."""
    clock = MockClock(1000.0)
    store = InMemorySessionStore(ttl_seconds=50.0, max_sessions=2, time_fn=clock)

    # Create 2 sessions at t=1000
    s1 = await store.create(data={"idx": 1})
    s2 = await store.create(data={"idx": 2})
    assert await store.count() == 2

    # Advance time so s1 and s2 expire (t=1060 > 1050)
    clock.advance(60.0)

    # Creating s3 at t=1060 must purge expired sessions s1 and s2 first
    s3 = await store.create(data={"idx": 3})

    assert await store.count() == 1
    assert await store.get(s1.session_id) is None
    assert await store.get(s2.session_id) is None
    assert await store.get(s3.session_id) is not None


@pytest.mark.asyncio
async def test_capacity_cap_evicts_least_recently_used():
    """When all sessions are active, store evicts the least recently accessed session."""
    clock = MockClock(1000.0)
    store = InMemorySessionStore(ttl_seconds=500.0, max_sessions=2, time_fn=clock)

    # Create 2 sessions (s1, s2)
    s1 = await store.create(data={"idx": 1})
    clock.advance(10.0)
    s2 = await store.create(data={"idx": 2})

    # Access s1 to make s2 the least recently used
    clock.advance(10.0)
    await store.get(s1.session_id)

    # Now s2 is least recently used. Creating s3 should evict s2, not s1!
    clock.advance(10.0)
    s3 = await store.create(data={"idx": 3})

    assert await store.count() == 2
    assert await store.get(s1.session_id) is not None
    assert await store.get(s2.session_id) is None  # s2 was evicted
    assert await store.get(s3.session_id) is not None


@pytest.mark.asyncio
async def test_session_update_and_deletion():
    """Verify session updating and explicit deletion."""
    clock = MockClock(1000.0)
    store = InMemorySessionStore(ttl_seconds=300.0, max_sessions=10, time_fn=clock)

    session = await store.create(data={"count": 1})
    session.data["count"] = 2
    await store.update(session)

    updated = await store.get(session.session_id)
    assert updated is not None
    assert updated.data["count"] == 2

    deleted = await store.delete(session.session_id)
    assert deleted is True
    assert await store.get(session.session_id) is None


@pytest.mark.asyncio
async def test_periodic_cleanup_task():
    """Verify the periodic cleanup background task purges expired sessions."""
    clock = MockClock(1000.0)
    store = InMemorySessionStore(ttl_seconds=50.0, max_sessions=10, time_fn=clock)

    s1 = await store.create(data={"idx": 1})
    assert await store.count() == 1

    # Start periodic task with tiny sleep interval
    task = asyncio.create_task(run_periodic_session_cleanup(store, interval_seconds=0.01))

    clock.advance(60.0)  # Make session expired
    await asyncio.sleep(0.05)  # Let cleanup loop run once

    assert await store.get(s1.session_id) is None
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task
