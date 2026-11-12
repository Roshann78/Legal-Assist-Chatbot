"""Tests for pure async SSE streaming, mid-stream error handling, and concurrency."""

from __future__ import annotations

import asyncio
import json
import time
from collections.abc import AsyncIterator

import httpx
import pytest
from fastapi import APIRouter

from legal_rag.api.main import create_app
from legal_rag.api.streaming import create_sse_response, format_sse, sse_event_stream
from legal_rag.config.settings import Settings


def parse_sse_frames(raw_text: str) -> list[dict[str, str]]:
    """Parse raw SSE text into list of dicts with 'event' and 'data'."""
    frames: list[dict[str, str]] = []
    blocks = raw_text.strip().split("\n\n")
    for block in blocks:
        if not block.strip():
            continue
        event_type = ""
        data_str = ""
        for line in block.splitlines():
            if line.startswith("event: "):
                event_type = line[len("event: ") :]
            elif line.startswith("data: "):
                data_str = line[len("data: ") :]
        if event_type and data_str:
            frames.append({"event": event_type, "data": data_str})
    return frames


# ── SSE Headers and Event Formatting ─────────────────────────────────────────


@pytest.mark.asyncio
async def test_format_sse_escapes_newlines():
    """Verify JSON encoding safely handles multiline text inside data."""
    formatted = format_sse("token", {"content": "line1\nline2\nline3"})
    assert formatted.startswith("event: token\ndata: ")
    assert formatted.endswith("\n\n")
    data_payload = json.loads(formatted.split("data: ")[1].strip())
    assert data_payload["content"] == "line1\nline2\nline3"


@pytest.mark.asyncio
async def test_sse_headers_and_happy_path_stream():
    """Verify SSE response headers and token/done event sequence."""

    async def sample_tokens() -> AsyncIterator[str]:
        yield "Legal "
        yield "RAG "
        yield "System"

    router = APIRouter()

    @router.get("/test-stream")
    async def stream_endpoint():
        return create_sse_response(
            sse_event_stream(sample_tokens(), request_id="test-req-123"),
            request_id="test-req-123",
        )

    app = create_app(settings=Settings(llm_api_key="k-" + "test"))
    app.include_router(router)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/test-stream")
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("text/event-stream")
        assert resp.headers["cache-control"] == "no-cache"
        assert resp.headers["x-accel-buffering"] == "no"
        assert resp.headers["x-request-id"] == "test-req-123"

        frames = parse_sse_frames(resp.text)
        assert len(frames) == 4
        assert frames[0]["event"] == "token"
        assert json.loads(frames[0]["data"])["content"] == "Legal "
        assert frames[1]["event"] == "token"
        assert json.loads(frames[1]["data"])["content"] == "RAG "
        assert frames[2]["event"] == "token"
        assert json.loads(frames[2]["data"])["content"] == "System"
        assert frames[3]["event"] == "done"
        assert json.loads(frames[3]["data"])["finish_reason"] == "stop"


# ── Mid-Stream Error Propagation ────────────────────────────────────────────


@pytest.mark.asyncio
async def test_mid_stream_error_surfaces_error_event_without_leakage():
    """Verify mid-stream error emits an error event and hides internal tracebacks."""

    async def faulty_tokens() -> AsyncIterator[str]:
        yield "First token "
        yield "Second token "
        db_uri = "postgresql://admin:pw@host"  # pragma: allowlist secret
        raise RuntimeError(f"Internal secret DB connection string: {db_uri}")

    router = APIRouter()

    @router.get("/faulty-stream")
    async def faulty_endpoint():
        return create_sse_response(
            sse_event_stream(faulty_tokens(), request_id="err-req-789"),
            request_id="err-req-789",
        )

    app = create_app(settings=Settings(llm_api_key="k-" + "test"))
    app.include_router(router)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/faulty-stream")
        assert resp.status_code == 200

        frames = parse_sse_frames(resp.text)
        assert len(frames) == 3
        assert frames[0]["event"] == "token"
        assert frames[1]["event"] == "token"
        assert frames[2]["event"] == "error"

        err_data = json.loads(frames[2]["data"])
        assert err_data["code"] == "STREAM_ERROR"
        assert err_data["request_id"] == "err-req-789"
        assert "An error occurred" in err_data["message"]

        # Secrets, connection strings, or tracebacks must NEVER reach the client
        assert "postgresql" not in resp.text
        assert "Traceback" not in resp.text


# ── Disconnect & Upstream Stream Cleanup ────────────────────────────────────


class CloseableAsyncIterator:
    """Async iterator that records whether its aclose() cleanup method was called."""

    def __init__(self, items: list[str]) -> None:
        self.items = list(items)
        self.is_closed = False

    def __aiter__(self):
        return self

    async def __anext__(self) -> str:
        if not self.items:
            raise StopAsyncIteration
        return self.items.pop(0)

    async def aclose(self) -> None:
        self.is_closed = True


@pytest.mark.asyncio
async def test_disconnect_guarantees_upstream_stream_is_closed():
    """Verify upstream generator's aclose() is invoked on disconnect/cancellation."""
    upstream = CloseableAsyncIterator(["tok1", "tok2", "tok3"])
    stream = sse_event_stream(upstream, request_id="dc-test")

    # Read first event
    first_event = await anext(stream)
    assert "token" in first_event

    # Simulate cancellation/disconnect by calling aclose() on the stream
    await stream.aclose()

    # Upstream stream must be cleanly closed
    assert upstream.is_closed is True


# ── Real Concurrency Test ───────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_concurrent_streams_do_not_block_each_other():
    """Two concurrent streams: one slow (sleeps), one fast.

    Proves that the fast stream completes while the slow stream is still running.
    """

    async def slow_generator() -> AsyncIterator[str]:
        for i in range(4):
            await asyncio.sleep(0.05)  # Total ~0.20s
            yield f"slow_{i} "

    async def fast_generator() -> AsyncIterator[str]:
        for i in range(4):
            await asyncio.sleep(0.001)  # Total ~0.004s
            yield f"fast_{i} "

    router = APIRouter()

    @router.get("/slow")
    async def slow_endpoint():
        return create_sse_response(sse_event_stream(slow_generator()))

    @router.get("/fast")
    async def fast_endpoint():
        return create_sse_response(sse_event_stream(fast_generator()))

    app = create_app(settings=Settings(llm_api_key="k-" + "test"))
    app.include_router(router)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        timing: dict[str, float] = {}

        async def fetch_slow():
            t0 = time.monotonic()
            resp = await client.get("/slow")
            timing["slow_duration"] = time.monotonic() - t0
            assert resp.status_code == 200

        async def fetch_fast():
            t0 = time.monotonic()
            resp = await client.get("/fast")
            timing["fast_duration"] = time.monotonic() - t0
            assert resp.status_code == 200

        # Launch both concurrently
        await asyncio.gather(fetch_slow(), fetch_fast())

        # Fast stream must finish significantly faster than the slow stream
        assert timing["fast_duration"] < timing["slow_duration"]
        # Fast completes in < 0.05s, while slow takes > 0.15s
        assert timing["fast_duration"] < 0.10
        assert timing["slow_duration"] >= 0.15
