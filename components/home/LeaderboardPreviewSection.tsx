"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, Crown, ArrowRight, Upload, Download, Flame, Star, Medal } from "lucide-react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "@/lib/firebase/firestore";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const PODIUM = [
  { rank: 2, offset: "mt-6", height: "h-20", emoji: "🥈", glow: "shadow-[0_0_30px_rgba(148,163,184,0.25)]", darkRing: "ring-slate-400/40", lightRing: "ring-slate-300", darkBg: "from-slate-400/20 to-slate-500/10", lightBg: "from-slate-100 to-slate-50", darkText: "text-slate-300", lightText: "text-slate-600" },
  { rank: 1, offset: "mt-0", height: "h-28", emoji: "🥇", glow: "shadow-[0_0_40px_rgba(251,191,36,0.4)]", darkRing: "ring-yellow-400/60", lightRing: "ring-yellow-400", darkBg: "from-yellow-400/25 to-amber-500/10", lightBg: "from-yellow-50 to-amber-50", darkText: "text-yellow-400", lightText: "text-yellow-600" },
  { rank: 3, offset: "mt-10", height: "h-14", emoji: "🥉", glow: "shadow-[0_0_25px_rgba(251,146,60,0.25)]", darkRing: "ring-orange-400/40", lightRing: "ring-orange-400/60", darkBg: "from-orange-400/20 to-amber-600/10", lightBg: "from-orange-50 to-amber-50", darkText: "text-orange-400", lightText: "text-orange-500" },
];

function Avatar({ name, photo, size = 48, ringClass }: { name?: string | null; photo?: string | null; size?: number; ringClass?: string }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn("rounded-full ring-2 overflow-hidden flex items-center justify-center font-bold shrink-0 bg-gradient-to-br from-cyan-400 to-purple-500 text-black", ringClass)}
    >
      {photo ? (
        <Image src={photo} alt={name || ""} width={size} height={size} className="object-cover w-full h-full" />
      ) : (
        <span style={{ fontSize: size * 0.38 }}>{(name?.[0] || "?").toUpperCase()}</span>
      )}
    </div>
  );
}

