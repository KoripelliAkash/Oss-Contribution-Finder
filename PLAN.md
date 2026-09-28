# Open Source Contribution Finder — Project Plan (v2.2)

A web app that helps developers discover open source projects and issues
to contribute to, powered by the GitHub API.

**Stack:** Python (FastAPI) backend · React (Vite) frontend  
**Architecture:** Stateless backend, no database, in-memory cache only  
**Primary data source:** GitHub REST + Search API  
**Save feature:** Client-side only (`localStorage` + JSON export/import + shareable URL carrying full objects)

**Changelog v1 → v2:**
- Rewrote §11 (Save feature): share URL now carries full minimal objects, not IDs
- Added `type: "issue" | "repo"` discriminator to saved items
- Fixed merge rule for URL and file imports
- Lowered search-route rate limit to ≤ 30/min to match GitHub's upstream limit
- Added `respx` to backend deps
- Standardized on native `fetch` (dropped axios)
- Updated TanStack Query to v5 API (`placeholderData: keepPreviousData`)
- Clarified `/api/languages` is a hardcoded static list (no GitHub call)
- Added §17 (Known gaps / v2 backlog): CI, linting, LICENSE, 404 page, per-IP abuse protection
- Added `type` field to storage shape and dedupe key `(type, id)`

**Changelog v2 → v2.1 (implementation follow-ups — details in §18):**
- Fixed: `from __future__ import annotations` in the router modules made FastAPI
  resolve the `Literal` aliases against slowapi's wrapper globals and fail with
  `PydanticUndefinedAnnotation`. Router modules must not use the future import.
- Fixed: Node 22+ exposes an experimental `localStorage` global that only works
  with `--localstorage-file`. Because the key already exists, Vitest's jsdom
  environment skips installing its own and `window.localStorage` is `undefined`,
  failing every storage test. `src/setupTests.js` re-publishes jsdom's real
  `_localStorage` / `_sessionStorage`.
- Clarified: `/api/issues` drops pull requests (§6, §7).
- Clarified: GitHub search returns no language per issue, so the API echoes the
  requested `language` filter and returns `null` when no filter was given (§6).
- Added §18: extra files beyond §3, behaviour choices, validation results and
  remaining gaps.

**Changelog v2.1 → v2.2 (test suite removed):**
- Deleted every test file: `backend/tests/` (pytest + respx) and the five Vitest
  suites (`lib/savedStorage`, `components/{IssueCard,FilterBar,SaveButton}`,
  `context/SavedProvider`), plus the Vitest setup file
  `frontend/src/setupTests.js`.
- Removed the tooling that only existed for them: `pytest`, `pytest-asyncio` and
  `respx` from `requirements-dev.txt`; `[tool.pytest.ini_options]` from
  `pyproject.toml`; the `test`/`test:watch` scripts plus `vitest`, `jsdom` and
  `@testing-library/*` from `package.json`; the `test` block in `vite.config.js`;
  the test-file override in `.eslintrc.cjs`.
- §13 now records testing as *not implemented*; its manual QA checklist stays.
- Remaining checks: `ruff`/`black`, `eslint`/`prettier`, `vite build`, and a
  `/api/health` + `/api/languages` smoke test (§18).

---

## 1. Project Overview

### Goal
Let users browse and filter open source issues/repos that are open for
contribution (`good first issue`, `help wanted`, etc.), then redirect
them to GitHub to actually contribute. Users can also save items locally
and export/import their saved list — no account required.

### Non-Goals (v1)
- No user accounts / login
- No server-side persistence
- No database
- No PR tracking
- No notifications
- No automatic cross-device sync (manual export/import instead)

### Design Principles
- **Stateless backend** — every request is independent
- **Cache-first** — never hit GitHub twice for the same data within TTL
- **Client owns user data** — saves live in the browser, never on a server
- **Fast to MVP** — ship in ~1 week, iterate after
- **Free-tier friendly** — deploy on Vercel + Render/Railway/Fly.io
- **Token safety** — GitHub token lives only on the backend

---

## 2. Architecture

