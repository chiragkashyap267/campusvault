"use client";

import { useState, useEffect, Suspense, useRef, useDeferredValue, useCallback } from "react";
import { useLenis } from "lenis/react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { ResourceFiltersPanel } from "@/components/resources/ResourceFilters";
import { ResourceFinder } from "@/components/home/ResourceFinder";
import { useUIStore } from "@/lib/store/uiStore";
import { ResourceFilters } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";

/**
 * Type accents match the badges on the cards exactly — a PYQ chip here and a
 * PYQ badge on a card are the same colour, so a filter visibly corresponds to
 * what appears in the results. They used to disagree (green here, purple on
 * the card), which made the colour coding meaningless.
 * Exam papers lead, since finding those is what most people came to do.
 */
const QUICK_FILTERS = [
  { label: "PYQ Papers", style: "type-pyq", key: "type", val: "pyq" },
  { label: "CT Papers", style: "type-ct", key: "type", val: "ct" },
  { label: "Notes", style: "type-notes", key: "type", val: "notes" },
  { label: "MCA", style: "type-other", key: "branch", val: "mca" },
  { label: "BCA", style: "type-other", key: "branch", val: "bca" },
  { label: "B.Tech", style: "type-other", key: "branch", val: "btech" },
] as const;

function ResourcesContent() {
  const { filters, setFilter, resetFilters } = useUIStore();
  const { user } = useAuthStore();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const newsletterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  /**
   * Bring the results into view after the directory sets a filter.
   *
   * Goes through Lenis rather than scrollIntoView: Lenis owns the scroll
   * position, and a native smooth scroll fights it for control. The offset
   * clears the fixed navbar so the first row of cards is not hidden under it.
   */
  const scrollToResults = useCallback(() => {
    const target = resultsRef.current;
    if (!target) return;
    // Let the filter state and the new card list commit first.
    requestAnimationFrame(() => {
      if (lenis) {
        lenis.scrollTo(target, { offset: -80 });
      } else {
        const y = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    });
  }, [lenis]);

  // Keeps the input responsive while the (heavier) result list re-ranks at a
  // lower priority. Typing never waits on rendering a few hundred cards.
  const deferredSearch = useDeferredValue(search);

  // Sync URL search params whenever URL changes (accordion links)
  useEffect(() => {
    const q = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const branch = searchParams.get("branch") || "";
    const semester = searchParams.get("semester") || "";
    const subject = searchParams.get("subject") || "";
    const sortBy = searchParams.get("sortBy") || "recent";

    resetFilters();
    setSearch(q);
    if (type) setFilter("type", type);
    if (branch) setFilter("branch", branch);
    if (semester) setFilter("semester", Number(semester));
    if (subject) setFilter("subject", subject);
    setFilter("sortBy", sortBy);
  }, [searchParams.toString()]);

  // Smart newsletter debounce
  useEffect(() => {
    if (!user?.email || search.trim().length < 3) return;
    if (newsletterTimerRef.current) clearTimeout(newsletterTimerRef.current);
    newsletterTimerRef.current = setTimeout(() => {
      fetch("/api/newsletter/search-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentEmail: user.email,
          studentName: user.displayName || "Student",
          searchQuery: search.trim(),
          branch: filters.branch || "",
        }),
      }).catch(() => {});
    }, 1500);
    return () => {
      if (newsletterTimerRef.current) clearTimeout(newsletterTimerRef.current);
    };
  }, [search, user]);

  /**
   * Bring results into view once a search is actually under way.
   *
   * Keyed on the deferred value so it fires when results have been computed,
   * not on every keystroke, and only on the transition into searching — so it
   * does not yank the page while someone is still refining a query.
   */
  const wasSearchingRef = useRef(false);
  useEffect(() => {
    const searching = deferredSearch.trim().length >= 2;
    if (searching && !wasSearchingRef.current) scrollToResults();
    wasSearchingRef.current = searching;
  }, [deferredSearch, scrollToResults]);

  const activeFilters: ResourceFilters = { ...filters, search: deferredSearch };

  const hasActiveFilter =
    !!(filters.type || filters.branch || filters.semester || filters.subject);

  return (
    <div className="min-h-screen bg-[#030712] pb-20">
      <div className="container-app pt-8 sm:pt-10 lg:pt-12">
        {/* ── Header ── */}
        <div className="mb-6">
          <h1 className="section-title text-white">Resource Library</h1>
          <p className="section-subtitle">
            Search by subject, code or paper type.
          </p>
        </div>

        {/* ── Search ── */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Try “DBMS pyq”, “os sem 1”, or a subject name…"
              autoComplete="off"
              className="input-field pl-10 pr-10 py-3 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden btn-ghost px-3.5 rounded-xl flex items-center gap-1.5 text-sm shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden xs:inline">Filters</span>
          </button>
        </div>

        {/* ── Quick filters ── */}
        {/* A single scrollable row on a phone. Wrapping put five chips onto
            three ragged lines, which is most of what made the header look
            cluttered on mobile. */}
        <div className="flex items-center gap-2 overflow-x-auto sm:flex-wrap no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-0.5">
          {QUICK_FILTERS.map((f) => {
            const isActive = filters[f.key as keyof ResourceFilters] === f.val;
            return (
              <button
                key={f.val}
                onClick={() => {
                  if (isActive) {
                    setFilter(f.key as keyof ResourceFilters, "");
                  } else {
                    resetFilters();
                    setFilter(f.key as keyof ResourceFilters, f.val);
                    scrollToResults();
                  }
                }}
                aria-pressed={isActive}
                className={`type-badge ${f.style} cursor-pointer shrink-0 px-3 py-1.5 transition-opacity active:scale-95 ${
                  isActive ? "ring-1 ring-current" : "opacity-65 hover:opacity-100"
                }`}
              >
                {f.label}
              </button>
            );
          })}
          {(hasActiveFilter || search) && (
            <button
              onClick={() => {
                resetFilters();
                setSearch("");
              }}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors shrink-0 ml-1 underline underline-offset-2 whitespace-nowrap"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Directory ── */}
      <div className="container-app mt-5 sm:mt-6">
        <ResourceFinder onSelect={scrollToResults} />
      </div>

      {/* ── Sidebar + grid ── */}
      <div className="container-app flex gap-6 items-start mt-5 sm:mt-6">
        <aside className="hidden lg:block w-56 shrink-0 sticky top-20 self-start">
          <div className="glass-card p-4">
            <ResourceFiltersPanel
              filters={filters}
              onChange={setFilter}
              onReset={resetFilters}
            />
          </div>
        </aside>

        <div ref={resultsRef} className="flex-1 min-w-0 scroll-mt-20">
          <ResourceGrid filters={activeFilters} />
        </div>
      </div>

      {/* ── Mobile filters drawer ── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div
            className="absolute left-0 top-0 bottom-0 w-72 glass border-r border-white/10 p-4 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Filters</h3>
              <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <ResourceFiltersPanel
              filters={filters}
              onChange={setFilter}
              onReset={() => {
                resetFilters();
                setMobileFiltersOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense
      fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            }
    >
      <ResourcesContent />
    </Suspense>
  );
}