export function LeaderboardPreviewSection() {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  const { data: leaders = [], isLoading } = useQuery({
    queryKey: ["leaderboard-preview"],
    queryFn: () => getLeaderboard(5),
    staleTime: 5 * 60 * 1000,
  });

  // Reorder for podium display: [2nd, 1st, 3rd]
  const top3 = leaders.slice(0, 3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const restList = leaders.slice(3, 5);

  return (
    <section className={cn(
      "py-20 relative overflow-hidden transition-colors duration-300",
      isLight ? "bg-white" : "bg-[#030712]"
    )}>
      {/* Decorative blobs */}
      <div className={cn(
        "absolute top-0 left-1/4 w-[500px] h-[400px] rounded-full blur-[140px] pointer-events-none",
        isLight ? "bg-yellow-100/70" : "bg-yellow-500/4"
      )} />
      <div className={cn(
        "absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full blur-[140px] pointer-events-none",
        isLight ? "bg-blue-100/60" : "bg-cyan-500/4"
      )} />

      <div className="container-app relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border",
            isLight
              ? "bg-yellow-50 border-yellow-200 text-yellow-700"
              : "bg-yellow-400/10 border-yellow-400/20 text-yellow-400"
          )}>
            <Trophy className="w-3.5 h-3.5" />
            Hall of Fame
          </div>
          <h2 className={cn(
            "text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4",
            isLight ? "text-slate-900" : "text-white"
          )}>
            Top{" "}
            <span className="gradient-text">Contributors</span>
          </h2>
          <p className={cn("max-w-xl mx-auto", isLight ? "text-slate-500" : "text-slate-400")}>
            Students who shared the most. The more you upload, the higher you climb — could be you next!
          </p>
        </motion.div>

        {isLoading ? (
          /* Skeleton */
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-end justify-center gap-4">
              {[68, 80, 60].map((s, i) => (
                <div key={i} className={cn("skeleton rounded-2xl", i === 1 ? "w-32 h-48" : "w-28 h-40")} />
              ))}
            </div>
            <div className="w-full max-w-lg space-y-3">
              {[1, 2].map(i => <div key={i} className="skeleton h-14 rounded-xl w-full" />)}
            </div>
          </div>
        ) : leaders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "p-16 text-center rounded-2xl border max-w-md mx-auto",
              isLight ? "bg-slate-50 border-slate-200" : "glass-card"
            )}
          >
            <Trophy className={cn("w-12 h-12 mx-auto mb-4", isLight ? "text-slate-300" : "text-slate-700")} />
            <p className={cn("font-medium mb-1", isLight ? "text-slate-700" : "text-slate-300")}>No heroes yet!</p>
            <p className={cn("text-sm mb-5", isLight ? "text-slate-500" : "text-slate-500")}>Be the first to upload and claim the #1 spot.</p>
            <Link href="/upload" className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
              <Upload className="w-4 h-4" /> Upload Now
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-10">

            {/* Podium */}
            {top3.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="flex items-end justify-center gap-3 sm:gap-6 w-full max-w-xl"
              >
                {podiumOrder.map((user, idx) => {
                  const config = PODIUM[idx];
                  return (
                    <motion.div
                      key={user.uid}
                      whileHover={{ y: -6, scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={cn(
                        "flex-1 flex flex-col items-center text-center rounded-2xl px-3 py-5 border transition-all cursor-default",
                        config.offset,
                        config.glow,
                        isLight
                          ? `bg-gradient-to-b ${config.lightBg} border-slate-200 ring-2 ${config.lightRing}`
                          : `bg-gradient-to-b ${config.darkBg} border-white/10 ring-1 ${config.darkRing}`
                      )}
                    >
                      {config.rank === 1 && (
                        <Crown className="w-5 h-5 text-yellow-400 mb-2 animate-bounce" style={{ animationDuration: "2s" }} />
                      )}
                      <Avatar
                        name={user.displayName}
                        photo={user.photoURL}
                        size={config.rank === 1 ? 60 : 48}
                        ringClass={isLight ? `ring-2 ${config.lightRing}` : `ring-2 ${config.darkRing}`}
                      />
                      <span className="text-2xl mt-2 mb-1">{config.emoji}</span>
                      <p className={cn(
                        "text-xs font-bold truncate w-full px-1",
                        isLight ? "text-slate-800" : "text-white"
                      )}>
                        {user.displayName?.split(" ")[0] || "Student"}
                      </p>
                      <div className={cn(
                        "mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold border",
                        isLight
                          ? `${config.lightText} bg-white border-slate-200`
                          : `${config.darkText} bg-white/5 border-white/10`
                      )}>
                        {user.uploadCount ?? 0} uploads
                      </div>
                      {/* Podium bar */}
                      <div className={cn(
                        "w-full mt-3 rounded-lg",
                        config.height,
                        isLight
                          ? `bg-gradient-to-t ${config.lightBg} border border-slate-200/80`
                          : `bg-gradient-to-t ${config.darkBg} border border-white/5`
                      )} />
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Rank 4 & 5 */}
            {restList.length > 0 && (
              <div className="w-full max-w-lg space-y-3">
                {restList.map((user, i) => (
                  <motion.div
                    key={user.uid}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border transition-all group",
                      isLight
                        ? "bg-white border-slate-200 hover:border-blue-300 hover:shadow-md shadow-sm"
                        : "glass-card hover:border-white/15"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center font-display font-bold text-sm shrink-0 border",
                      isLight ? "bg-slate-100 border-slate-200 text-slate-500" : "bg-white/5 border-white/10 text-slate-500"
                    )}>
                      {i + 4}
                    </div>
                    <Avatar name={user.displayName} photo={user.photoURL} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold truncate", isLight ? "text-slate-800" : "text-white")}>
                        {user.displayName || "Anonymous"}
                      </p>
                      <p className={cn("text-xs truncate", isLight ? "text-slate-400" : "text-slate-500")}>
                        {user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div>
                        <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>Uploads</p>
                        <p className={cn("text-sm font-bold", isLight ? "text-blue-600" : "text-cyan-400")}>{user.uploadCount ?? 0}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* CTA card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={cn(
                "w-full max-w-lg p-6 rounded-2xl border text-center relative overflow-hidden",
                isLight
                  ? "bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200"
                  : "glass-card border-cyan-400/15"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 via-blue-500/5 to-purple-500/5 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Flame className={cn("w-5 h-5", isLight ? "text-orange-500" : "text-orange-400")} />
                  <span className={cn("font-display font-bold text-lg", isLight ? "text-slate-900" : "text-white")}>
                    Your spot is waiting
                  </span>
                  <Flame className={cn("w-5 h-5", isLight ? "text-orange-500" : "text-orange-400")} />
                </div>
                <p className={cn("text-sm mb-4", isLight ? "text-slate-500" : "text-slate-400")}>
                  Upload notes, PYQs & study material — every approved upload adds to your rank.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Link href="/upload" className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Start Uploading
                  </Link>
                  <Link href="/leaderboard" className="btn-ghost px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 group">
                    Full Leaderboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
