"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MonitorPlay, ArrowRight, Network, PenTool } from "lucide-react";

const POPULAR_TOOLS = [
  { name: "Cisco Packet Tracer", icon: Network, desc: "Network Sim", color: "text-cyan-500", link: "https://drive.google.com/file/d/1oTeCij1NV5emMxZbDmIRNh3LqiyPm6A-/view?usp=sharing" },
  { name: "CorelDraw 2021", icon: PenTool, desc: "Vector Design", color: "text-green-500", link: "https://drive.google.com/file/d/11eX_ckzBqG8JjDqjQPMfsyyTg0zT1G1S/view?usp=drive_link" },
];

export function SoftwaresSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-[#0a0f1e] border-y border-white/5">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-64 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container-app relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-4">
              <MonitorPlay className="w-4 h-4" />
              <span>Essential Tools</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Useful Softwares
            </h2>
            <p className="text-slate-400 max-w-xl">
              Download the IDEs, local servers, and development tools you need for your practicals and projects.
            </p>
          </div>
          <Link
            href="/resources?type=software"
            className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all group"
          >
            Browse All Software
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
          {POPULAR_TOOLS.map((tool, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative glass-card p-6 w-[280px] flex items-center gap-4 hover:border-cyan-500/30 hover:bg-white/[0.03] transition-all group"
            >
              <div className={`w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 ${tool.color} group-hover:scale-110 transition-transform`}>
                <tool.icon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{tool.name}</h3>
                <p className="text-sm text-slate-500">{tool.desc}</p>
              </div>
              {tool.link && (
                <Link href={tool.link} target="_blank" className="absolute inset-0 z-10" aria-label={`Download ${tool.name}`} />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
