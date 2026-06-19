"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Folder, FileText, Book, PenTool, Search } from "lucide-react";
import Link from "next/link";
import { BRANCHES, SEMESTERS, MCA_SUBJECTS, BTECH_SUBJECTS } from "@/lib/constants";

export function ResourceFinder() {
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

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
        </div>
        <div>
          <h3 className="font-display text-sm sm:text-base font-bold text-white leading-tight">
            Resource Directory
          </h3>
          <p className="text-[10px] text-slate-500 leading-none mt-0.5">
            Browse by branch → semester → subject
          </p>
        </div>
      </div>

      {/* Branch list */}
      <div className="p-1.5 sm:p-2 space-y-1">
        {BRANCHES.filter(b => b.value === 'mca' || b.value === 'btech').map((branch) => {
          const isOpenBranch = openBranch === branch.value;
          return (
            <div key={branch.value} className="rounded-lg overflow-hidden bg-white/[0.02] border border-white/[0.06]">
              {/* Branch row */}
              <button
                onClick={() => toggleBranch(branch.value)}
                className="w-full flex items-center justify-between px-3 py-2.5 sm:py-3 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Folder className={`w-4 h-4 shrink-0 ${isOpenBranch ? "text-cyan-400" : "text-slate-400"}`} />
                  <span className="font-semibold text-white uppercase tracking-wider text-xs sm:text-sm">
                    {branch.label}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpenBranch ? "rotate-180" : ""}`}
                />
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
                              className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/[0.04] transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Folder className={`w-3.5 h-3.5 shrink-0 ${isOpenSem ? "text-blue-400" : "text-slate-500"}`} />
                                <span className="text-xs font-medium text-slate-300">{sem.label}</span>
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
                                                  <Link
                                                    href={`/resources?branch=${branch.value}&semester=${sem.value}&subject=${encodeURIComponent(sub)}&type=ct`}
                                                    className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/5 hover:border-cyan-500/30 transition-all text-center gap-1 group"
                                                  >
                                                    <PenTool className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[9px] sm:text-[10px] font-semibold text-slate-300 group-hover:text-cyan-400">CT Papers</span>
                                                  </Link>
                                                  <Link
                                                    href={`/resources?branch=${branch.value}&semester=${sem.value}&subject=${encodeURIComponent(sub)}&type=pyq`}
                                                    className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/5 hover:border-purple-500/30 transition-all text-center gap-1 group"
                                                  >
                                                    <FileText className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[9px] sm:text-[10px] font-semibold text-slate-300 group-hover:text-purple-400">Final Exams</span>
                                                  </Link>
                                                  <Link
                                                    href={`/resources?branch=${branch.value}&semester=${sem.value}&subject=${encodeURIComponent(sub)}&type=notes`}
                                                    className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg bg-white/5 hover:bg-yellow-500/20 border border-white/5 hover:border-yellow-500/30 transition-all text-center gap-1 group"
                                                  >
                                                    <FileText className="w-3.5 h-3.5 text-yellow-400 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[9px] sm:text-[10px] font-semibold text-slate-300 group-hover:text-yellow-400">Notes</span>
                                                  </Link>
                                                  <Link
                                                    href={`/resources?branch=${branch.value}&semester=${sem.value}&subject=${encodeURIComponent(sub)}&type=study_material`}
                                                    className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/5 hover:border-emerald-500/30 transition-all text-center gap-1 group"
                                                  >
                                                    <Book className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[9px] sm:text-[10px] font-semibold text-slate-300 group-hover:text-emerald-400">Books</span>
                                                  </Link>
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
