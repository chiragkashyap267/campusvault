"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store/authStore";
import { redirect } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "@/lib/firebase/firestore";
import { Search, Loader2, User as UserIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Image from "next/image";

export default function AdminUsersPage() {
  const { user, isAdmin, loading } = useAuthStore();
  if (!loading && (!user || !isAdmin)) redirect("/");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "all-users"],
    queryFn: getAllUsers,
    enabled: isAdmin,
  });
  const [search, setSearch] = useState("");

  const filtered = users?.filter((u) =>
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-white mb-1">User Manager</h1>
        <p className="text-slate-400 text-sm">{users?.length ?? 0} registered users.</p>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input className="input-field pl-9" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <motion.div key={u.uid} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 flex items-center gap-3">
              {u.photoURL ? (
                <Image src={u.photoURL} alt="" width={36} height={36} className="rounded-full border border-white/10 shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center text-xs font-bold text-cyan-400 shrink-0">
                  {u.displayName?.[0]?.toUpperCase() || <UserIcon className="w-4 h-4" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{u.displayName || "Anonymous"}</p>
                <p className="text-xs text-slate-500 truncate">{u.email}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-slate-500">{u.uploadCount ?? 0} uploads</p>
                {u.createdAt && <p className="text-[10px] text-slate-700">{formatDate(u.createdAt)}</p>}
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="glass-card p-10 text-center text-slate-500 text-sm">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
}
