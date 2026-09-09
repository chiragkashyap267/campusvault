"use client";

import { Search, Download, UploadCloud, CheckCircle } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "1. Search",
    desc: "Find PYQs, Notes, and Softwares using powerful filters and instant search.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: Download,
    title: "2. Download",
    desc: "Instantly download resources without any login required. Completely free.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: UploadCloud,
    title: "3. Contribute",
    desc: "Log in to upload your own notes and previous year papers.",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: CheckCircle,
    title: "4. Get Ranked",
    desc: "Every approved upload increases your score on the top contributor Leaderboard.",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
];

export function HowItWorksSection() {
  return (
    <section className="section relative overflow-hidden bg-[#030712]">
      <div className="divider mb-0" />
      <div className="container-app relative z-10">
        <div className="section-head text-center">
          <h2 className="section-title">
            How CampusVault Works
          </h2>
          <p className="section-subtitle mx-auto">
            A simple, open, and community-driven platform for GBPIET students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="relative flex flex-col items-center text-center p-6 glass-card rounded-2xl group"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${step.bg} ${step.color} relative z-10 group-hover:scale-110 transition-transform duration-300`}>
                <step.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
