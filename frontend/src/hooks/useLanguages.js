import { useQuery } from "@tanstack/react-query";
import { fetchLanguages, queryKeys } from "../api/client";

/**
 * Hardcoded language list from `/api/languages` — it never triggers a GitHub
 * call (v2 clarification), so it can be cached for a long time.
 */
export function useLanguages() {
  return useQuery({
    queryKey: queryKeys.languages,
    queryFn: fetchLanguages,
    staleTime: 60 * 60 * 1000,
    select: (data) => data?.languages ?? [],
  });
}
