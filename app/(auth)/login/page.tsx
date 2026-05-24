"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Mail, Lock, Loader2, Globe } from "lucide-react";
import { signInWithGoogle, signInWithEmail } from "@/lib/firebase/auth";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message.replace("Firebase: ", "") : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google!");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error("Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 sm:p-8">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-6 justify-center">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-black" />
        </div>
        <span className="font-display font-bold text-white">CampusVault <span className="text-cyan-400">GBPIET</span></span>
      </div>

      <h1 className="font-display text-xl font-bold text-white text-center mb-1">Welcome Back</h1>
      <p className="text-slate-400 text-sm text-center mb-6">Sign in to your account</p>

      {/* Google */}
      <button onClick={handleGoogle} disabled={googleLoading} className="btn-ghost w-full py-3 rounded-xl mb-4 flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-40">
        {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4 text-red-400" />}
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-slate-600">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <form onSubmit={handleEmail} className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input type="email" required className="input-field pl-9" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input type="password" required className="input-field pl-9" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-4">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-cyan-400 hover:underline font-medium">Register</Link>
      </p>
    </motion.div>
  );
}