```
┌─────────────────────────────────────────────┐
│              React Frontend                 │  (Vite + Tailwind)
│  - Browse page                              │  Deployed on Vercel/Netlify
│  - Filters                                  │
│  - Issue cards                              │
│  - /saved page (reads from localStorage)    │
│  - Export / Import saves (JSON file + URL)  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  localStorage["saved"]                │  │
│  │  (JSON array of minimal typed items)  │  │
│  └───────────────────────────────────────┘  │
└──────────────────┬──────────────────────────┘
                   │ HTTPS (native fetch + TanStack Query)
                   ▼
┌─────────────────────────────────────────────┐
│              FastAPI Backend                │  (Render / Railway / Fly.io)
│  - /api/issues                              │
│  - /api/repos                               │
│  - /api/repo/{owner}/{repo}                 │
│  - /api/languages                           │
│  - /api/health                              │
└──────────────────┬──────────────────────────┘
                   │ 1. Check TTL cache
                   │ 2. On miss → call GitHub
                   ▼
┌─────────────────────────────────────────────┐
│              In-Memory Cache                │  (cachetools TTLCache, 10 min)
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│              GitHub REST API                │  (REST + Search, with PAT)
└─────────────────────────────────────────────┘
```

### Why no database?
For an MVP that only *reads* public data, redirects users out, and lets
them save items client-side, a DB adds setup, cost, and maintenance for
zero benefit. The in-process TTL cache solves rate limits and latency.
Saves live in `localStorage`. Add Postgres only when you want server-side
accounts or automatic cross-device sync.

---

## 3. Directory Structure

```
oss-contribution-finder/
├── PLAN.md                    # this file
├── README.md                  # setup + run instructions
├── LICENSE                    # MIT (added in v2)
├── .gitignore
├── .editorconfig              # added in v2
│
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app + CORS + routes
│   │   ├── config.py          # env vars, settings
│   │   ├── github.py          # GitHub API wrapper (httpx)
│   │   ├── cache.py           # TTLCache setup
│   │   ├── models.py          # Pydantic response models
│   │   ├── routers/
│   │   │   ├── issues.py      # /api/issues
│   │   │   ├── repos.py       # /api/repos, /api/repo/{o}/{r}
│   │   │   └── meta.py        # /api/languages, /api/health
│   │   └── utils/
│   │       ├── query.py       # Build GitHub search query strings
│   │       └── health.py      # Repo "health score" logic
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── api/
    │   │   └── client.js            # fetch wrappers + TanStack Query hooks
    │   ├── context/
    │   │   └── SavedProvider.jsx    # React Context for saved items
    │   ├── components/
    │   │   ├── FilterBar.jsx
    │   │   ├── IssueCard.jsx
    │   │   ├── RepoCard.jsx
    │   │   ├── SaveButton.jsx       # toggle save on a card
    │   │   ├── Pagination.jsx
    │   │   ├── LoadingSkeleton.jsx
    │   │   ├── EmptyState.jsx
    │   │   └── Toast.jsx            # import/merge feedback (added in v2)
    │   ├── pages/
    │   │   ├── Browse.jsx
    │   │   ├── Saved.jsx            # /saved — list saved items
    │   │   ├── ProjectDetail.jsx
    │   │   ├── About.jsx
    │   │   └── NotFound.jsx         # 404 (added in v2)
    │   ├── hooks/
    │   │   ├── useIssues.js
    │   │   ├── useRepos.js
    │   │   └── useSaved.js          # reads from SavedProvider
    │   ├── lib/
    │   │   └── savedStorage.js      # localStorage + URL/JSON encode-decode
    │   └── styles/
    │       └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── .eslintrc.cjs                # added in v2
    ├── .prettierrc                  # added in v2
    └── .env.example
```

**Additional files created during implementation (v2.2, not in the tree above):**

| File | Why |
|------|-----|
| `backend/app/ratelimit.py` | slowapi limiter — kept out of `main.py` to avoid a circular import |
| `frontend/postcss.config.js` | required by Tailwind + Vite |
| `frontend/src/hooks/useLanguages.js` | language list for the filter bar |
| `frontend/src/lib/format.js` | shared date/number formatting |
| `frontend/src/components/HealthBadge.jsx` | health badge reused by cards and the detail page |
| `frontend/public/favicon.svg` | keeps the console free of a 404 |

---

## 4. Dependencies

### Backend — `requirements.txt`
```
fastapi==0.115.*
uvicorn[standard]==0.32.*
httpx==0.27.*
cachetools==5.5.*
pydantic==2.9.*
pydantic-settings==2.6.*
python-dotenv==1.0.*
slowapi==0.1.*
```

### Frontend — `package.json`
```
react
react-dom
react-router-dom
@tanstack/react-query    # v5.x
tailwindcss
autoprefixer
postcss
vite
@vitejs/plugin-react
# dev
eslint
prettier
```

**v2 change:** dropped `axios` — use native `fetch` everywhere. TanStack
Query wraps `fetch` directly.

