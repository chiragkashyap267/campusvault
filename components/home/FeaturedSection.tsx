"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp, Sparkles, Trophy, Crown } from "lucide-react";
import { ResourceCard, ResourceCardSkeleton } from "@/components/resources/ResourceCard";
import { useTrendingResources } from "@/lib/hooks/useResources";
import { ResourceFinder } from "./ResourceFinder";

export function FeaturedSection() {
  const { data: trending, isLoading: loadingTrending } = useTrendingResources(3);

  return (
    <section className="section bg-radial-blue relative">
      <div className="container-app space-y-20">

        {/* Trending */}
        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-brand mb-1.5">
                <TrendingUp className="w-4 h-4" />
                {/* Not "this week". `downloads` is a running counter with no
                    per-download timestamp, so there is nothing to window by —
                    the label was claiming a recency the data cannot support. */}
                <span className="text-xs font-semibold uppercase tracking-widest">Most Downloaded</span>
              </div>
              <h2 className="section-title">Trending Resources</h2>
            </div>
            <Link href="/resources?sortBy=downloads" className="flex items-center gap-1 text-sm text-muted hover:text-brand transition-colors group">
              View all <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          {loadingTrending ? (
            <div className="resource-grid">
              {Array.from({ length: 3 }).map((_, i) => <ResourceCardSkeleton key={i} />)}
            </div>
          ) : trending && trending.length > 0 ? (
            <div className="resource-grid">
              {trending.map((r) => <ResourceCard key={r.id} resource={r} />)}
            </div>
          ) : (
            /* Reached only when nothing has been downloaded at all — which is
               not the same as nothing being uploaded, so this no longer asks
               for uploads the library already has. */
            <div className="glass-card p-12 text-center">
              <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-muted text-sm">
                Nothing has been downloaded yet. The papers students open most will show up here.
              </p>
              <Link href="/resources" className="inline-flex items-center gap-1.5 mt-4 text-brand text-sm hover:text-brand transition-colors font-medium">
                Browse the library <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Resource Finder */}
        <ResourceFinder />

        {/* Dual CTA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="glass-card p-8 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-soft via-transparent to-brand-soft opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-brand-soft border border-brand/30 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-brand" />
              </div>
              <h3 className="font-display text-xl font-bold text-ink mb-2">Share Your Materials</h3>
              <p className="text-muted text-sm mb-5 leading-relaxed">
                Upload notes, PYQs, and study materials to help your batchmates and earn a spot on the leaderboard!
              </p>
              <Link href="/upload" className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
                Start Uploading <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <div
            className="glass-card p-8 text-center relative overflow-hidden group border border-yellow-400/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="font-display text-xl font-bold text-ink mb-2">Leaderboard</h3>
              <p className="text-muted text-sm mb-5 leading-relaxed">
                See who are the top contributors. Climb the ranks and get recognized by your peers!
              </p>
              <Link href="/leaderboard" className="btn-ghost px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
