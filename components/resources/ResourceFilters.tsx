"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { BRANCHES, SEMESTERS, SORT_OPTIONS } from "@/lib/constants";
import { ResourceFilters } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ResourceFiltersProps {
  filters: ResourceFilters;
  onChange: (key: keyof ResourceFilters, value: string | number) => void;
  onReset: () => void;
}

export function ResourceFiltersPanel({ filters, onChange, onReset }: ResourceFiltersProps) {
  const activeCount = [filters.branch, filters.semester]
    .filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Filter className="w-4 h-4 text-brand" />
          Filters
          {activeCount > 0 && (
            <span className="badge badge-cyan text-[10px]">{activeCount}</span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="text-xs text-muted hover:text-red-400 flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Sort */}
      <FilterGroup label="Sort By">
        <div className="space-y-1">
          {SORT_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              active={filters.sortBy === opt.value}
              onClick={() => onChange("sortBy", opt.value)}
            />
          ))}
        </div>
      </FilterGroup>

      {/* Branch */}
      <FilterGroup label="Branch">
        <div className="space-y-1">
          {BRANCHES.map((b) => (
            <FilterChip
              key={b.value}
              label={b.label}
              active={filters.branch === b.value}
              onClick={() => onChange("branch", filters.branch === b.value ? "" : b.value)}
            />
          ))}
        </div>
      </FilterGroup>

      {/* Semester */}
      <FilterGroup label="Semester">
        <div className="grid grid-cols-4 gap-1">
          {SEMESTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => onChange("semester", filters.semester === s.value ? "" : s.value)}
              className={cn(
                "py-1.5 rounded-lg text-xs font-medium transition-all",
                filters.semester === s.value
                  ? "bg-brand-soft text-brand border border-brand/30"
                  : "bg-surface-2 text-muted hover:bg-surface-2"
              )}
            >
              {s.value}
            </button>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-xs font-medium text-muted uppercase tracking-wider mb-2 hover:text-ink-soft transition-colors"
      >
        {label}
        <ChevronDown className={cn("w-3 h-3 transition-transform", !open && "-rotate-90")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all",
        active
          ? "bg-brand-soft text-brand border border-brand/30"
          : "text-muted hover:text-ink hover:bg-surface-2"
      )}
    >
      {label}
    </button>
  );
}
