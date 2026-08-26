"use client";

import { useMemo } from "react";
import { Loader2, PackageOpen, Search } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { ResourceCard, ResourceCardSkeleton } from "./ResourceCard";
import { useResources } from "@/lib/hooks/useResources";
import { useGlobalSearch } from "@/lib/hooks/useSearch";
import { Resource, ResourceFilters } from "@/lib/types";

interface ResourceGridProps {
  filters?: ResourceFilters;
}

/** Type priority for the default ordering: exam papers before everything else. */
const TYPE_PRIORITY: Record<string, number> = {
  ct: 0, pyq: 1, notes: 2, study_material: 3, assignment: 4,
  lab_manual: 5, pdf: 6, software: 7, other: 8,
};

function applyFilters(list: Resource[], filters: ResourceFilters): Resource[] {
  let out = list;
  if (filters.type) out = out.filter((r) => r.type === filters.type);
  if (filters.branch) out = out.filter((r) => r.branch === filters.branch);
  if (filters.semester) out = out.filter((r) => r.semester === Number(filters.semester));
  if (filters.subject) {
    const s = filters.subject.toLowerCase();
    out = out.filter((r) => (r.subject || "").toLowerCase() === s);
  }
  return out;
}

function applySort(list: Resource[], sortBy?: string): Resource[] {
  const out = [...list];
  if (sortBy === "downloads") {
    out.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  } else if (sortBy === "likes") {
    out.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  } else if (sortBy === "trending") {
    out.sort(
      (a, b) =>
        ((b.downloads || 0) + (b.likes || 0) * 2) - ((a.downloads || 0) + (a.likes || 0) * 2)
    );
  } else {
    // Default: exam papers first, then newest.
    out.sort((a, b) => {
      const pa = TYPE_PRIORITY[a.type] ?? 9;
      const pb = TYPE_PRIORITY[b.type] ?? 9;
      if (pa !== pb) return pa - pb;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  return out;
}

/**
 * One column on a phone, where each card renders as a wide scannable row, then
 * a card grid from `sm` up. Two narrow columns on mobile gave every card about
 * 160px to hold a badge, title, subject, preview and an action row — the main
 * reason the library felt cramped and was hard to skim for a paper.
 */
const GRID_CLASS = "resource-grid";

export function ResourceGrid({ filters = {} }: ResourceGridProps) {
  const searchTerm = (filters.search || "").trim();

  // ── Search path: ranked, searches the whole library ──────────────────────
  const search = useGlobalSearch(searchTerm, filters);

  // ── Browse path: paginated infinite scroll (unchanged) ───────────────────
  // Filters are passed without `search` so the paged query cache is not
  // invalidated on every keystroke while a search is in flight.
  const browseFilters = useMemo(() => {
    const { search: _omit, ...rest } = filters;
    return rest;
  }, [filters.type, filters.branch, filters.semester, filters.subject, filters.sortBy]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isBrowseLoading,
    isError: isBrowseError,
  } = useResources(browseFilters);

  const { ref: sentinelRef } = useInView({
    threshold: 0,
    rootMargin: "600px",
    onChange: (inView) => {
      // Never paginate while searching — search already covers everything.
      if (inView && !search.isSearching && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const browseResources = useMemo(() => {
    const flat = data?.pages.flatMap((p) => (p as { resources: Resource[] }).resources) ?? [];
    return applySort(applyFilters(flat, filters), filters.sortBy);
  }, [data, filters.type, filters.branch, filters.semester, filters.subject, filters.sortBy]);

  const searchResults = useMemo(() => {
    // Relevance order is the point of a search — only re-sort if the user
    // explicitly picked a different ordering.
    const explicitSort = filters.sortBy && filters.sortBy !== "recent";
    return explicitSort ? applySort(search.results, filters.sortBy) : search.results;
  }, [search.results, filters.sortBy]);

  const isSearching = search.isSearching;
  const resources = isSearching ? searchResults : browseResources;
  const isLoading = isSearching ? search.isLoading : isBrowseLoading;
  const isError = isSearching ? search.isError : isBrowseError;

  if (isLoading) {
    return (
      <div className={GRID_CLASS}>
        {Array.from({ length: 9 }).map((_, i) => (
          <ResourceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-card p-10 text-center">
        <p className="text-red-400 mb-1.5 font-semibold">Failed to load resources</p>
        <p className="text-slate-500 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="glass-card p-10 sm:p-14 text-center">
        {isSearching ? (
          <>
            <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300 mb-1.5">
              Nothing matches “{searchTerm}”
            </h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Try a shorter term, the subject code (like <span className="text-slate-400">DBMS</span>),
              or clear the filters on the left.
            </p>
          </>
        ) : (
          <>
            <PackageOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300 mb-1.5">No resources found</h3>
            <p className="text-slate-500 text-sm">
              Try adjusting your filters or be the first to upload!
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      {isSearching && (
        <p className="text-xs text-slate-500 mb-3">
          <span className="text-slate-300 font-medium">{resources.length}</span>{" "}
          {resources.length === 1 ? "result" : "results"} for “{searchTerm}” — best matches first
        </p>
      )}

      <div className={GRID_CLASS}>
        {resources.map((resource, i) => (
          <ResourceCard key={resource.id} resource={resource} index={i} />
        ))}
      </div>

      {/* Infinite scroll sentinel — browse mode only */}
      {!isSearching && (
        <div ref={sentinelRef} className="h-8 mt-6 flex items-center justify-center">
          {isFetchingNextPage && <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />}
          {!hasNextPage && resources.length > 0 && (
            <p className="text-xs text-slate-600">All resources loaded</p>
          )}
        </div>
      )}
    </div>
  );
}
