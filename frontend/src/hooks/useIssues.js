import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchIssues, fetchRepoIssues, queryKeys, STALE_TIME_MS } from "../api/client";

/**
 * Paginated issue search. TanStack Query v5 uses `placeholderData:
 * keepPreviousData` (v4's `keepPreviousData: true` does not exist).
 */
export function useIssues(filters, page = 1, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.issues(filters, page),
    queryFn: () => fetchIssues(filters, page),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_MS,
    enabled,
  });
}

/** Every open issue with the current label inside a single repository. */
export function useRepoIssues(owner, repo, filters, page = 1, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.repoIssues(owner, repo, filters, page),
    queryFn: () => fetchRepoIssues(owner, repo, filters, page),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_MS,
    enabled: Boolean(owner && repo) && enabled,
  });
}
