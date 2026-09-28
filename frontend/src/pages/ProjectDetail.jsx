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
      <section className="flex flex-col gap-4">
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

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl leading-tight">{details.full_name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
            <HealthBadge health={details.health} />
            {details.language ? <span className="chip">{details.language}</span> : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/project/${owner}/${repo}/issues`} className="btn btn-primary">
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
      </div>

      <p className="max-w-3xl text-sm text-fg-muted">
        {details.description || <span className="italic text-fg-subtle">No description yet.</span>}
      </p>

      <dl className="card flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="flex items-baseline gap-1.5">
          <dt className="order-2 text-sm text-fg-muted">stars</dt>
          <dd className="order-1 text-xl font-semibold text-accent">{formatNumber(details.stars)}</dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="order-2 text-sm text-fg-muted">forks</dt>
          <dd className="order-1 text-xl font-semibold text-accent">{formatNumber(details.forks)}</dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="order-2 text-sm text-fg-muted">open issues</dt>
          <dd className="order-1 text-xl font-semibold text-accent">
            {formatNumber(details.open_issues)}
          </dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="order-2 text-sm text-fg-muted">last push</dt>
          <dd className="order-1 text-xl font-semibold">
            {formatRelative(details.pushed_at ?? details.updated_at)}
          </dd>
        </div>
      </dl>

      {topics.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-fg">Topics</h2>
          <ul className="mt-2 flex flex-wrap gap-1" aria-label="Repository topics">
            {topics.map((topic) => (
              <li key={topic} className="chip">
                {topic}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {details.health?.reasons?.length ? (
        <div className="card text-sm text-fg-muted">
          <h2 className="text-sm font-semibold text-fg">Why this score?</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {details.health.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-fg-muted">
        {details.cached ? "Served from the backend cache." : "Fetched from GitHub just now."}
      </p>
    </section>
  );
}
