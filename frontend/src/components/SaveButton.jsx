import { useSaved } from "../hooks/useSaved";

/**
 * Star toggle shown on every issue and repo card.
 * `type` keeps issues and repos apart even when their numeric ids collide.
 */
export default function SaveButton({ item, type = "issue", className = "" }) {
  const { isSaved, toggleIssue, toggleRepo } = useSaved();

  if (!item || !item.id) return null;

  const isItemSaved = isSaved(type, item.id);
  const label = isItemSaved
    ? `Remove ${type === "repo" ? "repository" : "issue"} from saved`
    : `Save this ${type === "repo" ? "repository" : "issue"}`;

  function handleClick() {
    if (type === "repo") {
      toggleRepo(item);
    } else {
      toggleIssue(item);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isItemSaved}
      aria-label={label}
      title={label}
      className={`btn shrink-0 ${className}`}
    >
      <span
        aria-hidden="true"
        className={isItemSaved ? "text-[#e3b341]" : "text-fg-muted"}
      >
        {isItemSaved ? "★" : "☆"}
      </span>
      <span>{isItemSaved ? "Starred" : "Star"}</span>
    </button>
  );
}
