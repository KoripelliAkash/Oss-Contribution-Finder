"""slowapi rate limiting (PLAN.md §10).

NOTE: ``PLAN.md`` §3 does not list this module explicitly. The limiter lives
here instead of in ``main.py`` so that routers can import it without creating a
circular import (``main`` -> ``routers`` -> ``main``).

Limits:
* search routes (``/api/issues``, ``/api/repos``): ``RATE_LIMIT_SEARCH_PER_MINUTE`` (<= 25/min)
* everything else: ``RATE_LIMIT_DEFAULT_PER_MINUTE`` (60/min)
* keyed per client IP via ``slowapi.util.get_remote_address``
"""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from .config import get_settings

_settings = get_settings()

# slowapi/flask-limiter limit strings, e.g. "25/minute".
SEARCH_LIMIT = f"{_settings.rate_limit_search_per_minute}/minute"
DEFAULT_LIMIT = f"{_settings.rate_limit_default_per_minute}/minute"

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[DEFAULT_LIMIT],
)