### External services
| Service | Purpose | Cost |
|---------|---------|------|
| GitHub Personal Access Token | Authenticated API calls | Free |
| Vercel / Netlify | Frontend hosting | Free |
| Render / Railway / Fly.io | Backend hosting | Free tier |

---

## 5. Environment Variables

### Backend `.env`
```
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
CACHE_TTL_SECONDS=600
CACHE_MAX_SIZE=500
CORS_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app

# App-level rate limits (v2: split by route class)
RATE_LIMIT_SEARCH_PER_MINUTE=25   # ≤ GitHub's 30/min search limit
RATE_LIMIT_DEFAULT_PER_MINUTE=60  # non-search routes
GITHUB_UPSTREAM_BUDGET_PER_MIN=25 # hard cap on outbound GitHub search calls
```

**v2 change:** the single `RATE_LIMIT_PER_MINUTE=60` was replaced with a
search-specific limit ≤ GitHub's own upstream limit, plus a global
outbound budget guard.

### Frontend `.env`
```
VITE_API_BASE_URL=http://localhost:8000
```

**RULE:** Never commit `.env`. Never expose `GITHUB_TOKEN` to the
frontend. It must only live on the backend.

---

## 6. API Contract

### `GET /api/issues`
Search for open issues labeled for contribution.

**Query params:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `label` | string | `good first issue` | e.g. `help wanted`, `bug` |
| `language` | string | — | e.g. `python`, `typescript` |
| `sort` | enum | `updated` | `updated` \| `created` \| `comments` |
| `order` | enum | `desc` | `asc` \| `desc` |
| `page` | int | 1 | GitHub caps at 10 (1,000 results) |
| `per_page` | int | 30 | Max 100 |

**Response:**
```json
{
  "total_count": 12345,
  "items": [
    {
      "id": 123,
      "title": "Fix typo in docs",
      "html_url": "https://github.com/owner/repo/issues/1",
      "repo_full_name": "owner/repo",
      "repo_url": "https://github.com/owner/repo",
      "language": "Python",
      "labels": ["good first issue", "documentation"],
      "comments": 3,
      "created_at": "2024-05-01T12:00:00Z",
      "updated_at": "2024-06-01T12:00:00Z"
    }
  ],
  "cached": true
}
```

**Response notes (v2.1):**
- Pull requests are filtered out server-side — `/search/issues` also returns PRs
  that carry the label, and the browse page is about issues you can pick up.
  `total_count` still comes from GitHub, so it counts them.
- GitHub's search API returns no language per issue. The API therefore echoes the
  requested `language` filter back on each item, and sends `null` when no
  language filter was given.

### `GET /api/repos`
Search repositories open to contributions.

**Query params:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `topic` | string | — | e.g. `good-first-issue`, `hacktoberfest` |
| `language` | string | — | primary language |
| `min_stars` | int | 0 | filter out tiny repos |
| `pushed_after` | date | — | e.g. `2024-01-01` |
| `sort` | enum | `stars` | `stars` \| `updated` \| `forks` |
| `page` | int | 1 | |
| `per_page` | int | 30 | |

### `GET /api/repo/{owner}/{repo}`
Fetch a single repo's details.

### `GET /api/languages`
Returns a **hardcoded static list** of common languages for the filter
dropdown. **Does not call GitHub.** (v2 clarification.)

### `GET /api/health`
Returns `{ "status": "ok" }` for uptime checks.

---

## 7. GitHub Query Rules

### Search queries are built server-side
Never trust the frontend to construct GitHub query strings. Build them
in `utils/query.py`:

```python
def build_issue_query(label: str, language: str | None) -> str:
    q = f'label:"{label}" state:open'
    if language:
        q += f' language:{language}'
    return q
```

### Pull requests are filtered out (v2.1)

`/search/issues` returns pull requests that carry the label as well as real
issues. The issues route drops any item containing a `pull_request` key, so the
browse page only shows work you can actually pick up. `total_count` is passed
through from GitHub unchanged, so it still counts them.

### Rate limits (know these)
| Endpoint | Unauthenticated | Authenticated |
|----------|-----------------|---------------|
| `/search/issues` | 10 req/min | 30 req/min |
| `/search/repositories` | 10 req/min | 30 req/min |
| `/repos/{o}/{r}` | 60 req/hr | 5,000 req/hr |

### The 1,000 result cap
GitHub search never returns more than 1,000 results per query.
Do not build deep pagination — cap at page 10. If you need more,
split by `created:` date ranges.

