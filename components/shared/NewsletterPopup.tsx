"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, Check, Sparkles, RefreshCw, Bell } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

export function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Show popup 2.5 seconds after mounting, unless they already successfully subscribed
    const hasSubscribed = localStorage.getItem("campusvault_subscribed") === "true";
    if (hasSubscribed) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      // Save email with default values for name and branch for backwards compatibility
      await addDoc(collection(db, "subscribers"), {
        name: "Student",
        email: email.trim().toLowerCase(),
        branch: "ALL",
        topic: "weekly-digest",
        subscribedAt: serverTimestamp(),
        source: "global-popup"
      });

      // Try calling our real email serverless API route to trigger a real welcome email!
      try {
        const appOrigin = typeof window !== "undefined" ? window.location.origin : "https://campusvault.vercel.app";
        await fetch("/api/marketing/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientEmail: email.trim().toLowerCase(),
            studentName: "Student",
            subject: "Welcome to CampusVault Digests! 📚",
            headline: "Thank you for subscribing to study alerts!",
            message: `Hey student!\n\nYou've successfully subscribed to CampusVault academic digests.\n\nWe will regularly update you with study notes, previous year exam papers (PYQs), class tests, and syllabus templates!\n\nAlso, we highly encourage you to upload papers, books, and study guides you have to help other students succeed. Let's build a stronger campus together!\n\nCheck back regularly at ${appOrigin}\n\nWarm regards,\nCampusVault Outreach Team`,
            templateStyle: "sky"
          })
        });
      } catch (mailErr) {
        console.warn("Welcome email routing skipped:", mailErr);
      }

      toast.success("Subscribed successfully! Check your inbox.");
      localStorage.setItem("campusvault_subscribed", "true");
      setSuccess(true);
      
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error("Error subscribing:", err);
      toast.error("Subscription failed. Please check your network and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="relative w-full max-w-md glass rounded-3xl border border-cyan-400/20 overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.5)] p-6 md:p-8"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer z-10"
              aria-label="Dismiss subscription popup"
            >
              <X className="w-5 h-5" />
            </button>

            {success ? (
              <div className="text-center py-6 animate-bounce-in">
                <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/35 flex items-center justify-center text-cyan-400 mx-auto mb-4">
                  <Check className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-display font-black text-white">Welcome Aboard!</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  We've successfully registered <span className="text-cyan-400 font-bold">{email}</span>. 
                  Watch your inbox for handwritten notes, study guides, and PYQ updates!
                </p>
              </div>
            ) : (
              <div>
                {/* Header Icon */}
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-black shrink-0 shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                    <Bell className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                      <Sparkles className="w-3 h-3" />
                      <span>Never Miss a Paper</span>
                    </div>
                    <h3 className="text-lg font-display font-black text-white mt-1">Get Free Study Digests</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Stay ahead in your classes! Join our email newsletter to get instant alerts 
                  whenever toppers upload handpicked notes, PYQs, and class test papers matching your branch.
                </p>

                {/* Subscription Form */}
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mail ID</label>
                    <input
                      type="email"
                      placeholder="e.g. chirag@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field py-2.5 text-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 btn-primary font-bold py-3 rounded-xl text-xs mt-6 cursor-pointer"
                  >
                    {submitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4.5 h-4.5" />
                    )}
                    <span>Subscribe to Study Digests</span>
                  </button>
                </form>

                <div className="mt-5 pt-3.5 border-t border-white/5 flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                  <span>🔒 Direct Inbox Delivery</span>
                  <span>📩 Free Forever</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
