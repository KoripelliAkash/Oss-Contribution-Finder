/**
 * Thin `fetch` wrappers around our backend.
 *
 * The frontend never talks to GitHub directly and never sees the GitHub
 * token — only this API base URL.
 */

export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || "http://localhost:8000").replace(
  /\/+$/,
  "",
);

export const STALE_TIME_MS = 5 * 60 * 1000; // matches the backend TTL (5 min)

export class ApiError extends Error {
  constructor(message, { code = "unknown_error", status = 0 } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }

  get isRateLimited() {
    return this.code === "rate_limited";
  }
}

async function request(path, params = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  let response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new ApiError("Could not reach the API. Is the backend running?", {
      code: "network_error",
    });
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new ApiError(payload?.message || `Request failed with status ${response.status}.`, {
      code: payload?.error || "http_error",
      status: response.status,
    });
  }

  return payload;
}

export function fetchIssues(filters = {}, page = 1, perPage = 30) {
  const { label = "good first issue", language, sort = "updated", order = "desc" } = filters;
  return request("/api/issues", {
    label,
    language,
    sort,
    order,
    page,
    per_page: perPage,
  });
}

/** All open issues with a given label inside one repository. */
export function fetchRepoIssues(owner, repo, filters = {}, page = 1, perPage = 30) {
  const { label = "good first issue", language, sort = "updated", order = "desc" } = filters;
  return request("/api/issues", {
    label,
    language,
    sort,
    order,
    page,
    per_page: perPage,
    repo: `${owner}/${repo}`,
  });
}

export function fetchRepos(filters = {}, page = 1, perPage = 30) {
  const {
    topic,
    language,
    minStars = 0,
    pushedAfter,
    sort = "stars",
    order = "desc",
  } = filters;
  return request("/api/repos", {
    topic,
    language,
    min_stars: minStars,
    pushed_after: pushedAfter,
    sort,
    order,
    page,
    per_page: perPage,
  });
}

export function fetchRepo(owner, repo) {
  return request(`/api/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
}

export function fetchLanguages() {
  return request("/api/languages");
}

export function fetchHealth() {
  return request("/api/health");
}

export const queryKeys = {
  issues: (filters, page) => ["issues", filters, page],
  repoIssues: (owner, repo, filters, page) => ["repoIssues", owner, repo, filters, page],
  repos: (filters, page) => ["repos", filters, page],
  repo: (owner, repo) => ["repo", owner, repo],
  languages: ["languages"],
};
