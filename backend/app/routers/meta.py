"""``GET /api/languages`` and ``GET /api/health``.

The language list is a hardcoded static list — it never calls GitHub and is the
one thing we deliberately do *not* cache (v2 clarification).

NOTE: no ``from __future__ import annotations`` here — see ``issues.py``.
"""

from fastapi import APIRouter, Request

from .. import cache, github
from ..config import get_settings
from ..models import HealthResponse, LanguagesResponse
from ..ratelimit import DEFAULT_LIMIT, limiter

settings = get_settings()

router = APIRouter(prefix="/api", tags=["meta"])

LANGUAGES: list[str] = [
    "Python",
    "JavaScript",
    "TypeScript",
    "Java",
    "Go",
    "Rust",
    "C",
    "C++",
    "C#",
    "Ruby",
    "PHP",
    "Swift",
    "Kotlin",
    "Scala",
    "Elixir",
    "Haskell",
    "Dart",
    "R",
    "Julia",
    "Perl",
    "Lua",
    "Shell",
    "HTML",
    "CSS",
    "Vue",
    "Svelte",
    "Jupyter Notebook",
    "Visual Basic",
    "F#",
    "Clojure",
    "Zig",
    "OCaml",
    "Objective-C",
    "MATLAB",
    "Groovy",
    "PowerShell",
    "TeX",
    "Vim Script",
    "Makefile",
]


@router.get(
    "/languages", response_model=LanguagesResponse, summary="Static language list"
)
@limiter.limit(DEFAULT_LIMIT)
async def list_languages(request: Request) -> LanguagesResponse:
    """Feed the frontend filter dropdown without spending a GitHub call."""
    return LanguagesResponse(languages=LANGUAGES)


@router.get("/health", response_model=HealthResponse, summary="Uptime probe")
@limiter.limit(DEFAULT_LIMIT)
async def health(request: Request) -> HealthResponse:
    """Never cached: it must reflect the current process state."""
    return HealthResponse(
        status="ok",
        version=settings.app_version,
        cache_entries=len(cache.cache),
        github_search_budget_remaining=github.search_budget_remaining(),
    )
