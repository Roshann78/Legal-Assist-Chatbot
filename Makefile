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
	uv run uvicorn legal_rag.api.main:create_app --factory --reload --host 127.0.0.1 --port 8000

check: lint test

clean:
	rm -rf .pytest_cache .ruff_cache htmlcov .coverage
