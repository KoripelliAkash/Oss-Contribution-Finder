"""``GET /api/repos`` and ``GET /api/repo/{owner}/{repo}``.

NOTE: no ``from __future__ import annotations`` here — see ``issues.py``.
"""

import datetime as dt
import logging
from typing import Literal

from fastapi import APIRouter, Path, Query, Request

from .. import github
from ..models import RepoDetail, RepoSearchResponse, repo_from_api
from ..ratelimit import DEFAULT_LIMIT, SEARCH_LIMIT, limiter
from ..utils.query import build_repo_query

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["repos"])

RepoSortOption = Literal["stars", "updated", "forks"]
OrderOption = Literal["asc", "desc"]

# GitHub logins/repo names allow letters, numbers, dash, underscore and dot.
NAME_PATTERN = r"^[A-Za-z0-9._-]+$"


@router.get(
    "/repos",
    response_model=RepoSearchResponse,
    summary="Search repositories that are open to contributions",
)
@limiter.limit(SEARCH_LIMIT)
async def search_repos(
    request: Request,
    topic: str | None = Query(None, max_length=64, description="e.g. `hacktoberfest`"),
    language: str | None = Query(None, max_length=64),
    min_stars: int = Query(0, ge=0, le=1_000_000),
    pushed_after: dt.date | None = Query(None, description="e.g. `2024-01-01`"),
    sort: RepoSortOption = Query("stars"),
    order: OrderOption = Query("desc"),
    page: int = Query(1, ge=1, le=10),
    per_page: int = Query(30, ge=1, le=100),
) -> RepoSearchResponse:
    """Build the query server-side, then read through the TTL cache."""
    query = build_repo_query(
        topic=topic,
        language=language,
        min_stars=min_stars,
        pushed_after=pushed_after,
    )
    logger.info("repo search topic=%s language=%s query=%s", topic, language, query)

    fetched = await github.search_repositories(
        query=query,
        sort=sort,
        order=order,
        page=page,
        per_page=per_page,
    )

    items = [
        repo_from_api(item)
        for item in fetched.data.get("items") or []
        if isinstance(item, dict) and item.get("full_name")
    ]

    return RepoSearchResponse(
        total_count=int(fetched.data.get("total_count") or 0),
        items=items,
        cached=fetched.cached,
    )


@router.get(
    "/repo/{owner}/{repo}",
    response_model=RepoDetail,
    summary="Fetch a single repository's details",
)
@limiter.limit(DEFAULT_LIMIT)
async def get_repo_detail(
    request: Request,
    owner: str = Path(..., min_length=1, max_length=100, pattern=NAME_PATTERN),
    repo: str = Path(..., min_length=1, max_length=100, pattern=NAME_PATTERN),
) -> RepoDetail:
    """Repo documents change slowly, so they are cached like search results."""
    fetched = await github.get_repo(owner, repo)
    details = repo_from_api(fetched.data)
    return RepoDetail(**details.model_dump(), cached=fetched.cached)
