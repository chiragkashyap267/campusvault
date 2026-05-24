"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Send, Loader2, Globe, MapPin, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const FAQS = [
  { q: "How do I upload resources?", a: "Sign in, click Upload, fill in the details and submit. Your upload will be reviewed by an admin." },
  { q: "How long does review take?", a: "Typically within 24–48 hours. You'll see the status in your Dashboard." },
  { q: "Can guests browse resources?", a: "Yes! Anyone can browse and view resources. Login is only needed to upload or save." },
  { q: "How do I become an admin?", a: "Contact the developer (Chirag Kashyap) via the form or email." },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate sending (replace with EmailJS integration)
    await new Promise((r) => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
    toast.success("Message sent! We'll get back to you soon.");
  };

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm">
            Have feedback, want to report an issue, or want to become a contributor? Drop us a message!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
            <h2 className="font-display font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" /> Send Message
            </h2>
            {sent ? (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">Message Sent!</p>
                <p className="text-slate-400 text-sm">We'll reply to your email soon.</p>
                <button onClick={() => { setSent(false); setForm({ name: "", email: "", message: "" }); }} className="btn-ghost mt-4 px-4 py-2 rounded-xl text-sm">Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Your Name</label>
                  <input className="input-field" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Chirag Kashyap" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Email</label>
                  <input type="email" className="input-field" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@gbpiet.ac.in" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Message</label>
                  <textarea className="input-field resize-none" rows={5} required value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Your message..." />
                </div>
                <button type="submit" disabled={sending} className="btn-primary w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </motion.div>

          {/* Info + FAQ */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="space-y-4">
            <div className="glass-card p-5 space-y-3">
              <h3 className="font-semibold text-white text-sm">Contact Info</h3>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>chiragkashyap@gbpiet.ac.in</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                <a href="https://github.com/chiragkashyap" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">github.com/chiragkashyap</a>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>GBPIET, Pauri Garhwal, Uttarakhand</span>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-semibold text-white text-sm mb-4">FAQs</h3>
              <div className="space-y-2">
                {FAQS.map((faq, i) => (
                  <div key={i} className="border border-white/[0.06] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full text-left p-3 text-sm text-white hover:bg-white/5 transition-all flex items-center justify-between gap-2"
                    >
                      <span className="font-medium">{faq.q}</span>
                      <span className="text-slate-500 shrink-0">{openFaq === i ? "−" : "+"}</span>
                    </button>
                    {openFaq === i && (
                      <div className="p-3 pt-0 text-xs text-slate-400 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
