"""LLM call resilience: retries with exponential backoff and jitter."""

from __future__ import annotations

import asyncio
import logging
import random
import time
from collections.abc import AsyncIterator, Awaitable, Callable
from typing import Any

from legal_rag.config.settings import Settings
from legal_rag.llm.llm_client import (
    LLMAuthError,
    LLMClient,
    LLMProviderError,
    LLMRateLimitError,
    LLMResponse,
    LLMTimeoutError,
)

logger = logging.getLogger("legal_rag.llm.resilience")


def is_transient_error(exc: Exception) -> bool:
    """Determine if an exception represents a transient failure eligible for retry.

    Retries only timeouts, rate limits (429), and 5xx server errors.
    Never retries authentication errors (401/403) or client errors (4xx).
    """
    if isinstance(exc, LLMAuthError):
        return False
    if isinstance(exc, (LLMTimeoutError, LLMRateLimitError)):
        return True
    if isinstance(exc, LLMProviderError):
        # Retry 5xx server errors, never 4xx
        if exc.status_code is not None:
            return exc.status_code >= 500
        return True
    return False


def calculate_backoff(
    attempt: int,
    min_wait: float,
    max_wait: float,
    retry_after: float | None = None,
) -> float:
    """Calculate wait time with exponential backoff, jitter, and Retry-After support."""
    if retry_after is not None and retry_after > 0:
        return min(retry_after, max_wait)

    base = min_wait * (2**attempt)
    jitter = random.uniform(0, 0.5 * min_wait) if min_wait > 0 else 0.0
    return min(base + jitter, max_wait)


class ResilientLLMClient(LLMClient):
    """Wrapper that adds timeout, retry, and backoff resilience to an LLMClient.

    Key Streaming Invariant:
    Retries ONLY occur BEFORE the first token has been yielded to the caller.
    Once any token has been emitted, the stream is never restarted (to avoid
    corrupting or duplicating output). Any mid-stream error raises immediately.
    """

    def __init__(
        self,
        inner: LLMClient,
        settings: Settings,
        *,
        sleep_fn: Callable[[float], Awaitable[None]] | None = None,
        sync_sleep_fn: Callable[[float], None] | None = None,
    ) -> None:
        self.inner = inner
        self.max_retries = settings.llm_max_retries
        self.min_wait = settings.llm_retry_min_wait
        self.max_wait = settings.llm_retry_max_wait
        self.sleep_fn = sleep_fn or asyncio.sleep
        self.sync_sleep_fn = sync_sleep_fn or time.sleep

    def is_ready(self) -> bool:
        """Delegate readiness directly to the inner provider."""
        return self.inner.is_ready()

    def generate(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> LLMResponse:
        attempt = 0
        while True:
            try:
                return self.inner.generate(messages, temperature=temperature, max_tokens=max_tokens)
            except Exception as exc:
                if not is_transient_error(exc) or attempt >= self.max_retries:
                    raise

                retry_after = getattr(exc, "retry_after", None)
                wait_time = calculate_backoff(attempt, self.min_wait, self.max_wait, retry_after)
                logger.warning(
                    "Retrying LLM generate (attempt %d/%d) after %.2fs: %s",
                    attempt + 1,
                    self.max_retries,
                    wait_time,
                    exc,
                )
                self.sync_sleep_fn(wait_time)
                attempt += 1

    async def generate_stream(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AsyncIterator[str]:
        attempt = 0
        while True:
            stream_gen: Any = None
            first_token_yielded = False
            try:
                stream_gen = self.inner.generate_stream(
                    messages, temperature=temperature, max_tokens=max_tokens
                )
                async for token in stream_gen:
                    first_token_yielded = True
                    yield token
                return
            except Exception as exc:
                # If at least one token was yielded, NEVER retry or restart!
                if first_token_yielded:
                    logger.error(
                        "Error mid-stream after tokens yielded; aborting without retry: %s",
                        exc,
                    )
                    raise

                # Before first token: retry if transient and attempts remain
                if not is_transient_error(exc) or attempt >= self.max_retries:
                    logger.error(
                        "LLM stream failed before first token; no retries remaining: %s",
                        exc,
                    )
                    raise

                retry_after = getattr(exc, "retry_after", None)
                wait_time = calculate_backoff(attempt, self.min_wait, self.max_wait, retry_after)
                logger.warning(
                    "Retrying LLM stream (attempt %d/%d) after %.2fs: %s",
                    attempt + 1,
                    self.max_retries,
                    wait_time,
                    exc,
                )
                await self.sleep_fn(wait_time)
                attempt += 1
            finally:
                if stream_gen is not None and hasattr(stream_gen, "aclose"):
                    try:
                        await stream_gen.aclose()
                    except Exception:
                        pass
