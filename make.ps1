# make.ps1 - Windows PowerShell task runner matching Makefile targets
param(
    [Parameter(Position=0)]
    [ValidateSet("setup", "test", "lint", "format", "run", "check", "clean")]
    [string]$Target = "test"
)

$ErrorActionPreference = "Stop"

switch ($Target) {
    "setup" {
        uv sync
    }
    "test" {
        uv run pytest
    }
    "lint" {
        uv run ruff check .
    }
    "format" {
        uv run ruff format .
    }
    "run" {
        uv run uvicorn legal_rag.api.main:app --reload
    }
    "check" {
        uv run ruff check .
        uv run pytest
    }
    "clean" {
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue .pytest_cache, .ruff_cache, htmlcov, .coverage
        Write-Host "Cleaned test and cache artifacts."
    }
}
