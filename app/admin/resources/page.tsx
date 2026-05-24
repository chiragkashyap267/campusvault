"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store/authStore";
import { redirect } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAllResources } from "@/lib/firebase/firestore";
import { useDeleteResource } from "@/lib/hooks/useResources";
import { Trash2, Search, ExternalLink, Loader2 } from "lucide-react";
import { getResourceTypeLabel, formatRelativeTime, cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AdminResourcesPage() {
  const { user, isAdmin, loading } = useAuthStore();
  if (!loading && (!user || !isAdmin)) redirect("/");

  const { data: resources, isLoading } = useQuery({
    queryKey: ["admin", "all-resources"],
    queryFn: getAllResources,
    enabled: isAdmin,
  });
  const deleteMut = useDeleteResource();
  const [search, setSearch] = useState("");

  const filtered = resources?.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.uploaderName.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await deleteMut.mutateAsync(id);
    toast.success("Resource deleted");
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Resource Manager</h1>
        <p className="text-slate-400 text-sm">{resources?.length ?? 0} total resources.</p>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input className="input-field pl-9" placeholder="Search by title or uploader..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={cn("badge text-[10px]",
                    r.status === "approved" ? "badge-green" : r.status === "pending" ? "badge-yellow" : "badge-red"
                  )}>{r.status}</span>
                  <span className="badge badge-cyan text-[10px]">{getResourceTypeLabel(r.type)}</span>
                </div>
                <p className="text-sm font-medium text-white truncate">{r.title}</p>
                <p className="text-xs text-slate-500">by {r.uploaderName} · {formatRelativeTime(r.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => handleDelete(r.id, r.title)} className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="glass-card p-10 text-center text-slate-500 text-sm">No resources found.</div>
          )}
        </div>
      )}
    </div>
  );
}
