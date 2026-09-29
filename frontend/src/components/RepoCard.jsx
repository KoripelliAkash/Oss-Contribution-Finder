import { Link } from "react-router-dom";
import HealthBadge from "./HealthBadge";
import SaveButton from "./SaveButton";
import { formatNumber, formatRelative } from "../lib/format";

/** One repository result, with a health badge and a link to its detail page. */
export default function RepoCard({ repo }) {
  const [owner, name] = String(repo.full_name ?? "").split("/");
  const topics = Array.isArray(repo.topics) ? repo.topics : [];

  return (
    <article className="card flex h-full flex-col gap-4 p-5">
      {/* Header: title on the left, actions on the right */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug break-words">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              {repo.full_name}
            </a>
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <HealthBadge health={repo.health} />
            {repo.language ? (
              <span className="chip">{repo.language}</span>
            ) : null}
          </div>
        </div>
        <SaveButton item={repo} type="repo" />
      </header>

      {repo.description ? (
        <p className="text-sm leading-relaxed text-fg-muted line-clamp-2">
          {repo.description}
        </p>
      ) : (
        <p className="text-sm italic leading-relaxed text-fg-subtle">
          No description yet.
        </p>
      )}

      {topics.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Repository topics">
          {topics.slice(0, 4).map((topic) => (
            <li key={topic} className="chip">
              {topic}
            </li>
          ))}
        </ul>
      ) : null}

      {/* Footer: compact stat line */}
      <footer className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <svg
            viewBox="0 0 16 16"
            width="12"
            height="12"
            aria-hidden="true"
            className="fill-current"
          >
            <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
          </svg>
          {formatNumber(repo.stars)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg
            viewBox="0 0 16 16"
            width="12"
            height="12"
            aria-hidden="true"
            className="fill-current"
          >
            <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
          </svg>
          {formatNumber(repo.forks)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg
            viewBox="0 0 16 16"
            width="12"
            height="12"
            aria-hidden="true"
            className="fill-current"
          >
            <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
            <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
          </svg>
          {formatNumber(repo.open_issues)}
        </span>
        <span className="ml-auto">
          {formatRelative(repo.pushed_at ?? repo.updated_at)}
        </span>
      </footer>

      {owner && name ? (
        <Link
          to={`/project/${owner}/${name}`}
          className="text-sm font-medium text-accent hover:underline"
        >
          View project details →
        </Link>
      ) : null}
    </article>
  );
}