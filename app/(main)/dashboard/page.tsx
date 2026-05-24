"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { useUserResources } from "@/lib/hooks/useResources";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { ResourceCard, ResourceCardSkeleton } from "@/components/resources/ResourceCard";
import {
  Upload, BookmarkIcon, LayoutDashboard, Star,
  Download, Clock, CheckCircle, XCircle, AlertCircle
} from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  const { user, loading } = useAuthStore();

  if (!loading && !user) redirect("/login");

  const { data: uploads, isLoading: loadingUploads } = useUserResources(user?.uid);
  const { data: wishlist } = useWishlist(user?.uid);

  const approved = uploads?.filter((r) => r.status === "approved") ?? [];
  const pending = uploads?.filter((r) => r.status === "pending") ?? [];
  const rejected = uploads?.filter((r) => r.status === "rejected") ?? [];
  const totalDownloads = approved.reduce((sum, r) => sum + r.downloads, 0);
  const totalLikes = approved.reduce((sum, r) => sum + r.likes, 0);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 flex items-center gap-4">
          {user?.photoURL ? (
            <Image src={user.photoURL} alt="" width={56} height={56} className="rounded-full border-2 border-cyan-400/30" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xl font-bold text-black">
              {user?.displayName?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-white">
              Welcome back, {user?.displayName?.split(" ")[0] || "Student"}!
            </h1>
            <p className="text-slate-400 text-sm">{user?.email}</p>
          </div>
          <Link href="/profile" className="btn-ghost px-4 py-2 rounded-xl text-sm hidden sm:flex items-center gap-2">
            Edit Profile
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <Upload className="w-4 h-4" />, label: "Uploads", value: uploads?.length || 0, color: "text-cyan-400" },
            { icon: <CheckCircle className="w-4 h-4" />, label: "Approved", value: approved.length, color: "text-green-400" },
            { icon: <Download className="w-4 h-4" />, label: "Downloads", value: totalDownloads, color: "text-blue-400" },
            { icon: <Star className="w-4 h-4" />, label: "Likes", value: totalLikes, color: "text-yellow-400" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-4 text-center">
              <div className={`flex justify-center mb-2 ${stat.color}`}>{stat.icon}</div>
              <p className="text-2xl font-bold text-white font-display">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Pending / Rejected alerts */}
        {pending.length > 0 && (
          <div className="glass p-4 rounded-xl border border-yellow-400/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
            <p className="text-sm text-yellow-400">{pending.length} upload{pending.length > 1 ? "s" : ""} pending admin review.</p>
          </div>
        )}
        {rejected.length > 0 && (
          <div className="glass p-4 rounded-xl border border-red-400/20 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{rejected.length} upload{rejected.length > 1 ? "s" : ""} were rejected.</p>
          </div>
        )}

        {/* My Uploads */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-cyan-400" /> My Uploads
            </h2>
            <Link href="/upload" className="btn-primary text-xs px-4 py-2 rounded-lg">+ Upload</Link>
          </div>
          {loadingUploads ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {Array.from({ length: 3 }).map((_, i) => <ResourceCardSkeleton key={i} />)}
            </div>
          ) : uploads && uploads.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {uploads.map((r, i) => <ResourceCard key={r.id} resource={r} showStatus index={i} />)}
            </div>
          ) : (
            <div className="glass-card p-10 text-center">
              <Upload className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No uploads yet. Share your first resource!</p>
            </div>
          )}
        </section>

        {/* Saved Resources */}
        <section>
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2 mb-4">
            <BookmarkIcon className="w-5 h-5 text-cyan-400" /> Saved Resources
          </h2>
          {wishlist && wishlist.length === 0 && (
            <div className="glass-card p-10 text-center">
              <BookmarkIcon className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No saved resources yet.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
