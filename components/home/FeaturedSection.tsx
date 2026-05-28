"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, TrendingUp, Sparkles, Trophy, Crown } from "lucide-react";
import { ResourceCard, ResourceCardSkeleton } from "@/components/resources/ResourceCard";
import { useTrendingResources } from "@/lib/hooks/useResources";
import { ResourceFinder } from "./ResourceFinder";

export function FeaturedSection() {
  const { data: trending, isLoading: loadingTrending } = useTrendingResources(3);

  return (
    <section className="py-20 bg-radial-blue relative">
      <div className="container-app space-y-20">

        {/* Trending */}
        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 mb-1.5">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-widest">Most Downloaded This Week</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">Trending Resources</h2>
            </div>
            <Link href="/resources?sortBy=downloads" className="flex items-center gap-1 text-sm text-slate-400 hover:text-cyan-400 transition-colors group">
              View all <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          {loadingTrending ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Array.from({ length: 3 }).map((_, i) => <ResourceCardSkeleton key={i} />)}
            </div>
          ) : trending && trending.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {trending.map((r, i) => <ResourceCard key={r.id} resource={r} index={i} />)}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-12 text-center">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No trending resources yet. Be the first to upload!</p>
              <Link href="/upload" className="inline-flex items-center gap-1.5 mt-4 text-cyan-400 text-sm hover:text-cyan-300 transition-colors font-medium">
                Upload now <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          )}
        </div>

        {/* Resource Finder */}
        <ResourceFinder />

        {/* Dual CTA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -3 }}
            className="glass-card p-8 text-center relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">Share Your Materials</h3>
              <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                Upload notes, PYQs, and study materials to help your batchmates and earn a spot on the leaderboard!
              </p>
              <Link href="/upload" className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
                Start Uploading <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} viewport={{ once: true }} whileHover={{ y: -3 }}
            className="glass-card p-8 text-center relative overflow-hidden group border border-yellow-400/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">Leaderboard</h3>
              <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                See who are the top contributors. Climb the ranks and get recognized by your peers!
              </p>
              <Link href="/leaderboard" className="btn-ghost px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                View Leaderboard
              </Link>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
