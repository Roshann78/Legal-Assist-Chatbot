"""Base interfaces and placeholders for retrieval and embedding components.

TODO (Phase 2): These placeholders will be replaced by real implementations:
- Embedder -> SentenceTransformer / FastEmbed adapter (Phase 2 / Phase 4)
- VectorStore -> Qdrant adapter with filtered search (Phase 2.1)
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class Embedder(ABC):
    """Abstract interface for dense embedding models."""

    @abstractmethod
    def is_ready(self) -> bool:
        """Check if embedder model is loaded and ready."""

    @abstractmethod
    def get_status(self) -> str:
        """Return human-readable status for readiness checks."""


class VectorStore(ABC):
    """Abstract interface for vector database storage and search."""

    @abstractmethod
    def is_ready(self) -> bool:
        """Check if vector database is connected and ready."""

    @abstractmethod
    def get_status(self) -> str:
        """Return human-readable status for readiness checks."""


class PlaceholderEmbedder(Embedder):
    """Placeholder embedder used in Step 0.4 skeleton.

    TODO: Replaced in Phase 2 with real embedding model.
    """

    def __init__(self, ready: bool = True) -> None:
        self._ready = ready

    def is_ready(self) -> bool:
        return self._ready

    def get_status(self) -> str:
        return "ready (placeholder)" if self._ready else "not_ready (placeholder)"


class PlaceholderVectorStore(VectorStore):
    """Placeholder vector store used in Step 0.4 skeleton.

    TODO: Replaced in Phase 2 with Qdrant vector store adapter.
    """

    def __init__(self, ready: bool = True) -> None:
        self._ready = ready

    def is_ready(self) -> bool:
        return self._ready

    def get_status(self) -> str:
        return "ready (placeholder)" if self._ready else "not_ready (placeholder)"
