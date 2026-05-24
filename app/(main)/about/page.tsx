"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BookOpen, Globe, Link2, ExternalLink, Code2, Cpu, Zap, Shield, Heart } from "lucide-react";
import { CREATOR_NAME, SITE_NAME } from "@/lib/constants";

const TECH_STACK = [
  { name: "Next.js 16", desc: "React framework", icon: "⚡" },
  { name: "TypeScript", desc: "Type safety", icon: "🔷" },
  { name: "Firebase", desc: "Auth + Database", icon: "🔥" },
  { name: "Cloudinary", desc: "File storage", icon: "☁️" },
  { name: "Tailwind CSS", desc: "Styling", icon: "🎨" },
  { name: "Framer Motion", desc: "Animations", icon: "🎭" },
  { name: "Zustand", desc: "State management", icon: "🐻" },
  { name: "React Query", desc: "Data fetching", icon: "🔄" },
];

const FEATURES = [
  { icon: <BookOpen className="w-5 h-5" />, title: "Resource Library", desc: "PYQs, notes, lab manuals, assignments — all in one place." },
  { icon: <Shield className="w-5 h-5" />, title: "Moderated Uploads", desc: "Every upload is reviewed before it goes public — quality guaranteed." },
  { icon: <Zap className="w-5 h-5" />, title: "Lightning Fast", desc: "Server-side rendering, lazy loading, and optimized images." },
  { icon: <Code2 className="w-5 h-5" />, title: "Built for Students", desc: "Markdown notes, todo tracker, and productivity tools built-in." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-20">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="inline-flex items-center gap-2 badge badge-cyan mb-6">
            <BookOpen className="w-3.5 h-3.5" />
            About CampusVault GBPIET
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            Built for <span className="gradient-text">GBPIET Students</span>,
            <br />by a GBPIET Student
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
            CampusVault is a centralized academic collaboration platform that makes sharing and
            discovering study materials effortless for all MCA and B.Tech students.
          </p>
        </motion.div>

        {/* Features */}
        <section>
          <h2 className="font-display text-2xl font-bold text-white text-center mb-8">Why CampusVault?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-6"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-400/10 text-cyan-400 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section>
          <h2 className="font-display text-2xl font-bold text-white text-center mb-8">Tech Stack</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TECH_STACK.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="glass-card p-4 text-center"
              >
                <span className="text-2xl mb-2 block">{t.icon}</span>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-slate-500">{t.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Creator */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-8 sm:p-10 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-purple-500/5" />
          <div className="relative">
            <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-cyan-400/40 shadow-lg shadow-cyan-400/10 bg-gradient-to-br from-cyan-400 to-purple-500">
              <img
                src="/chirag.png"
                alt={CREATOR_NAME}
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="font-display text-xl font-bold text-white mb-1">{CREATOR_NAME}</h2>
            <p className="text-slate-400 text-sm mb-2">MCA Student · GBPIET, Pauri Garhwal</p>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
              Passionate about building tools that make student life easier. CampusVault was born
              from frustration with scattered resources and inaccessible study materials.
            </p>
            <div className="flex justify-center gap-3 mb-6">
              {[
                { icon: <Globe className="w-4 h-4" />, href: "https://github.com/chiragkashyap", label: "GitHub" },
                { icon: <Link2 className="w-4 h-4" />, href: "https://linkedin.com/in/chiragkashyap", label: "LinkedIn" },
                { icon: <ExternalLink className="w-4 h-4" />, href: "https://chiragkashyap.dev", label: "Portfolio" },
              ].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="p-3 glass rounded-xl text-slate-400 hover:text-cyan-400 hover:border-cyan-400/20 border border-white/10 transition-all">
                  {s.icon}
                </a>
              ))}
            </div>
            <p className="text-slate-600 text-xs flex items-center justify-center gap-1.5">
              Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> for GBPIET students
            </p>
          </div>
        </motion.section>

        {/* CTA */}
        <div className="text-center">
          <Link href="/resources" className="btn-primary px-8 py-3.5 rounded-xl inline-flex items-center gap-2 text-sm font-semibold">
            Explore Resources →
          </Link>
        </div>
      </div>
    </div>
  );
}
