"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Upload, BookOpen, Sparkles, FileText, MonitorPlay, Pencil, Lightbulb, Blocks } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";

const WORDS = ["Resources", "PYQ Papers", "Notes", "Lab Manuals", "Projects"];

/** One tap each, for the searches students actually run. */
const QUICK_PICKS = [
  { label: "MCA PYQ", href: "/resources?type=pyq&branch=mca" },
  { label: "B.Tech PYQ", href: "/resources?type=pyq&branch=btech" },
  { label: "BCA PYQ", href: "/resources?type=pyq&branch=bca" },
  { label: "CT Papers", href: "/resources?type=ct" },
];

export function HeroSection() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/resources?search=${encodeURIComponent(q)}` : "/resources");
  };

  return (
    /* Height excludes the navbar. At a flat 100svh the hero was a full
       viewport tall *below* a 64px nav, so it always overflowed the screen and
       pushed the call to action under the fold. */
    <section className="relative min-h-[calc(100svh-var(--nav-height)-var(--quick-actions-height))] flex items-center justify-center overflow-hidden hero-gradient">
      {/* The particle canvas, three blurred orbs and a grid overlay used to sit
          here. All four were built to glow against a near-black page; on white
          they range from invisible to grubby, and the canvas was a permanent
          animation frame loop on the first screen a visitor sees. The soft blue
          wash in .hero-gradient replaces the lot. */}

      <div className="container-app relative z-10 text-center py-10 sm:py-14">
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-soft border border-brand/25 text-sm font-medium text-brand">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Resource Hub for GBPIET</span>
          </div>
        </div>

        {/* Heading is a size smaller than it was. The search box below is the
            point of this screen, and at 7xl the type pushed it under the fold
            on a laptop. */}
        <div className="mb-7">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-ink tracking-[-0.045em] leading-[1.05] mb-1">
            One Vault for{" "}
            <br className="hidden sm:block" />
            <span className="gradient-text">All Your Academic</span>
          </h1>
          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-[-0.045em] leading-[1.05]">
            <AnimatedWord words={WORDS} />
          </div>
        </div>

        {/* ── The search. This is what the page is for. ──────────────────
            It was previously behind a magnifier icon in the navbar, two taps
            away and invisible to anyone who did not think to look. Finding a
            past paper is the whole job of the site, so it gets the middle of
            the first screen. */}
        <form onSubmit={submit} className="max-w-2xl mx-auto">
          <label htmlFor="hero-search" className="sr-only">
            Search past papers, notes and subjects
          </label>
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-white border border-line shadow-[0_4px_24px_rgba(11,18,32,0.07)] focus-within:border-brand focus-within:shadow-[0_0_0_4px_rgba(2,132,199,0.12)] transition-shadow">
            <Search className="w-5 h-5 text-muted shrink-0 ml-2" />
            <input
              id="hero-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a subject or code — try DBMS sem 3"
              className="flex-1 min-w-0 bg-transparent outline-none text-base text-ink placeholder:text-muted py-2"
              autoComplete="off"
            />
            <button
              type="submit"
              className="shrink-0 btn-primary px-5 sm:px-7 py-2.5 rounded-xl text-sm font-semibold"
            >
              Search
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          {QUICK_PICKS.map((p) => (
            <Link
              key={p.label}
              href={p.href}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-brand bg-brand-soft border border-brand/20 hover:bg-white hover:border-brand/40 transition-colors"
            >
              {p.label}
            </Link>
          ))}
        </div>

        {/* Secondary to the search now, so they no longer compete with it. */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 mb-10">
          <Link
            href="/resources"
            className="group flex items-center gap-2 btn-ghost px-6 py-2.5 rounded-xl text-sm font-semibold w-full sm:w-auto justify-center"
          >
            <BookOpen className="w-4 h-4" />
            Browse everything
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          {!user && (
            <Link
              href="/register"
              className="flex items-center gap-2 btn-ghost px-6 py-2.5 rounded-xl text-sm font-semibold w-full sm:w-auto justify-center"
            >
              <Upload className="w-4 h-4" />
              Join & Upload
            </Link>
          )}
        </div>

        {/* These were styled as buttons and had a pointer cursor but went
            nowhere. Each one now runs the search it advertises. */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
          {PREVIEW_CARDS.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="glass-card text-left group hover:border-brand/40 transition-colors"
            >
              <div className="p-4">
                <div className="mb-3">
                  <div className={`inline-flex p-2 rounded-xl bg-surface-2 border border-line ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-ink group-hover:text-brand transition-colors">{card.label}</p>
                <p className="text-xs text-muted mt-0.5">{card.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
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
          className="gradient-text block text-center"
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: "0%" }}
          exit={{ opacity: 0, y: "-100%" }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const PREVIEW_CARDS = [
  { icon: FileText, label: "PYQ Papers", count: "Semester-wise", color: "text-blue-600", href: "/resources?type=pyq" },
  { icon: BookOpen, label: "Books", count: "Library & Ref", color: "text-emerald-600", href: "/resources?type=study_material" },
  { icon: MonitorPlay, label: "Useful Softwares", count: "Tools & IDEs", color: "text-brand", href: "/resources?type=software" },
  { icon: Pencil, label: "CT Papers", count: "Previous years", color: "text-orange-600", href: "/resources?type=ct" },
  { icon: Lightbulb, label: "Projects", count: "Ideas & files", color: "text-amber-600", href: "/resources?type=project" },
  { icon: Blocks, label: "Study Notes", count: "All subjects", color: "text-purple-600", href: "/resources?type=notes" },
];
