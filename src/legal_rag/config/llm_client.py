"""LLM client interface and exception types.

Concrete implementations live alongside the interface. Phase 0 ships a Groq
implementation using httpx (already a project dependency, no new SDK needed).
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass, field

# ── Exception hierarchy ─────────────────────────────────────────────────────


class LLMError(Exception):
    """Base exception for all LLM client errors."""


class LLMAuthError(LLMError):
    """Authentication or authorization failure (invalid/missing API key)."""


class LLMRateLimitError(LLMError):
    """Provider rate limit exceeded."""


class LLMTimeoutError(LLMError):
    """Request timed out."""


class LLMProviderError(LLMError):
    """Any other provider-side error (5xx, unexpected response, etc.)."""


# ── Response type ────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class LLMResponse:
    """Structured response from an LLM call."""

    content: str
    model: str
    finish_reason: str = "stop"
    usage: dict[str, int] = field(default_factory=dict)


# ── Interface ────────────────────────────────────────────────────────────────


class LLMClient(ABC):
    """Abstract interface for LLM providers.

    Implementations must translate provider-specific errors into the exception
    types defined above. Retries and backoff are NOT handled here; they belong
    in the resilience layer (Step 0.5).
    """

    @abstractmethod
    def generate(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> LLMResponse:
        """Synchronous single-turn generation.

        Args:
            messages: Chat messages in OpenAI format ([{"role": ..., "content": ...}]).
            temperature: Override the default temperature.
            max_tokens: Override the default max_tokens.

        Returns:
            LLMResponse with content, model, usage, and finish_reason.

        Raises:
            LLMAuthError: Invalid or missing API key.
            LLMRateLimitError: Provider rate limit hit.
            LLMTimeoutError: Request timed out.
            LLMProviderError: Any other provider error.
        """

    @abstractmethod
    async def generate_stream(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AsyncIterator[str]:
        """Async streaming generation yielding text chunks.

        Args:
            messages: Chat messages in OpenAI format.
            temperature: Override the default temperature.
            max_tokens: Override the default max_tokens.

        Yields:
            Text chunks as they arrive from the provider.

        Raises:
            LLMAuthError: Invalid or missing API key.
            LLMRateLimitError: Provider rate limit hit.
            LLMTimeoutError: Request timed out.
            LLMProviderError: Any other provider error.
        """
        ...  # pragma: no cover
