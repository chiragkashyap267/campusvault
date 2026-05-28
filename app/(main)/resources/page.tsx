"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { ResourceFiltersPanel } from "@/components/resources/ResourceFilters";
import { useUIStore } from "@/lib/store/uiStore";
import { ResourceFilters } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";

function ResourcesContent() {
  const { filters, setFilter, resetFilters } = useUIStore();
  const { user } = useAuthStore();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const newsletterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync URL search params on load
  useEffect(() => {
    const q = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const branch = searchParams.get("branch") || "";
    const semester = searchParams.get("semester") || "";
    const subject = searchParams.get("subject") || "";
    const sortBy = searchParams.get("sortBy") || "recent";
    
    if (q) setSearch(q);
    if (type) setFilter("type", type);
    if (branch) setFilter("branch", branch);
    if (semester) setFilter("semester", Number(semester));
    if (subject) setFilter("subject", subject);
    
    setFilter("sortBy", sortBy);
  }, []);

  // Smart newsletter — fire after user searches (debounced, fire-and-forget)
  useEffect(() => {
    if (!user?.email || search.trim().length < 3) return;

    // Clear any pending timer
    if (newsletterTimerRef.current) clearTimeout(newsletterTimerRef.current);

    // Debounce 800ms so we only fire when user stops typing
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
      }).catch(() => { /* silently ignore */ });
    }, 800);

    return () => {
      if (newsletterTimerRef.current) clearTimeout(newsletterTimerRef.current);
    };
  }, [search, user]);

  const activeFilters: ResourceFilters = {
    ...filters,
    search,
  };

  return (
    <div className="min-h-screen bg-[#030712] pt-4 pb-16">
      {/* Page header */}
      <div className="container-app mb-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">
            Resource Library
          </h1>
          <p className="text-slate-400 text-sm">
            Browse study materials, PYQs, notes and more for GBPIET students.
          </p>
        </motion.div>

        {/* Search bar */}
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, subject, or keyword..."
              className="input-field pl-9 pr-4"
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
          {/* Mobile filter toggle */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden btn-ghost px-3 py-2 rounded-xl flex items-center gap-2 text-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>
        
        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => { resetFilters(); setFilter("branch", "mca"); }} className="badge badge-purple text-xs cursor-pointer hover:bg-purple-500/20 transition-colors">MCA</button>
          <button onClick={() => { resetFilters(); setFilter("branch", "btech"); }} className="badge badge-cyan text-xs cursor-pointer hover:bg-cyan-500/20 transition-colors">B.Tech</button>
          <button onClick={() => { resetFilters(); setFilter("type", "pyq"); }} className="badge badge-green text-xs cursor-pointer hover:bg-green-500/20 transition-colors">PYQ Papers</button>
          <button onClick={() => { resetFilters(); setFilter("type", "ct"); }} className="badge badge-blue text-xs cursor-pointer hover:bg-blue-500/20 transition-colors">CT Papers</button>
        </div>
      </div>

      <div className="container-app flex gap-6">
        {/* Sidebar filters — desktop */}
        <aside className="hidden lg:block w-56 shrink-0 sticky top-20 self-start">
          <div className="glass-card p-4">
            <ResourceFiltersPanel
              filters={filters}
              onChange={setFilter}
              onReset={resetFilters}
            />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <ResourceGrid filters={activeFilters} />
        </div>
      </div>

      {/* Mobile Filters Drawer */}
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>}>
      <ResourcesContent />
    </Suspense>
  );
}
