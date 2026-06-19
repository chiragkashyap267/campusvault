"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { ResourceFiltersPanel } from "@/components/resources/ResourceFilters";
import { ResourceFinder } from "@/components/home/ResourceFinder";
import { useUIStore } from "@/lib/store/uiStore";
import { ResourceFilters } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";

function ResourcesContent() {
  const { filters, setFilter, resetFilters } = useUIStore();
  const { user } = useAuthStore();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const newsletterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    }, 800);
    return () => {
      if (newsletterTimerRef.current) clearTimeout(newsletterTimerRef.current);
    };
  }, [search, user]);

  const activeFilters: ResourceFilters = { ...filters, search };

  return (
    <div className="min-h-screen bg-[#030712] pb-16">
      {/* ── Top section: title + search + quick filters ── */}
      <div className="container-app pt-4 sm:pt-6 pb-3">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3"
        >
          <h1 className="font-display text-xl sm:text-3xl font-bold text-white leading-tight">
            Resource Library
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Browse study materials, PYQs, notes and more for GBPIET students.
          </p>
        </motion.div>

        {/* Search + Mobile Filters toggle */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, subject, or keyword..."
              className="input-field pl-9 pr-9 py-2.5 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden btn-ghost px-3 py-2 rounded-xl flex items-center gap-1.5 text-sm shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden xs:inline">Filters</span>
          </button>
        </div>

        {/* Quick filter badges */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "MCA", style: "badge-purple", key: "branch", val: "mca" },
            { label: "B.Tech", style: "badge-cyan", key: "branch", val: "btech" },
            { label: "PYQ Papers", style: "badge-green", key: "type", val: "pyq" },
            { label: "CT Papers", style: "badge-blue", key: "type", val: "ct" },
          ].map((f) => (
            <button
              key={f.val}
              onClick={() => {
                resetFilters();
                setFilter(f.key as keyof ResourceFilters, f.val);
              }}
              className={`badge ${f.style} text-xs cursor-pointer transition-all hover:scale-105 active:scale-95`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Resource Directory Accordion ── */}
      <div className="container-app pb-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <ResourceFinder />
        </motion.div>
      </div>

      {/* ── Main layout: sidebar + grid ── */}
      <div className="container-app flex gap-4 lg:gap-6 items-start">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-52 xl:w-56 shrink-0 sticky top-20 self-start">
          <div className="glass-card p-4">
            <ResourceFiltersPanel
              filters={filters}
              onChange={setFilter}
              onReset={resetFilters}
            />
          </div>
        </aside>

        {/* Resource grid */}
        <div className="flex-1 min-w-0">
          <ResourceGrid filters={activeFilters} />
        </div>
      </div>

      {/* ── Mobile Filters Drawer ── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute left-0 top-0 bottom-0 w-72 glass border-r border-white/10 p-4 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Filters</h3>
              <button onClick={() => setMobileFiltersOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <ResourceFiltersPanel
              filters={filters}
              onChange={(k, v) => { setFilter(k, v); }}
              onReset={() => { resetFilters(); setMobileFiltersOpen(false); }}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResourcesContent />
    </Suspense>
  );
}
