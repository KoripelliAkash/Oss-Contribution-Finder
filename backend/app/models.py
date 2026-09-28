"""Pydantic response models plus GitHub-payload mapping helpers.

Routes only ever return these models — never raw dicts.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from .utils.health import repo_health


class ErrorResponse(BaseModel):
    """Consistent error shape for every failure."""

    error: str
    message: str


# --------------------------------------------------------------------------- #
# Issues
# --------------------------------------------------------------------------- #
class Issue(BaseModel):
    id: int
    title: str
    html_url: str
    repo_full_name: str
    repo_url: str
    language: str | None = None
    labels: list[str] = Field(default_factory=list)
    comments: int = 0
    created_at: str | None = None
    updated_at: str | None = None


class IssueSearchResponse(BaseModel):
    total_count: int = 0
    items: list[Issue] = Field(default_factory=list)
    cached: bool = False


# --------------------------------------------------------------------------- #
# Repositories
# --------------------------------------------------------------------------- #
class RepoHealth(BaseModel):
    score: int
    status: str
    reasons: list[str] = Field(default_factory=list)


class Repo(BaseModel):
    id: int
    full_name: str
    html_url: str
    description: str | None = None
    language: str | None = None
    stars: int = 0
    forks: int = 0
    open_issues: int = 0
    topics: list[str] = Field(default_factory=list)
    updated_at: str | None = None
    pushed_at: str | None = None
    health: RepoHealth | None = None


class RepoSearchResponse(BaseModel):
    total_count: int = 0
    items: list[Repo] = Field(default_factory=list)
    cached: bool = False


class RepoDetail(Repo):
    cached: bool = False


# --------------------------------------------------------------------------- #
# Meta
# --------------------------------------------------------------------------- #
class LanguagesResponse(BaseModel):
    languages: list[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = ""
    cache_entries: int = 0
    github_search_budget_remaining: int = 0


# --------------------------------------------------------------------------- #
# Mapping helpers
# --------------------------------------------------------------------------- #
def _repo_full_name(item: dict[str, Any]) -> str:
    """Best-effort ``owner/repo`` for a search result item."""
    repository = item.get("repository")
    if isinstance(repository, dict) and repository.get("full_name"):
        return str(repository["full_name"])

    repository_url = item.get("repository_url")
    if isinstance(repository_url, str) and "/repos/" in repository_url:
        return repository_url.split("/repos/", 1)[1]

    html_url = str(item.get("html_url") or "")
    marker = "/issues/"
    if marker in html_url:
        return html_url.split("github.com/", 1)[-1].split(marker, 1)[0]
    return ""


def _repo_html_url(item: dict[str, Any], full_name: str) -> str:
    """Always use an API-provided URL; fall back to the derived repo page."""
    repository = item.get("repository")
    if isinstance(repository, dict) and repository.get("html_url"):
        return str(repository["html_url"])
    if full_name:
        return f"https://github.com/{full_name}"
    return ""


def issue_from_search_item(
    item: dict[str, Any],
    *,
    fallback_language: str | None = None,
) -> Issue:
    """Map one ``/search/issues`` item onto our ``Issue`` model.

    The search endpoint does not return a language per issue, so when the caller
    filtered by language we reuse that filter value.
    """
    full_name = _repo_full_name(item)
    labels = [
        str(label.get("name"))
        for label in item.get("labels") or []
        if isinstance(label, dict) and label.get("name")
    ]
    return Issue(
        id=int(item.get("id") or 0),
        title=str(item.get("title") or ""),
        html_url=str(item.get("html_url") or ""),
        repo_full_name=full_name,
        repo_url=_repo_html_url(item, full_name),
        language=item.get("language") or fallback_language,
        labels=labels,
        comments=int(item.get("comments") or 0),
        created_at=item.get("created_at"),
        updated_at=item.get("updated_at"),
    )


def repo_from_api(payload: dict[str, Any], *, include_health: bool = True) -> Repo:
    """Map a GitHub repository object onto our ``Repo`` model."""
    return Repo(
        id=int(payload.get("id") or 0),
        full_name=str(payload.get("full_name") or ""),
        html_url=str(payload.get("html_url") or ""),
        description=payload.get("description"),
        language=payload.get("language"),
        stars=int(payload.get("stargazers_count") or 0),
        forks=int(payload.get("forks_count") or 0),
        open_issues=int(payload.get("open_issues_count") or 0),
        topics=[str(topic) for topic in payload.get("topics") or []],
        updated_at=payload.get("updated_at"),
        pushed_at=payload.get("pushed_at"),
        health=RepoHealth(**repo_health(payload)) if include_health else None,
    )
