"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MonitorPlay, ArrowRight, Network, PenTool } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const POPULAR_TOOLS = [
  { name: "Cisco Packet Tracer", icon: Network, desc: "Network Sim", darkColor: "text-cyan-500", lightColor: "text-blue-600", link: "https://drive.google.com/file/d/1oTeCij1NV5emMxZbDmIRNh3LqiyPm6A-/view?usp=sharing" },
  { name: "CorelDraw 2021", icon: PenTool, desc: "Vector Design", darkColor: "text-green-500", lightColor: "text-emerald-600", link: "https://drive.google.com/file/d/11eX_ckzBqG8JjDqjQPMfsyyTg0zT1G1S/view?usp=drive_link" },
];

export function SoftwaresSection() {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  return (
    <section className={cn(
      "py-24 relative overflow-hidden border-y transition-colors duration-300",
      isLight ? "bg-slate-50 border-slate-200" : "bg-[#0a0f1e] border-white/5"
    )}>
      {/* Center glow */}
      <div className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-64 blur-[120px] rounded-full pointer-events-none",
        isLight ? "bg-blue-100/60" : "bg-cyan-500/5"
      )} />

      <div className="container-app relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          <div>
            <div className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4 border",
              isLight
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
            )}>
              <MonitorPlay className="w-4 h-4" />
              <span>Essential Tools</span>
            </div>
            <h2 className={cn(
              "text-3xl md:text-4xl font-display font-bold mb-4",
              isLight ? "text-slate-900" : "text-white"
            )}>
              Useful Softwares
            </h2>
            <p className={cn("max-w-xl", isLight ? "text-slate-500" : "text-slate-400")}>
              Download the IDEs, local servers, and development tools you need for your practicals and projects.
            </p>
          </div>
          <Link
            href="/resources?type=software"
            className={cn(
              "shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all group",
              isLight
                ? "bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 shadow-sm"
                : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"
            )}
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
              className={cn(
                "relative p-6 w-[280px] flex items-center gap-4 transition-all group rounded-xl",
                isLight
                  ? "bg-white border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md"
                  : "glass-card hover:border-cyan-500/30 hover:bg-white/[0.03]"
              )}
            >
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border",
                isLight
                  ? `bg-blue-50 border-blue-100 ${tool.lightColor}`
                  : `bg-white/5 border-white/10 ${tool.darkColor}`
              )}>
                <tool.icon className="w-7 h-7" />
              </div>
              <div>
                <h3 className={cn("font-semibold text-lg", isLight ? "text-slate-800" : "text-white")}>
                  {tool.name}
                </h3>
                <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-500")}>
                  {tool.desc}
                </p>
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
