"use client";

import { useState, useEffect, useRef, forwardRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Upload, BookOpen, Sparkles } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";

/** Cycling words in the heading */
const WORDS = ["Resources", "PYQ Papers", "Notes", "Lab Manuals", "Projects"];

/**
 * Placeholder examples that cycle inside the search input — exactly like
 * Google's animated suggestions. They teach new users what to type.
 */
const PLACEHOLDER_EXAMPLES = [
  "Search Graph Theory...",
  "Search Big Data Analytics...",
  "Search Entrepreneurship...",
  "Search MCA Sem 3 papers...",
  "Search BCA Database...",
  "Search B.Tech networks...",
  "Search Cloud Computing...",
  "Search Compiler Design...",
  "Search Discrete Structures...",
  "Search Data Structures...",
];

/** Quick-tap chips below the search bar */
const QUICK_PICKS = [
  { label: "MCA Papers", href: "/resources?branch=mca" },
  { label: "BCA Papers", href: "/resources?branch=bca" },
  { label: "B.Tech Papers", href: "/resources?branch=btech" },
  { label: "Graph Theory", href: "/resources?search=Graph+Theory" },
  { label: "Big Data", href: "/resources?search=Big+Data" },
];

export function HeroSection() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/resources?search=${encodeURIComponent(q)}` : "/resources");
  };

  return (
    <section className="relative min-h-[calc(100svh-var(--nav-height)-var(--quick-actions-height))] flex items-center justify-center overflow-hidden hero-gradient">
      <div className="container-app relative z-10 text-center py-10 sm:py-16">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-5"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-soft border border-brand/25 text-sm font-medium text-brand">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Resource Hub for GBPIET</span>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-ink tracking-[-0.045em] leading-[1.05] mb-1">
            One Vault for{" "}
            <br className="hidden sm:block" />
            <span className="gradient-text">All Your Academic</span>
          </h1>
          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-[-0.045em] leading-[1.05]">
            <AnimatedWord words={WORDS} />
          </div>
        </motion.div>

        {/* ── GOOGLE-STYLE SEARCH BAR ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="max-w-3xl mx-auto px-2 sm:px-0"
        >
          <form onSubmit={submit}>
            <label htmlFor="hero-search" className="sr-only">
              Search subjects, papers, notes
            </label>

            {/* Search box — big, clean, Google-style */}
            <div
              className="
                flex items-center gap-3
                px-4 sm:px-6
                py-3 sm:py-4
                rounded-full
                bg-white
                border-2 border-line
                shadow-[0_4px_32px_rgba(11,18,32,0.1)]
                focus-within:border-brand
                focus-within:shadow-[0_0_0_4px_rgba(2,132,199,0.15),0_4px_32px_rgba(11,18,32,0.1)]
                transition-all duration-200
              "
            >
              {/* Search icon */}
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-muted shrink-0" />

              {/* Input with animated placeholder */}
              <AnimatedPlaceholderInput
                id="hero-search"
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholders={PLACEHOLDER_EXAMPLES}
                className="
                  flex-1 min-w-0 bg-transparent outline-none
                  text-base sm:text-lg md:text-xl
                  text-ink
                  placeholder:text-muted/60
                  py-0
                "
              />

              {/* Search button — hides label on very small phones, shows icon only */}
              <button
                type="submit"
                className="
                  shrink-0
                  btn-primary
                  px-4 sm:px-7
                  py-2 sm:py-2.5
                  rounded-full
                  text-sm sm:text-base
                  font-semibold
                  flex items-center gap-2
                "
              >
                <Search className="w-4 h-4 sm:hidden" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>

            {/* Helper hint */}
            <p className="text-xs text-muted mt-2.5 text-center">
              Try a subject name, branch, or semester — e.g.{" "}
              <button
                type="button"
                onClick={() => { setQuery("Graph Theory"); inputRef.current?.focus(); }}
                className="text-brand hover:underline"
              >
                Graph Theory
              </button>
              {" "}or{" "}
              <button
                type="button"
                onClick={() => { setQuery("Big Data"); inputRef.current?.focus(); }}
                className="text-brand hover:underline"
              >
                Big Data
              </button>
            </p>
          </form>

          {/* Quick-pick chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            {QUICK_PICKS.map((p) => (
              <Link
                key={p.label}
                href={p.href}
                className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-brand bg-brand-soft border border-brand/20 hover:bg-white hover:border-brand/40 transition-colors"
              >
                {p.label}
              </Link>
            ))}
          </div>
        </motion.div>
        {/* ─────────────────────────────────────────────────────────────────── */}

        {/* Secondary CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 mb-10"
        >
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
              Join &amp; Upload
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Animated cycling heading word ────────────────────────────────────────────

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



interface AnimatedPlaceholderInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholders: string[];
}

const AnimatedPlaceholderInput = forwardRef<
  HTMLInputElement,
  AnimatedPlaceholderInputProps
>(function AnimatedPlaceholderInput(
  { placeholders, value, onChange, className, id, ...rest },
  ref
) {
  const [phIndex, setPhIndex] = useState(0);
  const [displayedPh, setDisplayedPh] = useState("");
  const [typing, setTyping] = useState(true);

  // Cycle through placeholder strings with a typewriter effect
  useEffect(() => {
    if ((value as string)?.length > 0) return; // stop animating while user is typing

    const target = placeholders[phIndex];
    let i = typing ? displayedPh.length : displayedPh.length;
    let timeout: ReturnType<typeof setTimeout>;

    if (typing) {
      if (displayedPh.length < target.length) {
        timeout = setTimeout(() => {
          setDisplayedPh(target.slice(0, displayedPh.length + 1));
        }, 60);
      } else {
        // fully typed — pause then erase
        timeout = setTimeout(() => setTyping(false), 1800);
      }
    } else {
      if (displayedPh.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedPh(displayedPh.slice(0, -1));
        }, 30);
      } else {
        // fully erased — move to next placeholder
        setPhIndex((prev) => (prev + 1) % placeholders.length);
        setTyping(true);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedPh, typing, phIndex, placeholders, value]);

  // When user clears input, restart animation from current placeholder
  useEffect(() => {
    if ((value as string)?.length === 0) {
      setDisplayedPh("");
      setTyping(true);
    }
  }, [value]);

  return (
    <input
      ref={ref}
      id={id}
      value={value}
      onChange={onChange}
      placeholder={displayedPh}
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      className={className}
      {...rest}
    />
  );
});
