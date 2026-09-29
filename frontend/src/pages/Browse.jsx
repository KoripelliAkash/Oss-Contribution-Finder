import { useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import FilterBar from "../components/FilterBar";
import LoadingSkeleton from "../components/LoadingSkeleton";
import Pagination from "../components/Pagination";
import ProjectGroupCard from "../components/ProjectGroupCard";
import RepoCard from "../components/RepoCard";
import { useIssues } from "../hooks/useIssues";
import { useLanguages } from "../hooks/useLanguages";
import { useRepos } from "../hooks/useRepos";

const PER_PAGE = 30;
const MAX_PAGES = 10; // GitHub search never returns more than 1,000 results.

const DEFAULT_FILTERS = {
  label: "good first issue",
  language: undefined,
  sort: "updated",
  topic: undefined,
  minStars: 0,
};

/** Group a page of issues by repository (one API call, grouped client-side). */
function groupByRepo(items) {
  const byRepo = new Map();
  items.forEach((issue) => {
    const fullName = issue.repo_full_name || "unknown/unknown";
    const existing = byRepo.get(fullName);
    if (existing) {
      existing.issues.push(issue);
    } else {
      byRepo.set(fullName, {
        fullName,
        repoUrl: issue.repo_url,
        issues: [issue],
      });
    }
  });
  return [...byRepo.values()].sort((a, b) => b.issues.length - a.issues.length);
}

/** Browse page: issues or repositories, with filters and pagination. */
export default function Browse() {
  const [mode, setMode] = useState("issues");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS }));

  const languagesQuery = useLanguages();
  const issuesQuery = useIssues(filters, page, { enabled: mode === "issues" });
  const reposQuery = useRepos(filters, page, { enabled: mode === "repos" });

  const active = mode === "issues" ? issuesQuery : reposQuery;
  const items = active.data?.items ?? [];
  const totalCount = active.data?.total_count ?? 0;
  const totalPages = Math.min(MAX_PAGES, Math.max(1, Math.ceil(totalCount / PER_PAGE)));
  const error = active.error;

  const groups = useMemo(
    () => (mode === "issues" ? groupByRepo(items) : []),
    [mode, items]
  );

  function switchMode(nextMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      sort: nextMode === "repos" ? "stars" : "updated",
    }));
  }

  function handleFiltersChange(nextFilters) {
    setFilters(nextFilters);
    setPage(1); // filters always reset pagination
  }

  return (
    <section className="flex w-full flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold leading-tight">
          Find something to contribute to
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {mode === "issues"
            ? "Open issues grouped by project — open a project to see all of its issues in one place."
            : "Actively maintained repositories that welcome contributions."}
        </p>
      </div>

      <div className="underline-nav -mt-3" role="group" aria-label="Result type">
        <button
          type="button"
          className={`nav-link ${mode === "issues" ? "tab-active" : ""}`}
          aria-current={mode === "issues" ? "page" : undefined}
          onClick={() => switchMode("issues")}
        >
          Issues
        </button>
        <button
          type="button"
          className={`nav-link ${mode === "repos" ? "tab-active" : ""}`}
          aria-current={mode === "repos" ? "page" : undefined}
          onClick={() => switchMode("repos")}
        >
          Repositories
        </button>
      </div>

      <FilterBar
        mode={mode}
        filters={filters}
        onChange={handleFiltersChange}
        languages={languagesQuery.data ?? []}
        disabled={active.isFetching && !active.data}
      />

      {error ? (
        <div role="alert" className="card bg-danger-subtle text-sm text-fg">
          <p className="font-semibold">
            {error.isRateLimited ? "GitHub's rate limit was hit." : "Something went wrong."}
          </p>
          <p className="mt-1">
            {error.isRateLimited
              ? "Wait about a minute and try again — results are cached, so your place is kept."
              : error.message || "Please try again in a moment."}
          </p>
          <button type="button" className="btn mt-3" onClick={() => active.refetch()}>
            Try again
          </button>
        </div>
      ) : null}

      {active.isPending ? (
        <LoadingSkeleton count={6} />
      ) : items.length === 0 && !error ? (
        <EmptyState
          title={
            mode === "issues"
              ? "No open issues match these filters"
              : "No repositories match these filters"
          }
          message="Try another language, a different label or a lower star minimum."
        />
      ) : (
        <>
          <p className="text-xs text-fg-muted" aria-live="polite">
            {mode === "issues" ? (
              <>
                {groups.length} projects on this page ·{" "}
                <span className="counter">{totalCount.toLocaleString()}</span> matching issues
              </>
            ) : (
              <>
                <span className="counter">{totalCount.toLocaleString()}</span>{" "}
                matching repositories
              </>
            )}
          </p>
          <div className="grid w-full grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {mode === "issues"
              ? groups.map((group) => (
                  <ProjectGroupCard key={group.fullName} group={group} label={filters.label} />
                ))
              : items.map((repo) => <RepoCard key={`repo-${repo.id}`} repo={repo} />)}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
            isFetching={active.isFetching}
          />
        </>
      )}
    </section>
  );
}