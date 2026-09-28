/**
 * Saved-items storage: localStorage plus JSON/URL import-export (PLAN.md §11).
 *
 * Saved data never leaves the browser: the backend has no idea it exists.
 * Items are the *minimal* typed shape from the plan — never a full GitHub
 * response, and never tokens/emails/PII.
 */

export const STORAGE_KEY = "saved";
export const URL_LENGTH_LIMIT = 1800;
export const VALID_TYPES = ["issue", "repo"];

// --------------------------------------------------------------------------- //
// base64url codec (URL-safe, unicode-safe)
// --------------------------------------------------------------------------- //
function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = padded.length % 4;
  const binary = atob(remainder ? padded + "=".repeat(4 - remainder) : padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeForUrl(items) {
  return toBase64Url(JSON.stringify(Array.isArray(items) ? items : []));
}

export function decodeFromUrl(value) {
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(fromBase64Url(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Build the shareable `/saved?d=...` URL, or `null` when it would be too long.
 * Carrying the full minimal objects is what makes the link work on a fresh
 * browser (v2) — the length guard keeps us inside sane URL limits.
 */
export function buildShareUrl(items, baseUrl) {
  const origin = String(baseUrl || "").replace(/\/+$/, "");
  const url = `${origin}/saved?d=${encodeForUrl(items)}`;
  return url.length <= URL_LENGTH_LIMIT ? url : null;
}

// --------------------------------------------------------------------------- //
// Shape validation / normalisation
// --------------------------------------------------------------------------- //
export function itemKey(item) {
  return `${item?.type}:${item?.id}`;
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

/** Validate an incoming item and strip anything we do not store. */
export function normalizeItem(raw) {
  if (!raw || typeof raw !== "object") return null;

  const type = typeof raw.type === "string" ? raw.type.trim().toLowerCase() : "";
  if (!VALID_TYPES.includes(type)) return null;

  if (!hasValue(raw.id) || !hasValue(raw.html_url) || !hasValue(raw.saved_at)) return null;
  const id = Number(raw.id);
  if (!Number.isFinite(id)) return null;

  const repoFullName = typeof raw.repo_full_name === "string" ? raw.repo_full_name : "";

  return {
    type,
    id,
    title: typeof raw.title === "string" && raw.title ? raw.title : repoFullName,
    html_url: String(raw.html_url),
    repo_full_name: repoFullName,
    repo_url: typeof raw.repo_url === "string" && raw.repo_url ? raw.repo_url : String(raw.html_url),
    language: typeof raw.language === "string" && raw.language ? raw.language : null,
    labels: Array.isArray(raw.labels) ? raw.labels.filter((label) => typeof label === "string") : [],
    saved_at: String(raw.saved_at),
  };
}

export function isValidSavedItem(raw) {
  return normalizeItem(raw) !== null;
}

// Public-API -> saved-item converters.
export function toIssueSave(issue, savedAt = new Date().toISOString()) {
  return normalizeItem({
    type: "issue",
    id: issue?.id,
    title: issue?.title ?? "",
    html_url: issue?.html_url,
    repo_full_name: issue?.repo_full_name ?? "",
    repo_url: issue?.repo_url ?? issue?.html_url,
    language: issue?.language ?? null,
    labels: issue?.labels ?? [],
    saved_at: savedAt,
  });
}

export function toRepoSave(repo, savedAt = new Date().toISOString()) {
  return normalizeItem({
    type: "repo",
    id: repo?.id,
    title: repo?.full_name ?? "",
    html_url: repo?.html_url,
    repo_full_name: repo?.full_name ?? "",
    repo_url: repo?.html_url,
    language: repo?.language ?? null,
    labels: [],
    saved_at: savedAt,
  });
}

// --------------------------------------------------------------------------- //
// localStorage (always wrapped in try/catch: private mode, quota, corruption)
// --------------------------------------------------------------------------- //
function storage() {
  try {
    return typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function storageAvailable() {
  const target = storage();
  if (!target) return false;
  try {
    const probe = "__oss_contribution_finder_probe__";
    target.setItem(probe, "1");
    target.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** Read saved items, tolerating corrupt JSON by falling back to an empty list. */
export function load() {
  const target = storage();
  if (!target) return [];
  try {
    const raw = target.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeItem).filter(Boolean);
  } catch (error) {
    console.warn("Saved items were unreadable; starting from an empty list.", error);
    return [];
  }
}

/** Returns false when the write failed (quota exceeded / private mode). */
export function save(items) {
  const target = storage();
  if (!target) return false;
  try {
    target.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(items) ? items : []));
    return true;
  } catch (error) {
    console.warn("Could not write saved items (storage disabled or full).", error);
    return false;
  }
}

export function clearAll() {
  const target = storage();
  if (!target) return;
  try {
    target.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Could not clear saved items.", error);
  }
}

export function removeItem(items, type, id) {
  return (Array.isArray(items) ? items : []).filter(
    (item) => !(item.type === type && item.id === Number(id)),
  );
}

// --------------------------------------------------------------------------- //
// Merge / sort
// --------------------------------------------------------------------------- //
function savedAtTime(item) {
  const parsed = Date.parse(item?.saved_at);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function sortBySavedAt(items) {
  return [...(Array.isArray(items) ? items : [])].sort((a, b) => savedAtTime(b) - savedAtTime(a));
}

/**
 * Merge incoming items into the local list (PLAN.md §11 merge rules):
 * dedupe by `(type, id)`, keep the newer `saved_at`, count new/updated/skipped.
 */
export function mergeSaves(localItems, incomingItems) {
  const byKey = new Map();
  (Array.isArray(localItems) ? localItems : []).forEach((item) => {
    const clean = normalizeItem(item);
    if (clean) byKey.set(itemKey(clean), clean);
  });

  let added = 0;
  let updated = 0;
  let skipped = 0;

  (Array.isArray(incomingItems) ? incomingItems : []).forEach((raw) => {
    const item = normalizeItem(raw);
    if (!item) {
      skipped += 1;
      return;
    }
    const key = itemKey(item);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      added += 1;
    } else if (savedAtTime(item) > savedAtTime(existing)) {
      byKey.set(key, item);
      updated += 1;
    }
  });

  return { merged: sortBySavedAt([...byKey.values()]), added, updated, skipped };
}

// --------------------------------------------------------------------------- //
// File export / import
// --------------------------------------------------------------------------- //
export function serializeSaves(items) {
  return JSON.stringify(sortBySavedAt(items), null, 2);
}

/** Pretty-printed `saved-YYYY-MM-DD.json` download. */
export function downloadSaves(items, now = new Date()) {
  const body = serializeSaves(items);
  const blob = new Blob([body], { type: "application/json" });
  const objectUrl = URL.createObjectURL(blob);
  const stamp = now.toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `saved-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
  return body;
}

export async function readFileAsText(file) {
  if (!file) throw new Error("No file selected.");
  if (typeof file.text === "function") return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file."));
    reader.readAsText(file);
  });
}

