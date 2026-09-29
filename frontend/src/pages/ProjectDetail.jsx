import { Link, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import HealthBadge from "../components/HealthBadge";
import LoadingSkeleton from "../components/LoadingSkeleton";
import SaveButton from "../components/SaveButton";
import { useRepo } from "../hooks/useRepos";
import { formatNumber, formatRelative } from "../lib/format";

/** `/project/:owner/:repo` — repo details plus the health badge. */
export default function ProjectDetail() {
  const { owner, repo } = useParams();
  const query = useRepo(owner, repo);

  if (query.isPending) {
    return (
      <section className="flex w-full flex-col gap-4">
        <LoadingSkeleton count={1} />
      </section>
    );
  }

  if (query.isError) {
    const missing = query.error?.code === "not_found";
    return (
      <EmptyState
        title={missing ? "Repository not found" : "Could not load this repository"}
        message={
          missing
            ? `${owner}/${repo} does not exist, is private, or was renamed.`
            : query.error?.message ?? "The backend could not reach GitHub."
        }
        action={
          <Link to="/" className="btn mt-2">
            Back to browsing
          </Link>
        }
      />
    );
  }

  const details = query.data;
  const topics = Array.isArray(details.topics) ? details.topics : [];
  const reasons = Array.isArray(details.health?.reasons)
    ? details.health.reasons
    : [];

  return (
    <section className="flex w-full flex-col gap-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-fg-muted">
        <Link to="/" className="text-accent hover:underline">
          Browse
        </Link>
        <span className="mx-1.5" aria-hidden="true">
          /
        </span>
        <span className="break-all">{details.full_name}</span>
      </nav>

      {/* Header: title + actions */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold leading-tight break-words">
            <a
              href={details.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              {details.full_name}
            </a>
          </h1>
          {details.description ? (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-fg-muted">
              {details.description}
            </p>
          ) : (
            <p className="mt-2 max-w-3xl text-sm italic text-fg-subtle">
              No description yet.
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <HealthBadge health={details.health} />
            {details.language ? (
              <span className="chip">{details.language}</span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/project/${owner}/${repo}/issues`}
            className="btn btn-primary"
          >
            View issues <span aria-hidden="true">→</span>
          </Link>
          <a
            href={details.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            Open on GitHub <span aria-hidden="true">↗</span>
          </a>
          <SaveButton item={details} type="repo" />
        </div>
      </header>

      {/* Stat cards grid */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4">
          <dt className="text-xs font-medium text-fg-muted">Stars</dt>
          <dd className="mt-1 text-2xl font-semibold text-accent">
            {formatNumber(details.stars)}
          </dd>
        </div>
        <div className="card p-4">
          <dt className="text-xs font-medium text-fg-muted">Forks</dt>
          <dd className="mt-1 text-2xl font-semibold text-accent">
            {formatNumber(details.forks)}
          </dd>
        </div>
        <div className="card p-4">
          <dt className="text-xs font-medium text-fg-muted">Open issues</dt>
          <dd className="mt-1 text-2xl font-semibold text-accent">
            {formatNumber(details.open_issues)}
          </dd>
        </div>
        <div className="card p-4">
          <dt className="text-xs font-medium text-fg-muted">Last push</dt>
          <dd className="mt-1 text-2xl font-semibold">
            {formatRelative(details.pushed_at ?? details.updated_at)}
          </dd>
        </div>
      </dl>

      {/* Two-column body */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Main column */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* Topics */}
          {topics.length > 0 ? (
            <section className="card p-5">
              <h2 className="text-base font-semibold text-fg">Topics</h2>
              <ul
                className="mt-3 flex flex-wrap gap-1.5"
                aria-label="Repository topics"
              >
                {topics.map((topic) => (
                  <li key={topic} className="chip">
                    {topic}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Health reasons */}
          {reasons.length > 0 ? (
            <section className="card p-5">
              <h2 className="text-base font-semibold text-fg">
                Why this score?
              </h2>
              <ul className="mt-3 space-y-2.5 text-sm text-fg-muted">
                {reasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-2">
                    <svg
                      viewBox="0 0 16 16"
                      width="14"
                      height="14"
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 fill-success-fg"
                    >
                      <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
                      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
                    </svg>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Info fallback: shown when there are no topics */}
          {topics.length === 0 ? (
            <section className="card p-5">
              <h2 className="text-base font-semibold text-fg">
                About this repository
              </h2>
              <p className="mt-3 text-sm text-fg-muted">
                This repository has no topics set on GitHub. Topics help
                contributors find projects — you can suggest adding some on
                GitHub.
              </p>
              <a
                href={details.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn mt-4"
              >
                Open on GitHub <span aria-hidden="true">↗</span>
              </a>
            </section>
          ) : null}
        </div>

        {/* Sidebar */}
        <aside className="flex min-w-0 flex-col gap-4">
          {/* About card */}
          <section className="card p-5">
            <h2 className="text-base font-semibold text-fg">About</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-fg-muted">Repository</dt>
                <dd className="max-w-[60%] text-right">
                  <a
                    href={details.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-accent hover:underline"
                  >
                    {details.full_name}
                  </a>
                </dd>
              </div>
              {details.language ? (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-fg-muted">Language</dt>
                  <dd className="text-right text-fg">{details.language}</dd>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-fg-muted">Stars</dt>
                <dd className="text-right text-fg">
                  {formatNumber(details.stars)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-fg-muted">Forks</dt>
                <dd className="text-right text-fg">
                  {formatNumber(details.forks)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-fg-muted">Last push</dt>
                <dd className="text-right text-fg">
                  {formatRelative(details.pushed_at ?? details.updated_at)}
                </dd>
              </div>
            </dl>
          </section>

          {/* Health card */}
          {details.health ? (
            <section className="card p-5">
              <h2 className="text-base font-semibold text-fg">Health</h2>
              <div className="mt-3">
                <HealthBadge health={details.health} />
              </div>
              {reasons.length > 0 ? (
                <ul className="mt-3 space-y-1.5 text-xs text-fg-muted">
                  {reasons.slice(0, 3).map((reason) => (
                    <li key={reason} className="flex items-start gap-1.5">
                      <span aria-hidden="true" className="text-fg-subtle">
                        •
                      </span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          {/* Cache note */}
          <p className="px-1 text-xs text-fg-subtle">
            {details.cached
              ? "Served from the backend cache."
              : "Fetched from GitHub just now."}
          </p>
        </aside>
      </div>

      {/* Footer action */}
      <p>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          <span aria-hidden="true">←</span> Back to browsing
        </Link>
      </p>
    </section>
  );
}