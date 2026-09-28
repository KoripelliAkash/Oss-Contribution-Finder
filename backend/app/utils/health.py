"""Repo "health score" logic (PLAN.md §3, §12 Phase 6).

Returns a plain dict so ``models.py`` can hydrate ``RepoHealth`` without
importing the models module back (which would be circular).
"""

from __future__ import annotations

import datetime as dt
from typing import Any

STALE_AFTER_DAYS = 180
QUIET_AFTER_DAYS = 90
RECENT_DAYS = 30

ACTIVE_SCORE = 75
MODERATE_SCORE = 45

_LARGE_BACKLOG = 500
_POPULAR_STARS = 1000


def parse_github_datetime(value: str | None) -> dt.datetime | None:
    """Parse GitHub's RFC 3339 timestamps (``2024-06-01T12:00:00Z``)."""
    if not value:
        return None
    text = str(value).strip()
    if text.endswith(("Z", "z")):
        text = f"{text[:-1]}+00:00"
    try:
        parsed = dt.datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.UTC)
    return parsed


def repo_health(payload: dict[str, Any], *, now: dt.datetime | None = None) -> dict[str, Any]:
    """Score how welcoming/active a repository looks for a new contributor."""
    now = now or dt.datetime.now(dt.UTC)
    pushed = parse_github_datetime(payload.get("pushed_at")) or parse_github_datetime(
        payload.get("updated_at")
    )

    score = 100
    reasons: list[str] = []

    if pushed is None:
        score = 40
        reasons.append("No recent push information available.")
    else:
        idle_days = max(0, (now - pushed).days)
        if idle_days > STALE_AFTER_DAYS:
            score -= 60
            reasons.append(f"No pushes in {idle_days} days.")
        elif idle_days > QUIET_AFTER_DAYS:
            score -= 30
            reasons.append(f"Last push was {idle_days} days ago.")
        elif idle_days > RECENT_DAYS:
            score -= 10
            reasons.append(f"Last push was {idle_days} days ago.")

    open_issues = int(payload.get("open_issues_count") or 0)
    if open_issues == 0:
        score -= 10
        reasons.append("No open issues right now.")
    elif open_issues > _LARGE_BACKLOG:
        score -= 10
        reasons.append(f"Large backlog ({open_issues} open issues).")

    stars = int(payload.get("stargazers_count") or 0)
    if stars >= _POPULAR_STARS:
        score += 5
        reasons.append(f"Popular project ({stars} stars).")

    score = max(0, min(100, score))
    if score >= ACTIVE_SCORE:
        status = "active"
    elif score >= MODERATE_SCORE:
        status = "moderately active"
    else:
        status = "stale"

    if not reasons:
        reasons.append("Recently pushed with a manageable issue count.")

    return {"score": score, "status": status, "reasons": reasons}
