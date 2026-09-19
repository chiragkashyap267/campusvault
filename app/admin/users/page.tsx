"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { redirect } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllUsers, getAdminUids, setUserAdmin } from "@/lib/firebase/firestore";
import { Search, Loader2, User as UserIcon, ShieldCheck, ShieldOff } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
import toast from "react-hot-toast";

export default function AdminUsersPage() {
  const { user, isAdmin, loading } = useAuthStore();
  if (!loading && (!user || !isAdmin)) redirect("/");

  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "all-users"],
    queryFn: getAllUsers,
    enabled: isAdmin,
  });

  const { data: adminUids } = useQuery({
    queryKey: ["admin", "admin-uids"],
    queryFn: getAdminUids,
    enabled: isAdmin,
  });

  const admins = new Set(adminUids ?? []);

  const toggleAdmin = useMutation({
    mutationFn: ({ uid, makeAdmin }: { uid: string; makeAdmin: boolean }) =>
      setUserAdmin(uid, makeAdmin, user!.uid),
    onSuccess: (_, { makeAdmin }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admin-uids"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "all-users"] });
      toast.success(makeAdmin ? "Admin access granted" : "Admin access removed");
    },
    onError: (err: Error) => toast.error(err.message || "Could not change admin access"),
  });

  const [search, setSearch] = useState("");

  const filtered = users?.filter((u) =>
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  // Admins first, so the people with access are visible without searching.
  const sorted = [...filtered].sort((a, b) => {
    const diff = Number(admins.has(b.uid)) - Number(admins.has(a.uid));
    return diff !== 0 ? diff : (a.displayName || a.email || "").localeCompare(b.displayName || b.email || "");
  });

  const handleToggle = (uid: string, name: string, isCurrentlyAdmin: boolean) => {
    const message = isCurrentlyAdmin
      ? `Remove admin access from ${name}?\n\nThey will lose the admin panel, and the ability to approve or delete uploads.`
      : `Give ${name} full admin access?\n\nThey will be able to approve, edit and delete any upload, and manage other admins.`;
    if (!window.confirm(message)) return;
    toggleAdmin.mutate({ uid, makeAdmin: !isCurrentlyAdmin });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">User Manager</h1>
        <p className="text-slate-400 text-sm">
          {users?.length ?? 0} registered users · {admins.size} admin{admins.size === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input className="input-field pl-9" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {sorted.map((u) => {
            const userIsAdmin = admins.has(u.uid);
            const isSelf = u.uid === user?.uid;
            const pending = toggleAdmin.isPending && toggleAdmin.variables?.uid === u.uid;

            return (
              <div
                key={u.uid}
                className="glass-card p-4 flex flex-wrap items-center gap-3"
              >
                {u.photoURL ? (
                  <Image src={u.photoURL} alt="" width={36} height={36} className="rounded-full border border-white/10 shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center text-xs font-bold text-cyan-400 shrink-0">
                    {u.displayName?.[0]?.toUpperCase() || <UserIcon className="w-4 h-4" />}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white flex items-center gap-2 flex-wrap">
                    <span className="truncate">{u.displayName || "Anonymous"}</span>
                    {userIsAdmin && (
                      <span className="type-badge type-ct inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-500">{u.uploadCount ?? 0} uploads</p>
                  {u.createdAt && <p className="text-[10px] text-slate-700">{formatDate(u.createdAt)}</p>}
                </div>

                {/* An admin who demotes themselves has no way back in through
                    the app, so their own row offers nothing to click. */}
                {isSelf ? (
                  <span className="text-[11px] text-slate-600 shrink-0 w-28 text-right">You</span>
                ) : (
                  <button
                    onClick={() => handleToggle(u.uid, u.displayName || u.email || "this user", userIsAdmin)}
                    disabled={pending}
                    className={
                      userIsAdmin
                        ? "btn-ghost shrink-0 w-28 justify-center inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-300 hover:text-red-200 disabled:opacity-50"
                        : "btn-ghost shrink-0 w-28 justify-center inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold hover:text-cyan-300 disabled:opacity-50"
                    }
                  >
                    {pending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : userIsAdmin ? (
                      <><ShieldOff className="w-3.5 h-3.5" /> Remove</>
                    ) : (
                      <><ShieldCheck className="w-3.5 h-3.5" /> Make admin</>
                    )}
                  </button>
                )}
              </div>
            );
          })}
          {sorted.length === 0 && (
            <div className="glass-card p-10 text-center text-slate-500 text-sm">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
}
