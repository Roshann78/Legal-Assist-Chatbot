"""Structured JSON logging with request_id propagation and secret scrubbing."""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from typing import Any

from legal_rag.api.middleware import get_request_id
from legal_rag.config.settings import Settings

# Regex patterns for common sensitive token formats
_SECRET_PATTERNS = [
    re.compile(r"(?i)\b(bearer\s+)[a-zA-Z0-9_\-\.]+"),
    re.compile(r"(?i)\b(gsk_[a-zA-Z0-9]{20,})"),
    re.compile(r"(?i)\b(sk-[a-zA-Z0-9]{20,})"),
    re.compile(r"(?i)\b(api[-_]?key|x-api-key)\s*[:=]\s*['\"]?[^\s,'\"]+"),
]


class SecretScrubber:
    """Scrubs known secrets and common sensitive patterns from log messages."""

    def __init__(self, exact_secrets: set[str] | None = None) -> None:
        self.exact_secrets = {s for s in (exact_secrets or set()) if s and len(s) > 3}

    def scrub(self, text: str) -> str:
        if not text:
            return text

        # 1. Scrub exact secret strings
        for secret in self.exact_secrets:
            text = text.replace(secret, "[REDACTED]")

        # 2. Scrub regex patterns
        text = _SECRET_PATTERNS[0].sub(r"\1[REDACTED]", text)
        text = _SECRET_PATTERNS[1].sub("[REDACTED_API_KEY]", text)
        text = _SECRET_PATTERNS[2].sub("[REDACTED_API_KEY]", text)
        text = _SECRET_PATTERNS[3].sub(r"\1=[REDACTED]", text)

        return text


class JSONFormatter(logging.Formatter):
    """Formats log records as structured JSON with request_id and scrubbed secrets."""

    def __init__(self, scrubber: SecretScrubber | None = None) -> None:
        super().__init__()
        self.scrubber = scrubber or SecretScrubber()

    def format(self, record: logging.LogRecord) -> str:
        raw_message = record.getMessage()
        clean_message = self.scrubber.scrub(raw_message)

        log_data: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": clean_message,
            "request_id": get_request_id(),
        }

        # Include exception info if present
        if record.exc_info:
            log_data["exception"] = self.scrubber.scrub(self.formatException(record.exc_info))

        return json.dumps(log_data)


def setup_logging(settings: Settings | None = None) -> logging.Logger:
    """Configure structured JSON logging for the application."""
    exact_secrets: set[str] = set()
    log_level = "INFO"

    if settings is not None:
        log_level = settings.log_level
        if settings.llm_api_key.get_secret_value():
            exact_secrets.add(settings.llm_api_key.get_secret_value())

    scrubber = SecretScrubber(exact_secrets=exact_secrets)
    formatter = JSONFormatter(scrubber=scrubber)

    handler = logging.StreamHandler()
    handler.setFormatter(formatter)

    app_logger = logging.getLogger("legal_rag")
    app_logger.handlers.clear()
    app_logger.addHandler(handler)
    app_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    app_logger.propagate = False

    return app_logger
