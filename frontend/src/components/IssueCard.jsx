import SaveButton from "./SaveButton";
import { formatNumber, formatRelative } from "../lib/format";

/** One issue result. Links always come from the API (`html_url`). */
export default function IssueCard({ issue }) {
  const labels = Array.isArray(issue.labels) ? issue.labels : [];

  return (
    <article className="card flex h-full flex-col gap-3">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug">
          <a
            href={issue.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-600"
          >
            {issue.title}
          </a>
        </h3>
        <SaveButton item={issue} type="issue" />
      </header>

      <p className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <a
          href={issue.repo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:text-brand-600"
        >
          {issue.repo_full_name}
        </a>
        {issue.language ? <span className="chip">{issue.language}</span> : null}
      </p>

      {labels.length > 0 ? (
        <ul className="flex flex-wrap gap-1" aria-label="Issue labels">
          {labels.map((label) => (
            <li key={label} className="chip">
              {label}
            </li>
          ))}
        </ul>
      ) : null}

      <footer className="mt-auto flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>{formatNumber(issue.comments)} comments</span>
        <span aria-hidden="true">·</span>
        <span>updated {formatRelative(issue.updated_at)}</span>
      </footer>
    </article>
  );
}
