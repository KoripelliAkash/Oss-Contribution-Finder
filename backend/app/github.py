"""GitHub REST + Search wrapper (PLAN.md §10).

All outbound GitHub traffic goes through this module: nothing else may create
an ``httpx`` client. Each call is logged with its query, status and cache
hit/miss, and every failure is converted into a ``GitHubError`` carrying the
status code and error code we expose to clients.
"""

from __future__ import annotations

import logging
import time
from collections import deque
from typing import Any, NamedTuple

import httpx

from . import cache
from .config import get_settings

logger = logging.getLogger(__name__)

ACCEPT_HEADER = "application/vnd.github+json"
API_VERSION = "2022-11-28"

_settings = get_settings()


class GitHubError(Exception):
    """A failed GitHub interaction mapped onto our own error shape."""

    def __init__(self, status_code: int, error: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.error = error
        self.message = message


class Fetched(NamedTuple):
    """A payload plus whether it came from the TTL cache."""

    data: dict[str, Any]
    cached: bool


class SearchBudget:
    """Rolling per-minute cap on outbound GitHub *search* calls (PLAN.md §10)."""

    def __init__(self, per_minute: int, window_seconds: float = 60.0) -> None:
        self.per_minute = max(0, per_minute)
        self.window_seconds = window_seconds
        self._calls: deque[float] = deque()

    def _prune(self, now: float) -> None:
        while self._calls and now - self._calls[0] >= self.window_seconds:
            self._calls.popleft()

    def acquire(self) -> None:
        """Record a call, or raise if the budget for this minute is spent."""
        now = time.monotonic()
        self._prune(now)
        if self.per_minute and len(self._calls) >= self.per_minute:
            raise GitHubError(
                429,
                "rate_limited",
                "The backend used its GitHub search budget for this minute. "
                "Try again in a minute.",
            )
        self._calls.append(now)

    def remaining(self) -> int:
        if not self.per_minute:
            return 0
        self._prune(time.monotonic())
        return max(0, self.per_minute - len(self._calls))

    def reset(self) -> None:
        self._calls.clear()


_budget = SearchBudget(_settings.github_upstream_budget_per_min)
_client: httpx.AsyncClient | None = None


def _headers() -> dict[str, str]:
    """Required GitHub headers (PLAN.md §7). The token never leaves the backend."""
    headers = {
        "Accept": ACCEPT_HEADER,
        "User-Agent": _settings.github_user_agent,
        "X-GitHub-Api-Version": API_VERSION,
    }
    if _settings.github_token:
        headers["Authorization"] = f"Bearer {_settings.github_token}"
    return headers


def get_client() -> httpx.AsyncClient:
    """Return the shared AsyncClient, creating it on first use."""
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            base_url=_settings.github_api_base_url,
            timeout=_settings.github_timeout_seconds,
        )
    return _client


async def close_client() -> None:
    """Close the shared client (called from the app lifespan)."""
    global _client
    if _client is not None and not _client.is_closed:
        await _client.aclose()
    _client = None


def _map_error(response: httpx.Response) -> GitHubError:
    """Translate a GitHub error response (PLAN.md §10 error mapping table)."""
    status = response.status_code
    message = ""
    try:
        body = response.json()
        if isinstance(body, dict):
            message = str(body.get("message") or "")
    except ValueError:
        message = ""

    remaining = response.headers.get("x-ratelimit-remaining")
    if status in (403, 429):
        if status == 429 or "rate limit" in message.lower() or remaining == "0":
            return GitHubError(429, "rate_limited", "GitHub rate limit hit. Try again in 60s.")
        return GitHubError(502, "github_error", "GitHub refused the request (403).")
    if status == 404:
        return GitHubError(404, "not_found", "GitHub could not find that repository or issue.")
    if status == 422:
        return GitHubError(400, "invalid_query", "GitHub rejected the search query.")
    if status == 401:
        return GitHubError(502, "github_error", "GitHub rejected the backend credentials.")
    if status >= 500:
        return GitHubError(
            502, "github_error", "GitHub returned a server error. Try again shortly."
        )
    return GitHubError(502, "github_error", f"Unexpected response from GitHub ({status}).")


async def _request(
    path: str,
    params: dict[str, Any] | None = None,
    *,
    search: bool = False,
    cache_key: str | None = None,
) -> Fetched:
    """Cache-first GitHub GET. Logs query, status and cache hit/miss."""
    key = cache_key or cache.make_key(path, **(params or {}))

    cached_payload = cache.get(key)
    if cached_payload is not None:
        logger.info("github cache hit key=%s", key)
        return Fetched(cached_payload, True)

    if search:
        _budget.acquire()

    logger.info("github call path=%s params=%s cache=miss", path, params)
    try:
        response = await get_client().get(path, params=params, headers=_headers())
    except httpx.TimeoutException as exc:
        logger.warning("github timeout path=%s", path)
        raise GitHubError(
            502, "github_error", "GitHub did not respond in time. Try again."
        ) from exc
    except httpx.HTTPError as exc:
        logger.warning("github transport error path=%s: %s", path, exc)
        raise GitHubError(502, "github_error", "Could not reach GitHub.") from exc

    logger.info(
        "github response path=%s status=%s rate_remaining=%s",
        path,
        response.status_code,
        response.headers.get("x-ratelimit-remaining"),
    )

    if response.status_code >= 400:
        raise _map_error(response)

    try:
        payload = response.json()
    except ValueError as exc:
        raise GitHubError(502, "github_error", "GitHub returned a malformed response.") from exc

    if not isinstance(payload, dict):
        raise GitHubError(502, "github_error", "GitHub returned an unexpected response shape.")

    cache.set(key, payload)
    return Fetched(payload, False)


async def search_issues(
    *,
    query: str,
    sort: str = "updated",
    order: str = "desc",
    page: int = 1,
    per_page: int = 30,
) -> Fetched:
    """``GET /search/issues`` (counts against the outbound search budget)."""
    params = {"q": query, "sort": sort, "order": order, "page": page, "per_page": per_page}
    return await _request(
        "/search/issues",
        params,
        search=True,
        cache_key=cache.make_key("/search/issues", **params),
    )


async def search_repositories(
    *,
    query: str,
    sort: str = "stars",
    order: str = "desc",
    page: int = 1,
    per_page: int = 30,
) -> Fetched:
    """``GET /search/repositories`` (counts against the outbound search budget)."""
    params = {"q": query, "sort": sort, "order": order, "page": page, "per_page": per_page}
    return await _request(
        "/search/repositories",
        params,
        search=True,
        cache_key=cache.make_key("/search/repositories", **params),
    )


async def get_repo(owner: str, repo: str) -> Fetched:
    """``GET /repos/{owner}/{repo}``."""
    path = f"/repos/{owner}/{repo}"
    return await _request(path, None, cache_key=cache.make_key(path))


def search_budget_remaining() -> int:
    """Remaining outbound search calls in the current minute."""
    return _budget.remaining()


def reset_search_budget() -> None:
    """Reset the rolling budget window (used by tests)."""
    _budget.reset()
