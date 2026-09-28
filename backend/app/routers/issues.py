"""``GET /api/issues`` — search open issues labelled for contributors.

NOTE: no ``from __future__ import annotations`` here — the slowapi decorator
wraps the endpoint, and FastAPI resolves string annotations against the
wrapper's module globals, which would break ``Literal`` aliases.
"""

import logging
from typing import Literal

from fastapi import APIRouter, Query, Request

from .. import github
from ..models import IssueSearchResponse, issue_from_search_item
from ..ratelimit import SEARCH_LIMIT, limiter
from ..utils.query import DEFAULT_LABEL, build_issue_query

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["issues"])

SortOption = Literal["updated", "created", "comments"]
OrderOption = Literal["asc", "desc"]

MAX_SORTABLE = {"updated", "created", "comments"}


@router.get(
    "/issues",
    response_model=IssueSearchResponse,
    summary="Search open issues labelled for new contributors",
)
@limiter.limit(SEARCH_LIMIT)
async def search_issues(
    request: Request,
    label: str = Query(DEFAULT_LABEL, min_length=1, max_length=64),
    language: str | None = Query(
        None, max_length=64, description="e.g. `python`, `typescript`"
    ),
    repo: str | None = Query(None, max_length=100, description="e.g. `owner/repo`"),
    sort: SortOption = Query("updated"),
    order: OrderOption = Query("desc"),
    page: int = Query(
        1, ge=1, le=10, description="GitHub caps search at 1,000 results"
    ),
    per_page: int = Query(30, ge=1, le=100),
) -> IssueSearchResponse:
    """Build the query server-side, then read through the TTL cache.

    Pull requests that carry the label are filtered out — the browse page is
    about issues you can pick up, not PRs already in flight.
    """
    query = build_issue_query(label, language, repo=repo)
    logger.info(
        "issues search label=%s language=%s repo=%s query=%s",
        label,
        language,
        repo,
        query,
    )

    fetched = await github.search_issues(
        query=query,
        sort=sort,
        order=order,
        page=page,
        per_page=per_page,
    )

    items = [
        issue_from_search_item(item, fallback_language=language)
        for item in fetched.data.get("items") or []
        if isinstance(item, dict) and "pull_request" not in item
    ]

    return IssueSearchResponse(
        total_count=int(fetched.data.get("total_count") or 0),
        items=items,
        cached=fetched.cached,
    )
