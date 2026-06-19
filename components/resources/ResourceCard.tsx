"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Download, Heart, BookmarkPlus, Eye, FileText, Image as ImageIcon, Archive, File } from "lucide-react";
import { Resource } from "@/lib/types";
import { getResourceTypeLabel, formatRelativeTime, cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import { useToggleWishlist, useIsInWishlist } from "@/lib/hooks/useWishlist";
import { useLikeResource } from "@/lib/hooks/useResources";
import toast from "react-hot-toast";

function FileFormatIcon({ format, className = "w-4 h-4" }: { format: string; className?: string }) {
  switch (format) {
    case "pdf": return <FileText className={cn("text-red-400", className)} />;
    case "image": return <ImageIcon className={cn("text-green-400", className)} />;
    case "zip": return <Archive className={cn("text-yellow-400", className)} />;
    default: return <File className={cn("text-blue-400", className)} />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: "badge-green",
    pending: "badge-yellow",
    rejected: "badge-red",
  };
  return (
    <span className={`badge ${styles[status] || "badge-cyan"} text-[9px] sm:text-[10px]`}>
      {status}
    </span>
  );
}

interface ResourceCardProps {
  resource: Resource;
  showStatus?: boolean;
  index?: number;
}

export function ResourceCard({ resource, showStatus = false, index = 0 }: ResourceCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: inWishlist } = useIsInWishlist(user?.uid, resource.id);
  const toggleWishlist = useToggleWishlist();
  const likeResource = useLikeResource();

  const isLiked = user ? resource.likedBy?.includes(user.uid) : false;

  // Generate thumbnail URL for Cloudinary-hosted PDFs
  const isCloudinaryPdf = resource.fileFormat === "pdf" && resource.fileUrl.includes("res.cloudinary.com");
  const thumbnailUrl = isCloudinaryPdf
    ? resource.fileUrl.replace(/\.pdf$/i, ".jpg")
    : null;

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error("Sign in to save resources"); return; }
    await toggleWishlist.mutateAsync({ uid: user.uid, resourceId: resource.id, inWishlist: !!inWishlist });
    toast.success(inWishlist ? "Removed from saved" : "Saved to wishlist!");
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error("Sign in to like resources"); return; }
    await likeResource.mutateAsync({ resourceId: resource.id, uid: user.uid, liked: !isLiked });
  };

  return (
    <motion.div
      onClick={() => router.push(`/resources/${resource.id}`)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="glass-card group relative flex flex-col h-full overflow-hidden cursor-pointer"
    >
      {/* Neon accent top border on hover */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Header */}
      <div className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/20 flex items-center justify-center shrink-0">
          <FileFormatIcon format={resource.fileFormat} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5 sm:mb-1">
            <span className="badge badge-cyan text-[9px] sm:text-[10px] uppercase tracking-wide px-1.5 py-0.5">
              {getResourceTypeLabel(resource.type)}
            </span>
            {showStatus && <StatusBadge status={resource.status} />}
          </div>
          <h3 className="text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-cyan-400 transition-colors">
            {resource.title}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 sm:px-4 pb-2.5 sm:pb-3 flex-1 flex flex-col gap-2">
        <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {resource.description}
        </p>

        {/* PDF / Image thumbnail */}
        {thumbnailUrl && (
          <div className="relative h-20 sm:h-24 rounded-lg overflow-hidden border border-white/5 bg-[#0a0f1e] mt-auto">
            <img
              src={thumbnailUrl}
              alt={`${resource.title} preview`}
              className="w-full h-full object-cover object-top opacity-70 group-hover:opacity-100 transition-opacity"
              onError={(e) => {
                (e.currentTarget.parentElement as HTMLElement).style.display = "none";
              }}
            />
          </div>
        )}

        {/* Tags row */}
        <div className="flex flex-wrap gap-1 mt-auto">
          <span className="badge badge-purple text-[9px] sm:text-[10px] px-1.5 py-0.5">{resource.branch.toUpperCase()}</span>
          {resource.semester && (
            <span className="badge badge-cyan text-[9px] sm:text-[10px] px-1.5 py-0.5">Sem {resource.semester}</span>
          )}
          {resource.subject && (
            <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-400 line-clamp-1 max-w-[100px] sm:max-w-none">
              {resource.subject}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1.5 sm:pt-2 flex items-center justify-between gap-1 mt-auto border-t border-white/[0.04]">
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500">
          <span className="flex items-center gap-0.5 sm:gap-1">
            <Download className="w-3 h-3" />
            {resource.downloads}
          </span>
          <span className="flex items-center gap-0.5 sm:gap-1">
            <Heart className="w-3 h-3" />
            {resource.likes}
          </span>
          <span className="hidden md:inline">{formatRelativeTime(resource.createdAt)}</span>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            onClick={handleLike}
            className={cn(
              "p-1 sm:p-1.5 rounded-lg transition-all",
              isLiked ? "text-red-400 bg-red-400/10" : "text-slate-500 hover:text-red-400 hover:bg-red-400/10"
            )}
          >
            <Heart className={cn("w-3 sm:w-3.5 h-3 sm:h-3.5", isLiked && "fill-red-400")} />
          </button>
          <button
            onClick={handleWishlist}
            className={cn(
              "p-1 sm:p-1.5 rounded-lg transition-all",
              inWishlist ? "text-cyan-400 bg-cyan-400/10" : "text-slate-500 hover:text-cyan-400 hover:bg-cyan-400/10"
            )}
          >
            <BookmarkPlus className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          </button>
          <Link
            href={`/resources/${resource.id}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1 sm:p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <Eye className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// Skeleton version
export function ResourceCardSkeleton() {
  return (
    <div className="glass-card p-3 sm:p-4 flex flex-col gap-2.5 h-[180px] sm:h-[230px]">
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="skeleton w-8 h-8 sm:w-10 sm:h-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-1.5 sm:space-y-2">
          <div className="skeleton h-3 w-12 rounded" />
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-3/4 rounded" />
        </div>
      </div>
      <div className="skeleton h-2 w-full rounded" />
      <div className="skeleton h-14 sm:h-20 rounded-lg mt-auto" />
      <div className="flex gap-1.5 mt-1">
        <div className="skeleton h-4 w-10 rounded-full" />
        <div className="skeleton h-4 w-8 rounded-full" />
      </div>
    </div>
  );
}
