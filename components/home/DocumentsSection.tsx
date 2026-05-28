"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, FileText, Sparkles, Upload } from "lucide-react";
import { ResourceCard, ResourceCardSkeleton } from "@/components/resources/ResourceCard";
import { useResources } from "@/lib/hooks/useResources";

export function DocumentsSection() {
  const { data, isLoading } = useResources({ type: "form" });
  const resources = data?.pages.flatMap((p) => p.resources) || [];
  const displayResources = resources.slice(0, 6);

  return (
    <section className="py-20 bg-[#0a0f1e] relative border-y border-white/5">
      <div className="absolute top-0 right-0 w-full max-w-2xl h-64 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container-app relative z-10 space-y-12">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-widest">Important Forms</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              College Documents
            </h2>
            <p className="text-slate-400 max-w-xl">
              Quickly find and download essential GBPIET forms, gatepasses, syllabus, and practical front pages.
            </p>
          </div>
          <div className="flex gap-4 shrink-0">
            <Link href="/upload" className="btn-ghost flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium">
              <Upload className="w-4 h-4" />
              Upload Form
            </Link>
            <Link href="/resources?type=form" className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium group">
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {Array.from({ length: 3 }).map((_, i) => <ResourceCardSkeleton key={i} />)}
          </div>
        ) : displayResources.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {displayResources.map((r, i) => (
              <ResourceCard key={r.id} resource={r} index={i} />
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-slate-500" />
            </div>
            <h3 className="text-white font-semibold mb-2">No Forms Uploaded Yet</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
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
