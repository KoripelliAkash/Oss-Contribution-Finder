"""FastAPI application entrypoint: CORS, rate limiting, error handling, pre-warm.

Run locally with::

    uvicorn app.main:app --reload
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from . import github
from .config import get_settings
from .github import GitHubError
from .ratelimit import limiter
from .routers import issues, meta, repos
from .utils.query import DEFAULT_LABEL, QueryBuildError, build_issue_query

settings = get_settings()

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)


def _error_response(status_code: int, error: str, message: str) -> JSONResponse:
    """Every failure uses the same JSON shape (PLAN.md §10)."""
    return JSONResponse(status_code=status_code, content={"error": error, "message": message})


async def _prewarm() -> None:
    """Warm the cache for the default query plus a few top languages (PLAN.md §8)."""
    languages: list[str | None] = [None, *meta.LANGUAGES[: max(0, settings.prewarm_language_count)]]
    for language in languages:
        try:
            query = build_issue_query(DEFAULT_LABEL, language)
            await github.search_issues(query=query, sort="updated", order="desc")
            logger.info("cache prewarmed query=%s", query)
        except (GitHubError, QueryBuildError) as exc:
            logger.warning("cache prewarm stopped (%s): %s", language, exc)
            return


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    if settings.prewarm_cache:
        await _prewarm()
    yield
    await github.close_client()


app = FastAPI(
    title="Open Source Contribution Finder API",
    description=(
        "Discover GitHub issues and repositories that are open to contributions. "
        "Stateless and cache-first: no database, no user accounts, no saved data."
    ),
    version=settings.app_version,
    lifespan=lifespan,
)

# slowapi needs both the state entry and the middleware.
app.state.limiter = limiter

# Middleware order: the last one added is the outermost, so CORS wraps everything.
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.exception_handler(GitHubError)
async def github_error_handler(request: Request, exc: GitHubError) -> JSONResponse:
    logger.warning(
        "github error path=%s error=%s message=%s", request.url.path, exc.error, exc.message
    )
    return _error_response(exc.status_code, exc.error, exc.message)


@app.exception_handler(QueryBuildError)
async def query_build_error_handler(request: Request, exc: QueryBuildError) -> JSONResponse:
    logger.info("invalid query path=%s reason=%s", request.url.path, exc)
    return _error_response(400, "invalid_query", str(exc))


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return _error_response(400, "invalid_query", "One or more query parameters are invalid.")


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return _error_response(
        429,
        "rate_limited",
        "Too many requests from this IP. Slow down and try again in a minute.",
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled error path=%s", request.url.path)
    return _error_response(500, "internal_error", "Something went wrong on our side.")


@app.get("/", include_in_schema=False)
async def root() -> dict[str, str]:
    """Tiny landing response so hitting the host root is not a 404."""
    return {
        "name": "oss-contribution-finder",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/api/health",
    }


app.include_router(issues.router)
app.include_router(repos.router)
app.include_router(meta.router)
