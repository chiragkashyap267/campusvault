"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle } from "lucide-react";

const FAQS = [
  {
    question: "Is CampusVault completely free to use?",
    answer: "Yes! All study materials, PYQs, and local tools like the Notes Editor and Todo tracker are 100% free for all students.",
  },
  {
    question: "Do I need to login to download notes?",
    answer: "No, you don't need an account to browse and download resources. However, you do need an account to upload resources, save items to your wishlist, or appear on the Leaderboard.",
  },
  {
    question: "How do I get on the Top Contributors Leaderboard?",
    answer: "Every time you upload a study resource (like a PYQ, Note, or Lab Manual) and it gets approved by the admin, your upload count increases. The top 3 contributors get featured on the podium!",
  },
  {
    question: "Are the resources verified?",
    answer: "Yes, all uploaded materials go through a quick admin review process before they become publicly available to ensure quality and relevance for GBPIET students.",
  },
  {
    question: "What happens to my Notes if I'm not logged in?",
    answer: "If you use the Notes or Todo features as a Guest, your data is saved locally on your browser. This means it won't sync across your devices until you log in.",
  },
];

export function FAQSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const qRefs = useRef<HTMLDivElement[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        qRefs.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, stagger: 0.1, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#030712]" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container-app relative z-10 max-w-4xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Everything you need to know about using CampusVault effectively for your academic journey.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                ref={(el) => { if (el) qRefs.current[i] = el; }}
                className={`glass-card rounded-2xl overflow-hidden transition-colors ${
                  isOpen ? "border-cyan-500/30 bg-white/[0.04]" : "border-white/5 hover:border-white/10"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className={`font-semibold text-lg ${isOpen ? "text-cyan-400" : "text-white"}`}>
                    {faq.question}
                  </span>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isOpen ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-slate-400"
                  }`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-0 text-slate-400 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
