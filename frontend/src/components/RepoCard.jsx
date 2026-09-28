import { Link } from "react-router-dom";
import HealthBadge from "./HealthBadge";
import SaveButton from "./SaveButton";
import { formatNumber, formatRelative } from "../lib/format";

/** One repository result, with a health badge and a link to its detail page. */
export default function RepoCard({ repo }) {
  const [owner, name] = String(repo.full_name ?? "").split("/");
  const topics = Array.isArray(repo.topics) ? repo.topics : [];

  return (
    <article className="card flex h-full flex-col gap-3">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug">
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent"
          >
            {repo.full_name}
          </a>
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <HealthBadge health={repo.health} />
          <SaveButton item={repo} type="repo" />
        </div>
      </header>

      <p className="text-sm text-fg-muted">
        {repo.description || <span className="italic text-fg-subtle">No description yet.</span>}
      </p>

      {topics.length > 0 ? (
        <ul className="flex flex-wrap gap-1" aria-label="Repository topics">
          {topics.slice(0, 6).map((topic) => (
            <li key={topic} className="chip">
              {topic}
            </li>
          ))}
        </ul>
      ) : null}

      <footer className="mt-auto flex flex-wrap items-center gap-3 text-xs text-fg-muted">
        <span>{formatNumber(repo.stars)} stars</span>
        <span>{formatNumber(repo.forks)} forks</span>
        <span>{formatNumber(repo.open_issues)} open issues</span>
        {repo.language ? <span className="chip">{repo.language}</span> : null}
        <span>pushed {formatRelative(repo.pushed_at ?? repo.updated_at)}</span>
      </footer>

      {owner && name ? (
        <Link to={`/project/${owner}/${name}`} className="text-sm font-medium">
          View project details →
        </Link>
      ) : null}
    </article>
  );
}