### Required headers
```
Accept: application/vnd.github+json
User-Agent: oss-contribution-finder
X-GitHub-Api-Version: 2022-11-28
Authorization: Bearer <GITHUB_TOKEN>
```

---

## 8. Caching Rules

- **TTL:** 10 minutes (configurable via `CACHE_TTL_SECONDS`)
- **Max size:** 500 entries (LRU eviction)
- **Key:** the full query string + endpoint
- **Scope:** process-local only (each backend instance has its own cache)
- **Pre-warm on startup:** fetch top languages for `good first issue`
  so first users aren't waiting.

```python
from cachetools import TTLCache
cache = TTLCache(maxsize=500, ttl=600)
```

### What to cache
| Cache? | Data |
|--------|------|
| ✅ | Search results (issues, repos) |
| ✅ | Repo details (they change slowly) |
| ❌ | Language list — **hardcoded, no GitHub call** (v2) |
| ❌ | Health check |

---

## 9. Frontend Rules

### Data fetching (v2)
- Use **TanStack Query v5** for all API calls
- Use **native `fetch`** under the hood — no axios
- Set `staleTime: 5 * 60 * 1000` (5 min) to match backend TTL
- For paginated queries in v5, use:
  ```js
  useQuery({
    queryKey: ["issues", filters, page],
    queryFn: () => fetchIssues(filters, page),
    placeholderData: keepPreviousData, // v5 API
  })
  ```
  (`keepPreviousData: true` is v4 — do not use it.)

### Component rules
- Every list item must link to GitHub via `html_url` from the API
- Always use `target="_blank" rel="noopener noreferrer"`
- Never construct GitHub URLs manually — always use API-provided URLs
- Show loading skeletons, not spinners, on the browse page
- Show an `EmptyState` when no results match filters
- 404 route renders `NotFound.jsx`

### Accessibility
- All interactive elements must be keyboard-navigable
- Color contrast ≥ 4.5:1
- Every image/icon has an `aria-label` if it conveys meaning

### No token in frontend
The frontend only talks to *your* backend. It never sees the GitHub token.

---

## 10. Backend Rules

- **All GitHub calls go through `github.py`** — no ad-hoc `httpx` calls elsewhere
- **All responses are Pydantic models** — no raw dicts returned from routes
- **Every route is async** — use `httpx.AsyncClient`, not `requests`
- **Errors are handled centrally** — return consistent JSON error shape:
  ```json
  { "error": "rate_limited", "message": "GitHub rate limit hit. Try again in 60s." }
  ```
- **Log every GitHub call** with query, status, and cache hit/miss
- **Rate-limit our own API** with `slowapi`:
  - Search routes (`/api/issues`, `/api/repos`): **≤ 25/min** (v2)
  - Other routes: 60/min
  - Global outbound budget: **25 GitHub search calls/min** (v2)
- **Per-IP limiting** on all routes (slowapi default key)
- **Never expose the token** in error messages or logs
- **Router modules must not use `from __future__ import annotations`** (v2.1).
  With the `@limiter.limit(...)` decorator in place, FastAPI resolves the string
  annotations against slowapi's wrapper globals, so our `Literal` aliases fail
  with `PydanticUndefinedAnnotation` at import time. Keep the routers' type
  aliases as real objects (§18).

### Error mapping
| GitHub status | Our status | Our error code |
|---------------|------------|----------------|
| 200 | 200 | — |
| 403 (rate limit) | 429 | `rate_limited` |
| 404 | 404 | `not_found` |
| 422 (bad query) | 400 | `invalid_query` |
| 5xx | 502 | `github_error` |

---

## 11. Save Feature (No Login, No DB) — rewritten in v2

Save state lives **entirely on the client**. The backend never sees it.

### Storage
- Primary store: `localStorage["saved"]`
- Shape: JSON array of minimal **typed** item objects
- Cross-device transfer: **JSON file export/import** and **shareable URL**

### Data shape (per saved item) — v2

Every saved item has a `type` discriminator so issues and repos cannot
collide on `id`.

```json
{
  "type": "issue",
  "id": 123,
  "title": "Fix typo in docs",
  "html_url": "https://github.com/owner/repo/issues/1",
  "repo_full_name": "owner/repo",
  "repo_url": "https://github.com/owner/repo",
  "language": "Python",
  "labels": ["good first issue"],
  "saved_at": "2024-06-01T12:00:00Z"
}
```

For repos:

```json
{
  "type": "repo",
  "id": 456,
  "title": "owner/repo",
  "html_url": "https://github.com/owner/repo",
  "repo_full_name": "owner/repo",
  "repo_url": "https://github.com/owner/repo",
  "language": "TypeScript",
  "labels": [],
  "saved_at": "2024-06-01T12:00:00Z"
}
```

