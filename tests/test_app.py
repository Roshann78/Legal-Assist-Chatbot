"""Unit and integration tests for FastAPI application skeleton."""

from __future__ import annotations

import io
import json
import logging
from typing import AsyncIterator

from fastapi import APIRouter
from fastapi.testclient import TestClient

from legal_rag.api.main import create_app
from legal_rag.config.llm_client import LLMClient, LLMResponse
from legal_rag.config.settings import Settings
from legal_rag.observability.logging import setup_logging
from legal_rag.retrieval.base import PlaceholderEmbedder, PlaceholderVectorStore


class MockLLM(LLMClient):
    """Mock LLM client for testing app readiness and lifecycle."""

    def __init__(self, ready: bool = True) -> None:
        self._ready = ready
        self.call_count = 0

    def is_ready(self) -> bool:
        return self._ready

    def generate(self, *args, **kwargs) -> LLMResponse:
        self.call_count += 1
        return LLMResponse(content="mock", model="mock")

    async def generate_stream(self, *args, **kwargs) -> AsyncIterator[str]:
        yield "mock"


def _test_settings(**overrides) -> Settings:
    defaults = {
        "llm_api_key": "dummy-test-key-for-app",  # pragma: allowlist secret
        "cors_origins": ["http://localhost:3000"],
    }
    defaults.update(overrides)
    return Settings(**defaults)


# ── Liveness and Readiness ───────────────────────────────────────────────────


def test_health_returns_200():
    """Verify /health liveness probe always returns 200 OK."""
    app = create_app(settings=_test_settings(), llm_client=MockLLM(ready=True))
    with TestClient(app) as client:
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "x-request-id" in resp.headers


def test_ready_returns_200_when_all_components_ready():
    """Verify /ready returns 200 and component breakdown when all are ready."""
    app = create_app(
        settings=_test_settings(),
        llm_client=MockLLM(ready=True),
        embedder=PlaceholderEmbedder(ready=True),
        vector_store=PlaceholderVectorStore(ready=True),
    )
    with TestClient(app) as client:
        resp = client.get("/ready")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ready"
        assert data["components"]["llm"] == "ready"
        assert data["components"]["embedder"] == "ready (placeholder)"
        assert data["components"]["vector_store"] == "ready (placeholder)"


def test_ready_returns_503_when_llm_not_ready():
    """Verify /ready returns 503 and ReadyResponse shape if LLM is unready."""
    app = create_app(
        settings=_test_settings(),
        llm_client=MockLLM(ready=False),
        embedder=PlaceholderEmbedder(ready=True),
        vector_store=PlaceholderVectorStore(ready=True),
    )
    with TestClient(app) as client:
        resp = client.get("/ready")
        assert resp.status_code == 503
        data = resp.json()
        assert data["status"] == "not_ready"
        assert data["components"]["llm"] == "not_ready"
        assert data["components"]["embedder"] == "ready (placeholder)"
        # Must return ReadyResponse shape, NOT ErrorResponse shape
        assert "components" in data
        assert "code" not in data


def test_ready_returns_503_when_embedder_not_ready():
    """Verify /ready returns 503 if embedder is not ready."""
    app = create_app(
        settings=_test_settings(),
        llm_client=MockLLM(ready=True),
        embedder=PlaceholderEmbedder(ready=False),
    )
    with TestClient(app) as client:
        resp = client.get("/ready")
        assert resp.status_code == 503
        data = resp.json()
        assert data["status"] == "not_ready"
        assert data["components"]["embedder"] == "not_ready (placeholder)"


# ── Lifespan & Singleton Components ─────────────────────────────────────────


def test_components_initialized_once_across_multiple_requests():
    """Verify shared components in app.state are created once and persist."""
    mock_llm = MockLLM(ready=True)
    app = create_app(settings=_test_settings(), llm_client=mock_llm)

    with TestClient(app) as client:
        # Initial component references
        llm_ref = app.state.llm_client
        http_client_ref = app.state.http_client

        # Make multiple requests
        client.get("/health")
        client.get("/ready")
        client.get("/health")

        # Must remain identical object instances (not recreated per request)
        assert app.state.llm_client is llm_ref
        assert app.state.http_client is http_client_ref


def test_lifespan_clean_shutdown():
    """Verify app lifespan cleanly closes shared httpx.AsyncClient on exit."""
    app = create_app(settings=_test_settings(), llm_client=MockLLM(ready=True))

    with TestClient(app):
        http_client = app.state.http_client
        assert not http_client.is_closed

    # Once client context exits, lifespan shutdown ran
    assert http_client.is_closed


# ── Request IDs & Middleware ─────────────────────────────────────────────────


def test_request_id_generated_when_missing():
    """Verify UUID is generated and returned when no X-Request-ID provided."""
    app = create_app(settings=_test_settings(), llm_client=MockLLM(ready=True))
    with TestClient(app) as client:
        resp = client.get("/health")
        req_id = resp.headers.get("x-request-id")
        assert req_id is not None
        assert len(req_id) >= 16  # UUID length


def test_request_id_preserved_when_valid():
    """Verify valid incoming X-Request-ID is preserved and reflected."""
    app = create_app(settings=_test_settings(), llm_client=MockLLM(ready=True))
    with TestClient(app) as client:
        valid_id = "client-req-id-12345678"
        resp = client.get("/health", headers={"X-Request-ID": valid_id})
        assert resp.headers.get("x-request-id") == valid_id


