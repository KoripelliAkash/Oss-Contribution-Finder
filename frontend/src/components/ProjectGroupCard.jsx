import { Link } from "react-router-dom";

/**
 * One project in the grouped issues view — every issue from this page that
 * came from the same repository, counted honestly as "on this page".
 */
export default function ProjectGroupCard({ group, label = "good first issue" }) {
  const { fullName, repoUrl, issues } = group;
  const [owner = "", name = ""] = String(fullName).split("/");
  const issuesPath = `/project/${owner}/${name}/issues?label=${encodeURIComponent(label)}`;

  const visible = issues.slice(0, 3);
  const hiddenCount = issues.length - visible.length;

  return (
    <article className="card flex h-full flex-col gap-4 p-5">
      {/* Header */}
      <header className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 break-all text-base font-semibold leading-snug">
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            {fullName}
          </a>
        </h3>
        <span className="counter shrink-0">{issues.length}</span>
      </header>

      {/* Issue list */}
      <ul
        className="flex flex-col gap-2.5 text-sm"
        aria-label={`Open issues in ${fullName}`}
      >
        {visible.map((issue) => (
          <li key={issue.id} className="flex items-start gap-2">
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
            <a
              href={issue.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="line-clamp-2 text-fg hover:text-accent hover:underline"
            >
              {issue.title}
            </a>
          </li>
        ))}
        {hiddenCount > 0 ? (
          <li className="text-xs text-fg-muted">+{hiddenCount} more on this page</li>
        ) : null}
      </ul>

      {/* Footer */}
      <footer className="mt-auto flex flex-wrap gap-2 border-t border-border pt-3">
        <Link
          to={issuesPath}
          className="btn btn-primary flex-1"
          aria-label={`View all issues in ${fullName}`}
        >
          View issues <span aria-hidden="true">→</span>
        </Link>
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          aria-label={`View ${fullName} on GitHub`}
        >
          GitHub <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </article>
  );
}