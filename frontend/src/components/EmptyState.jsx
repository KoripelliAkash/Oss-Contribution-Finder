/** Shown when a filter combination returns nothing. */
export default function EmptyState({
  title = "No results",
  message = "Try a different language, label or sort order.",
  action = null,
}) {
  return (
    <div className="card flex flex-col items-center gap-2 py-10 text-center">
      <span aria-hidden="true" className="text-2xl">
        🔍
      </span>
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      <p className="max-w-md text-sm text-fg-muted">{message}</p>
      {action}
    </div>
  );
}
