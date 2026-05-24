"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, TrendingUp, Download, Upload, Users, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "@/lib/firebase/firestore";
import { cn } from "@/lib/utils";
import Image from "next/image";

const RANK_STYLES = [
  { bg: "from-yellow-400/20 to-amber-500/10", border: "border-yellow-400/40", text: "text-yellow-400", icon: "🥇", glow: "shadow-[0_0_20px_rgba(251,191,36,0.3)]" },
  { bg: "from-slate-300/15 to-slate-400/10", border: "border-slate-300/30", text: "text-slate-300", icon: "🥈", glow: "shadow-[0_0_20px_rgba(148,163,184,0.2)]" },
  { bg: "from-orange-400/20 to-amber-600/10", border: "border-orange-400/40", text: "text-orange-400", icon: "🥉", glow: "shadow-[0_0_20px_rgba(251,146,60,0.2)]" },
];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<"all" | "month">("all");

  const { data: leaders = [], isLoading } = useQuery({
    queryKey: ["leaderboard", tab],
    queryFn: () => getLeaderboard(20),
    staleTime: 5 * 60 * 1000,
  });

  const topThree = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="inline-flex items-center gap-2 badge badge-cyan mb-4">
            <Trophy className="w-3.5 h-3.5" />
            Hall of Fame
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
            Top <span className="gradient-text">Contributors</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Students who shared the most resources and helped their peers succeed. Be the next one!
          </p>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex justify-center">
          <div className="glass-card p-1 rounded-xl flex gap-1 w-fit">
            {(["all", "month"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                  tab === t ? "bg-cyan-400/15 text-cyan-400" : "text-slate-400 hover:text-white"
                )}
              >
                {t === "all" ? "All Time" : "This Month"}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-card p-4 flex items-center gap-4">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-40 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
                <div className="skeleton h-6 w-16 rounded" />
              </div>
            ))}
          </div>
        ) : leaders.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-16 text-center">
            <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No contributors yet.</p>
            <p className="text-slate-600 text-sm mt-1">Be the first to upload resources!</p>
          </motion.div>
        ) : (
          <>
            {/* Top 3 podium */}
            {topThree.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-3 gap-3 items-end"
              >
                {/* 2nd place */}
                <LeaderPodiumCard rank={2} user={topThree[1]} style={RANK_STYLES[1]} />
                {/* 1st place */}
                <LeaderPodiumCard rank={1} user={topThree[0]} style={RANK_STYLES[0]} isFirst />
                {/* 3rd place */}
                <LeaderPodiumCard rank={3} user={topThree[2]} style={RANK_STYLES[2]} />
              </motion.div>
            )}

            {/* Full list */}
            <div className="space-y-2">
              {leaders.map((leader, i) => (
                <motion.div
                  key={leader.uid}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    "glass-card p-4 flex items-center gap-4",
                    i < 3 && "border border-white/10"
                  )}
                >
                  {/* Rank */}
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center font-display font-bold text-sm shrink-0",
                    i === 0 ? "bg-yellow-400/20 text-yellow-400" :
                    i === 1 ? "bg-slate-300/15 text-slate-300" :
                    i === 2 ? "bg-orange-400/20 text-orange-400" :
                    "bg-white/5 text-slate-500"
                  )}>
                    {i < 3 ? RANK_STYLES[i].icon : i + 1}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-black font-bold text-sm">
                    {leader.photoURL
                      ? <Image src={leader.photoURL} alt="" width={40} height={40} className="object-cover w-full h-full" />
                      : (leader.displayName?.[0] || "?").toUpperCase()
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {leader.displayName || "Anonymous Student"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{leader.email}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Upload className="w-3 h-3" /> Uploads
                      </p>
                      <p className="text-sm font-bold text-cyan-400">{leader.uploadCount ?? 0}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Download className="w-3 h-3" /> Downloads
                      </p>
                      <p className="text-sm font-bold text-blue-400">{leader.totalDownloads ?? 0}</p>
                    </div>
                    <div className="sm:hidden">
                      <span className="badge badge-cyan text-xs">{leader.uploadCount ?? 0} uploads</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-6 text-center border border-cyan-400/10"
            >
              <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="font-display text-lg font-bold text-white mb-1">Want to be on the leaderboard?</h3>
              <p className="text-slate-400 text-sm mb-4">Upload your notes, PYQs, and study material to earn your spot!</p>
              <a href="/upload" className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Start Uploading
              </a>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

function LeaderPodiumCard({
  rank, user, style, isFirst = false
}: {
  rank: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  style: typeof RANK_STYLES[number];
  isFirst?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        `bg-gradient-to-b ${style.bg} border ${style.border} rounded-2xl p-4 text-center transition-all`,
        style.glow,
        isFirst ? "pt-8 pb-5" : "pt-5 pb-4"
      )}
    >
      {isFirst && <Crown className="w-5 h-5 text-yellow-400 mx-auto mb-2" />}
      <div className={cn(
        "mx-auto rounded-full overflow-hidden bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-black font-bold mb-2",
        isFirst ? "w-14 h-14 text-lg" : "w-11 h-11 text-sm"
      )}>
        {user?.photoURL
          ? <Image src={user.photoURL} alt="" width={56} height={56} className="object-cover w-full h-full" />
          : (user?.displayName?.[0] || "?").toUpperCase()
        }
      </div>
      <span className="text-xl mb-1 block">{style.icon}</span>
      <p className="text-xs font-semibold text-white truncate mb-1">{user?.displayName || "Student"}</p>
      <p className={cn("text-sm font-bold", style.text)}>{user?.uploadCount ?? 0}</p>
      <p className="text-[10px] text-slate-500">uploads</p>
    </motion.div>
  );
}
