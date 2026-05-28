"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, FileText, Sparkles, Upload } from "lucide-react";
import { ResourceCard, ResourceCardSkeleton } from "@/components/resources/ResourceCard";
import { useResources } from "@/lib/hooks/useResources";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function DocumentsSection() {
  const { data, isLoading } = useResources({ type: "form" });
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  const resources = data?.pages.flatMap((p) => p.resources) || [];
  const displayResources = resources.slice(0, 6);

  return (
    <section
      className={cn(
        "py-20 relative border-y transition-colors duration-300",
        isLight
          ? "bg-slate-50 border-slate-200"
          : "bg-[#0a0f1e] border-white/5"
      )}
    >
      {/* Decorative blur */}
      <div
        className={cn(
          "absolute top-0 right-0 w-full max-w-2xl h-64 blur-[120px] rounded-full pointer-events-none",
          isLight ? "bg-blue-400/8" : "bg-cyan-500/5"
        )}
      />

      <div className="container-app relative z-10 space-y-12">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6">
          <div>
            <div className={cn("flex items-center gap-2 mb-2", isLight ? "text-blue-600" : "text-cyan-400")}>
              <FileText className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-widest">Important Forms</span>
            </div>
            <h2 className={cn("font-display text-3xl sm:text-4xl font-bold mb-4", isLight ? "text-slate-900" : "text-white")}>
              College Documents
            </h2>
            <p className={cn("max-w-xl", isLight ? "text-slate-500" : "text-slate-400")}>
              Quickly find and download essential GBPIET forms, gatepasses, syllabus, and practical front pages.
            </p>
          </div>
          <div className="flex gap-4 shrink-0">
            <Link
              href="/upload"
              className="btn-ghost flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Upload Form
            </Link>
            <Link
              href="/resources?type=form"
              className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium group"
            >
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
            {Array.from({ length: 3 }).map((_, i) => <ResourceCardSkeleton key={i} />)}
          </div>
        ) : displayResources.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
            {displayResources.map((r, i) => (
              <ResourceCard key={r.id} resource={r} index={i} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-12 text-center"
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4",
              isLight ? "bg-slate-100 border border-slate-200" : "bg-white/5 border border-white/10"
            )}>
              <Sparkles className={cn("w-6 h-6", isLight ? "text-slate-400" : "text-slate-500")} />
            </div>
            <h3 className={cn("font-semibold mb-2", isLight ? "text-slate-800" : "text-white")}>No Forms Uploaded Yet</h3>
            <p className={cn("text-sm mb-6 max-w-md mx-auto", isLight ? "text-slate-500" : "text-slate-400")}>
              Help your peers by uploading the Gatepass forms, Syllabus, or Practical front pages.
            </p>
            <Link href="/upload" className="btn-primary px-6 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload First Form
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
