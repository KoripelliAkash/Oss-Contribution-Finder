import SaveButton from "./SaveButton";
import { formatNumber, formatRelative } from "../lib/format";

/**
 * GitHub's own label colours for the most common labels. Anything else falls
 * back to Primer's neutral dark label pill, matching how unlisted labels render.
 */
const LABEL_COLORS = {
  bug: { bg: "#d73a4a", fg: "#ffffff" },
  "good first issue": { bg: "#7057ff", fg: "#ffffff" },
  "good-first-issue": { bg: "#7057ff", fg: "#ffffff" },
  "help wanted": { bg: "#008672", fg: "#ffffff" },
  "help-wanted": { bg: "#008672", fg: "#ffffff" },
  documentation: { bg: "#0075ca", fg: "#ffffff" },
  enhancement: { bg: "#a2eeef", fg: "#1f2328" },
  question: { bg: "#d876e3", fg: "#1f2328" },
  duplicate: { bg: "#cfd3d7", fg: "#1f2328" },
  invalid: { bg: "#e4e669", fg: "#1f2328" },
  wontfix: { bg: "#f9f9f9", fg: "#1f2328", border: "#6e7681" },
  dependencies: { bg: "#0366d6", fg: "#ffffff" },
  hacktoberfest: { bg: "#2b7c32", fg: "#ffffff" },
};

// Unlisted labels fall back to Primer's neutral dark label pill.
const FALLBACK_LABEL = { bg: "#31363e", fg: "#e6edf3" };

function labelStyle(name) {
  const color = LABEL_COLORS[String(name).toLowerCase()] ?? FALLBACK_LABEL;
  return {
    backgroundColor: color.bg,
    color: color.fg,
    borderColor: color.border ?? "transparent",
  };
}

/** One issue result. Links always come from the API (`html_url`). */
export default function IssueCard({ issue }) {
  const labels = Array.isArray(issue.labels) ? issue.labels : [];

  return (
    <article className="card flex h-full flex-col gap-3">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug">
          <a
            href={issue.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-fg hover:text-accent hover:underline line-clamp-2"
          >
            {issue.title}
          </a>
        </h3>
        <SaveButton item={issue} type="issue" />
      </header>

      <p className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
        {issue.repo_url && issue.repo_full_name ? (
          <a
            href={issue.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            {issue.repo_full_name}
          </a>
        ) : (
          <span className="font-medium">{issue.repo_full_name}</span>
        )}
        {issue.language ? <span className="chip">{issue.language}</span> : null}
      </p>

      {labels.length > 0 ? (
        <ul className="flex flex-wrap gap-1" aria-label="Issue labels">
          {labels.map((label) => (
            <li
              key={label}
              className="chip"
              style={labelStyle(label)}
            >
              {label}
            </li>
          ))}
        </ul>
      ) : null}

      <footer className="mt-auto flex flex-wrap items-center gap-2 text-xs text-fg-muted">
        <span>{formatNumber(issue.comments)} comments</span>
        <span aria-hidden="true">·</span>
        <span>updated {formatRelative(issue.updated_at)}</span>
      </footer>
    </article>
  );
}