def test_request_id_replaced_when_malformed():
    """Verify invalid format or too-short IDs are replaced with safe UUIDs."""
    app = create_app(settings=_test_settings(), llm_client=MockLLM(ready=True))
    with TestClient(app) as client:
        # Too short (< 8 chars)
        resp = client.get("/health", headers={"X-Request-ID": "short"})
        req_id = resp.headers.get("x-request-id")
        assert req_id != "short"
        assert len(req_id) >= 16

        # Contains invalid characters (e.g. spaces/injection)
        resp2 = client.get("/health", headers={"X-Request-ID": "bad id with spaces!"})
        req_id2 = resp2.headers.get("x-request-id")
        assert req_id2 != "bad id with spaces!"


# ── Error Handling & ErrorResponse Shape ────────────────────────────────────


def test_404_error_response_shape():
    """Verify 404 response matches ErrorResponse schema with X-Request-ID."""
    app = create_app(settings=_test_settings(), llm_client=MockLLM(ready=True))
    with TestClient(app) as client:
        resp = client.get("/non-existent-endpoint")
        assert resp.status_code == 404
        data = resp.json()
        assert data["code"] == "NOT_FOUND"
        assert "message" in data
        assert "request_id" in data
        assert resp.headers.get("x-request-id") == data["request_id"]


def test_422_validation_error_shape():
    """Verify 422 response matches ErrorResponse schema with X-Request-ID."""
    app = create_app(settings=_test_settings(), llm_client=MockLLM(ready=True))
    router = APIRouter()

    @router.get("/test-param")
    def param_endpoint(val: int):
        return {"val": val}

    app.include_router(router)

    with TestClient(app) as client:
        resp = client.get("/test-param?val=not-an-integer")
        assert resp.status_code == 422
        data = resp.json()
        assert data["code"] == "VALIDATION_ERROR"
        assert "request_id" in data
        assert resp.headers.get("x-request-id") == data["request_id"]


def test_500_unhandled_exception_returns_clean_json_with_same_request_id():
    """Verify unhandled exceptions return 500 JSON without stack traces."""
    app = create_app(settings=_test_settings(), llm_client=MockLLM(ready=True))
    router = APIRouter()

    @router.get("/raise-error")
    def error_endpoint():
        raise RuntimeError("Secret internal database failure details!")

    app.include_router(router)

    with TestClient(app, raise_server_exceptions=False) as client:
        resp = client.get("/raise-error", headers={"X-Request-ID": "test-err-req-12345"})
        assert resp.status_code == 500
        data = resp.json()

        # Consistent ErrorResponse shape
        assert data["code"] == "INTERNAL_SERVER_ERROR"
        assert data["message"] == "An unexpected error occurred."
        assert data["request_id"] == "test-err-req-12345"
        assert resp.headers.get("x-request-id") == "test-err-req-12345"

        # Internal exception details and traceback must NEVER appear in response body
        assert "Secret internal database failure details" not in json.dumps(data)
        assert "Traceback" not in json.dumps(data)


# ── CORS Credentials Policy ──────────────────────────────────────────────────


def test_cors_specific_origin_allows_credentials():
    """Verify specific CORS origin allows credentials."""
    s = _test_settings(cors_origins=["http://localhost:3000"])
    app = create_app(settings=s, llm_client=MockLLM(ready=True))
    with TestClient(app) as client:
        resp = client.options(
            "/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert resp.headers.get("access-control-allow-origin") == "http://localhost:3000"
        assert resp.headers.get("access-control-allow-credentials") == "true"


def test_cors_wildcard_disallows_credentials():
    """Verify wildcard CORS origin explicitly disallows credentials."""
    s = _test_settings(cors_origins=["*"])
    app = create_app(settings=s, llm_client=MockLLM(ready=True))
    with TestClient(app) as client:
        resp = client.options(
            "/health",
            headers={
                "Origin": "http://example.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert resp.headers.get("access-control-allow-origin") == "*"
        # Credentials header MUST NOT be true when wildcard is used
        assert resp.headers.get("access-control-allow-credentials") != "true"


# ── Structured Logging & Secret Scrubbing ────────────────────────────────────


def test_logging_scrubs_secrets_and_injects_request_id():
    """Verify JSON logging scrubs exact keys, headers, and tokens."""
    # Build fake key at runtime to avoid static match in scanners
    fake_key = "gsk_" + "dummysecret1234567890abcdef"
    settings = _test_settings(llm_api_key=fake_key)

    stream = io.StringIO()
    app_logger = setup_logging(settings)
    handler = logging.StreamHandler(stream)
    handler.setFormatter(app_logger.handlers[0].formatter)
    app_logger.handlers.clear()
    app_logger.addHandler(handler)

    # Log messages containing secrets
    app_logger.info("Calling Groq with key %s", fake_key)
    app_logger.info("Header Authorization: Bearer some_secret_token_12345")
    app_logger.info("Config value api_key=super_secret_value_xyz")

    output = stream.getvalue()

    # The actual secrets must be completely absent from log output
    assert fake_key not in output
    assert "some_secret_token_12345" not in output
    assert "super_secret_value_xyz" not in output

    # Verify structured JSON format
    lines = [json.loads(line) for line in output.strip().split("\n") if line.strip()]
    assert len(lines) == 3
    assert "[REDACTED" in lines[0]["message"]
    assert "Authorization: Bearer [REDACTED]" in lines[1]["message"]
    assert "api_key=[REDACTED]" in lines[2]["message"]
    assert "request_id" in lines[0]
