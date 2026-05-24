"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, MessageSquare, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

const TIPS = [
  "Hey! You can upload resources to help your peers and climb the leaderboard!",
  "Add your favorite assets to your personal Wishlist to easily access them later.",
  "Did you know? We have a Todo app to help you track assignments and tasks.",
  "Check out our Notes app! You can jot down important study points securely.",
  "Can't find a PYQ? Try using the Global Search in the navigation bar.",
  "Engage with others by dropping comments on helpful resources!",
];

export function RobotAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  // Show a new tip periodically if open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Optionally auto-open the assistant after 5 seconds if not dismissed
  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [pathname, dismissed]);

  if (dismissed) return null;

  return (
    <motion.div
      animate={{
        x: [0, -15, 10, -5, 15, 0],
        y: [0, -20, 5, -15, 10, 0],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mb-4 max-w-xs w-[280px] pointer-events-auto"
          >
            <div className="glass-card p-4 relative rounded-2xl rounded-br-sm border border-cyan-400/30 shadow-[0_0_30px_rgba(0,212,255,0.15)] bg-[#0f172a]/90">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-2 right-2 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-start gap-3 mt-1">
                <div className="w-8 h-8 rounded-full bg-cyan-400/10 flex items-center justify-center shrink-0 border border-cyan-400/20">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-sm text-slate-200 leading-relaxed pr-2">
                  {TIPS[currentTip]}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (isOpen) {
            setDismissed(true);
          } else {
            setIsOpen(true);
          }
        }}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,212,255,0.4)] pointer-events-auto relative group overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Bot className="w-7 h-7" />
        )}
      </motion.button>
    </motion.div>
  );
}
