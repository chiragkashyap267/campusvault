"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/store/authStore";
import { redirect } from "next/navigation";
import { usePendingResources, useApproveResource, useRejectResource } from "@/lib/hooks/useResources";
import { CheckCircle, XCircle, FileText, ExternalLink, Loader2, Clock } from "lucide-react";
import { getResourceTypeLabel, formatRelativeTime, formatBytes } from "@/lib/utils";
import { incrementUserUploadCount } from "@/lib/firebase/firestore";
import toast from "react-hot-toast";

export default function AdminPendingPage() {
  const { user, isAdmin, loading } = useAuthStore();
  if (!loading && (!user || !isAdmin)) redirect("/");

  const { data: pending, isLoading } = usePendingResources();
  const approveMut = useApproveResource();
  const rejectMut = useRejectResource();

  const handleApprove = async (id: string, title: string, uploaderUid?: string) => {
    await approveMut.mutateAsync(id);
    if (uploaderUid) {
      await incrementUserUploadCount(uploaderUid).catch(() => {});
    }
    toast.success(`"${title}" approved and published!`);
  };

  const handleReject = async (id: string, title: string) => {
    await rejectMut.mutateAsync(id);
    toast.error(`"${title}" rejected.`);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-5 h-5 text-yellow-400" />
          <h1 className="font-display text-2xl font-bold text-white">Pending Uploads</h1>
        </div>
        <p className="text-slate-400 text-sm">{pending?.length ?? 0} resources waiting for review.</p>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
      ) : pending?.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-white font-semibold">All caught up!</p>
          <p className="text-slate-500 text-sm">No pending uploads.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {pending?.map((resource, i) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5"
              >
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm mb-1">{resource.title}</h3>
                    <p className="text-xs text-slate-500 mb-2 line-clamp-2">{resource.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="badge badge-purple">{resource.branch.toUpperCase()}</span>
                      <span className="badge badge-cyan">{getResourceTypeLabel(resource.type)}</span>
                      <span>Sem {resource.semester}</span>
                      {resource.subject && <span>{resource.subject}</span>}
                      {resource.size && <span>{formatBytes(resource.size)}</span>}
                      <span>by {resource.uploaderName}</span>
                      <span>{formatRelativeTime(resource.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg btn-ghost text-sm flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View
                    </a>
                    <button
                      onClick={() => handleReject(resource.id, resource.title)}
                      disabled={rejectMut.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition-all disabled:opacity-40"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                    <button
                      onClick={() => handleApprove(resource.id, resource.title, resource.uploadedBy)}
                      disabled={approveMut.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm bg-green-400/10 text-green-400 border border-green-400/20 hover:bg-green-400/20 transition-all disabled:opacity-40"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
