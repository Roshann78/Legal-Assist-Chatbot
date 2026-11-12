"""Application settings, env-driven, with validation and secret masking."""

from __future__ import annotations

from pathlib import Path

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed, validated settings for Legal Assist RAG.

    All values can be overridden via environment variables or a .env file.
    Secrets are stored as SecretStr and never appear in repr, str, or model_dump.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── LLM ──────────────────────────────────────────────────────────────
    llm_provider: str = Field(default="groq", description="LLM provider name")
    llm_model: str = Field(
        default="llama-3.3-70b-versatile",
        description="Model ID (verified against Groq production models Nov 2026)",
    )
    llm_api_key: SecretStr = Field(
        default=SecretStr(""),
        description="Provider API key (required for LLM calls)",
    )
    llm_temperature: float = Field(default=0.1, ge=0.0, le=2.0)
    llm_max_tokens: int = Field(default=2048, ge=1, le=131072)
    llm_timeout_seconds: float = Field(default=30.0, gt=0.0)

    # ── Embedding (name only; model loaded in later phases) ──────────────
    embedding_model: str = Field(
        default="all-MiniLM-L6-v2",
        description="Sentence-transformer model name (baseline; bake-off in Phase 4)",
    )

    # ── Retrieval defaults ───────────────────────────────────────────────
    retrieval_top_k: int = Field(default=5, ge=1, le=100)
    retrieval_score_threshold: float = Field(default=0.0, ge=0.0, le=1.0)

    # ── Paths ────────────────────────────────────────────────────────────
    data_dir: Path = Field(default=Path("data"))
    processed_dir: Path = Field(default=Path("data/processed"))
    eval_dir: Path = Field(default=Path("eval"))

    # ── API & Logging ────────────────────────────────────────────────────
    api_host: str = Field(default="127.0.0.1")
    api_port: int = Field(default=8000, ge=1, le=65535)
    cors_origins: list[str] = Field(default=["http://localhost:3000"])
    log_level: str = Field(default="INFO", description="Logging level")

    # ── Limits ───────────────────────────────────────────────────────────
    max_question_length: int = Field(default=1000, ge=10, le=10000)
    rate_limit_rpm: int = Field(default=60, ge=1)

    # ── Validators ───────────────────────────────────────────────────────

    @field_validator("llm_provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        allowed = {"groq"}
        if v.lower() not in allowed:
            msg = f"Unsupported LLM provider '{v}'. Allowed: {allowed}"
            raise ValueError(msg)
        return v.lower()

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        val = v.upper()
        if val not in allowed:
            msg = f"Invalid log_level '{v}'. Allowed: {allowed}"
            raise ValueError(msg)
        return val

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @model_validator(mode="after")
    def validate_api_key_present(self) -> Settings:
        """Warn at construction time if the API key is empty."""
        if not self.llm_api_key.get_secret_value():
            import warnings

            warnings.warn(
                "LLM_API_KEY is empty. LLM calls will fail. "
                "Set the LLM_API_KEY environment variable.",
                UserWarning,
                stacklevel=2,
            )
        return self

    # ── Safe representation ──────────────────────────────────────────────

    def __repr__(self) -> str:
        safe = self.model_dump()
        return f"Settings({safe})"

    def __str__(self) -> str:
        return self.__repr__()

    def model_dump(self, **kwargs):  # type: ignore[override]
        """Override to always mask secrets in dumps."""
        data = super().model_dump(**kwargs)
        for key, value in data.items():
            if isinstance(value, SecretStr):
                data[key] = "**********"
            elif key.lower().endswith(("_key", "_secret", "_token", "_password")):
                data[key] = "**********"
        return data


def get_settings(**overrides) -> Settings:
    """Create a Settings instance, optionally with overrides for testing."""
    return Settings(**overrides)
