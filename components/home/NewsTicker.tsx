"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, HelpCircle, FileText, Upload, Shield, Sparkles, Bell, Zap } from "lucide-react";

const NEWS_ITEMS = [
  { icon: MessageSquare, text: "💬 Comments are live — share your thoughts on any resource!", href: "/resources", color: "text-cyan-400" },
  { icon: HelpCircle, text: "❓ Ask a question — drop your doubt on any note or PYQ page.", href: "/resources", color: "text-blue-400" },
  { icon: FileText, text: "📄 New PYQs uploaded — End-Sem 2024 papers now available!", href: "/resources?type=pyq", color: "text-emerald-400" },
  { icon: Upload, text: "⬆️ Upload your CT papers — help your juniors score better.", href: "/upload", color: "text-purple-400" },
  { icon: Shield, text: "🛡️ Want to be an Admin? Reach out to the CampusVault team.", href: "/contact", color: "text-yellow-400" },
  { icon: Sparkles, text: "✨ New Notes section is here — find handwritten notes by toppers!", href: "/resources?type=notes", color: "text-pink-400" },
  { icon: Bell, text: "🔔 Newsletter is LIVE — get study alerts delivered to your inbox.", href: "/#newsletter", color: "text-orange-400" },
  { icon: FileText, text: "📚 Lab Manuals added — all branches now covered. Check it out!", href: "/resources?type=lab_manual", color: "text-teal-400" },
  { icon: Zap, text: "⚡ 500+ resources — search and download instantly, no login needed.", href: "/resources", color: "text-cyan-300" },
  { icon: Upload, text: "🎯 Upload & earn your rank — top contributors featured on Leaderboard!", href: "/leaderboard", color: "text-yellow-300" },
];

const TICKER_ITEMS = [...NEWS_ITEMS, ...NEWS_ITEMS];

export function NewsTicker() {
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const posRef = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const speed = 0.5;

    const animate = () => {
      if (!pausedRef.current) {
        posRef.current -= speed;
        const singleSetWidth = track.scrollWidth / 2;
        if (Math.abs(posRef.current) >= singleSetWidth) posRef.current = 0;
        track.style.transform = `translateX(${posRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current !== null) cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden border-y border-white/5 bg-gradient-to-r from-[#060b18] via-[#07101f] to-[#060b18]"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none bg-gradient-to-r from-[#060b18] to-transparent" />
      {/* LIVE badge */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-cyan-400/10 text-cyan-400 border-cyan-400/25">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        LIVE
      </div>
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none bg-gradient-to-l from-[#060b18] to-transparent" />

      <div className="pl-32 py-2.5">
        <div ref={trackRef} className="flex items-center whitespace-nowrap will-change-transform">
          {TICKER_ITEMS.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className="inline-flex items-center gap-2 px-5 text-sm font-medium text-slate-300 hover:text-white transition-opacity shrink-0 group"
              tabIndex={-1}
            >
              <item.icon className={`w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform ${item.color}`} />
              <span>{item.text}</span>
              <span className="mx-3 text-xs text-slate-700 select-none">◆</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
