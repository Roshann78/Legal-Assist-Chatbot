"""Groq LLM client implementation using httpx (no extra SDK dependency)."""

from __future__ import annotations

import json
from collections.abc import AsyncIterator

import httpx

from legal_rag.config.settings import Settings
from legal_rag.llm.llm_client import (
    LLMAuthError,
    LLMClient,
    LLMProviderError,
    LLMRateLimitError,
    LLMResponse,
    LLMTimeoutError,
)

GROQ_API_BASE = "https://api.groq.com/openai/v1"


class GroqClient(LLMClient):
    """Groq LLM client using direct httpx calls to the OpenAI-compatible API."""

    def __init__(
        self,
        settings: Settings,
        async_client: httpx.AsyncClient | None = None,
    ) -> None:
        api_key = settings.llm_api_key.get_secret_value()
        if not api_key:
            raise LLMAuthError("LLM_API_KEY is empty. Cannot create Groq client.")

        self._api_key = api_key
        self._model = settings.llm_model
        self._temperature = settings.llm_temperature
        self._max_tokens = settings.llm_max_tokens
        self._timeout = settings.llm_timeout_seconds
        self._async_client = async_client
        self._headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    def is_ready(self) -> bool:
        """Check local configuration without network calls."""
        return bool(self._api_key and self._model)

    def _build_payload(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float | None,
        max_tokens: int | None,
        stream: bool = False,
    ) -> dict:
        return {
            "model": self._model,
            "messages": messages,
            "temperature": temperature if temperature is not None else self._temperature,
            "max_tokens": max_tokens if max_tokens is not None else self._max_tokens,
            "stream": stream,
        }

    @staticmethod
    def _handle_error_status(
        status_code: int, body: str, headers: httpx.Headers | None = None
    ) -> None:
        """Translate HTTP error codes to typed exceptions."""
        if status_code in (401, 403):
            raise LLMAuthError(f"Authentication failed ({status_code}): {body[:200]}")
        if status_code == 429:
            retry_after = None
            if headers and "retry-after" in headers:
                try:
                    retry_after = float(headers["retry-after"])
                except (ValueError, TypeError):
                    pass
            raise LLMRateLimitError(f"Rate limit exceeded: {body[:200]}", retry_after=retry_after)
        if status_code >= 400:
            raise LLMProviderError(
                f"Provider error ({status_code}): {body[:200]}", status_code=status_code
            )

    def generate(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> LLMResponse:
        payload = self._build_payload(messages, temperature=temperature, max_tokens=max_tokens)

        try:
            with httpx.Client(timeout=self._timeout) as client:
                resp = client.post(
                    f"{GROQ_API_BASE}/chat/completions",
                    headers=self._headers,
                    json=payload,
                )
        except httpx.TimeoutException as exc:
            raise LLMTimeoutError(f"Request timed out after {self._timeout}s") from exc
        except httpx.HTTPError as exc:
            raise LLMProviderError(f"HTTP error: {exc}") from exc

        self._handle_error_status(resp.status_code, resp.text, resp.headers)

        data = resp.json()
        choice = data["choices"][0]
        return LLMResponse(
            content=choice["message"]["content"],
            model=data.get("model", self._model),
            finish_reason=choice.get("finish_reason", "stop"),
            usage=data.get("usage", {}),
        )

    async def generate_stream(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AsyncIterator[str]:
        payload = self._build_payload(
            messages, temperature=temperature, max_tokens=max_tokens, stream=True
        )

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                async with client.stream(
                    "POST",
                    f"{GROQ_API_BASE}/chat/completions",
                    headers=self._headers,
                    json=payload,
                ) as resp:
                    if resp.status_code != 200:
                        body = await resp.aread()
                        self._handle_error_status(resp.status_code, body.decode(), resp.headers)

                    async for line in resp.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        data_str = line[len("data: ") :]
                        if data_str.strip() == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            delta = chunk["choices"][0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue

        except httpx.TimeoutException as exc:
            raise LLMTimeoutError(f"Stream timed out after {self._timeout}s") from exc
        except httpx.HTTPError as exc:
            raise LLMProviderError(f"HTTP stream error: {exc}") from exc
