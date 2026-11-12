"""Observability module: logging, tracing, metrics."""

from legal_rag.observability.logging import JSONFormatter, SecretScrubber, setup_logging

__all__ = ["JSONFormatter", "SecretScrubber", "setup_logging"]
