const STYLES = {
  active: "border-emerald-200 bg-emerald-100 text-emerald-800",
  "moderately active": "border-amber-200 bg-amber-100 text-amber-800",
  stale: "border-rose-200 bg-rose-100 text-rose-800",
};

/** Repo health badge (PLAN.md §12 Phase 6) — also used on the detail page. */
export default function HealthBadge({ health }) {
  if (!health || typeof health.status !== "string") return null;

  const style = STYLES[health.status] ?? "border-slate-200 bg-slate-100 text-slate-700";
  const reasons = Array.isArray(health.reasons) ? health.reasons.join(" ") : "";
  const score = Number.isFinite(health.score) ? health.score : null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${style}`}
      title={reasons || undefined}
    >
      <span aria-hidden="true">●</span>
      <span>
        {health.status}
        {score !== null ? ` · ${score}` : ""}
      </span>
      <span className="sr-only">{reasons}</span>
    </span>
  );
}
