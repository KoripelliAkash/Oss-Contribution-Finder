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
          <h1 className="text-2xl font-bold text-slate-900">{details.full_name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
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

      <p className="text-sm text-slate-700">
        {details.description || <span className="italic text-slate-400">No description yet.</span>}
      </p>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Stars</dt>
          <dd className="text-lg font-semibold">{formatNumber(details.stars)}</dd>
        </div>
        <div className="card">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Forks</dt>
          <dd className="text-lg font-semibold">{formatNumber(details.forks)}</dd>
        </div>
        <div className="card">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Open issues</dt>
          <dd className="text-lg font-semibold">{formatNumber(details.open_issues)}</dd>
        </div>
        <div className="card">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Last push</dt>
          <dd className="text-lg font-semibold">
            {formatRelative(details.pushed_at ?? details.updated_at)}
          </dd>
        </div>
      </dl>

      {topics.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Topics</h2>
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
        <div className="card text-sm text-slate-600">
          <h2 className="text-sm font-semibold text-slate-800">Why this score?</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {details.health.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-slate-500">
        {details.cached ? "Served from the backend cache." : "Fetched from GitHub just now."}
      </p>
    </section>
  );
}
