import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import { useToast } from "../components/Toast";
import { useSaved } from "../hooks/useSaved";
import { formatDate } from "../lib/format";
import { URL_LENGTH_LIMIT } from "../lib/savedStorage";

const TYPE_LABEL = { issue: "Issue", repo: "Repository" };

/** `/saved` — everything the browser remembers, with export/import/share. */
export default function Saved() {
  const {
    saved,
    count,
    remove,
    clearAll,
    importSaves,
    importFromFile,
    exportJson,
    shareUrl,
    shareTooLong,
    copyShareLink,
    storageOk,
    notice,
    dismissNotice,
  } = useSaved();
  const { push } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  const handledPayload = useRef(false);

  // Share links carry the full minimal objects (v2): merge them, then tidy the URL.
  useEffect(() => {
    if (handledPayload.current) return;
    const payload = searchParams.get("d");
    if (!payload) return;
    handledPayload.current = true;

    const result = importSaves(payload);
    setSearchParams({}, { replace: true });

    if (result.ok) {
      push(
        `Imported ${result.added + result.updated} saves (${result.added} new, ${result.updated} updated)`,
        "success",
      );
    } else {
      push("That share link could not be read.", "error");
    }
  }, [searchParams, setSearchParams, importSaves, push]);

  function handleExport() {
    const exported = exportJson();
    push(
      exported > 0 ? `Exported ${exported} saves to saved.json` : "There is nothing to export yet.",
      exported > 0 ? "success" : "info",
    );
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow picking the same file twice
    if (!file) return;

    const result = await importFromFile(file);
    if (!result.ok) {
      push(
        result.reason === "invalid_json"
          ? "That file is not valid JSON."
          : "That file is not a list of saved items.",
        "error",
      );
      return;
    }

    const skipped = result.skipped > 0 ? `, ${result.skipped} skipped` : "";
    push(
      `Imported ${result.added + result.updated} saves (${result.added} new, ${result.updated} updated${skipped})`,
      "success",
    );
  }

  async function handleCopyShareLink() {
    const copied = await copyShareLink();
    push(
      copied
        ? "Share link copied to your clipboard."
        : "Could not copy automatically — use Export to JSON instead.",
      copied ? "success" : "error",
    );
  }

  function handleClearAll() {
    if (!window.confirm(`Remove all ${count} saved items from this device?`)) return;
    clearAll();
    push("All saves cleared.", "info");
  }

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl text-fg">Saved items</h1>
        <p className="text-sm text-fg-muted">
          Your saves are stored only on this device (browser local storage) and are never sent to our
          backend. Export them if you want a backup.
        </p>
      </div>

      {notice ? (
        <div
          role="status"
          className="card flex items-start justify-between gap-3 bg-attention-subtle text-sm text-fg"
        >
          <span>{notice}</span>
          <button
            type="button"
            className="btn"
            onClick={dismissNotice}
            aria-label="Dismiss storage notice"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="card flex flex-wrap items-center gap-3">
        <button type="button" className="btn" onClick={handleExport} disabled={count === 0}>
          Download saves (JSON)
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={handleImport}
          aria-label="Import a saved.json file"
        />
        <button type="button" className="btn" onClick={() => fileInputRef.current?.click()}>
          Import saves
        </button>

        <button
          type="button"
          className="btn"
          onClick={handleCopyShareLink}
          disabled={shareTooLong || !shareUrl}
          title={
            shareTooLong
              ? "Too many items to share via link — use Export to JSON instead."
              : undefined
          }
        >
          Copy share link
        </button>

        <button
          type="button"
          className="btn"
          onClick={handleClearAll}
          disabled={count === 0}
          aria-label="Remove all saved items"
        >
          Clear all
        </button>

        <span className="text-xs text-fg-muted">
          {count} saved item{count === 1 ? "" : "s"}
        </span>
      </div>

      {shareTooLong ? (
        <p role="status" className="text-xs text-attention">
          Too many items to share via link (limit ≈ {URL_LENGTH_LIMIT} characters) — use Export to
          JSON instead.
        </p>
      ) : null}

      {!storageOk ? (
        <p className="text-xs text-fg-muted">
          Local storage is unavailable, so this list only lives in this tab.
        </p>
      ) : null}

      {saved.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          message="Star an issue or a repository while browsing and it will show up here."
          action={
            <Link to="/" className="btn btn-primary mt-2">
              Browse issues
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {saved.map((item) => (
            <li
              key={`${item.type}-${item.id}`}
              className="card flex flex-wrap items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-fg">
                  <a
                    href={item.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent"
                  >
                    {item.title || item.repo_full_name || item.html_url}
                  </a>
                </h2>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                  <span className="chip">{TYPE_LABEL[item.type] ?? item.type}</span>
                  {item.repo_full_name ? <span>{item.repo_full_name}</span> : null}
                  {item.language ? <span className="chip">{item.language}</span> : null}
                  <span>saved {formatDate(item.saved_at)}</span>
                </p>
                {item.labels?.length ? (
                  <ul className="mt-2 flex flex-wrap gap-1" aria-label="Labels">
                    {item.labels.map((label) => (
                      <li key={label} className="chip">
                        {label}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => remove(item.type, item.id)}
                aria-label={`Remove ${item.title || item.repo_full_name} from saved`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
