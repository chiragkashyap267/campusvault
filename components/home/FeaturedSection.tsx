"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, TrendingUp, Clock, Sparkles, Trophy, Crown } from "lucide-react";
import { ResourceCard, ResourceCardSkeleton } from "@/components/resources/ResourceCard";
import { useTrendingResources } from "@/lib/hooks/useResources";
import { ResourceFinder } from "./ResourceFinder";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function FeaturedSection() {
  const { data: trending, isLoading: loadingTrending } = useTrendingResources(3);
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  return (
    <section className={cn("py-20 relative transition-colors duration-300", isLight ? "bg-slate-50" : "bg-radial-blue")}>
      <div className="container-app space-y-20">

        {/* Trending */}
        <div>
          <SectionHeader
            icon={<TrendingUp className="w-4 h-4" />}
            title="Trending Resources"
            subtitle="Most Downloaded This Week"
            href="/resources?sortBy=downloads"
            isLight={isLight}
          />
          {loadingTrending ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {Array.from({ length: 3 }).map((_, i) => <ResourceCardSkeleton key={i} />)}
            </div>
          ) : trending && trending.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {trending.map((r, i) => <ResourceCard key={r.id} resource={r} index={i} />)}
            </div>
          ) : (
            <EmptySection message="No trending resources yet. Be the first to upload!" isLight={isLight} />
          )}
        </div>

        {/* Resource Finder */}
        <div>
          <ResourceFinder />
        </div>

        {/* Dual CTA row: Upload + Leaderboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Upload CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -3 }}
            className={cn(
              "p-8 text-center relative overflow-hidden group rounded-xl border transition-all",
              isLight ? "bg-white border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md" : "glass-card"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 border", isLight ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-cyan-400/10 border-cyan-400/20 text-cyan-400")}>
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className={cn("font-display text-xl font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>
                Share Your Materials
              </h3>
              <p className={cn("text-sm mb-5 leading-relaxed", isLight ? "text-slate-500" : "text-slate-400")}>
                Upload notes, PYQs, and study materials to help your batchmates and earn a spot on the leaderboard!
              </p>
              <Link href="/upload" className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
                Start Uploading
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Leaderboard CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -3 }}
            className={cn(
              "p-8 text-center relative overflow-hidden group rounded-xl border transition-all",
              isLight ? "bg-white border-slate-200 shadow-sm hover:border-yellow-300 hover:shadow-md" : "glass-card border-yellow-400/10"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 border", isLight ? "bg-yellow-50 border-yellow-200 text-yellow-600" : "bg-yellow-400/10 border-yellow-400/20 text-yellow-400")}>
                <Crown className="w-6 h-6" />
              </div>
              <h3 className={cn("font-display text-xl font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>
                Leaderboard
              </h3>
              <p className={cn("text-sm mb-5 leading-relaxed", isLight ? "text-slate-500" : "text-slate-400")}>
                See who are the top contributors. Climb the ranks and get recognized by your peers!
              </p>
              <Link href="/leaderboard" className="btn-ghost px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
                <Trophy className={cn("w-4 h-4", isLight ? "text-yellow-500" : "text-yellow-400")} />
                View Leaderboard
              </Link>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

function SectionHeader({
  icon, title, subtitle, href, isLight = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
  isLight?: boolean;
}) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <div className={cn("flex items-center gap-2 mb-1.5", isLight ? "text-blue-600" : "text-cyan-400")}>
          {icon}
          <span className="text-xs font-semibold uppercase tracking-widest">{subtitle}</span>
        </div>
        <h2 className={cn("font-display text-xl sm:text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{title}</h2>
      </div>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-1 text-sm transition-colors group",
          isLight ? "text-slate-500 hover:text-blue-600" : "text-slate-400 hover:text-cyan-400"
        )}
      >
        View all
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}

function EmptySection({ message, isLight = false }: { message: string; isLight?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "p-12 text-center rounded-xl border",
        isLight ? "bg-white border-slate-200 shadow-sm" : "glass-card"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4",
        isLight ? "bg-slate-100" : "bg-white/5"
      )}>
        <Sparkles className={cn("w-6 h-6", isLight ? "text-slate-400" : "text-slate-600")} />
      </div>
      <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-500")}>{message}</p>
      <Link href="/upload" className={cn(
        "inline-flex items-center gap-1.5 mt-4 text-sm hover:opacity-80 transition-colors font-medium",
        isLight ? "text-blue-600" : "text-cyan-400"
      )}>
        Upload now <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </motion.div>
  );
}
