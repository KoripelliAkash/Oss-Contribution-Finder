const MAX_PAGE_LINKS = 5;

function pageWindow(page, totalPages) {
  const start = Math.max(1, Math.min(page - Math.floor(MAX_PAGE_LINKS / 2), totalPages - MAX_PAGE_LINKS + 1));
  const end = Math.min(totalPages, start + MAX_PAGE_LINKS - 1);
  const pages = [];
  for (let current = Math.max(1, start); current <= end; current += 1) {
    pages.push(current);
  }
  return pages;
}

/** Paging controls. GitHub never returns more than 1,000 results per query. */
export default function Pagination({ page, totalPages, onChange, disabled = false, isFetching = false }) {
  if (!Number.isFinite(totalPages) || totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav className="flex flex-wrap items-right justify-end gap-3 mt-5" aria-label="Pagination">
      <button
        type="button"
        className="btn"
        disabled={disabled || page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>

      <div className="flex flex-wrap items-center gap-1">
        {pages.map((number) => (
          <button
            key={number}
            type="button"
            className={`btn ${number === page ? "border-brand-500 bg-brand-50 font-semibold text-accent" : ""}`}
            aria-current={number === page ? "page" : undefined}
            disabled={disabled}
            onClick={() => onChange(number)}
          >
            {number}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-fg-muted" aria-live="polite">
          Page {page} of {totalPages}
          {isFetching ? " · updating…" : ""}
        </span>
        <button
          type="button"
          className="btn"
          disabled={disabled || page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