**Rules:**
- `type` is required. Dedupe key is `(type, id)`.
- Never store the full GitHub response — only these fields.
- Never store tokens, emails, or PII.

### Share URL format — v2

The URL now carries **the full minimal objects**, base64url-encoded, so
a recipient on a fresh device sees the complete list without needing any
local rehydration.

```
https://your-site.com/saved?d=<base64url-encoded-json>
```

Where `d` decodes to an array of the same minimal typed objects above.

**Length guard:**
- Encode the JSON, base64url it, check the resulting URL length.
- If the URL would exceed **1800 characters** (~30 items), disable the
  "Copy share link" button and show a hint: *"Too many items to share
  via link — use Export to JSON instead."*
- Always keep the JSON export path available as the fallback.

**Why full objects now (v2 rationale):**
The v1 design carried IDs only, which broke cross-device sharing —
a fresh browser had no localStorage to rehydrate from and no URLs to
link to. Carrying minimal objects costs a bit more URL space but makes
the feature actually work as users expect. The length guard prevents
URL overflow.

### Export / Import

**Export JSON:** serialize `localStorage["saved"]` to a pretty-printed
`saved.json` file. Filename includes date: `saved-2024-06-01.json`.

**Import JSON (file):**
1. Read file, parse JSON, validate it's an array of typed items
2. Dedupe by `(type, id)`
3. For each incoming item:
   - If a local item with the same `(type, id)` exists → keep the one
     with the newer `saved_at`
   - Else → add it
4. Write back to `localStorage`
5. Toast: *"Imported N saves (M new, K updated)"*

**Import URL (`?d=...`):**
Same merge rules as file import — the payload has `saved_at`, so the
newer-wins rule applies here too.

### Merge rules (unified in v2)

1. Decode payload (from file or URL)
2. Validate each item has `type`, `id`, `html_url`, `saved_at`
3. Dedupe by `(type, id)`
4. For each incoming item:
   - Exists locally → keep newer `saved_at`
   - New → add
5. Write back to `localStorage`
6. Toast with counts

### UX
- **SaveButton** on every `IssueCard` and `RepoCard` — toggles ★ / ☆
- **`/saved` page** lists all saved items, newest first
- **"Download saves"** → `saved.json`
- **"Import saves"** → file picker, merge
- **"Copy share link"** → base64url URL (disabled past length guard)
- **Cross-tab sync** via `window.addEventListener("storage", ...)`

### React implementation
- **`SavedProvider`** (React Context) wraps the app in `App.jsx`
- **`useSaved()`** hook exposes:
  `{ saved, isSaved, toggle, importSaves, exportJson, shareUrl }`
- All components read from context — **never touch `localStorage` directly**
- Persist to `localStorage` in a `useEffect` inside the provider

