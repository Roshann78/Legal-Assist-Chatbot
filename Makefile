.PHONY: setup test lint format run check clean

setup:
	uv sync

test:
	uv run pytest

lint:
	uv run ruff check .

format:
	uv run ruff format .

run:
	uv run uvicorn legal_rag.api.main:app --reload

check: lint test

clean:
	rm -rf .pytest_cache .ruff_cache htmlcov .coverage
