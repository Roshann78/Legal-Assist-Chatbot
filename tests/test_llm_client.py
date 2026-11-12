"""Tests for LLM client interface and Groq implementation.

All tests use fakes or mocked httpx transport — no real API calls.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

import httpx
import pytest

from legal_rag.config.settings import Settings
from legal_rag.llm import (
    GroqClient,
    LLMAuthError,
    LLMClient,
    LLMProviderError,
    LLMRateLimitError,
    LLMResponse,
    LLMTimeoutError,
)

# ── Fake LLM Client ─────────────────────────────────────────────────────────


class FakeLLMClient(LLMClient):
    """Fake implementation proving the interface contract."""

    def __init__(self, response_text: str = "fake answer", ready: bool = True):
        self._response_text = response_text
        self._ready = ready
        self.call_count = 0

    def is_ready(self) -> bool:
        return self._ready

    def generate(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> LLMResponse:
        self.call_count += 1
        return LLMResponse(
            content=self._response_text,
            model="fake-model",
            finish_reason="stop",
            usage={"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15},
        )

    async def generate_stream(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AsyncIterator[str]:
        self.call_count += 1
        for word in self._response_text.split():
            yield word + " "


class TestFakeLLMClient:
    """Verify the fake satisfies the interface."""

    def test_is_instance_of_interface(self):
        client = FakeLLMClient()
        assert isinstance(client, LLMClient)
        assert client.is_ready() is True

    def test_fake_not_ready(self):
        client = FakeLLMClient(ready=False)
        assert client.is_ready() is False

    def test_generate_returns_response(self):
        client = FakeLLMClient("hello world")
        resp = client.generate([{"role": "user", "content": "hi"}])
        assert isinstance(resp, LLMResponse)
        assert resp.content == "hello world"
        assert resp.model == "fake-model"
        assert resp.usage["total_tokens"] == 15
        assert client.call_count == 1

    @pytest.mark.asyncio
    async def test_stream_yields_chunks(self):
        client = FakeLLMClient("hello world")
        chunks = []
        async for chunk in client.generate_stream([{"role": "user", "content": "hi"}]):
            chunks.append(chunk)
        assert "".join(chunks).strip() == "hello world"
        assert client.call_count == 1


# ── Exception types ─────────────────────────────────────────────────────────


class TestExceptionHierarchy:
    def test_auth_error_is_llm_error(self):
        assert issubclass(LLMAuthError, Exception)

    def test_rate_limit_is_llm_error(self):
        assert issubclass(LLMRateLimitError, Exception)

    def test_timeout_is_llm_error(self):
        assert issubclass(LLMTimeoutError, Exception)

    def test_provider_error_is_llm_error(self):
        assert issubclass(LLMProviderError, Exception)


# ── Groq Client (mocked transport) ──────────────────────────────────────────


def _make_settings(**overrides) -> Settings:
    defaults = {"llm_api_key": "test-key-for-groq"}  # pragma: allowlist secret
    defaults.update(overrides)
    return Settings(**defaults)


def _mock_transport(status_code: int, json_body: dict) -> httpx.MockTransport:
    """Create a mock httpx transport returning a fixed response."""
    import json as json_mod

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            status_code=status_code,
            content=json_mod.dumps(json_body).encode(),
            headers={"content-type": "application/json"},
        )

    return httpx.MockTransport(handler)


class TestGroqClientInit:
    def test_empty_key_raises_auth_error(self):
        s = Settings(llm_api_key="")
        with pytest.raises(LLMAuthError, match="LLM_API_KEY is empty"):
            GroqClient(s)

    def test_valid_key_creates_client(self):
        s = _make_settings()
        client = GroqClient(s)
        assert isinstance(client, LLMClient)
        assert client.is_ready() is True


class TestGroqGenerate:
    def _success_body(self) -> dict:
        return {
            "choices": [
                {
                    "message": {"content": "The answer is 42."},
                    "finish_reason": "stop",
                }
            ],
            "model": "llama-3.3-70b-versatile",
            "usage": {
                "prompt_tokens": 20,
                "completion_tokens": 10,
                "total_tokens": 30,
            },
        }

    def test_successful_generate(self, monkeypatch):
        s = _make_settings()
        client = GroqClient(s)
        transport = _mock_transport(200, self._success_body())
        orig_client = httpx.Client

        monkeypatch.setattr(httpx, "Client", lambda **kwargs: orig_client(transport=transport))

        resp = client.generate([{"role": "user", "content": "What is 6*7?"}])
        assert resp.content == "The answer is 42."
        assert resp.model == "llama-3.3-70b-versatile"
        assert resp.usage["total_tokens"] == 30

    def test_auth_error_401(self, monkeypatch):
        s = _make_settings()
        client = GroqClient(s)
        transport = _mock_transport(401, {"error": {"message": "invalid key"}})
        orig_client = httpx.Client

        monkeypatch.setattr(httpx, "Client", lambda **kwargs: orig_client(transport=transport))

        with pytest.raises(LLMAuthError, match="Authentication failed"):
            client.generate([{"role": "user", "content": "hi"}])

    def test_rate_limit_429(self, monkeypatch):
        s = _make_settings()
        client = GroqClient(s)
        transport = _mock_transport(429, {"error": {"message": "rate limited"}})
        orig_client = httpx.Client

        monkeypatch.setattr(httpx, "Client", lambda **kwargs: orig_client(transport=transport))

        with pytest.raises(LLMRateLimitError, match="Rate limit"):
            client.generate([{"role": "user", "content": "hi"}])

    def test_server_error_500(self, monkeypatch):
        s = _make_settings()
        client = GroqClient(s)
        transport = _mock_transport(500, {"error": {"message": "internal error"}})
        orig_client = httpx.Client

        monkeypatch.setattr(httpx, "Client", lambda **kwargs: orig_client(transport=transport))

        with pytest.raises(LLMProviderError, match="Provider error"):
            client.generate([{"role": "user", "content": "hi"}])

    def test_timeout_raises(self, monkeypatch):
        s = _make_settings(llm_timeout_seconds=0.01)
        client = GroqClient(s)

        class FakeContext:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                pass

            def post(self, *args, **kwargs):
                raise httpx.TimeoutException("timed out")

        monkeypatch.setattr(httpx, "Client", lambda **kw: FakeContext())

        with pytest.raises(LLMTimeoutError, match="timed out"):
            client.generate([{"role": "user", "content": "hi"}])

    @pytest.mark.asyncio
    async def test_stream_success(self, monkeypatch):
        s = _make_settings()
        client = GroqClient(s)

        class FakeStreamResponse:
            status_code = 200

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                pass

            async def aiter_lines(self):
                yield 'data: {"choices": [{"delta": {"content": "Hello"}}]}'
                yield 'data: {"choices": [{"delta": {"content": " world"}}]}'
                yield "data: [DONE]"

        class FakeAsyncClient:
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                pass

            def stream(self, *args, **kwargs):
                return FakeStreamResponse()

        monkeypatch.setattr(httpx, "AsyncClient", FakeAsyncClient)

        tokens = []
        async for chunk in client.generate_stream([{"role": "user", "content": "hi"}]):
            tokens.append(chunk)

        assert "".join(tokens) == "Hello world"


class TestLLMResponseDataclass:
    def test_frozen(self):
        r = LLMResponse(content="hi", model="m")
        with pytest.raises(AttributeError):
            r.content = "changed"  # type: ignore[misc]

    def test_defaults(self):
        r = LLMResponse(content="hi", model="m")
        assert r.finish_reason == "stop"
        assert r.usage == {}
