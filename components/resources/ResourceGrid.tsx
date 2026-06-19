"use client";

import { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, PackageOpen } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { ResourceCard, ResourceCardSkeleton } from "./ResourceCard";
import { useResources } from "@/lib/hooks/useResources";
import { Resource, ResourceFilters } from "@/lib/types";

interface ResourceGridProps {
  filters?: ResourceFilters;
}

export function ResourceGrid({ filters = {} }: ResourceGridProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useResources(filters);

  const { ref: sentinelRef } = useInView({
    threshold: 0.1,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  let resources = data?.pages.flatMap((p) => (p as { resources: Resource[] }).resources) ?? [];

  // Client-side filtering
  if (filters) {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      resources = resources.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.subject?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filters.type) {
      resources = resources.filter((r) => r.type === filters.type);
    }
    if (filters.branch) {
      resources = resources.filter((r) => r.branch === filters.branch);
    }
    if (filters.semester) {
      resources = resources.filter((r) => r.semester === Number(filters.semester));
    }
    if (filters.subject) {
      const subjectLower = filters.subject.toLowerCase();
      resources = resources.filter((r) => (r.subject || '').toLowerCase() === subjectLower);
    }

    // Type priority: ct > pyq > notes/study_material > pdf > others
    const typePriority: Record<string, number> = { ct: 0, pyq: 1, notes: 2, study_material: 3, assignment: 4, lab_manual: 5, pdf: 6, software: 7, other: 8 };

    // Client-side sorting
    if (filters.sortBy === "downloads") {
      resources.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    } else if (filters.sortBy === "likes") {
      resources.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (filters.sortBy === "trending") {
      resources.sort((a, b) => ((b.downloads || 0) + (b.likes || 0) * 2) - ((a.downloads || 0) + (a.likes || 0) * 2));
    } else {
      // Default: sort by type priority first, then by date
      resources.sort((a, b) => {
        const pa = typePriority[a.type] ?? 9;
        const pb = typePriority[b.type] ?? 9;
        if (pa !== pb) return pa - pb;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <ResourceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-red-400 mb-2 text-lg font-semibold">Failed to load resources</p>
        <p className="text-slate-500 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-16 text-center"
      >
        <PackageOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-300 mb-2">No resources found</h3>
        <p className="text-slate-500 text-sm">
          Try adjusting your filters or be the first to upload!
        </p>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        {resources.map((resource, i) => (
          <ResourceCard key={resource.id} resource={resource} index={i} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-8 mt-4 flex items-center justify-center">
        {isFetchingNextPage && (
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
        )}
        {!hasNextPage && resources.length > 0 && (
          <p className="text-xs text-slate-600">All resources loaded</p>
        )}
      </div>
    </div>
  );
}
