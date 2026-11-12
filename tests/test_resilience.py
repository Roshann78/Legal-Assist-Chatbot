"""Tests for LLM resilience layer: timeouts, retries, backoff, and streaming limits."""

from __future__ import annotations

from collections.abc import AsyncIterator

import pytest

from legal_rag.config.settings import Settings
from legal_rag.llm import (
    LLMAuthError,
    LLMClient,
    LLMProviderError,
    LLMRateLimitError,
    LLMResponse,
    LLMTimeoutError,
    ResilientLLMClient,
    calculate_backoff,
    is_transient_error,
)


def _make_settings(**overrides) -> Settings:
    defaults = {
        "llm_api_key": "dummy-" + "key-for-test",  # pragma: allowlist secret
        "llm_max_retries": 3,
        "llm_retry_min_wait": 0.1,
        "llm_retry_max_wait": 1.0,
    }
    defaults.update(overrides)
    return Settings(**defaults)


# ── Transient Error Classification ──────────────────────────────────────────


def test_is_transient_error_classification():
    assert is_transient_error(LLMTimeoutError("timed out")) is True
    assert is_transient_error(LLMRateLimitError("rate limited")) is True
    assert is_transient_error(LLMProviderError("server error", status_code=500)) is True
    assert is_transient_error(LLMProviderError("bad gateway", status_code=502)) is True

    # Permanent / Client errors must never be retried
    assert is_transient_error(LLMAuthError("bad key")) is False
    assert is_transient_error(LLMProviderError("bad request", status_code=400)) is False
    assert is_transient_error(LLMProviderError("not found", status_code=404)) is False


def test_calculate_backoff_respects_retry_after():
    # Respects Retry-After when within max_wait
    wait = calculate_backoff(attempt=0, min_wait=1.0, max_wait=10.0, retry_after=4.5)
    assert wait == 4.5

    # Caps Retry-After at max_wait
    wait_capped = calculate_backoff(attempt=0, min_wait=1.0, max_wait=5.0, retry_after=20.0)
    assert wait_capped == 5.0


# ── Resilient Generate Tests ────────────────────────────────────────────────


class FlakyLLM(LLMClient):
    """Mock client that fails N times before succeeding."""

    def __init__(self, failures: list[Exception], success_response: str = "ok"):
        self.failures = list(failures)
        self.success_response = success_response
        self.calls = 0

    def is_ready(self) -> bool:
        return True

    def generate(self, *args, **kwargs) -> LLMResponse:
        self.calls += 1
        if self.failures:
            raise self.failures.pop(0)
        return LLMResponse(content=self.success_response, model="mock")

    async def generate_stream(self, *args, **kwargs) -> AsyncIterator[str]:
        self.calls += 1
        if self.failures:
            raise self.failures.pop(0)
        yield self.success_response


def test_resilient_generate_retries_transient_and_succeeds():
    """Verify transient timeouts trigger retries and eventually succeed."""
    flaky = FlakyLLM(failures=[LLMTimeoutError("timeout 1"), LLMTimeoutError("timeout 2")])
    sleeps: list[float] = []

    client = ResilientLLMClient(
        flaky,
        settings=_make_settings(llm_max_retries=3),
        sync_sleep_fn=sleeps.append,
    )

    resp = client.generate([{"role": "user", "content": "hi"}])
    assert resp.content == "ok"
    assert flaky.calls == 3
    assert len(sleeps) == 2


def test_resilient_generate_never_retries_auth_error():
    """Verify auth errors fail immediately on first attempt."""
    flaky = FlakyLLM(failures=[LLMAuthError("invalid API key")])
    sleeps: list[float] = []

    client = ResilientLLMClient(
        flaky,
        settings=_make_settings(llm_max_retries=3),
        sync_sleep_fn=sleeps.append,
    )

    with pytest.raises(LLMAuthError, match="invalid API key"):
        client.generate([{"role": "user", "content": "hi"}])

    assert flaky.calls == 1
    assert len(sleeps) == 0


def test_resilient_generate_exhausts_retries():
    """Verify exceeding max_retries raises the final transient exception."""
    flaky = FlakyLLM(failures=[LLMTimeoutError("t1"), LLMTimeoutError("t2"), LLMTimeoutError("t3")])
    sleeps: list[float] = []

    client = ResilientLLMClient(
        flaky,
        settings=_make_settings(llm_max_retries=2),
        sync_sleep_fn=sleeps.append,
    )

    with pytest.raises(LLMTimeoutError, match="t3"):
        client.generate([{"role": "user", "content": "hi"}])

    assert flaky.calls == 3
    assert len(sleeps) == 2


# ── Streaming Retry Invariant Tests ─────────────────────────────────────────


class MidStreamFailingLLM(LLMClient):
    """Yields a specified number of tokens before raising an exception."""

    def __init__(self, tokens_before_error: int, error_to_raise: Exception):
        self.tokens_before_error = tokens_before_error
        self.error_to_raise = error_to_raise
        self.calls = 0

    def is_ready(self) -> bool:
        return True

    def generate(self, *args, **kwargs) -> LLMResponse:
        raise NotImplementedError

    async def generate_stream(self, *args, **kwargs) -> AsyncIterator[str]:
        self.calls += 1
        for i in range(self.tokens_before_error):
            yield f"token_{i} "
        raise self.error_to_raise


@pytest.mark.asyncio
async def test_stream_retries_before_first_token():
    """If error occurs before any token is yielded, stream is safely retried."""
    flaky = FlakyLLM(
        failures=[LLMTimeoutError("stream timeout 1")],
        success_response="token1 token2",
    )
    async_sleeps: list[float] = []

    async def fake_sleep(t: float) -> None:
        async_sleeps.append(t)

    client = ResilientLLMClient(
        flaky,
        settings=_make_settings(llm_max_retries=3),
        sleep_fn=fake_sleep,
    )

    chunks: list[str] = []
    async for chunk in client.generate_stream([{"role": "user", "content": "hi"}]):
        chunks.append(chunk)

    assert "".join(chunks) == "token1 token2"
    assert flaky.calls == 2
    assert len(async_sleeps) == 1


@pytest.mark.asyncio
async def test_stream_never_retries_after_first_token_emitted():
    """Once tokens have been yielded, NEVER retry or restart the stream.

    Fails after 2 tokens, asserts no retry occurred and exception propagates.
    """
    failing_llm = MidStreamFailingLLM(
        tokens_before_error=2,
        error_to_raise=LLMTimeoutError("Mid-stream connection drop"),
    )
    async_sleeps: list[float] = []

    async def fake_sleep(t: float) -> None:
        async_sleeps.append(t)

    client = ResilientLLMClient(
        failing_llm,
        settings=_make_settings(llm_max_retries=3),
        sleep_fn=fake_sleep,
    )

    yielded: list[str] = []
    with pytest.raises(LLMTimeoutError, match="Mid-stream connection drop"):
        async for chunk in client.generate_stream([{"role": "user", "content": "hi"}]):
            yielded.append(chunk)

    # Exactly 2 tokens were yielded before error
    assert yielded == ["token_0 ", "token_1 "]
    # Must NOT have restarted or retried (calls must be exactly 1)
    assert failing_llm.calls == 1
    # No sleep or retry was initiated
    assert len(async_sleeps) == 0
