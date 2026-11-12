# Legal Assist RAG

Production-style Legal & Banking RAG System built with clean architecture, structure-aware chunking, hybrid retrieval, and rigorous evaluation.

## Quickstart

### Prerequisites
- Python 3.11 (`cpython-3.11`)
- [uv](https://docs.astral.sh/uv/) package manager

### Developer Commands
On **Windows** (PowerShell), use `.\make.ps1`:
```powershell
.\make.ps1 setup    # Install and sync dependencies via uv
.\make.ps1 test     # Run pytest test suite
.\make.ps1 lint     # Run ruff linter
.\make.ps1 format   # Format code with ruff
.\make.ps1 check    # Run lint + test
```

On Linux/macOS (or Windows with GNU `make` installed), use `make`:
```bash
make setup
make test
make lint
make format
```
You can also run commands directly via `uv`:
```bash
uv run pytest
uv run ruff check .
```
