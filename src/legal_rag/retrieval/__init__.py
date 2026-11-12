"""Retrieval subpackage."""

from legal_rag.retrieval.base import (
    Embedder,
    PlaceholderEmbedder,
    PlaceholderVectorStore,
    VectorStore,
)

__all__ = [
    "Embedder",
    "PlaceholderEmbedder",
    "PlaceholderVectorStore",
    "VectorStore",
]
