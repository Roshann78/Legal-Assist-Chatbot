"""Pre-commit check to detect API keys and print masked findings only."""

from __future__ import annotations

import re
import sys
from pathlib import Path

# Match common LLM provider API key prefixes with minimum entropy length
API_KEY_REGEX = re.compile(
    r"(?i)\b(gsk_[a-zA-Z0-9]{20,}|sk-[a-zA-Z0-9]{20,}|sk-ant-[a-zA-Z0-9]{20,})"
)


def check_file(path: Path) -> list[str]:
    """Scan a single file and return masked findings."""
    findings: list[str] = []
    try:
        content = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return findings

    for line_num, line in enumerate(content.splitlines(), start=1):
        for match in API_KEY_REGEX.finditer(line):
            matched = match.group(0)
            masked = matched[:4] + "****"
            findings.append(f"{path}:{line_num}: Potential API key detected ({masked})")

    return findings


def main(argv: list[str] | None = None) -> int:
    files = argv if argv is not None else sys.argv[1:]
    all_findings: list[str] = []

    for file_str in files:
        path = Path(file_str)
        if path.is_file():
            all_findings.extend(check_file(path))

    if all_findings:
        for finding in all_findings:
            print(finding)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
