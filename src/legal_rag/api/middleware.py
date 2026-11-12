"""Pure ASGI middleware for request ID propagation."""

from __future__ import annotations

import re
import uuid
from contextvars import ContextVar
from typing import Any, Callable

# Context variable accessible anywhere during request processing
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")

# Format: alphanumeric, hyphen, underscore, 8 to 64 characters
_REQUEST_ID_REGEX = re.compile(r"^[a-zA-Z0-9_\-]{8,64}$")


def get_request_id() -> str:
    """Return the current request ID from contextvar or generate fallback."""
    req_id = request_id_ctx.get()
    return req_id if req_id else "unknown-request-id"


def is_valid_request_id(candidate: str) -> bool:
    """Validate incoming request ID against allowed format and length."""
    return bool(_REQUEST_ID_REGEX.match(candidate))


class RequestIDMiddleware:
    """Pure ASGI middleware that handles X-Request-ID headers.

    Does not use BaseHTTPMiddleware to maintain complete compatibility with
    ASGI contextvars and streaming responses.
    """

    def __init__(self, app: Callable) -> None:
        self.app = app

    async def __call__(
        self,
        scope: dict[str, Any],
        receive: Callable,
        send: Callable,
    ) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Check for incoming X-Request-ID
        req_id: str | None = None
        for name, value in scope.get("headers", []):
            if name.lower() == b"x-request-id":
                decoded = value.decode("utf-8", errors="ignore").strip()
                if is_valid_request_id(decoded):
                    req_id = decoded
                break

        if not req_id:
            req_id = str(uuid.uuid4())

        # Set contextvar and store in scope state
        token = request_id_ctx.set(req_id)
        if "state" not in scope:
            scope["state"] = {}
        scope["state"]["request_id"] = req_id

        async def send_with_request_id(message: dict[str, Any]) -> None:
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                # Ensure x-request-id header is present
                has_header = any(h[0].lower() == b"x-request-id" for h in headers)
                if not has_header:
                    headers.append((b"x-request-id", req_id.encode("ascii")))  # type: ignore[union-attr]
                message["headers"] = headers
            await send(message)

        try:
            await self.app(scope, receive, send_with_request_id)
        finally:
            request_id_ctx.reset(token)
