"""Process-local TTL cache (PLAN.md §8).

Key   = endpoint + the full canonical query string.
Value = the raw GitHub payload (never a Pydantic model) so mapping stays cheap.
Scope = process-local only; a new instance starts cold.
"""

from __future__ import annotations

import logging
from typing import Any

from cachetools import TTLCache

from .config import get_settings

logger = logging.getLogger(__name__)

_settings = get_settings()

cache: TTLCache[str, Any] = TTLCache(
    maxsize=_settings.cache_max_size,
    ttl=_settings.cache_ttl_seconds,
)

_stats: dict[str, int] = {"hits": 0, "misses": 0}


def make_key(endpoint: str, **params: Any) -> str:
    """Build a stable cache key from an endpoint and its query params."""
    pairs = [f"{name}={params[name]}" for name in sorted(params) if params[name] is not None]
    if not pairs:
        return endpoint
    return f"{endpoint}?{'&'.join(pairs)}"


def get(key: str) -> Any | None:
    """Return a cached payload or ``None`` on a miss."""
    value = cache.get(key)
    if value is None:
        _stats["misses"] += 1
        return None
    _stats["hits"] += 1
    return value


def set(key: str, value: Any) -> None:
    """Store a payload under ``key`` (TTL is enforced by the cache itself)."""
    cache[key] = value


def clear() -> None:
    """Drop every entry (used by tests)."""
    cache.clear()


def stats() -> dict[str, int]:
    """Cache counters for logging / the health endpoint."""
    return {"entries": len(cache), **_stats}


def invalidate_prefix(prefix: str) -> int:
    """Remove every key starting with ``prefix``; returns the number removed."""
    doomed = [key for key in list(cache.keys()) if key.startswith(prefix)]
    for key in doomed:
        cache.pop(key, None)
    return len(doomed)
