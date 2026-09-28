import { Link } from "react-router-dom";

/**
 * One project in the grouped issues view — every issue from this page that
 * came from the same repository, counted honestly as "on this page"
 * (PLAN.md §6, Option A).
 */
export default function ProjectGroupCard({ group, label = "good first issue" }) {
  const { fullName, repoUrl, issues } = group;
  const [owner = "", name = ""] = String(fullName).split("/");
  const issuesPath = `/project/${owner}/${name}/issues?label=${encodeURIComponent(label)}`;

  return (
    <article className="card flex h-full flex-col gap-3">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 break-all text-base font-semibold leading-snug">
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-600"
          >
            {fullName}
          </a>
        </h3>
        <span className="chip shrink-0">
          {issues.length} {issues.length === 1 ? "issue" : "issues"} on this page
        </span>
      </header>

      <ul
        className="flex flex-col gap-1 text-xs text-slate-500"
        aria-label={`Open issues in ${fullName}`}
      >
        {issues.slice(0, 3).map((issue) => (
          <li key={issue.id}>
            <a
              href={issue.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="line-clamp-1 hover:text-brand-600"
            >
              {issue.title}
            </a>
          </li>
        ))}
        {issues.length > 3 ? (
          <li aria-hidden="true">…and {issues.length - 3} more on this page</li>
        ) : null}
      </ul>

      <footer className="mt-auto flex flex-wrap gap-2">
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          aria-label={`View ${fullName} on GitHub`}
        >
          View project <span aria-hidden="true">↗</span>
        </a>
        <Link
          to={issuesPath}
          className="btn btn-primary"
          aria-label={`View all issues in ${fullName}`}
        >
          View issues <span aria-hidden="true">→</span>
        </Link>
      </footer>
    </article>
  );
}
