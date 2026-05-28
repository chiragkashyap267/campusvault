"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Search, Download, UploadCloud, CheckCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Search,
    title: "1. Search",
    desc: "Find PYQs, Notes, and Softwares using powerful filters and instant search.",
    darkColor: "text-cyan-400",
    lightColor: "text-blue-600",
    darkBg: "bg-cyan-500/10 border-cyan-500/20",
    lightBg: "bg-blue-50 border-blue-200",
  },
  {
    icon: Download,
    title: "2. Download",
    desc: "Instantly download resources without any login required. Completely free.",
    darkColor: "text-emerald-400",
    lightColor: "text-emerald-600",
    darkBg: "bg-emerald-500/10 border-emerald-500/20",
    lightBg: "bg-emerald-50 border-emerald-200",
  },
  {
    icon: UploadCloud,
    title: "3. Contribute",
    desc: "Log in to upload your own notes and previous year papers.",
    darkColor: "text-purple-400",
    lightColor: "text-purple-600",
    darkBg: "bg-purple-500/10 border-purple-500/20",
    lightBg: "bg-purple-50 border-purple-200",
  },
  {
    icon: CheckCircle,
    title: "4. Get Ranked",
    desc: "Every approved upload increases your score on the top contributor Leaderboard.",
    darkColor: "text-orange-400",
    lightColor: "text-orange-500",
    darkBg: "bg-orange-500/10 border-orange-500/20",
    lightBg: "bg-orange-50 border-orange-200",
  },
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRefs.current,
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={cn(
        "py-24 relative overflow-hidden transition-colors duration-300",
        isLight ? "bg-white" : "bg-[#030712]"
      )}
    >
      {/* Decorative top divider */}
      <div className="divider mb-0" />

      {/* Subtle background blobs */}
      <div className={cn(
        "absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[140px] pointer-events-none",
        isLight ? "bg-blue-100/60" : "bg-cyan-500/4"
      )} />
      <div className={cn(
        "absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[140px] pointer-events-none",
        isLight ? "bg-indigo-100/40" : "bg-blue-500/4"
      )} />

      <div className="container-app relative z-10">
        <div className="text-center mb-16">
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border",
            isLight
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
          )}>
            <span>Step by Step</span>
          </div>
          <h2 className={cn(
            "text-3xl md:text-5xl font-display font-bold mb-4",
            isLight ? "text-slate-900" : "text-white"
          )}>
            How CampusVault Works
          </h2>
          <p className={cn("max-w-2xl mx-auto", isLight ? "text-slate-500" : "text-slate-400")}>
            A simple, open, and community-driven platform for GBPIET students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Connecting Line */}
          <div className={cn(
            "hidden md:block absolute top-12 left-[10%] right-[10%] h-[1px]",
            isLight
              ? "bg-gradient-to-r from-transparent via-blue-200 to-transparent"
              : "bg-gradient-to-r from-transparent via-white/10 to-transparent"
          )} />

          {STEPS.map((step, i) => (
            <div
              key={step.title}
              ref={(el) => { if (el) cardRefs.current[i] = el; }}
              className={cn(
                "relative flex flex-col items-center text-center p-6 rounded-2xl group hover:-translate-y-2 transition-all duration-300",
                isLight
                  ? "bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200"
                  : "glass-card"
              )}
            >
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border relative z-10 group-hover:scale-110 transition-transform duration-300",
                isLight ? `${step.lightBg} ${step.lightColor}` : `${step.darkBg} ${step.darkColor}`
              )}>
                <step.icon className="w-8 h-8" />
              </div>
              <h3 className={cn("text-xl font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>
                {step.title}
              </h3>
              <p className={cn("text-sm leading-relaxed", isLight ? "text-slate-500" : "text-slate-400")}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
