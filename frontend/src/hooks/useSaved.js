import { useSavedContext } from "../context/SavedProvider";

/**
 * Single entry point for save state:
 * `{ saved, isSaved, toggle, importSaves, exportJson, shareUrl, ... }`.
 */
export function useSaved() {
  return useSavedContext();
}
