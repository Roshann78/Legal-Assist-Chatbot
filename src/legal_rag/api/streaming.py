"""Thread-safe pure async SSE streaming with structured events and error handling."""

from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import AsyncIterator
from typing import Any

from starlette.responses import StreamingResponse

from legal_rag.api.middleware import get_request_id

logger = logging.getLogger("legal_rag.api.streaming")

SSE_HEADERS = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
}


def format_sse(event: str, data: dict[str, Any]) -> str:
    """Format an SSE message block with JSON data.

    Encoding payload as JSON ensures raw newlines in content are safely escaped
    and compliant with the Server-Sent Events protocol.
    """
    payload = json.dumps(data)
    return f"event: {event}\ndata: {payload}\n\n"


async def sse_event_stream(
    token_generator: AsyncIterator[str],
    *,
    request_id: str | None = None,
) -> AsyncIterator[str]:
    """Pure async generator transforming raw tokens into structured SSE events.

    Yields:
        - event: token  data: {"content": "<chunk>"}
        - event: done   data: {"finish_reason": "stop"}
        - event: error  data: {"code": "...", "message": "...", "request_id": "..."}

    Invariants:
        1. Catches asyncio.CancelledError on client disconnect and ensures upstream generator
           is closed in a finally block to avoid runaway provider charges.
        2. Translates mid-stream exceptions into structured 'error' events with generic
           safe messaging (never exposing raw tracebacks, internal paths, or secrets).
    """
    req_id = request_id or get_request_id()

    try:
        async for chunk in token_generator:
            if chunk:
                yield format_sse("token", {"content": chunk})

        yield format_sse("done", {"finish_reason": "stop"})

    except asyncio.CancelledError:
        logger.info("[%s] Client disconnected; streaming cancelled.", req_id)
        raise

    except Exception as exc:
        logger.exception("[%s] Mid-stream failure: %s", req_id, exc)
        yield format_sse(
            "error",
            {
                "code": "STREAM_ERROR",
                "message": "An error occurred while generating the response.",
                "request_id": req_id,
            },
        )

    finally:
        # Guarantee upstream generator is closed upon exit or disconnect
        if hasattr(token_generator, "aclose"):
            try:
                await token_generator.aclose()
            except Exception as close_exc:
                logger.debug("[%s] Error closing upstream generator: %s", req_id, close_exc)


def create_sse_response(
    event_generator: AsyncIterator[str],
    *,
    request_id: str | None = None,
) -> StreamingResponse:
    """Wrap an SSE event generator into a standard Starlette StreamingResponse."""
    req_id = request_id or get_request_id()
    headers = dict(SSE_HEADERS)
    headers["X-Request-ID"] = req_id

    return StreamingResponse(
        event_generator,
        media_type="text/event-stream",
        headers=headers,
    )
