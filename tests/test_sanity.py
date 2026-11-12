"""Sanity tests for legal_rag package skeleton."""

import legal_rag


def test_package_import():
    """Verify package imports correctly and exposes a version."""
    assert legal_rag.__version__ == "0.1.0"


def test_subpackages_importable():
    """Verify core subpackages are present."""
    from legal_rag import api, config, eval, generation, ingestion, observability, retrieval

    assert api is not None
    assert config is not None
    assert eval is not None
    assert generation is not None
    assert ingestion is not None
    assert observability is not None
    assert retrieval is not None
