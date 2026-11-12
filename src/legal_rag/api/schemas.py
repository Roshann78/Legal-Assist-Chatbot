"""Pydantic schemas for API responses and errors."""

from __future__ import annotations

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Liveness probe response model."""

    status: str = Field(default="ok", description="Liveness status")


class ReadyResponse(BaseModel):
    """Readiness probe response model."""

    status: str = Field(description="Overall readiness: 'ready' or 'not_ready'")
    components: dict[str, str] = Field(
        description="Per-component status (e.g. llm, embedder, vector_store)"
    )


class ErrorResponse(BaseModel):
    """Consistent error response model for all 4xx/5xx responses."""

    code: str = Field(description="Machine-readable error code")
    message: str = Field(description="Human-readable error description")
    request_id: str = Field(description="Unique request ID for tracing and support")
