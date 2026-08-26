"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllApprovedResources } from "@/lib/firebase/firestore";
import { buildIndex, searchResources, parseQuery, subjectMatches, type IndexedResource } from "@/lib/search/engine";
import type { Resource, ResourceFilters } from "@/lib/types";

/**
 * Fetch every approved resource once per session and keep the built index in
 * memory. One read backs all searching, so typing costs nothing.
 */
export function useSearchIndex(enabled = true) {
  const query = useQuery({
    queryKey: ["search-index"],
    queryFn: getAllApprovedResources,
    enabled,
    // The library changes when an admin approves an upload — minutes-stale is
    // fine, and it keeps typing instant.
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const index = useMemo<IndexedResource[]>(
    () => (query.data ? buildIndex(query.data) : []),
    [query.data]
  );

  return { index, isLoading: query.isLoading, isError: query.isError, count: query.data?.length ?? 0 };
}

export interface GlobalSearchState {
  /** Ranked matches, best first. Empty when no search term is active. */
  results: Resource[];
  /** True while the index is still loading and a term is present. */
  isLoading: boolean;
  isError: boolean;
  /** True when a search term is driving the results. */
  isSearching: boolean;
  /** Filters detected inside the query itself, e.g. "sem 3". */
  inferred: { semester?: number; branch?: string };
}

/**
 * Search the whole library, honouring the sidebar filters.
 *
 * Returns `isSearching: false` when there is no term, so callers can fall back
 * to their normal paginated browse path untouched.
 */
export function useGlobalSearch(
  term: string,
  filters: ResourceFilters = {}
): GlobalSearchState {
  const trimmed = (term || "").trim();
  const active = trimmed.length > 0;

  const { index, isLoading, isError } = useSearchIndex(active);

  const { results, inferred } = useMemo(() => {
    if (!active || index.length === 0) {
      return { results: [] as Resource[], inferred: {} };
    }

    // "dbms sem 3" — pull the semester out so it filters instead of having to
    // match as text.
    const parsed = parseQuery(trimmed);
    const effectiveTerm = parsed.rest || trimmed;

    const ranked = searchResources(index, effectiveTerm, { limit: 300 });

    // Explicit sidebar filters always win over anything inferred from the text.
    const semester = filters.semester ? Number(filters.semester) : parsed.semester;
    const branch = filters.branch || parsed.branch;

    const filtered = ranked
      .map((r) => r.resource)
      .filter((r) => {
        if (filters.type && r.type !== filters.type) return false;
        if (branch && r.branch !== branch) return false;
        if (semester && r.semester !== semester) return false;
        if (filters.subject && !subjectMatches(r.subject, filters.subject)) return false;
        return true;
      });

    return {
      results: filtered,
      inferred: { semester: parsed.semester, branch: parsed.branch },
    };
  }, [active, index, trimmed, filters.type, filters.branch, filters.semester, filters.subject]);

  return {
    results,
    isLoading: active && isLoading,
    isError: active && isError,
    isSearching: active,
    inferred,
  };
}