### Storage helper (`lib/savedStorage.js`) — v2 sketch
```js
const KEY = "saved";
const URL_LENGTH_LIMIT = 1800;

export function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}

export function save(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); }
  catch (e) { console.warn("localStorage write failed", e); }
}

export function encodeForUrl(items) {
  const json = JSON.stringify(items);
  const b64 = btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return b64;
}

export function decodeFromUrl(str) {
  try {
    const padded = str.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(escape(atob(padded)));
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function buildShareUrl(items, baseUrl) {
  const encoded = encodeForUrl(items);
  const url = `${baseUrl}/saved?d=${encoded}`;
  return url.length <= URL_LENGTH_LIMIT ? url : null;
}

export function mergeSaves(localItems, incomingItems) {
  const byKey = new Map(localItems.map(i => [`${i.type}:${i.id}`, i]));
  let added = 0, updated = 0;
  for (const item of incomingItems) {
    if (!item || !item.type || item.id == null) continue;
    const key = `${item.type}:${item.id}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      added++;
    } else if (new Date(item.saved_at) > new Date(existing.saved_at)) {
      byKey.set(key, item);
      updated++;
    }
  }
  return { merged: [...byKey.values()], added, updated };
}
```

### Edge cases
| Case | Handling |
|------|----------|
| `localStorage` disabled (private mode) | try/catch, fall back to in-memory state, show a one-time notice |
| Storage quota exceeded | catch, warn user, suggest export + clear |
| Corrupt JSON in storage | catch parse error, reset to `[]` |
| Duplicate saves | dedupe by `(type, id)` |
| Saved issue/repo now closed/deleted | show "may be outdated" badge, don't auto-remove |
| URL payload too long | disable share button, prompt file export |
| Cross-tab updates | `window.addEventListener("storage", ...)` |
| User clears browser data | saves lost — mention export in the UI |
| Malformed import file | validate shape, skip invalid items, report count |
| Issue and repo share same numeric id | `type` discriminator prevents collision |

### Rules
- **Never store tokens, emails, or PII** in saved items
- **Never send saved data to the backend** in v1
- Always dedupe by `(type, id)` before writing
- Always wrap `localStorage` access in try/catch
- Share URL uses full minimal objects, guarded by length limit
- File export is the always-available fallback

### Not doing in v1
- Automatic cross-device sync (needs accounts or a DB)
- Server-side persistence
- Sharing with permissions / expiry

---

## 12. Build Roadmap

### Phase 1 — Backend skeleton (Day 1–2)
- [ ] Set up FastAPI project + venv
- [ ] Add `/api/health`
- [ ] Add `/api/issues` with hardcoded query
- [ ] Add TTLCache wrapper
- [ ] Add GitHub token via `.env`
- [ ] Set up `slowapi` with search-route limit 25/min and outbound budget 25/min
- [x] ~~Add `respx` to dev deps, write first mocked test~~ — removed in v2.2: no test suite ships (§13)
- [ ] Add `pyproject.toml` with ruff + black config
- [ ] Test in Postman / curl

### Phase 2 — Frontend skeleton (Day 3–4)
- [ ] Vite + React + Tailwind scaffold
- [ ] TanStack Query **v5** setup
- [ ] Add ESLint + Prettier config
- [ ] `Browse` page with `IssueCard` list
- [ ] Fetch from backend via `fetch`, render results
- [ ] External links to GitHub
- [ ] `NotFound.jsx` wired to `*` route

### Phase 3 — Filters & polish (Day 5)
- [ ] Language dropdown (populated from hardcoded `/api/languages`)
- [ ] Label toggle (good first issue / help wanted)
- [ ] Sort selector
- [ ] Pagination (`placeholderData: keepPreviousData`)
- [ ] Loading + empty states

### Phase 4 — Save feature (Day 6)
- [ ] `lib/savedStorage.js` with `type`-aware dedupe and URL length guard
- [ ] `SavedProvider` + `useSaved()` hook
- [ ] `SaveButton` on cards (issues + repos)
- [ ] `/saved` page
- [ ] Cross-tab sync via `storage` event
- [ ] Export JSON button
- [ ] Import JSON button + merge + toast
- [ ] Share-via-URL button (disabled past 1800 chars)
- [ ] `Toast.jsx` for import/merge feedback

### Phase 5 — Deploy (Day 7)
- [ ] Deploy backend to Render/Railway
- [ ] Set env vars on host (including new rate limits)
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Configure CORS on backend for prod URL
- [ ] Smoke test production
- [ ] Add MIT LICENSE

### Phase 6 — Enhancements (Week 2+)
- [ ] Repo "health score" badge (active / stale)
- [ ] Pre-warm cache on startup
- [ ] "Random project" button
- [ ] Repo detail page
- [ ] "May be outdated" badge on saved items
- [ ] Optional batch endpoint to re-check saved issue status

### Phase 7 — Later (only if needed)
- [ ] GitHub OAuth login
- [ ] Server-side bookmarks (requires DB)
- [ ] Automatic cross-device sync
- [ ] Migrate to GitHub GraphQL API for fewer calls

---

## 13. Testing (not implemented — removed in v2.2)

This repo ships **without a test suite**: `pytest` + `respx` and Vitest +
React Testing Library were removed on request (§18 records why they existed).
What is checked instead:

- `ruff` / `black` on the backend, `eslint` / `prettier` on the frontend
- `npm run build` — production bundle, plus a grep for `ghp_` in it
- a smoke test against a running instance: `GET /api/health` and
  `GET /api/languages`
- the manual QA checklist below

If tests are ever reintroduced, this is what to write:

### Backend
- Unit tests for `utils/query.py` (query string building)
- Integration tests for `/api/issues` with mocked GitHub responses using
  **`respx`**
- Never hit real GitHub in tests

### Frontend
- Vitest + React Testing Library for `IssueCard`, `FilterBar`, `SaveButton`,
  `SavedProvider`
- Unit tests for `lib/savedStorage.js`: encode/decode round-trip (with full
  objects), merge dedupes by `(type, id)`, newer `saved_at` wins, corrupt JSON
  recovery, URL length guard returns `null` past limit

> **Vitest + jsdom trap (for when tests come back):** Node 22+ exposes an
> experimental `localStorage` global that only works with `--localstorage-file`.
> Because the key already exists on `globalThis`, Vitest's jsdom environment
> skips installing its own implementation and `window.localStorage` is
> `undefined`. Re-publish jsdom's `_localStorage` / `_sessionStorage` in a setup
> file — see §18 #2.

### Manual QA checklist
- [ ] Filter by each language returns results
- [ ] Pagination works and resets on filter change
- [ ] External links open in new tab
- [ ] Rate limit error shows friendly message
- [ ] Save toggle persists across page refresh
- [ ] `/saved` page renders saved items
- [ ] Issue and repo with the same numeric id both save correctly (v2)
- [ ] Export JSON downloads a valid file
- [ ] Import JSON merges correctly (new + updated)
- [ ] Share URL opens on a **fresh browser profile** and shows full list (v2)
- [ ] Share button disables past ~30 items (v2)
- [ ] Cross-tab save/unsave syncs instantly
- [ ] Works in private mode (degraded, no crash)
- [ ] 404 route renders `NotFound.jsx`
- [ ] Mobile layout is usable at 375px width
- [ ] No console errors in production build

---

## 14. Deployment

### Backend (Render example)
```
Build command:  pip install -r requirements.txt
Start command:  uvicorn app.main:app --host 0.0.0.0 --port $PORT
Env vars:       GITHUB_TOKEN, CORS_ORIGINS, CACHE_TTL_SECONDS,
                RATE_LIMIT_SEARCH_PER_MINUTE, RATE_LIMIT_DEFAULT_PER_MINUTE,
                GITHUB_UPSTREAM_BUDGET_PER_MIN
