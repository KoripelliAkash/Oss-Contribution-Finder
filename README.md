# Open Source Contribution Finder

> Find open source work you can pick up today — browse `good first issue` and `help wanted` issues, discover contribution-friendly repositories, and jump straight to GitHub to contribute.

[![Backend](https://img.shields.io/badge/backend-FastAPI-009688?logo=fastapi&logoColor=white)](./backend)
[![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=white)](./frontend)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

A small, stateless web app that surfaces open source work worth doing. It queries the GitHub API through a thin backend, groups issues by project, scores repository health, and lets you save anything you like — locally, with no account, no database, and no tracking.

---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Running locally](#running-locally)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [API reference](#api-reference)
- [How saves work](#how-saves-work)
- [Deployment](#deployment)
- [Implementation notes](#implementation-notes)
- [License](#license)

---

## Features

- **Browse issues** filtered by label (`good first issue`, `help wanted`), language, and sort order, with pagination.
- **Browse repositories** filtered by topic, language, and minimum stars.
- **Project detail page** with a health score that reflects how actively maintained a repository appears.
- **Grouped view** — issues from the same project are collected into one card, so you can see where a project's work is concentrated.
- **Save anything** — issues and repositories are stored locally, exportable as JSON, importable back, mergeable, and shareable via URL.
- **Every result links directly to GitHub** (`target="_blank"`, `rel="noopener noreferrer"`) — this app helps you find work, GitHub is where you do it.

---

## Architecture

| Layer | Stack |
| --- | --- |
| **Backend** | Python 3.11+ · FastAPI · `httpx` · `slowapi` · `cachetools.TTLCache` |
| **Frontend** | React 18 · Vite · Tailwind CSS · TanStack Query v5 · React Router v6 |
| **Storage** | Client-side only — `localStorage` (no server-side persistence) |
| **Auth** | None required. A GitHub token is held by the backend to lift rate limits. |

```
oss-contribution-finder/
├── backend/         # FastAPI service (stateless, in-memory TTL cache)
└── frontend/        # Vite + React app
```

The frontend only ever talks to *your* backend. The GitHub token never reaches the browser.

---

## Prerequisites

- **Python** 3.11+ (3.12 tested)
---

## API reference

All routes are prefixed with `/api`. Errors follow a consistent shape:

```json
{ "error": "rate_limited", "message": "…" }
```

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Uptime probe. Never cached. |
| `GET` | `/api/languages` | Static language list. Does not call GitHub. |
| `GET` | `/api/issues` | Search issues. Params: `label`, `language`, `sort`, `order`, `page`, `per_page`. |
| `GET` | `/api/repos` | Search repositories. Params: `topic`, `language`, `min_stars`, `pushed_after`, `sort`, `page`, `per_page`. |
| `GET` | `/api/repo/{owner}/{repo}` | Single repository details plus health score. |

---

## How saves work

Saves are entirely client-side. There is no login, no database, and nothing about your saves is ever sent to the backend.

- **Storage format:** `localStorage["saved"]` holds minimal typed objects — `type: "issue" | "repo"`, `id`, `title`, `html_url`, `repo_full_name`, `repo_url`, `language`, `labels`, `saved_at`.
- **Deduplication:** keyed by `(type, id)`, so an issue and a repository with the same numeric id never collide.
- **Export / import:** `Download saves` writes `saved-YYYY-MM-DD.json`. `Import saves` merges a file back in — the same `(type, id)` keeps the newer `saved_at`, everything else is added.
- **Share link:** `Copy share link` base64url-encodes the same objects into `/saved?d=…`, so a fresh browser sees the full list. Past ~1,800 characters (about 30 items) the button disables itself and points you at the JSON export instead.
- **Multi-tab:** saves sync across tabs via the `storage` event.
- **Degraded mode:** when local storage is blocked (private mode), the app falls back to in-memory state and shows a notice.

**Privacy:** data comes from the GitHub API. This project is not affiliated with GitHub. Saved data never leaves your browser.

---

## Deployment

### Backend — Render, Railway, or Fly.io

```
Build command:  pip install -r requirements.txt
Start command:  uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Environment variables:

| Variable | Purpose |
| --- | --- |
| `GITHUB_TOKEN` | Personal access token used for outbound GitHub calls |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |
| `CACHE_TTL_SECONDS` | TTL for the in-memory cache (default 600) |
| `RATE_LIMIT_SEARCH_PER_MINUTE` | Per-IP limit for search routes (default 25) |
| `RATE_LIMIT_DEFAULT_PER_MINUTE` | Per-IP limit for other routes (default 60) |
| `GITHUB_UPSTREAM_BUDGET_PER_MIN` | Rolling cap on outbound GitHub search calls (default 25) |

### Frontend — Vercel or Netlify

```
Build command:  npm run build
Output dir:     dist
```

Environment variables:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Full URL of the deployed backend |

### Post-deploy checks

- `/api/health` returns `200`.
- The frontend can call `/api/issues` cross-origin without CORS errors.
- No `ghp_` string appears anywhere in the built JavaScript bundle.
- Save / export / import / share all work on the deployed URL.

---

## Implementation notes

- **Rate limiting** — `slowapi` per-IP limits (25/min on search routes, 60/min elsewhere), plus a rolling cap of 25 outbound GitHub search calls per minute.
- **Caching** — `cachetools.TTLCache` (500 entries, 600-second TTL). Search results and repository details are cached; `/api/languages` and `/api/health` are not. Set `PREWARM_CACHE=true` to warm the default query (plus `PREWARM_LANGUAGE_COUNT` languages) at startup.
- **Query building** — happens server-side, stripping characters that could escape a GitHub search qualifier.
- **Pull requests are excluded** — GitHub's `/search/issues` endpoint returns PRs alongside issues; the backend filters them out.
- **Known limitation** — GitHub's search API does not return a language per issue. When you filter by language, the API echoes that filter back; with no language filter, the field is `null`.

---

## License

MIT — see [`LICENSE`](./LICENSE).