# Backend — Open Source Contribution Finder

FastAPI service that reads GitHub's REST + Search APIs, caches results in
memory and returns a stable, frontend-friendly shape. No database, no accounts,
no user data.

## Quick start

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Docs: <http://localhost:8000/docs> · Health: <http://localhost:8000/api/health>

## Layout

```
app/
├── main.py        # app factory: CORS, limiter, error handlers, lifespan/pre-warm
├── config.py      # pydantic-settings (env + .env)
├── cache.py       # TTLCache wrapper + cache keys/stats
├── github.py      # the only place that talks to GitHub (httpx, budget, error mapping)
├── models.py      # Pydantic response models + GitHub payload mappers
├── ratelimit.py   # slowapi limiter (search ≤25/min, others 60/min)
├── routers/       # issues.py, repos.py, meta.py
└── utils/         # query.py (search query building), health.py (health score)
```

## Rules this service follows (PLAN.md §10)

- Every GitHub call goes through `github.py`; every route is `async`.
- Routes return Pydantic models only — never raw dicts.
- Failures map to one JSON shape: `{"error": ..., "message": ...}`
  (`rate_limited` 429, `not_found` 404, `invalid_query` 400, `github_error` 502).
- GitHub is called at most 25×/min (search) and every call is logged with its
  query, status and cache hit/miss.
- The GitHub token is read from the environment, never logged, never returned.

## Verification

To check a running instance:
```powershell
uvicorn app.main:app --reload
```
Then visit:
- Health: `GET http://localhost:8000/api/health`
- Languages: `GET http://localhost:8000/api/languages`
- Interactive docs: <http://localhost:8000/docs>

## Configuration

See `.env.example`. The important ones: `GITHUB_TOKEN`, `CORS_ORIGINS`,
`CACHE_TTL_SECONDS`, `CACHE_MAX_SIZE`, `RATE_LIMIT_SEARCH_PER_MINUTE`,
`RATE_LIMIT_DEFAULT_PER_MINUTE`, `GITHUB_UPSTREAM_BUDGET_PER_MIN`,
`PREWARM_CACHE`, `LOG_LEVEL`.
