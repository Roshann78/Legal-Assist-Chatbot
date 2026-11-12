"""LLM module: client interfaces, providers, and resilience."""

from legal_rag.llm.groq_client import GroqClient
from legal_rag.llm.llm_client import (
    LLMAuthError,
    LLMClient,
    LLMError,
    LLMProviderError,
    LLMRateLimitError,
    LLMResponse,
    LLMTimeoutError,
)
from legal_rag.llm.resilience import ResilientLLMClient, calculate_backoff, is_transient_error

__all__ = [
    "GroqClient",
    "LLMAuthError",
    "LLMClient",
    "LLMError",
    "LLMProviderError",
    "LLMRateLimitError",
    "LLMResponse",
    "LLMTimeoutError",
    "ResilientLLMClient",
    "calculate_backoff",
    "is_transient_error",
]
