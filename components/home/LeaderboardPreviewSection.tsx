"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, Crown, ArrowRight, Upload, Flame } from "lucide-react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "@/lib/firebase/firestore";

const PODIUM_CONFIG = [
  { rank: 2, offset: "mt-6",  barH: "h-20", emoji: "🥈", glow: "shadow-[0_0_30px_rgba(148,163,184,0.2)]",  ring: "ring-slate-400/40", bg: "from-slate-400/20 to-slate-500/10",  text: "text-slate-300" },
  { rank: 1, offset: "mt-0",  barH: "h-28", emoji: "🥇", glow: "shadow-[0_0_40px_rgba(251,191,36,0.35)]", ring: "ring-yellow-400/50", bg: "from-yellow-400/20 to-amber-500/10", text: "text-yellow-400" },
  { rank: 3, offset: "mt-10", barH: "h-14", emoji: "🥉", glow: "shadow-[0_0_25px_rgba(251,146,60,0.2)]",  ring: "ring-orange-400/40", bg: "from-orange-400/20 to-amber-600/10", text: "text-orange-400" },
];

function Avatar({ name, photo, size = 48, ringClass }: { name?: string | null; photo?: string | null; size?: number; ringClass?: string }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full ring-2 overflow-hidden flex items-center justify-center font-bold shrink-0 bg-gradient-to-br from-cyan-400 to-purple-500 text-black ${ringClass || ""}`}
    >
      {photo
        ? <Image src={photo} alt={name || ""} width={size} height={size} className="object-cover w-full h-full" />
        : <span style={{ fontSize: size * 0.38 }}>{(name?.[0] || "?").toUpperCase()}</span>
      }
    </div>
  );
}

export function LeaderboardPreviewSection() {
  const { data: leaders = [], isLoading } = useQuery({
    queryKey: ["leaderboard-preview"],
    queryFn: () => getLeaderboard(5),
    staleTime: 5 * 60 * 1000,
  });

  const top3 = leaders.slice(0, 3);
  // Podium order: 2nd | 1st | 3rd
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const restList = leaders.slice(3, 5);

  return (
    <section className="py-20 relative overflow-hidden bg-[#030712]">
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] rounded-full blur-[140px] bg-yellow-500/4 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[200px] rounded-full blur-[140px] bg-cyan-500/4 pointer-events-none" />

      <div className="container-app relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-semibold mb-4">
            <Trophy className="w-3.5 h-3.5" /> Hall of Fame
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Top <span className="gradient-text">Contributors</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Students who shared the most. Upload more — could be you next!
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-end justify-center gap-4">
              {[0, 1, 2].map(i => <div key={i} className={`skeleton rounded-2xl ${i === 1 ? "w-32 h-48" : "w-28 h-40"}`} />)}
            </div>
            <div className="w-full max-w-lg space-y-3">
              {[1, 2].map(i => <div key={i} className="skeleton h-14 rounded-xl w-full" />)}
            </div>
          </div>
        ) : leaders.length === 0 ? (
          <div className="glass-card p-16 text-center max-w-md mx-auto">
            <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-300 font-medium mb-1">No heroes yet!</p>
            <p className="text-slate-500 text-sm mb-5">Be the first to upload and claim the #1 spot.</p>
            <Link href="/upload" className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
              <Upload className="w-4 h-4" /> Upload Now
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-10">

            {/* Podium — only if we have at least 2 */}
            {top3.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
                className="flex items-end justify-center gap-3 sm:gap-6 w-full max-w-xl"
              >
                {podiumOrder.map((user, idx) => {
                  const cfg = PODIUM_CONFIG[idx];
                  return (
                    <motion.div
                      key={user.uid}
                      whileHover={{ y: -6, scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={`flex-1 flex flex-col items-center text-center rounded-2xl px-3 py-5 border transition-all cursor-default bg-gradient-to-b ${cfg.bg} border-white/10 ring-1 ${cfg.ring} ${cfg.glow} ${cfg.offset}`}
                    >
                      {cfg.rank === 1 && <Crown className="w-5 h-5 text-yellow-400 mb-2 animate-bounce" style={{ animationDuration: "2s" }} />}
                      <Avatar name={user.displayName} photo={user.photoURL} size={cfg.rank === 1 ? 60 : 48} ringClass={`ring-2 ${cfg.ring}`} />
                      <span className="text-2xl mt-2 mb-1">{cfg.emoji}</span>
                      <p className="text-xs font-bold text-white truncate w-full px-1">
                        {user.displayName?.split(" ")[0] || "Student"}
                      </p>
                      <div className={`mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.text} bg-white/5 border-white/10`}>
                        {user.uploadCount ?? 0} uploads
                      </div>
                      {/* Platform bar */}
                      <div className={`w-full mt-3 rounded-lg ${cfg.barH} bg-gradient-to-t ${cfg.bg} border border-white/5`} />
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* 4th & 5th */}
            {restList.length > 0 && (
              <div className="w-full max-w-lg space-y-3">
                {restList.map((user, i) => (
                  <motion.div
                    key={user.uid}
                    initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                    className="glass-card flex items-center gap-4 p-4 hover:border-white/15 transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm text-slate-500 shrink-0">
                      {i + 4}
                    </div>
                    <Avatar name={user.displayName} photo={user.photoURL} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{user.displayName || "Anonymous"}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-500">Uploads</p>
                      <p className="text-sm font-bold text-cyan-400">{user.uploadCount ?? 0}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="w-full max-w-lg glass-card p-6 text-center border-cyan-400/10 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 via-blue-500/5 to-purple-500/5 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="font-display font-bold text-lg text-white">Your spot is waiting</span>
                  <Flame className="w-5 h-5 text-orange-400" />
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  Upload notes, PYQs & study material — every approved upload adds to your rank.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Link href="/upload" className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Start Uploading
                  </Link>
                  <Link href="/leaderboard" className="btn-ghost px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 group">
                    Full Board <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>

          </div>
        )}
      </div>
    </section>
  );
}
