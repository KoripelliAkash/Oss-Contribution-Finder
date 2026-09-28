import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchRepo, fetchRepos, queryKeys, STALE_TIME_MS } from "../api/client";

/** Paginated repository search (same pagination rules as `useIssues`). */
export function useRepos(filters, page = 1, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.repos(filters, page),
    queryFn: () => fetchRepos(filters, page),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_MS,
    enabled,
  });
}

/** Single repository details, including the health badge. */
export function useRepo(owner, repo) {
  return useQuery({
    queryKey: queryKeys.repo(owner, repo),
    queryFn: () => fetchRepo(owner, repo),
    staleTime: STALE_TIME_MS,
    enabled: Boolean(owner && repo),
  });
}
