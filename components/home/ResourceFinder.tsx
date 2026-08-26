"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Folder, FileText, Book, PenTool, Search } from "lucide-react";
import Link from "next/link";
import { BRANCHES, SEMESTERS, MCA_SUBJECTS, BTECH_SUBJECTS } from "@/lib/constants";

/**
 * The four things you can open for a subject.
 *
 * Accents come from the shared type classes, so a "Final Exams" tile here, the
 * PYQ chip on the library page and the PYQ badge on a card are all the same
 * colour. The four blocks this replaces were near-identical markup with the
 * colours written out by hand each time.
 */
const SUBJECT_LINKS = [
  { type: "ct", label: "CT Papers", icon: PenTool, accent: "type-ct" },
  { type: "pyq", label: "Final Exams", icon: FileText, accent: "type-pyq" },
  { type: "notes", label: "Notes", icon: FileText, accent: "type-notes" },
  { type: "study_material", label: "Books", icon: Book, accent: "type-book" },
] as const;

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
  const [openSubject, setOpenSubject] = useState<string | null>(null);

  const getSubjects = (branch: string, semester: number | string) => {
    if (branch === "mca") {
      switch (semester) {
        case "bridge":
          return [
            "Introduction of Information Technology",
            "Programming Fundamentals With C",
            "Fundamental of Web Technology",
          ];
        case 1:
          return [
            "Discrete Structures",
            "Data base management system",
            "Operating System",
            "Computer Organization",
            "Technical Communication Skills",
            "Python Programming",
          ];
        case 2:
          return [
            "Computer based numerical and statistical techniques",
            "Data Structures and analysis of algorithm",
            "Object oriented programming with Java",
            "Computer networks",
            "Artificial intelligence",
            "Accounting and Financial Management",
          ];
        case 3:
          return [
            "Big Data analytics",
            "Cloud Computing",
            "Compiler Design",
            "Entrepreneurship",
            "Graph Theory",
            "Internet of Things",
            "Multimedia",
            "Principal of Management",
            "Soft Computing",
            "Software Engineering",
            "Startup",
            "Universal Human Values",
          ];
        case 4:
          return [
            "Data Science",
            "Digital Marketing",
            "Network Security",
            "Software Testing & Quality Assurance",
          ];
        default:
          return MCA_SUBJECTS;
      }
    }
    if (branch === "btech") return BTECH_SUBJECTS;
    return [];
  };

  const getSemesters = (branch: string) => {
    if (branch === "mca") {
      return [
        { value: "bridge", label: "Bridge Course" },
        ...SEMESTERS.slice(0, 4)
      ];
    }
    return SEMESTERS;
  };

  const toggleBranch = (val: string) => {
    if (openBranch === val) {
      setOpenBranch(null);
    } else {
      setOpenBranch(val);
      setOpenSemester(null);
      setOpenSubject(null);
    }
  };

  const toggleSemester = (val: number | string) => {
    setOpenSemester(openSemester === val ? null : val);
    setOpenSubject(null);
  };

  const toggleSubject = (val: string) => {
    setOpenSubject(openSubject === val ? null : val);
  };

  /** Collapse the whole directory once a choice is made, then hand off. */
  const handleSelect = () => {
    setOpenBranch(null);
    setOpenSemester(null);
    setOpenSubject(null);
    onSelect?.();
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 sm:px-4 py-3 border-b border-white/[0.07] bg-white/[0.03]">
        <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
          <Search className="w-4 h-4 text-cyan-400" />
        </div>
        <h3 className="font-display text-sm sm:text-base font-bold text-white leading-tight">
          Browse by subject
        </h3>
        <span className="ml-auto text-[11px] text-slate-500">Pick a branch</span>
      </div>

      {/* Branch list */}
      <div className="p-1.5 sm:p-2 space-y-1">
        {BRANCHES.filter(b => b.value === 'mca' || b.value === 'btech').map((branch) => {
          const isOpenBranch = openBranch === branch.value;
          return (
            <div
              key={branch.value}
              className={`rounded-lg overflow-hidden border transition-colors ${
                isOpenBranch
                  ? "bg-cyan-400/[0.06] border-cyan-400/25"
                  : "bg-white/[0.025] border-white/[0.08]"
              }`}
            >
              {/* Branch row — 48px min height, comfortably tappable on a phone */}
              <button
                onClick={() => toggleBranch(branch.value)}
                aria-expanded={isOpenBranch}
                className="w-full flex items-center justify-between px-3.5 py-3.5 min-h-[3rem] hover:bg-white/[0.05] active:bg-white/[0.07] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Folder className={`w-4 h-4 shrink-0 ${isOpenBranch ? "text-cyan-400" : "text-slate-400"}`} />
                  <span className="font-bold text-white uppercase tracking-wider text-sm">
                    {branch.label}
                  </span>
                </div>
                <span className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-colors ${
                  isOpenBranch ? "bg-cyan-400/20 text-cyan-300" : "bg-white/[0.06] text-slate-400"
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
                    <div className="px-1.5 pb-1.5 space-y-1 border-t border-white/[0.05]">
                      {getSemesters(branch.value).map((sem) => {
                        const isOpenSem = openSemester === sem.value;
                        return (
                          <div key={sem.value} className="rounded-md overflow-hidden bg-white/[0.02] border border-white/[0.04]">
                            {/* Semester row */}
                            <button
                              onClick={() => toggleSemester(sem.value)}
                              aria-expanded={isOpenSem}
                              className="w-full flex items-center justify-between px-3 py-2.5 min-h-[2.5rem] hover:bg-white/[0.05] active:bg-white/[0.07] transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Folder className={`w-3.5 h-3.5 shrink-0 ${isOpenSem ? "text-cyan-400" : "text-slate-500"}`} />
                                <span className={`text-[13px] font-medium ${isOpenSem ? "text-white" : "text-slate-300"}`}>{sem.label}</span>
                              </div>
                              <ChevronDown
                                className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 shrink-0 ${isOpenSem ? "rotate-180" : ""}`}
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
                                  <div className="px-1.5 pb-1.5 border-t border-white/[0.04] space-y-0.5">
                                    {getSubjects(branch.value, sem.value).map((sub) => {
                                      const isOpenSub = openSubject === sub;
                                      return (
                                        <div key={sub}>
                                          {/* Subject row */}
                                          <button
                                            onClick={() => toggleSubject(sub)}
                                            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-white/[0.05] transition-colors rounded-md group"
                                          >
                                            <span className="text-xs text-slate-400 group-hover:text-white transition-colors text-left leading-snug">
                                              {sub}
                                            </span>
                                            <ChevronRight
                                              className={`w-3 h-3 text-slate-600 transition-transform duration-150 shrink-0 ml-2 ${isOpenSub ? "rotate-90" : ""}`}
                                            />
                                          </button>

                                          <AnimatePresence initial={false}>
                                            {isOpenSub && (
                                              <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.15 }}
                                                className="overflow-hidden"
                                              >
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 px-2 pt-1 pb-2">
                                                  {SUBJECT_LINKS.map((link) => (
                                                    <Link
                                                      key={link.type}
                                                      href={`/resources?branch=${branch.value}&semester=${sem.value}&subject=${encodeURIComponent(sub)}&type=${link.type}`}
                                                      onClick={handleSelect}
                                                      className={`type-tile ${link.accent}`}
                                                    >
                                                      <link.icon className="w-3.5 h-3.5" />
                                                      <span>{link.label}</span>
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
