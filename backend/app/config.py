"""Environment-driven settings.

Every value can be overridden through the environment or ``backend/.env``.
The GitHub token lives *only* here — it is never sent to the frontend.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

from . import __version__

DEFAULT_CORS_ORIGINS = "http://localhost:5173"


class Settings(BaseSettings):
    """Runtime configuration loaded from env vars or ``backend/.env``."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- GitHub ---
    github_token: str = ""
    github_api_base_url: str = "https://api.github.com"
    github_user_agent: str = "oss-contribution-finder"
    github_timeout_seconds: float = 10.0

    # --- Cache ---
    cache_ttl_seconds: int = 600
    cache_max_size: int = 500
    # Pre-warm the cache on startup so the first visitors are not waiting.
    prewarm_cache: bool = False
    prewarm_language_count: int = 3

    # --- CORS ---
    cors_origins: str = DEFAULT_CORS_ORIGINS

    # --- Rate limiting (v2 split by route class) ---
    rate_limit_search_per_minute: int = 25
    rate_limit_default_per_minute: int = 60
    github_upstream_budget_per_min: int = 25

    # --- Misc ---
    app_version: str = __version__
    log_level: str = "INFO"

    @property
    def cors_origin_list(self) -> list[str]:
        """``CORS_ORIGINS`` is a comma-separated string in ``.env``."""
        return [
            origin.strip() for origin in self.cors_origins.split(",") if origin.strip()
        ]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the process-wide settings object (parsed once)."""
    return Settings()
