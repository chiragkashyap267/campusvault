"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { FileText, Users, Download, Star } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const STATS = [
  { icon: <FileText className="w-5 h-5" />, label: "Resources", value: 500, suffix: "+" },
  { icon: <Users className="w-5 h-5" />, label: "Students", value: 1200, suffix: "+" },
  { icon: <Download className="w-5 h-5" />, label: "Downloads", value: 8000, suffix: "+" },
  { icon: <Star className="w-5 h-5" />, label: "Reviews", value: 99, suffix: "%" },
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = (value / duration) * 16;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export function StatsSection() {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  return (
    <section className={cn("py-16 relative transition-colors duration-300", isLight ? "bg-white" : "")}>
      <div className="divider mb-16" />
      <div className="container-app">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className={cn(
                "p-6 text-center group rounded-xl border transition-all",
                isLight
                  ? "bg-white border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md"
                  : "glass-card"
              )}
            >
              <div className={cn(
                "inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 transition-all",
                isLight
                  ? "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                  : "bg-cyan-400/10 text-cyan-400 group-hover:bg-cyan-400/20"
              )}>
                {stat.icon}
              </div>
              <p className="text-3xl font-display font-bold gradient-text mb-1">
                <Counter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-500")}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
