"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Upload, BookOpen, Sparkles, Zap, FileText, MonitorPlay, Pencil, Lightbulb, Blocks } from "lucide-react";
import { ParticleBackground } from "./ParticleBackground";
import { SITE_TAGLINE } from "@/lib/constants";
import { useAuthStore } from "@/lib/store/authStore";

const WORDS = ["Resources", "PYQ Papers", "Notes", "Lab Manuals", "Projects"];

export function HeroSection() {
  const { user } = useAuthStore();

  return (
    /* Height excludes the navbar. At a flat 100svh the hero was a full
       viewport tall *below* a 64px nav, so it always overflowed the screen and
       pushed the call to action under the fold. */
    <section className="relative min-h-[calc(100svh-var(--nav-height)-var(--quick-actions-height))] flex items-center justify-center overflow-hidden hero-gradient">
      <ParticleBackground />

      {/* Ambient orbs.
          Static on purpose. Each is a large element under a 64px blur, and
          animating the transform of a blurred layer forces the browser to
          re-render and re-blur that whole surface every single frame — three
          of them, permanently, was the heaviest continuous cost on the page.
          Painted once, they look identical and cost nothing. */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-cyan-400/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/6 w-48 h-48 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container-app relative z-10 text-center py-12 sm:py-16">
        {/* Announcement badge */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-cyan-400/20 text-sm text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Resource Hub for GBPIET</span>
            <Zap className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Main heading */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-tight mb-2">
            One Vault for{" "}
            <br className="hidden sm:block" />
            <span className="gradient-text glow-text">All Your Academic</span>
          </h1>
          <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight">
            <AnimatedWord words={WORDS} />
          </div>
        </div>

        {/* Tagline */}
        <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
          {SITE_TAGLINE} — Share notes, access PYQs, collaborate with your batchmates, all in one premium platform.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
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
        </div>

        {/* Glassmorphism Preview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
          {PREVIEW_CARDS.map((card, i) => (
            <div
              key={card.label}
              className="glass-card text-left group cursor-pointer relative overflow-hidden flex flex-col justify-between"
            >
              <div className="p-4 pb-4">
                <div className="mb-3">
                  <div
                    className={`inline-flex p-2 rounded-xl bg-white/5 border border-white/10 ${card.color}`}
                  >
                    <card.icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-white">{card.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{card.count}</p>
              </div>
            </div>
          ))}
        </div>
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
