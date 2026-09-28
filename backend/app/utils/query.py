"""Server-side GitHub search query building.

The frontend never builds a GitHub query string — it only sends filter values,
which are sanitised and turned into qualifiers here.
"""

from __future__ import annotations

import datetime as dt
import re

DEFAULT_LABEL = "good first issue"
DEFAULT_TOPIC = "good-first-issue"
MAX_VALUE_LENGTH = 64

# Anything outside this set is replaced by a space: it keeps "python", "c++",
# "c#", "Visual Basic" and "good-first-issue" intact while removing Quotes,
# colons and parentheses that could break out of a qualifier.
_ALLOWED_CHARS = re.compile(r"[^0-9A-Za-z +#\-./_]")
_WHITESPACE = re.compile(r"\s+")


class QueryBuildError(ValueError):
    """Raised when a caller-supplied filter cannot become a valid GitHub query."""


def sanitize(value: str | None, *, max_length: int = MAX_VALUE_LENGTH) -> str:
    """Strip anything that could escape a GitHub search qualifier."""
    if value is None:
        return ""
    cleaned = _ALLOWED_CHARS.sub(" ", str(value))
    cleaned = _WHITESPACE.sub(" ", cleaned).strip()
    return cleaned[:max_length].strip()


def _token(name: str, value: str) -> str:
    """Build ``name:value`` (quoted when the value contains spaces)."""
    cleaned = sanitize(value)
    if not cleaned:
        raise QueryBuildError(f"'{name}' contains no usable characters.")
    if " " in cleaned:
        return f'{name}:"{cleaned}"'
    return f"{name}:{cleaned}"


def _date_token(value: dt.date | dt.datetime | str) -> str:
    if isinstance(value, dt.datetime):
        return value.date().isoformat()
    if isinstance(value, dt.date):
        return value.isoformat()
    try:
        return dt.date.fromisoformat(str(value).strip()).isoformat()
    except ValueError as exc:
        raise QueryBuildError(
            "'pushed_after' must be a date such as 2024-01-01."
        ) from exc


def build_issue_query(
    label: str = DEFAULT_LABEL,
    language: str | None = None,
    repo: str | None = None,
) -> str:
    """Build the issue search query, e.g. ``is:issue state:open label:"good first issue"``."""
    clean_label = sanitize(label) or DEFAULT_LABEL
    parts = ["is:issue", "state:open"]
    if repo and sanitize(repo):
        parts.append(f"repo:{sanitize(repo)}")
    parts.append(f'label:"{clean_label}"')
    if language and sanitize(language):
        parts.append(_token("language", language))
    return " ".join(parts)


def build_repo_query(
    topic: str | None = None,
    language: str | None = None,
    min_stars: int = 0,
    pushed_after: dt.date | dt.datetime | str | None = None,
) -> str:
    """Build the repository search query (defaults to contribution-friendly topics)."""
    parts: list[str] = [_token("topic", topic) if topic else f"topic:{DEFAULT_TOPIC}"]

    if language and sanitize(language):
        parts.append(_token("language", language))

    if min_stars is not None:
        try:
            stars = int(min_stars)
        except (TypeError, ValueError) as exc:
            raise QueryBuildError("'min_stars' must be an integer.") from exc
        if stars < 0:
            raise QueryBuildError("'min_stars' cannot be negative.")
        if stars > 0:
            parts.append(f"stars:>={stars}")

    if pushed_after:
        parts.append(f"pushed:>{_date_token(pushed_after)}")

    return " ".join(parts)
