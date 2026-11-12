"""In-memory session storage with TTL expiration and LRU capacity management.

NOTE: This in-memory implementation is single-process only. In a multi-worker
or multi-instance production deployment, a distributed store (e.g. Redis)
implements the same SessionStore interface.
"""

from __future__ import annotations

import asyncio
import logging
import secrets
import time
from abc import ABC, abstractmethod
from collections import OrderedDict
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger("legal_rag.api.sessions")


@dataclass
class Session:
    """Represents a client session with metadata and state."""

    session_id: str
    created_at: float
    last_accessed_at: float
    data: dict[str, Any] = field(default_factory=dict)


class SessionStore(ABC):
    """Abstract interface for session management."""

    @abstractmethod
    async def get(self, session_id: str) -> Session | None:
        """Retrieve a session by ID, returning None if not found or expired."""

    @abstractmethod
    async def create(self, data: dict[str, Any] | None = None) -> Session:
        """Create and store a new session with a secure unique ID."""

    @abstractmethod
    async def update(self, session: Session) -> None:
        """Update an existing session's data and refresh its access time."""

    @abstractmethod
    async def delete(self, session_id: str) -> bool:
        """Remove a session by ID. Returns True if found and deleted."""

    @abstractmethod
    async def cleanup_expired(self) -> int:
        """Remove all expired sessions and return the count of purged sessions."""

    @abstractmethod
    async def count(self) -> int:
        """Return the number of currently active non-expired sessions."""


class InMemorySessionStore(SessionStore):
    """Thread-safe and async-safe in-memory session store.

    Features:
    - Injectable time function (time_fn) for instant testing without sleeping.
    - Lazy expiration on access + proactive background cleanup.
    - Capacity capping: when full, first drops expired sessions, then evicts LRU.
    """

    def __init__(
        self,
        ttl_seconds: float = 3600.0,
        max_sessions: int = 1000,
        *,
        time_fn: Callable[[], float] | None = None,
    ) -> None:
        self.ttl_seconds = ttl_seconds
        self.max_sessions = max_sessions
        self.time_fn = time_fn or time.time
        self._store: OrderedDict[str, Session] = OrderedDict()
        self._lock = asyncio.Lock()

    def _is_expired(self, session: Session, now: float) -> bool:
        return (now - session.last_accessed_at) > self.ttl_seconds

    def _cleanup_expired_locked(self, now: float) -> int:
        expired_keys = [sid for sid, sess in self._store.items() if self._is_expired(sess, now)]
        for sid in expired_keys:
            del self._store[sid]
        return len(expired_keys)

    async def get(self, session_id: str) -> Session | None:
        now = self.time_fn()
        async with self._lock:
            session = self._store.get(session_id)
            if session is None:
                return None

            if self._is_expired(session, now):
                del self._store[session_id]
                return None

            # Refresh access time and update LRU order
            session.last_accessed_at = now
            self._store.move_to_end(session_id)
            return session

    async def create(self, data: dict[str, Any] | None = None) -> Session:
        now = self.time_fn()
        session_id = secrets.token_urlsafe(32)
        session = Session(
            session_id=session_id,
            created_at=now,
            last_accessed_at=now,
            data=data or {},
        )

        async with self._lock:
            # Capacity management
            if len(self._store) >= self.max_sessions:
                # 1. First drop expired sessions
                self._cleanup_expired_locked(now)

                # 2. If still at/over capacity, evict the least recently used (first item)
                while len(self._store) >= self.max_sessions:
                    evicted_id, _ = self._store.popitem(last=False)
                    logger.debug("Evicted LRU session: %s", evicted_id)

            self._store[session_id] = session
            return session

    async def update(self, session: Session) -> None:
        now = self.time_fn()
        async with self._lock:
            if session.session_id in self._store:
                session.last_accessed_at = now
                self._store[session.session_id] = session
                self._store.move_to_end(session.session_id)

    async def delete(self, session_id: str) -> bool:
        async with self._lock:
            return bool(self._store.pop(session_id, None))

    async def cleanup_expired(self) -> int:
        now = self.time_fn()
        async with self._lock:
            return self._cleanup_expired_locked(now)

    async def count(self) -> int:
        now = self.time_fn()
        async with self._lock:
            self._cleanup_expired_locked(now)
            return len(self._store)


async def run_periodic_session_cleanup(
    store: SessionStore,
    interval_seconds: float = 60.0,
) -> None:
    """Background task running periodic session cleanup until cancelled."""
    try:
        while True:
            await asyncio.sleep(interval_seconds)
            purged = await store.cleanup_expired()
            if purged > 0:
                logger.debug("Purged %d expired sessions during periodic sweep", purged)
    except asyncio.CancelledError:
        logger.debug("Periodic session cleanup task stopped.")
        raise
