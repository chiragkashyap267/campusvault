"use client";

import { useAuthStore } from "@/lib/store/authStore";
import { redirect } from "next/navigation";
import { usePendingResources } from "@/lib/hooks/useResources";
import { useQuery } from "@tanstack/react-query";
import { getAllResources, getAllUsers } from "@/lib/firebase/firestore";
import { FileText, Users, Download, Clock, Shield } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuthStore();
  if (!loading && (!user || !isAdmin)) redirect("/");

  const { data: pending } = usePendingResources();
  const { data: allResources } = useQuery({
    queryKey: ["admin", "all-resources"],
    queryFn: getAllResources,
    enabled: isAdmin,
  });
  const { data: allUsers } = useQuery({
    queryKey: ["admin", "all-users"],
    queryFn: getAllUsers,
    enabled: isAdmin,
  });

  const approved = allResources?.filter((r) => r.status === "approved") ?? [];
  const totalDownloads = approved.reduce((sum, r) => sum + r.downloads, 0);

  const stats = [
    { icon: <Clock className="w-5 h-5" />, label: "Pending Review", value: pending?.length ?? 0, color: "text-yellow-400", href: "/admin/pending" },
    { icon: <FileText className="w-5 h-5" />, label: "Total Resources", value: allResources?.length ?? 0, color: "text-cyan-400", href: "/admin/resources" },
    { icon: <Users className="w-5 h-5" />, label: "Total Users", value: allUsers?.length ?? 0, color: "text-blue-400", href: "/admin/users" },
    { icon: <Download className="w-5 h-5" />, label: "Total Downloads", value: totalDownloads, color: "text-green-400", href: "#" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h1 className="font-display text-2xl font-bold text-white">Admin Overview</h1>
        </div>
        <p className="text-slate-400 text-sm">Manage uploads, users, and platform content.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={s.label}>
            <Link href={s.href} className="glass-card p-5 block text-center hover:border-cyan-400/20 transition-all">
              <div className={`flex justify-center mb-2 ${s.color}`}>{s.icon}</div>
              <p className="text-2xl font-bold text-white font-display">{s.value.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </Link>
          </div>
        ))}
      </div>

      {/* Quick Action */}
      {pending && pending.length > 0 && (
        <div className="glass-card p-5 border border-yellow-400/20">
          <p className="text-yellow-400 font-semibold text-sm mb-2">
            🔔 {pending.length} upload{pending.length > 1 ? "s" : ""} awaiting review
          </p>
          <Link href="/admin/pending" className="btn-primary px-5 py-2 rounded-xl text-sm inline-block">
            Review Now →
          </Link>
        </div>
      )}
    </div>
  );
}
