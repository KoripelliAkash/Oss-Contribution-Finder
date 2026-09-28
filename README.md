# Open Source Contribution Finder

A small web app that helps developers find open source work to pick up: browse
`good first issue` / `help wanted` issues and contribution-friendly repositories
via the GitHub API, then jump to GitHub to actually contribute.

- **Backend:** Python (FastAPI) — stateless, in-memory TTL cache, no database
- **Frontend:** React + Vite + Tailwind + TanStack Query v5
- **Save feature:** client-side only (`localStorage`, JSON export/import, shareable URL)
- **Spec:** see [`PLAN.md`](./PLAN.md) for the full design (this repo implements v2)

```
oss-contribution-finder/
├── PLAN.md          # design document
├── backend/         # FastAPI service
└── frontend/        # Vite + React app
```

---

## What it does

- **Browse** open issues filtered by label (`good first issue`, `help wanted`),
  language and sort order, with pagination.
- **Browse** contribution-friendly repositories (topic, language, minimum stars).
- **Project detail** page with a "health score" (how active/maintained a repo looks).
- **Save** issues and repositories locally, export them as JSON, import them back,
  merge them, or share a URL that opens the same list on a fresh device.
- Every result links straight to GitHub (`target="_blank"`, `rel="noopener noreferrer"`).

## Prerequisites

- Python 3.11+ (3.12 tested)
- Node.js 18+ (20+ recommended)
- A GitHub Personal Access Token (fine-grained or classic, **no scopes needed**
  for public data) — a token lifts the search limit from 10 to 30 requests/min

---

## Backend — run locally

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # PowerShell
# source .venv/bin/activate            # bash / zsh

pip install -r requirements.txt
Copy-Item .env.example .env            # then edit .env and paste your token
uvicorn app.main:app --reload
```

The API is then at <http://localhost:8000>; interactive docs at
<http://localhost:8000/docs>.

| Route | Purpose |
| --- | --- |
| `GET /api/health` | uptime probe (never cached) |
| `GET /api/languages` | hardcoded static language list (no GitHub call) |
| `GET /api/issues` | issue search (`label`, `language`, `sort`, `order`, `page`, `per_page`) |
| `GET /api/repos` | repo search (`topic`, `language`, `min_stars`, `pushed_after`, `sort`, `page`, `per_page`) |
| `GET /api/repo/{owner}/{repo}` | single repo details + health score |

Errors always look like `{ "error": "rate_limited", "message": "…" }`.

---

## Frontend — run locally

```powershell
cd frontend
npm install
Copy-Item .env.example .env            # VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

Open <http://localhost:5173>.

```powershell
npm run lint      # eslint
npm run format    # prettier
npm run build     # production bundle in dist/
```

The frontend only ever talks to *your* backend. The GitHub token never reaches
the browser.

---

## How saves work (no login, no database)

- Saved items live in `localStorage["saved"]` as minimal **typed** objects
  (`type: "issue" | "repo"`, `id`, `title`, `html_url`, `repo_full_name`,
  `repo_url`, `language`, `labels`, `saved_at`). The dedupe key is `(type, id)`,
  so an issue and a repo with the same numeric id never collide.
- **Download saves** writes `saved-YYYY-MM-DD.json`. **Import saves** merges a
  file back in: same `(type, id)` → the newer `saved_at` wins, otherwise it is added.
- **Copy share link** base64url-encodes the same objects into `/saved?d=…`, so a
  fresh browser sees the full list. Past ~1,800 characters (about 30 items) the
  button disables itself and points you at the JSON export instead.
- Saves sync across tabs via the `storage` event, and the app degrades gracefully
  when local storage is blocked (private mode): in-memory state plus a notice.
- Nothing about your saves is ever sent to the backend.

**Privacy:** data comes from the GitHub API. Not affiliated with GitHub. Saved
data never leaves your browser.

---

## Deployment

**Backend** (Render/Railway/Fly.io):

```
Build command:  pip install -r requirements.txt
Start command:  uvicorn app.main:app --host 0.0.0.0 --port $PORT
Env vars:       GITHUB_TOKEN, CORS_ORIGINS, CACHE_TTL_SECONDS,
                RATE_LIMIT_SEARCH_PER_MINUTE, RATE_LIMIT_DEFAULT_PER_MINUTE,
                GITHUB_UPSTREAM_BUDGET_PER_MIN
```

**Frontend** (Vercel/Netlify):

```
Build command:  npm run build
Output dir:     dist
Env vars:       VITE_API_BASE_URL=https://your-backend.onrender.com
```

Post-deploy checks: `/api/health` returns 200, the frontend can call
`/api/issues` cross-origin, no `ghp_` string appears in the built JS, and
save/export/import/share works on the deployed URL.

---

## Implementation notes (v2)

- **Rate limits:** `slowapi` per-IP limits — 25/min on search routes, 60/min
  elsewhere — plus a rolling cap of 25 outbound GitHub search calls per minute.
- **Caching:** `cachetools.TTLCache` (500 entries, 600 s). Search results and
  repo details are cached; `/api/languages` and `/api/health` are not.
  Set `PREWARM_CACHE=true` to warm the default query (plus
  `PREWARM_LANGUAGE_COUNT` languages) at startup.
- **Query building** happens server-side in `app/utils/query.py`, which strips
  characters that could escape a GitHub search qualifier.
- **Issue results exclude pull requests** — `/search/issues` returns PRs too.
- **Known limitation:** GitHub's search API does not return a language per
  issue, so when you filter by language the API echoes that filter back; with no
  language filter the field is `null`.

### Additions beyond the file list in `PLAN.md` §3

Everything the plan lists exists. A few small files were added for clarity:

| File | Why |
| --- | --- |
| `backend/app/ratelimit.py` | the `slowapi` limiter; kept out of `main.py` to avoid a circular import |
| `frontend/postcss.config.js` | required by Tailwind + Vite |
| `frontend/src/hooks/useLanguages.js` | language list hook used by the filter bar |
| `frontend/src/lib/format.js` | shared date/number formatting |
| `frontend/src/components/HealthBadge.jsx` | health badge reused by cards and the detail page |
| `frontend/public/favicon.svg` | keeps the console free of a 404 |

## License

MIT — see [`LICENSE`](./LICENSE).
