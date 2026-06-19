"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, Check, Sparkles, RefreshCw, Bell } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuthStore } from "@/lib/store/authStore";
import toast from "react-hot-toast";

// How long (ms) to wait before re-showing the popup if user dismissed without subscribing
const REDISPLAY_DELAY_MS = 45_000; // 45 seconds

// localStorage key
const SUBSCRIBED_KEY = "campusvault_subscribed_v2";

export function NewsletterPopup() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const redisplayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if already subscribed (localStorage fast-path)
  const isAlreadySubscribed = () =>
    typeof window !== "undefined" &&
    localStorage.getItem(SUBSCRIBED_KEY) === "true";

  // Schedule or immediately show the popup
  const scheduleShow = (delayMs: number) => {
    if (isAlreadySubscribed()) return;
    if (redisplayTimer.current) clearTimeout(redisplayTimer.current);
    redisplayTimer.current = setTimeout(() => {
      if (!isAlreadySubscribed()) setIsOpen(true);
    }, delayMs);
  };

  useEffect(() => {
    if (isAlreadySubscribed()) return;

    // Pre-fill email from logged-in user
    if (user?.email) setEmail(user.email);

    // Show popup 3 seconds after mount
    scheduleShow(3000);

    return () => {
      if (redisplayTimer.current) clearTimeout(redisplayTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // When user closes without subscribing → re-show after REDISPLAY_DELAY_MS
  const handleClose = () => {
    setIsOpen(false);
    scheduleShow(REDISPLAY_DELAY_MS);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      // Save to Firestore subscribers collection
      // The blast route deduplicates by email, so duplicate entries are harmless
      await addDoc(collection(db, "subscribers"), {
        name: user?.displayName || "Student",
        email: trimmedEmail,
        branch: "ALL",
        topic: "weekly-digest",
        subscribedAt: serverTimestamp(),
        source: "global-popup",
        uid: user?.uid || null,
      });

      // 3. Send welcome email via our API route (fire-and-forget)
      fetch("/api/marketing/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: trimmedEmail,
          studentName: user?.displayName || "Student",
          subject: "🎉 Welcome to CampusVault Study Digests!",
          headline: "You're in! Study alerts are now active for your inbox.",
          message: `Hey there!\n\nYou've successfully subscribed to CampusVault academic digests.\n\nWe'll send you weekly updates with:\n📄 New PYQ & Class Test papers\n📝 Handwritten notes from toppers\n📚 Books, lab manuals & syllabus guides\n\nAlso — help your batchmates by uploading your own notes and CT papers! Every upload earns you leaderboard points 🏆\n\nAccess everything at campusvaultgbpiet.vercel.app\n\nWarm regards,\nCampusVault Team`,
          templateStyle: "royal",
        }),
      }).catch(err => console.warn("[NewsletterPopup] Welcome email failed:", err));

      // 4. Mark subscribed in localStorage — popup will never show again
      localStorage.setItem(SUBSCRIBED_KEY, "true");
      if (redisplayTimer.current) clearTimeout(redisplayTimer.current);

      setSuccess(true);
      toast.success("Subscribed! Welcome to CampusVault digests 🎉");

      setTimeout(() => {
        setIsOpen(false);
      }, 2500);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Subscribe to study digests">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal */}
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
              aria-label="Dismiss — will ask again shortly"
            >
              <X className="w-5 h-5" />
            </button>

            {success ? (
              <div className="text-center py-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 300 }}
                  className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/35 flex items-center justify-center text-cyan-400 mx-auto mb-4"
                >
                  <Check className="w-8 h-8" />
                </motion.div>
                <h3 className="text-xl font-display font-black text-white">You're In! 🎉</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Welcome! We've registered <span className="text-cyan-400 font-bold">{email}</span> for weekly study digests.
                  Check your inbox for a welcome email!
                </p>
              </div>
            ) : (
              <div>
                {/* Header */}
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-black shrink-0 shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                      <Sparkles className="w-3 h-3" />
                      <span>Free Weekly Digests</span>
                    </div>
                    <h3 className="text-lg font-display font-black text-white mt-1">Get Study Alerts in Your Inbox</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-5">
                  Stay ahead in your exams! Get instant email alerts whenever toppers upload
                  handpicked notes, PYQs, and class test papers — completely free, no spam.
                </p>

                {/* Perks row */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { icon: "📄", label: "PYQ Papers" },
                    { icon: "📝", label: "Handwritten Notes" },
                    { icon: "📚", label: "Books & Manuals" },
                  ].map(perk => (
                    <div key={perk.label} className="bg-white/5 rounded-xl p-2.5 text-center border border-white/5">
                      <div className="text-lg mb-1">{perk.icon}</div>
                      <div className="text-[10px] font-bold text-slate-400">{perk.label}</div>
                    </div>
                  ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="newsletter-email">
                      Your Email Address
                    </label>
                    <input
                      id="newsletter-email"
                      type="email"
                      placeholder="e.g. chirag@gmail.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input-field py-2.5 text-white"
                      required
                      autoComplete="email"
                    />
                  </div>

                  <button
                    id="newsletter-subscribe-btn"
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 btn-primary font-bold py-3 rounded-xl text-xs cursor-pointer disabled:opacity-60"
                  >
                    {submitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                    <span>{submitting ? "Subscribing..." : "Subscribe to Study Digests"}</span>
                  </button>
                </form>

                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                  <span>🔒 Zero Spam Policy</span>
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
