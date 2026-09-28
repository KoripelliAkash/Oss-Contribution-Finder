/** Shown when a filter combination returns nothing (PLAN.md §9). */
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
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <p className="max-w-md text-sm text-slate-600">{message}</p>
      {action}
    </div>
  );
}
