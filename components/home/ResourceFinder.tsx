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
    if (openSemester === val) {
      setOpenSemester(null);
    } else {
      setOpenSemester(val);
      setOpenSubject(null);
    }
  };

  const toggleSubject = (val: string) => {
    setOpenSubject(openSubject === val ? null : val);
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
        <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
          <Search className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-white">Resource Directory</h3>
          <p className="text-xs text-slate-400">Navigate to find exactly what you need</p>
        </div>
      </div>

      <div className="p-2 sm:p-4 space-y-2">
        {BRANCHES.filter(b => b.value === 'mca' || b.value === 'btech').map((branch) => {
          const isOpenBranch = openBranch === branch.value;
          return (
            <div key={branch.value} className="rounded-xl overflow-hidden bg-white/[0.02] border border-white/5">
              <button
                onClick={() => toggleBranch(branch.value)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Folder className={`w-5 h-5 ${isOpenBranch ? "text-cyan-400" : "text-slate-400"}`} />
                  <span className="font-semibold text-white uppercase tracking-wider text-sm">
                    {branch.label}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${isOpenBranch ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {isOpenBranch && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-2 pl-6 sm:pl-10 space-y-2 bg-black/20 border-t border-white/5">
                      {getSemesters(branch.value).map((sem) => {
                        const isOpenSem = openSemester === sem.value;
                        return (
                          <div key={sem.value} className="rounded-lg overflow-hidden border border-white/5 bg-white/[0.02]">
                            <button
                              onClick={() => toggleSemester(sem.value)}
                              className="w-full flex items-center justify-between p-3 hover:bg-white/[0.04] transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Folder className={`w-4 h-4 ${isOpenSem ? "text-blue-400" : "text-slate-500"}`} />
                                <span className="text-sm font-medium text-slate-200">{sem.label}</span>
                              </div>
                              <ChevronDown
                                className={`w-4 h-4 text-slate-500 transition-transform ${isOpenSem ? "rotate-180" : ""}`}
                              />
                            </button>

                            <AnimatePresence>
                              {isOpenSem && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: "auto" }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-2 pl-6 sm:pl-8 space-y-1 bg-black/40 border-t border-white/5">
                                    {getSubjects(branch.value, sem.value).map((sub) => {
                                      const isOpenSub = openSubject === sub;
                                      return (
                                        <div key={sub} className="rounded-md overflow-hidden">
                                          <button
                                            onClick={() => toggleSubject(sub)}
                                            className="w-full flex items-center justify-between p-2.5 hover:bg-white/[0.06] transition-colors rounded-md group"
                                          >
                                            <span className="text-sm text-slate-300 group-hover:text-white transition-colors text-left">
                                              {sub}
                                            </span>
                                            <ChevronRight
                                              className={`w-3 h-3 text-slate-600 transition-transform ${isOpenSub ? "rotate-90" : ""}`}
                                            />
                                          </button>

                                          <AnimatePresence>
                                            {isOpenSub && (
                                              <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                              >
                                                <div className="p-3 pl-4 grid grid-cols-2 sm:grid-cols-4 gap-2 border-l-2 border-cyan-500/30 ml-2 mb-2">
                                                  <Link
                                                    href={`/resources?branch=${branch.value}&semester=${sem.value}&subject=${encodeURIComponent(sub)}&type=ct`}
                                                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/5 hover:border-cyan-500/30 transition-all text-center gap-1 group"
                                                  >
                                                    <PenTool className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-semibold text-slate-300 group-hover:text-cyan-400">CT Papers</span>
                                                  </Link>
                                                  <Link
                                                    href={`/resources?branch=${branch.value}&semester=${sem.value}&subject=${encodeURIComponent(sub)}&type=pyq`}
                                                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/5 hover:border-purple-500/30 transition-all text-center gap-1 group"
                                                  >
                                                    <FileText className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-semibold text-slate-300 group-hover:text-purple-400">Final Exams</span>
                                                  </Link>
                                                  <Link
                                                    href={`/resources?branch=${branch.value}&semester=${sem.value}&subject=${encodeURIComponent(sub)}&type=notes`}
                                                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/5 hover:bg-yellow-500/20 border border-white/5 hover:border-yellow-500/30 transition-all text-center gap-1 group"
                                                  >
                                                    <FileText className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-semibold text-slate-300 group-hover:text-yellow-400">Notes</span>
                                                  </Link>
                                                  <Link
                                                    href={`/resources?branch=${branch.value}&semester=${sem.value}&subject=${encodeURIComponent(sub)}&type=study_material`}
                                                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/5 hover:border-emerald-500/30 transition-all text-center gap-1 group"
                                                  >
                                                    <Book className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-semibold text-slate-300 group-hover:text-emerald-400">Books</span>
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
