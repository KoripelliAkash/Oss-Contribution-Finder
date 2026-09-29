/* Primer .State colours (dark): solid emphasis fill, white text. */
const STYLES = {
  active: "bg-success-emphasis",
  "moderately active": "bg-attention-emphasis",
  stale: "bg-severe-emphasis",
};

/** Repo health badge — also used on the detail page. */
export default function HealthBadge({ health }) {
  if (!health || typeof health.status !== "string") return null;

  const style = STYLES[health.status] ?? "bg-neutral";
  const reasons = Array.isArray(health.reasons) ? health.reasons.join(" ") : "";
  const score = Number.isFinite(health.score) ? health.score : null;

  // Title text: status + score + reasons, so hovering shows everything.
  const titleParts = [health.status];
  if (score !== null) titleParts.push(`score ${score}`);
  if (reasons) titleParts.push(reasons);
  const title = titleParts.join(" — ");

  return (
    <span className={`state-pill ${style}`} title={title}>
      {health.status}
      {score !== null ? ` · ${score}` : ""}
    </span>
  );
}