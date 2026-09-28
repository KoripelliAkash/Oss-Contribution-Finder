/* eslint-disable react-refresh/only-export-components -- the saved-items context
   is colocated with its provider on purpose. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  STORAGE_KEY,
  URL_LENGTH_LIMIT,
  buildShareUrl,
  clearAll as clearStoredSaves,
  decodeFromUrl,
  downloadSaves,
  itemKey,
  load,
  mergeSaves,
  readFileAsText,
  removeItem,
  save as persistSaves,
  sortBySavedAt,
  storageAvailable,
  toIssueSave,
  toRepoSave,
} from "../lib/savedStorage";

/**
 * Saved items live here and only here: React Context on top of
 * `localStorage`. Components never touch `localStorage` directly.
 */
export const SavedContext = createContext(null);

const STORAGE_NOTICE =
  "Your browser is blocking local storage (private mode?). Saves will be lost when you close this tab.";

const QUOTA_NOTICE = "Storage is full — export your saves and remove a few before adding more.";

export function SavedProvider({ children }) {
  const [storageOk] = useState(() => storageAvailable());
  const [saved, setSaved] = useState(() => load());
  const [notice, setNotice] = useState(storageOk ? null : STORAGE_NOTICE);
  const savedRef = useRef(saved);

  useEffect(() => {
    savedRef.current = saved;
  }, [saved]);

  // Persist on every change.
  useEffect(() => {
    if (!storageOk) return;
    if (!persistSaves(saved)) setNotice(QUOTA_NOTICE);
  }, [saved, storageOk]);

  // Cross-tab sync: another tab writing `saved` rehydrates this one.
  useEffect(() => {
    function handleStorage(event) {
      if (event.key && event.key !== STORAGE_KEY) return;
      setSaved(load());
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const isSaved = useCallback(
    (type, id) => saved.some((item) => item.type === type && item.id === Number(id)),
    [saved],
  );

  const toggle = useCallback((item) => {
    if (!item) return;
    setSaved((current) => {
      const key = itemKey(item);
      if (current.some((entry) => itemKey(entry) === key)) {
        return current.filter((entry) => itemKey(entry) !== key);
      }
      return sortBySavedAt([item, ...current]);
    });
  }, []);

  const toggleIssue = useCallback(
    (issue) => {
      const item = toIssueSave(issue);
      if (item) toggle(item);
    },
    [toggle],
  );

  const toggleRepo = useCallback(
    (repo) => {
      const item = toRepoSave(repo);
      if (item) toggle(item);
    },
    [toggle],
  );

  const remove = useCallback((type, id) => setSaved((current) => removeItem(current, type, id)), []);

  const clearAll = useCallback(() => {
    setSaved([]);
    clearStoredSaves();
  }, []);

  const dismissNotice = useCallback(() => setNotice(null), []);

  /** Merge a share-URL payload or a parsed JSON array (file or URL: same rules). */
  const importSaves = useCallback(
    (payload) => {
      const items = typeof payload === "string" ? decodeFromUrl(payload) : payload;
      if (!Array.isArray(items) || items.length === 0) {
        return { ok: false, added: 0, updated: 0, skipped: 0 };
      }
      const base = storageOk ? load() : savedRef.current;
      const result = mergeSaves(base, items);
      setSaved(result.merged);
      return { ok: true, added: result.added, updated: result.updated, skipped: result.skipped };
    },
    [storageOk],
  );

  const importFromFile = useCallback(
    async (file) => {
      let text;
      try {
        text = await readFileAsText(file);
      } catch {
        return { ok: false, reason: "unreadable", added: 0, updated: 0, skipped: 0 };
      }
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        return { ok: false, reason: "invalid_json", added: 0, updated: 0, skipped: 0 };
      }
      if (!Array.isArray(parsed)) {
        return { ok: false, reason: "not_array", added: 0, updated: 0, skipped: 0 };
      }
      return importSaves(parsed);
    },
    [importSaves],
  );

  const exportJson = useCallback(() => {
    if (!saved.length) return 0;
    downloadSaves(saved);
    return saved.length;
  }, [saved]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || saved.length === 0) return null;
    return buildShareUrl(saved, window.location.origin);
  }, [saved]);

  const copyShareLink = useCallback(async () => {
    if (!shareUrl) return false;
    try {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch {
      return false;
    }
  }, [shareUrl]);

  const value = useMemo(
    () => ({
      saved,
      count: saved.length,
      isSaved,
      toggle,
      toggleIssue,
      toggleRepo,
      remove,
      clearAll,
      importSaves,
      importFromFile,
      exportJson,
      shareUrl,
      shareTooLong: saved.length > 0 && shareUrl === null,
      copyShareLink,
      urlLengthLimit: URL_LENGTH_LIMIT,
      storageOk,
      notice,
      dismissNotice,
    }),
    [
      saved,
      isSaved,
      toggle,
      toggleIssue,
      toggleRepo,
      remove,
      clearAll,
      importSaves,
      importFromFile,
      exportJson,
      shareUrl,
      copyShareLink,
      storageOk,
      notice,
      dismissNotice,
    ],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSavedContext() {
  const context = useContext(SavedContext);
  if (!context) {
    throw new Error("useSaved must be used inside a <SavedProvider>.");
  }
  return context;
}
