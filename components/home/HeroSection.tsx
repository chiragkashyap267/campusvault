"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Upload, BookOpen, Sparkles, Zap, FileText, MonitorPlay, Pencil, Lightbulb, Blocks } from "lucide-react";
import { ParticleBackground } from "./ParticleBackground";
import { SITE_TAGLINE } from "@/lib/constants";
import { useAuthStore } from "@/lib/store/authStore";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const WORDS = ["Resources", "PYQ Papers", "Notes", "Lab Manuals", "Projects"];

export function HeroSection() {
  const { user } = useAuthStore();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden hero-gradient">
      {/* Particle Canvas */}
      <ParticleBackground />

      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-cyan-400/5 blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl animate-float-delay pointer-events-none" />
      <div className="absolute top-1/2 right-1/6 w-48 h-48 rounded-full bg-purple-500/5 blur-3xl animate-float pointer-events-none" style={{ animationDelay: "3s" }} />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container-app relative z-10 text-center pt-28 pb-20 sm:pt-36 sm:pb-24">
        {/* Announcement badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-cyan-400/20 text-sm text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Resource Hub for GBPIET</span>
            <Zap className="w-3.5 h-3.5" />
          </div>
        </motion.div>

        {/* Main heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-8"
        >
          <h1 className={cn(
            "text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-2",
            isLight ? "text-slate-900" : "text-white"
          )}>
            One Vault for{" "}
            <br className="hidden sm:block" />
            <span className="gradient-text glow-text">All Your Academic</span>
          </h1>
          <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight">
            <AnimatedWord words={WORDS} />
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={cn(
            "text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed",
            isLight ? "text-slate-500" : "text-slate-400"
          )}
        >
          {SITE_TAGLINE} — Share notes, access PYQs, collaborate with your
          batchmates, all in one premium platform.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link
            href="/resources"
            className="group flex items-center gap-2 btn-primary px-8 py-3.5 rounded-xl text-base font-semibold w-full sm:w-auto justify-center"
          >
            <BookOpen className="w-5 h-5" />
            Explore Resources
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          {!user && (
            <Link
              href="/register"
              className="flex items-center gap-2 btn-ghost px-8 py-3.5 rounded-xl text-base font-semibold w-full sm:w-auto justify-center"
            >
              <Upload className="w-5 h-5" />
              Join & Upload
            </Link>
          )}
        </motion.div>

        {/* Glassmorphism Preview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto"
        >
          {PREVIEW_CARDS.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className={cn(
                "text-left group cursor-pointer relative overflow-hidden flex flex-col justify-between rounded-xl border transition-all",
                isLight
                  ? "bg-white/80 border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300"
                  : "glass-card"
              )}
            >
              <div className="p-4 pb-4">
                <div className="mb-3">
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: [-5, 5, -5, 0] }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "inline-flex p-2 rounded-xl border",
                      isLight ? "bg-blue-50 border-blue-100" : "bg-white/5 border-white/10",
                      card.color
                    )}
                  >
                    <card.icon className="w-5 h-5" />
                  </motion.div>
                </div>
                <p className={cn("text-xs font-semibold", isLight ? "text-slate-800" : "text-white")}>{card.label}</p>
                <p className={cn("text-xs mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>{card.count}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 hero-bottom-fade pointer-events-none" />
    </section>
  );
}

function AnimatedWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % words.length), 2800);
    return () => clearInterval(t);
  }, [words.length]);

  return (
    <span className="block h-[1.25em] overflow-hidden relative mt-1">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          className="gradient-text glow-text block text-center"
          initial={{ opacity: 0, y: "100%", filter: "blur(8px)" }}
          animate={{ opacity: 1, y: "0%", filter: "blur(0px)" }}
          exit={{ opacity: 0, y: "-100%", filter: "blur(8px)" }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
const PREVIEW_CARDS = [
  { icon: FileText, label: "PYQ Papers", count: "Semester-wise", color: "text-blue-400", marquee: "DOWNLOAD NOW • LATEST UPLOADS • EXAM READY • " },
  { icon: BookOpen, label: "Books", count: "Library & Ref", color: "text-emerald-400", marquee: "BROWSE BOOKS • TOP RATED • STUDY SMART • " },
  { icon: MonitorPlay, label: "Useful Softwares", count: "Tools & IDEs", color: "text-cyan-400", marquee: "DOWNLOAD TOOLS • IDE SETUPS • MUST HAVE • " },
  { icon: Pencil, label: "CT Papers", count: "Previous years", color: "text-orange-400", marquee: "PRACTICE NOW • HIGH SCORES • CLASS TESTS • " },
  { icon: Lightbulb, label: "Projects", count: "Ideas & files", color: "text-yellow-400", marquee: "GET INSPIRED • FINAL YEAR • MINI PROJECTS • " },
  { icon: Blocks, label: "Study Notes", count: "All subjects", color: "text-purple-400", marquee: "TOPPERS NOTES • HANDWRITTEN • CLEAR CONCEPTS • " },
];
