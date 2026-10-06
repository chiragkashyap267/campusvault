"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Folder, Search } from "lucide-react";
import Link from "next/link";
import { BRANCHES, SEMESTERS, SUBJECTS_BY_BRANCH, SEMESTER_COUNT, BTECH_SUBJECTS } from "@/lib/constants";

interface ResourceFinderProps {
  /**
   * Called after a subject shortcut is chosen. The library page uses it to
   * scroll the results into view: on a phone the accordion filled the screen,
   * so picking a subject appeared to do nothing — the results it loaded were
   * below the fold with no indication anything had happened.
   */
  onSelect?: () => void;
}

export function ResourceFinder({ onSelect }: ResourceFinderProps = {}) {
  const [openBranch, setOpenBranch] = useState<string | null>(null);
  const [openSemester, setOpenSemester] = useState<number | string | null>(null);

  /**
   * Subjects come from the shared table rather than a copy inside this
   * component, so the curriculum can be corrected in one place.
   * B.Tech has no per-semester breakdown yet, so it falls back to its flat list.
   */
  const getSubjects = (branch: string, semester: number | string): string[] => {
    const perSemester = SUBJECTS_BY_BRANCH[branch]?.[String(semester)];
    if (perSemester) return perSemester;
    if (branch === "btech") return BTECH_SUBJECTS;
    return [];
  };

  const getSemesters = (branch: string) => {
    const count = SEMESTER_COUNT[branch] ?? 8;
    const semesters = SEMESTERS.slice(0, count);
    // MCA runs a bridge course before semester 1.
    if (branch === "mca") {
      return [{ value: "bridge" as const, label: "Bridge Course" }, ...semesters];
    }
    return semesters;
  };

  const toggleBranch = (val: string) => {
    if (openBranch === val) {
      setOpenBranch(null);
    } else {
      setOpenBranch(val);
      setOpenSemester(null);
    }
  };

  const toggleSemester = (val: number | string) => {
    setOpenSemester(openSemester === val ? null : val);
  };

  /** Collapse the whole directory once a choice is made, then hand off. */
  const handleSelect = () => {
    setOpenBranch(null);
    setOpenSemester(null);
    onSelect?.();
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 sm:px-4 py-3 border-b border-line bg-surface-2">
        <div className="w-8 h-8 rounded-lg bg-brand-soft border border-brand/30 flex items-center justify-center shrink-0">
          <Search className="w-4 h-4 text-brand" />
        </div>
        <h3 className="font-display text-sm sm:text-base font-bold text-ink leading-tight">
          Browse by subject
        </h3>
        <span className="ml-auto text-[11px] text-muted">Pick a branch</span>
      </div>

      {/* Branch list */}
      <div className="p-2.5 sm:p-3 space-y-2">
        {/* Only branches the directory can actually drill into. Listing a
            branch with no subject table gives an empty semester list. */}
        {BRANCHES.filter((b) => b.value === "mca" || b.value === "bca" || b.value === "btech").map((branch) => {
          const isOpenBranch = openBranch === branch.value;
          return (
            <div
              key={branch.value}
              className={`rounded-lg overflow-hidden border transition-colors ${
                isOpenBranch
                  ? "bg-brand-soft border-brand/30"
                  : "bg-surface-2 border-line"
              }`}
            >
              {/* Branch row — 48px min height, comfortably tappable on a phone */}
              <button
                onClick={() => toggleBranch(branch.value)}
                aria-expanded={isOpenBranch}
                className="w-full flex items-center justify-between px-3.5 py-3.5 min-h-[3rem] hover:bg-surface-2 active:bg-surface-2 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Folder className={`w-4 h-4 shrink-0 ${isOpenBranch ? "text-brand" : "text-muted"}`} />
                  <span className="font-bold text-ink uppercase tracking-wider text-sm">
                    {branch.label}
                  </span>
                </div>
                <span className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-colors ${
                  isOpenBranch ? "bg-brand-soft text-brand" : "bg-surface-2 text-muted"
                }`}>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpenBranch ? "rotate-180" : ""}`}
                  />
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpenBranch && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.18, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-2 pt-2 pb-2 space-y-1.5 border-t border-line">
                      {getSemesters(branch.value).map((sem) => {
                        const isOpenSem = openSemester === sem.value;
                        return (
                          <div key={sem.value} className="rounded-md overflow-hidden bg-surface-2 border border-line">
                            {/* Semester row */}
                            <button
                              onClick={() => toggleSemester(sem.value)}
                              aria-expanded={isOpenSem}
                              className="w-full flex items-center justify-between px-3 py-2.5 min-h-[2.5rem] hover:bg-surface-2 active:bg-surface-2 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Folder className={`w-3.5 h-3.5 shrink-0 ${isOpenSem ? "text-brand" : "text-muted"}`} />
                                <span className={`text-[13px] font-medium ${isOpenSem ? "text-ink" : "text-ink-soft"}`}>{sem.label}</span>
                              </div>
                              <ChevronDown
                                className={`w-3.5 h-3.5 text-muted transition-transform duration-200 shrink-0 ${isOpenSem ? "rotate-180" : ""}`}
                              />
                            </button>

                            <AnimatePresence initial={false}>
                              {isOpenSem && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: "auto" }}
                                  exit={{ height: 0 }}
                                  transition={{ duration: 0.15, ease: "easeInOut" }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-2 pt-1.5 pb-2 border-t border-line space-y-1">
                                    {getSubjects(branch.value, sem.value).map((sub) => (
                                      <Link
                                        key={sub}
                                        href={`/resources?branch=${branch.value}&semester=${sem.value}&subject=${encodeURIComponent(sub)}`}
                                        onClick={handleSelect}
                                        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-surface-2 transition-colors rounded-md group"
                                      >
                                        <span className="text-xs text-muted group-hover:text-ink transition-colors text-left leading-snug">
                                          {sub}
                                        </span>
                                        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0 ml-2" />
                                      </Link>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
