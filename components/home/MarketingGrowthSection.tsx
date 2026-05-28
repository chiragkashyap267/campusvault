"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Mail, Users, ArrowRight, Check, RefreshCw, BarChart2 } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

const MARKETING_METRICS = [
  { label: "Free Email Bulletins", value: "Unlimited Dispatches", icon: Mail },
  { label: "Real-Time Tracking", value: "Subscriber Growth", icon: Users },
  { label: "Delivery Speed", value: "Instant Local Blast", icon: Sparkles },
  { label: "Campaign Metrics", value: "Interactive Dashboard", icon: BarChart2 },
];

export function MarketingGrowthSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [branch, setBranch] = useState("MCA");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      toast.error("Please provide both your name and college email.");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "subscribers"), {
        name,
        email,
        branch,
        topic: "newsletter-digest",
        subscribedAt: serverTimestamp(),
      });
      toast.success("Welcome aboard! You have successfully subscribed to study digests.");
      setName("");
      setEmail("");
      setSubscribed(true);
    } catch (error) {
      console.error("Error subscribing from home:", error);
      toast.error("Subscription failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-24 relative overflow-hidden bg-radial-cyan">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/3 right-10 w-72 h-72 rounded-full bg-cyan-400/5 blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl animate-float pointer-events-none" />

      <div className="container-app relative z-10">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Premium Pitch & Features */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Outreach Engine</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-display font-black text-white leading-tight mb-5">
              Interact and Share with <br />
              <span className="gradient-text glow-text">Completely Free Marketing</span>
            </h2>
            <p className="text-slate-400 leading-relaxed mb-8 max-w-xl text-sm md:text-base">
              CampusVault features a powerful Student Outreach suite that allows batch representatives, toppers, 
              and student authors to easily promote academic study packs. Completely free, highly integrated, 
              and simple for everyone.
            </p>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {MARKETING_METRICS.map((item) => (
                <div key={item.label} className="glass-card p-4 rounded-xl flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 shrink-0">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{item.label}</p>
                    <p className="text-sm text-white font-bold mt-0.5">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button directly to outreach hub */}
            <Link
              href="/marketing"
              className="inline-flex items-center gap-2 btn-primary font-bold py-3.5 px-7 rounded-xl text-sm shadow-[0_0_20px_rgba(56,189,248,0.2)] hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] group"
            >
              <span>Explore Visual Outreach Hub</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Right Column: Interactive Subscription Form Card */}
          <div className="glass-card p-6 md:p-8 rounded-3xl border border-cyan-400/10 shadow-[0_4px_32px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Mail className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Subscribe to Study Digests</h3>
                <p className="text-xs text-slate-500 mt-0.5">Handwritten notes, CT test papers, and syllabus updates.</p>
              </div>
            </div>

            {subscribed ? (
              <div className="py-8 text-center bg-cyan-500/5 border border-cyan-400/10 rounded-2xl animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-400/25 flex items-center justify-center text-cyan-400 mx-auto mb-3.5">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white text-base">You are on the list!</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  You will now receive weekly emails containing handpicked resources for your exams and labs.
                </p>
                <button
                  onClick={() => setSubscribed(false)}
                  className="text-xs text-cyan-400 underline mt-4 font-semibold hover:text-cyan-300 cursor-pointer"
                >
                  Subscribe another email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Student Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Chirag Kashyap"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">College Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. student@gbpiet.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">College branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="input-field cursor-pointer"
                  >
                    <option value="MCA">MCA (Computer Applications)</option>
                    <option value="BTECH">B.Tech (CSE, ECE, EE, ME, CE)</option>
                    <option value="MTECH">M.Tech Research</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 btn-ghost font-bold py-3.5 rounded-xl text-xs hover:border-cyan-400/50 cursor-pointer"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 text-cyan-400" />
                  )}
                  <span>Subscribe to Digests Free</span>
                </button>
              </form>
            )}

            <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              <span>🔒 Encrypted Database</span>
              <span>📩 Opt-out Anytime</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
