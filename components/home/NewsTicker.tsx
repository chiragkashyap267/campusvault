"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare, HelpCircle, FileText, Upload,
  Shield, Sparkles, Bell, Zap
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface NewsItem {
  icon: React.ElementType;
  text: string;
  href: string;
  color: string; // tailwind text class
}

const NEWS_ITEMS: NewsItem[] = [
  { icon: MessageSquare, text: "💬 Comments are live — share your thoughts on any resource!", href: "/resources", color: "text-cyan-400" },
  { icon: HelpCircle, text: "❓ Ask a question — drop your doubt on any note or PYQ page.", href: "/resources", color: "text-blue-400" },
  { icon: FileText, text: "📄 New PYQs uploaded — End-Sem 2024 papers now available!", href: "/resources?type=pyq", color: "text-emerald-400" },
  { icon: Upload, text: "⬆️ Upload your CT papers — help your juniors score better.", href: "/upload", color: "text-purple-400" },
  { icon: Shield, text: "🛡️ Want to be an Admin? Reach out to the CampusVault team.", href: "/contact", color: "text-yellow-400" },
  { icon: Sparkles, text: "✨ New Notes section is here — find handwritten notes by toppers!", href: "/resources?type=notes", color: "text-pink-400" },
  { icon: Bell, text: "🔔 Newsletter is LIVE — get study alerts delivered to your inbox.", href: "/#newsletter", color: "text-orange-400" },
  { icon: FileText, text: "📚 Lab Manuals added — all branches now covered. Check it out!", href: "/resources?type=lab_manual", color: "text-teal-400" },
  { icon: Zap, text: "⚡ 500+ resources available — search and download instantly, no login needed.", href: "/resources", color: "text-cyan-300" },
  { icon: HelpCircle, text: "🤝 Help others — answer questions in the comments section!", href: "/resources", color: "text-indigo-400" },
  { icon: Upload, text: "🎯 Upload & earn your rank — top contributors featured on Leaderboard!", href: "/leaderboard", color: "text-yellow-300" },
  { icon: FileText, text: "📝 Looking for a CT paper? Request it in the comments — community helps!", href: "/resources?type=ct", color: "text-green-400" },
];

// Duplicate for seamless infinite loop
const TICKER_ITEMS = [...NEWS_ITEMS, ...NEWS_ITEMS];

export function NewsTicker() {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const posRef = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const speed = 0.5; // px per frame
    const singleSetWidth = track.scrollWidth / 2;

    const animate = () => {
      if (!pausedRef.current) {
        posRef.current -= speed;
        // Reset when we've scrolled exactly one full set
        if (Math.abs(posRef.current) >= singleSetWidth) {
          posRef.current = 0;
        }
        track.style.transform = `translateX(${posRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden border-y transition-colors duration-300",
        isLight
          ? "bg-gradient-to-r from-blue-50 via-indigo-50/80 to-blue-50 border-blue-100"
          : "bg-gradient-to-r from-[#060b18] via-[#07101f] to-[#060b18] border-white/5"
      )}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {/* Left fade mask */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none",
        isLight
          ? "bg-gradient-to-r from-blue-50 to-transparent"
          : "bg-gradient-to-r from-[#060b18] to-transparent"
      )} />

      {/* LIVE badge */}
      <div className={cn(
        "absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0",
        isLight
          ? "bg-blue-600 text-white border-blue-700"
          : "bg-cyan-400/15 text-cyan-400 border-cyan-400/30"
      )}>
        <span className={cn(
          "w-1.5 h-1.5 rounded-full animate-pulse",
          isLight ? "bg-white" : "bg-cyan-400"
        )} />
        LIVE
      </div>

      {/* Right fade mask */}
      <div className={cn(
        "absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none",
        isLight
          ? "bg-gradient-to-l from-blue-50 to-transparent"
          : "bg-gradient-to-l from-[#060b18] to-transparent"
      )} />

      {/* Scrolling track */}
      <div className="pl-24 py-2.5">
        <div ref={trackRef} className="flex items-center gap-0 whitespace-nowrap will-change-transform">
          {TICKER_ITEMS.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 px-5 text-sm font-medium transition-opacity hover:opacity-80 shrink-0 group",
                isLight ? "text-slate-600 hover:text-blue-700" : "text-slate-300 hover:text-white"
              )}
              tabIndex={-1}
            >
              <item.icon className={cn("w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform", item.color)} />
              <span>{item.text}</span>
              {/* Separator */}
              <span className={cn("mx-3 text-xs select-none", isLight ? "text-slate-300" : "text-slate-700")}>◆</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
