import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import IssueCard from "../components/IssueCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import Pagination from "../components/Pagination";
import { useRepoIssues } from "../hooks/useIssues";

const PER_PAGE = 30;
const MAX_PAGES = 10;

/**
 * `/project/:owner/:repo/issues` — every open issue of one project, in one
 * place. The backend scopes the search with the `repo:` qualifier, so the
 * counts here are the real totals for the project (not "on this page").
 */
export default function ProjectIssues() {
  const { owner, repo } = useParams();
  const fullName = `${owner}/${repo}`;
  const [searchParams] = useSearchParams();
  const label = searchParams.get("label") || "good first issue";
  const [page, setPage] = useState(1);

  const query = useRepoIssues(owner, repo, { label, sort: "updated" }, page);

  const items = query.data?.items ?? [];
  const totalCount = query.data?.total_count ?? 0;
  const totalPages = Math.min(MAX_PAGES, Math.max(1, Math.ceil(totalCount / PER_PAGE)));
  const repoUrl = items[0]?.repo_url; // API-provided, never hand-built

  if (query.isPending && !query.data) {
    return (
      <section className="flex flex-col gap-4">
        <LoadingSkeleton count={3} />
      </section>
    );
  }

  if (query.isError) {
    return (
      <EmptyState
        title="Could not load these issues"
        message={query.error?.message ?? "The backend could not reach GitHub."}
        action={
          <Link to="/" className="btn mt-2">
            Back to browsing
          </Link>
        }
      />
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-fg-muted">
            <Link to="/">Browse</Link> / issues
          </p>
          <h1 className="text-3xl leading-tight">{fullName}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
            <span className="counter">{totalCount.toLocaleString()}</span> open{" "}
            {totalCount === 1 ? "issue" : "issues"} labelled <span className="chip">{label}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to={`/project/${owner}/${repo}`} className="btn">
            Project overview
          </Link>
          {repoUrl ? (
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Open on GitHub <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No open issues here"
          message={`${fullName} has no open issues labelled "${label}" right now. Try another project.`}
          action={
            <Link to="/" className="btn btn-primary mt-2">
              Back to browsing
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {items.map((issue) => (
              <IssueCard key={`issue-${issue.id}`} issue={issue} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
            isFetching={query.isFetching}
          />
        </>
      )}

      <p className="text-xs text-fg-muted">
        {query.data?.cached ? "Served from the backend cache." : "Fetched from GitHub just now."}
      </p>
    </section>
  );
}