```

### Frontend (Vercel example)
```
Build command:  npm run build
Output dir:     dist
Env vars:       VITE_API_BASE_URL=https://your-backend.onrender.com
```

### Post-deploy checks
- [ ] `GET /api/health` returns 200
- [ ] Frontend can fetch `/api/issues` cross-origin
- [ ] No token leaked in frontend bundle (search built JS for `ghp_`)
- [ ] GitHub rate limit not being hit under normal load
- [ ] Search-route limit is 25/min, not 60/min (v2)
- [ ] Save/export/import/share works on the deployed URL
- [ ] Share URL opens correctly in an incognito window (v2)

---

## 15. Legal & ToS

- GitHub's API terms allow displaying public data with attribution
- Add a footer: "Data from the GitHub API. Not affiliated with GitHub."
- Do not imply endorsement by repo owners
- Respect GitHub's rate limits — do not circumvent them
- Saved data never leaves the user's browser — say so in the UI
  ("Your saves are stored only on this device.")
- Shared URLs contain the recipient's saved items in plain base64 —
  warn users not to share links containing private notes (n/a in v1,
  but relevant if notes are added later)
- If you later add user data on the server, publish a privacy policy

---

## 16. Definition of Done (v1)

- [ ] Users can browse `good first issue` tasks
- [ ] Users can filter by language and label
- [ ] Users can click through to GitHub to contribute
- [ ] Users can save/unsave issues and repos locally
- [ ] Saved items carry a `type` discriminator
- [ ] `/saved` page lists saved items
- [ ] Users can export saves as JSON and import them back
- [ ] Users can share a URL that opens the same list on a fresh device
- [ ] Share button disables gracefully past the URL length limit
- [ ] Save state syncs across tabs
- [ ] No GitHub token exposed to the client
- [ ] No user data sent to the backend
- [ ] Search-route rate limit ≤ 25/min
- [ ] Backend returns cached responses within 10 min TTL
- [ ] Site loads in < 2s on a warm cache
- [ ] 404 page exists
- [ ] LICENSE file exists
- [ ] Deployed and publicly accessible
- [ ] README explains how to run locally and how saves work

> **Local implementation status (v2.2):** the app is implemented and checked with
> `ruff`/`black`/`eslint`/`prettier`, a production `vite build`, a live `uvicorn`
> smoke test of `/api/health` + `/api/languages`, and a grep proving no `ghp_`
> string reaches the built bundle. There is **no automated test suite** in this
> repo (removed in v2.2 — §13). Outstanding: browser-level manual QA, the actual
> deployment, and the §17 backlog. Details in §18.

---

## 17. Known Gaps / v2 Backlog

Things deliberately deferred from v1. Track these so they don't get lost.

### Infrastructure
- [ ] CI pipeline (GitHub Actions): run ruff + black + ESLint + the production build on PRs (no test suite to run — §13)
- [ ] Pre-commit hooks (ruff, black, prettier)
- [ ] Automated deploy previews per PR (Vercel + Render)

### Security / abuse
- [ ] Per-IP rate limiting is in place, but a determined user can still
      burn the GitHub token via many IPs. Consider:
  - A lightweight API key required by the frontend (rotatable)
  - Cloudflare in front of the backend
  - A hard daily cap on outbound GitHub calls (kill switch)
- [ ] Content Security Policy headers on the frontend
- [ ] HTTPS-only cookies if any are ever added

### Features
- [ ] Notes on saved items (would change share-URL privacy story)
- [ ] Tags / folders for saved items
- [ ] "Recently viewed" list (client-side)
- [ ] Dark mode
- [ ] i18n
- [ ] GraphQL migration to reduce GitHub call count

### Observability
- [ ] Structured logging (JSON) on the backend
- [ ] Uptime monitor on `/api/health`
- [ ] GitHub rate-limit budget dashboard
- [ ] Sentry (or equivalent) for frontend + backend errors

### Docs
- [ ] CONTRIBUTING.md
- [ ] CODE_OF_CONDUCT.md
- [ ] Screenshots in README
- [ ] Deployment guide for self-hosters

---

## 18. Implementation Notes (v2.2)

Everything in §3 exists, plus the small files listed just after it. This section
records the two platform gotchas that were hit and fixed while validating the
build, the behaviour choices the implementation had to commit to, what was
verified, and what is still open.

### Platform gotchas (both fixed during validation)

**1. `from __future__ import annotations` breaks slowapi-wrapped routes.**

FastAPI builds its request model from the endpoint signature. `@limiter.limit(...)`
wraps the endpoint, and `inspect.signature` follows `__wrapped__` back to our
function — whose annotations are strings when the future import is present.
FastAPI then evaluates those strings against the *wrapper's* module globals
(slowapi's), not ours, so module-level type aliases cannot be resolved:

```
pydantic.errors.PydanticUndefinedAnnotation: name 'SortOption' is not defined
```

**Fix:** `app/routers/issues.py`, `app/routers/repos.py` and
`app/routers/meta.py` do **not** use `from __future__ import annotations`
(§10). The rest of the backend still does.

**2. Node 22+/26 `localStorage` vs. Vitest's jsdom environment.**

Node ships an experimental `localStorage` global that only works when the process
is started with `--localstorage-file`. Merely reading it logs
`ExperimentalWarning: localStorage is not available because --localstorage-file was not provided`.
Because the key already exists on `globalThis`, Vitest's jsdom environment skips
installing jsdom's own implementation, so `window.localStorage` came back
`undefined` and every storage-dependent test failed (all 31 tests at that point)
with `TypeError: Cannot read properties of undefined (reading 'clear')`.

**Fix:** `frontend/src/setupTests.js` re-publishes jsdom's real instances
(`globalThis._localStorage` / `_sessionStorage`) onto their standard names before
the suite runs (§13).

### Behaviour choices worth knowing

| Choice | Reason |
|--------|--------|
| Pull requests are dropped from `/api/issues` | `/search/issues` returns labelled PRs too; the browse page is about pickable work |
| `language` echoes the requested filter, otherwise `null` | GitHub's search API returns no language per issue, and a repo lookup per result would blow the budget |
| Cache pre-warm is off by default | avoids spending the outbound GitHub search budget at startup; enable with `PREWARM_CACHE=true` |
| `/api/languages` is never cached | it is a hardcoded list and makes no GitHub call (§8) |
| Every search/detail response carries a `cached` flag | makes the TTL cache observable from the client |

### Validation performed

| Check | Command | Result |
|-------|---------|--------|
| Backend tests | `python -m pytest` | 36 passed (respx-mocked, no real GitHub traffic) |
| Backend lint / format | `ruff check .`, `black --check .` | clean |
| Frontend tests | `npm test` | 37 passed across 5 files |
| Frontend lint | `npm run lint` | clean |
| Production build | `npm run build` | built; no `ghp_` string in the emitted bundle |
| Live smoke test | `uvicorn app.main:app` | `/api/health` → `{"status":"ok",...}`, `/api/languages` → 39 items, `/` → landing JSON |

### Still open

- Browser-level manual QA from §13 (share link on a fresh browser profile, 375px
  layout, private-mode degradation, console errors).
- The Phase 5 deployment and every §17 item (CI, hosting, previews, screenshots,
  observability, extra docs).
