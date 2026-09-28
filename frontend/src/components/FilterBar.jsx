const ISSUE_LABELS = ["good first issue", "help wanted"];

const ISSUE_SORTS = [
  { value: "updated", label: "Recently updated" },
  { value: "created", label: "Newest" },
  { value: "comments", label: "Most comments" },
];

const REPO_SORTS = [
  { value: "stars", label: "Most stars" },
  { value: "updated", label: "Recently updated" },
  { value: "forks", label: "Most forks" },
];

/**
 * Filter controls. The language list is static and comes
 * from `/api/languages`; filters are sent to the backend, which builds the
 * GitHub query itself.
 */
export default function FilterBar({ mode, filters, onChange, languages = [], disabled = false }) {
  const languageOptions = Array.isArray(languages) ? languages : [];
  const sorts = mode === "repos" ? REPO_SORTS : ISSUE_SORTS;

  function update(patch) {
    onChange({ ...filters, ...patch });
  }

  return (
    <form
      className="card flex flex-wrap items-end gap-4"
      aria-label="Result filters"
      onSubmit={(event) => event.preventDefault()}
    >
      {mode === "repos" ? (
        <>
          <label className="flex flex-col gap-1 text-sm font-medium text-fg-muted">
            Topic
            <input
              type="search"
              className="input"
              placeholder="hacktoberfest"
              value={filters.topic ?? ""}
              disabled={disabled}
              onChange={(event) => update({ topic: event.target.value || undefined })}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-fg-muted">
            Minimum stars
            <input
              type="number"
              min="0"
              step="10"
              className="input"
              value={filters.minStars ?? 0}
              disabled={disabled}
              onChange={(event) => update({ minStars: Number(event.target.value) || 0 })}
            />
          </label>
        </>
      ) : (
        <fieldset className="flex flex-col gap-1 text-sm font-medium text-fg-muted">
          <legend>Label</legend>
          <div className="flex flex-wrap gap-2">
            {ISSUE_LABELS.map((label) => {
              const active = filters.label === label;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={disabled}
                  aria-pressed={active}
                  onClick={() => update({ label })}
                  className={`btn ${active ? "border-brand-500 bg-brand-50 text-accent" : ""}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium text-fg-muted">
        Language
        <select
          className="input"
          value={filters.language ?? ""}
          disabled={disabled}
          onChange={(event) => update({ language: event.target.value || undefined })}
        >
          <option value="">Any language</option>
          {languageOptions.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-fg-muted">
        Sort by
        <select
          className="input"
          value={filters.sort ?? sorts[0].value}
          disabled={disabled}
          onChange={(event) => update({ sort: event.target.value })}
        >
          {sorts.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="btn"
        disabled={disabled}
        onClick={() => onChange(mode === "repos" ? { sort: "stars", minStars: 0 } : { label: "good first issue", sort: "updated" })}
      >
        Reset filters
      </button>
    </form>
  );
}
