"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getResources } from "@/lib/firebase/firestore";
import { 
  FileText, Search, ChevronDown, Download, 
  ExternalLink, File, Loader2, BookOpen, 
  AlertCircle, Eye 
} from "lucide-react";
import Link from "next/link";
import { formatBytes } from "@/lib/utils";

// Define categories to enforce order
const CATEGORIES = [
  "Front Pages",
  "MCA Syllabus",
  "Index Page",
  "Hostel & Library Forms"
];

export default function FormsPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>("Front Pages");

  // Fetch all resources of type 'form'
  const { data, isLoading, error } = useQuery({
    queryKey: ["resources", "forms"],
    queryFn: async () => {
      // Fetch resources of type 'form'
      const result = await getResources({ type: "form" });
      return result.resources;
    },
    staleTime: 60 * 1000,
  });

  // Toggle accordion tab
  const toggleTab = (tab: string) => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  // Group forms by category (stored in subject field) and apply search filter
  const filteredForms = data?.filter((form) => {
    const matchesSearch = 
      form.title.toLowerCase().includes(search.toLowerCase()) ||
      (form.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  }) ?? [];

  // Grouped forms by category
  const groupedForms = filteredForms.reduce((acc, form) => {
    const category = form.subject || "General Forms";
    if (!acc[category]) acc[category] = [];
    acc[category].push(form);
    return acc;
  }, {} as Record<string, typeof filteredForms>);

  // Helper for direct CDN download with attachment
  const getDirectDownloadUrl = (url: string) => {
    if (!url) return url;
    if (url.includes("/upload/")) {
      return url.replace("/upload/", "/upload/fl_attachment/");
    }
    return url;
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-[#030712]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 badge badge-cyan py-1 px-3">
            <BookOpen className="w-3.5 h-3.5" />
            Forms & Syllabuses
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Academic <span className="gradient-text">Forms & Documents</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
            Download standard front pages, index pages, syllabuses, and hostel/mess outpass forms for GBPIET students.
          </p>
        </motion.div>

        {/* Search Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative max-w-md mx-auto"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search academic forms..."
            className="input-field pl-9 pr-4"
          />
        </motion.div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="h-60 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-500 animate-pulse">Loading directory...</p>
          </div>
        ) : error ? (
          <div className="glass-card p-8 text-center max-w-md mx-auto border border-red-500/20">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-white">Failed to load documents</p>
            <p className="text-xs text-slate-500 mt-1">Please check your connection and try again.</p>
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-md mx-auto border border-white/5">
            <File className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-400">No documents found matching "{search}"</p>
          </div>
        ) : (
          /* Accordion Category Container */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="space-y-3"
          >
            {CATEGORIES.map((category) => {
              const forms = groupedForms[category] || [];
              if (forms.length === 0 && search) return null; // Hide empty category on filter
              const isOpen = activeTab === category;

              return (
                <div 
                  key={category} 
                  className="rounded-xl overflow-hidden bg-white/[0.02] border border-white/5 transition-colors duration-300 hover:border-white/10"
                >
                  {/* Category Trigger Header */}
                  <button
                    onClick={() => toggleTab(category)}
                    className="w-full flex items-center justify-between p-5 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isOpen ? "bg-cyan-400/10 border border-cyan-400/20 text-cyan-400" : "bg-white/5 text-slate-500"
                      }`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-white text-sm uppercase tracking-wide">
                        {category} ({forms.length})
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-cyan-400" : ""}`}
                    />
                  </button>

                  {/* Accordion Expandable body */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden border-t border-white/[0.04]"
                      >
                        <div className="p-3 sm:p-5 bg-black/20 grid grid-cols-2 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
                          {forms.length === 0 ? (
                            <p className="text-xs text-slate-600 col-span-2 py-4 text-center">
                              No files currently available in this section.
                            </p>
                          ) : (
                            forms.map((form) => (
                              <div 
                                key={form.id} 
                                className="glass-card p-3 sm:p-4 flex flex-col justify-between hover:bg-white/[0.04] cursor-pointer transition-all duration-300 group"
                              >
                                <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 flex items-center justify-center shrink-0">
                                    <File className="w-3.5 h-3.5 sm:w-4 h-4 text-cyan-400" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs sm:text-sm font-semibold text-white leading-tight group-hover:text-cyan-400 transition-colors truncate">
                                      {form.title}
                                    </h4>
                                    <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1">
                                      {formatBytes(form.size || 0)} · Approved
                                    </p>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-1.5 sm:gap-2 mt-auto">
                                  <Link 
                                    href={`/resources/${form.id}`}
                                    className="btn-ghost flex-1 py-1.5 sm:py-2 px-1 sm:px-3 rounded-lg text-[10px] sm:text-xs flex items-center justify-center gap-1"
                                    title="Details"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Details</span>
                                  </Link>
                                  <a 
                                    href={form.fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-1.5 sm:p-2 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400/30 text-slate-400 hover:text-cyan-400 transition-all"
                                    title="Open"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                  <a 
                                    href={getDirectDownloadUrl(form.fileUrl)} 
                                    download={`${form.title.replace(/[^a-zA-Z0-9_\-]/g, "_")}.pdf`}
                                    className="p-1.5 sm:p-2 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400/30 text-slate-400 hover:text-cyan-400 transition-all"
                                    title="Download"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
