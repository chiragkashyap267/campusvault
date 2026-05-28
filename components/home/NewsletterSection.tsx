"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, CheckCircle, Sparkles, BookOpen, Bell } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import toast from "react-hot-toast";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function NewsletterSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [branch, setBranch] = useState("MCA");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in your name and email.");
      return;
    }

    setLoading(true);
    try {
      // Check if already subscribed
      const existingQ = query(
        collection(db, "subscribers"),
        where("email", "==", email.trim().toLowerCase())
      );
      const existingSnap = await getDocs(existingQ);
      if (!existingSnap.empty) {
        toast.success("You're already subscribed! 🎉");
        setSubscribed(true);
        return;
      }

      await addDoc(collection(db, "subscribers"), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        branch,
        topic: "all",
        source: "homepage_newsletter",
        subscribedAt: serverTimestamp(),
      });

      setSubscribed(true);
      toast.success("Welcome aboard! You'll get personalized academic updates 🎓");
    } catch (err) {
      console.error("Newsletter subscribe error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: BookOpen, text: "Study materials matching your searches", color: "text-blue-500", bg: isLight ? "bg-blue-50" : "bg-blue-500/10" },
    { icon: Bell, text: "New uploads for your branch & semester", color: "text-purple-500", bg: isLight ? "bg-purple-50" : "bg-purple-500/10" },
    { icon: Sparkles, text: "Smart recommendations powered by your activity", color: "text-amber-500", bg: isLight ? "bg-amber-50" : "bg-amber-500/10" },
  ];

  return (
    <section className={cn("section-padding", isLight ? "bg-white" : "bg-transparent")}>
      <div className="container-app">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl"
          >
            {/* Background */}
            <div className="newsletter-gradient absolute inset-0 z-0" />
            <div className="absolute inset-0 z-0 opacity-30"
              style={{
                backgroundImage: "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)"
              }}
            />

            {/* Floating decoration */}
            <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/5 blur-2xl z-0" />
            <div className="absolute -bottom-8 -left-8 w-64 h-64 rounded-full bg-white/5 blur-2xl z-0" />

            <div className="relative z-10 grid md:grid-cols-2 gap-10 p-8 md:p-12 items-center">
              {/* Left: Copy */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-bold mb-4 backdrop-blur-sm">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Smart Academic Newsletter</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-display font-black text-white leading-tight mb-3">
                  Never miss a{" "}
                  <span className="text-blue-200">study resource</span>{" "}
                  again.
                </h2>

                <p className="text-blue-100 text-sm md:text-base leading-relaxed mb-8">
                  Get personalized emails whenever new notes, PYQs, or CT papers matching your searches are added to CampusVault. 100% free, no spam.
                </p>

                {/* Benefits */}
                <div className="space-y-3">
                  {benefits.map((b, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 + 0.3 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                        <b.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm text-blue-100 font-medium">{b.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right: Form */}
              <div>
                {subscribed ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-8 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">You&apos;re in! 🎉</h3>
                    <p className="text-blue-100 text-sm leading-relaxed">
                      We&apos;ll send you personalized academic updates based on what you search and browse on CampusVault.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/12 backdrop-blur-md border border-white/20 rounded-2xl p-6 space-y-4 shadow-2xl"
                  >
                    <h3 className="text-lg font-bold text-white mb-1">Subscribe for free</h3>
                    <p className="text-blue-200 text-xs mb-4">Join thousands of GBPIET students staying ahead.</p>

                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/25 text-white placeholder-blue-200 text-sm outline-none focus:border-white/50 focus:bg-white/20 transition-all"
                      />
                      <input
                        type="email"
                        placeholder="student@gbpiet.ac.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/25 text-white placeholder-blue-200 text-sm outline-none focus:border-white/50 focus:bg-white/20 transition-all"
                      />
                      <select
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/25 text-white text-sm outline-none focus:border-white/50 focus:bg-white/20 transition-all appearance-none cursor-pointer"
                        style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "white" }}
                      >
                        <option value="MCA" style={{ background: "#1e40af", color: "white" }}>MCA Programme</option>
                        <option value="BTECH" style={{ background: "#1e40af", color: "white" }}>B.Tech Program</option>
                        <option value="MTECH" style={{ background: "#1e40af", color: "white" }}>M.Tech / Research</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-white text-blue-700 font-bold py-3.5 rounded-xl text-sm hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="w-4 h-4 rounded-full border-2 border-blue-700 border-t-transparent animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>{loading ? "Subscribing..." : "Subscribe — It's Free"}</span>
                    </button>

                    <p className="text-[11px] text-blue-200 text-center leading-relaxed">
                      No spam ever. Unsubscribe anytime from your profile settings.
                    </p>
                  </motion.form>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
