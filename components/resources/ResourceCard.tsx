"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Download, Heart, BookmarkPlus, Eye, FileText, Image as ImageIcon, Archive, File } from "lucide-react";
import { Resource } from "@/lib/types";
import { getResourceTypeLabel, formatRelativeTime, formatBytes, cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import { useToggleWishlist, useIsInWishlist } from "@/lib/hooks/useWishlist";
import { useLikeResource } from "@/lib/hooks/useResources";
import { useTheme } from "next-themes";
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
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const { data: inWishlist } = useIsInWishlist(user?.uid, resource.id);
  const toggleWishlist = useToggleWishlist();
  const likeResource = useLikeResource();

  const isLiked = user ? resource.likedBy?.includes(user.uid) : false;

  // Generate PDF glimpse thumbnail if applicable
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
      className={cn(
        "group relative flex flex-col h-full overflow-hidden cursor-pointer rounded-xl border transition-all duration-300",
        isLight
          ? "bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300"
          : "glass-card"
      )}
    >
      {/* Top border accent */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity",
        isLight ? "via-blue-400/50" : "via-cyan-400/40"
      )} />

      {/* Header */}
      <div className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
        <div className={cn(
          "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 border",
          isLight
            ? "bg-blue-50 border-blue-100"
            : "bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border-cyan-400/20"
        )}>
          <FileFormatIcon format={resource.fileFormat} className="w-3.5 h-3.5 sm:w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5 sm:mb-1">
            <span className="badge badge-cyan text-[9px] sm:text-[10px] uppercase tracking-wide px-1.5 py-0.5">
              {getResourceTypeLabel(resource.type)}
            </span>
            {showStatus && <StatusBadge status={resource.status} />}
          </div>
          <h3 className={cn(
            "text-xs sm:text-sm font-semibold line-clamp-2 leading-snug transition-colors",
            isLight ? "text-slate-800 group-hover:text-blue-600" : "text-white group-hover:text-cyan-400"
          )}>
            {resource.title}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 sm:px-4 pb-2.5 sm:pb-3 flex-1 flex flex-col gap-2 sm:gap-3">
        <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-1 sm:line-clamp-2 leading-relaxed">
          {resource.description}
        </p>

        {/* Thumbnail Preview Area */}
        <div className={cn(
          "relative aspect-[16/8] rounded-lg overflow-hidden border mt-auto",
          isLight ? "border-slate-200 bg-slate-50" : "border-white/5 bg-[#0a0f1e]"
        )}>
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={`${resource.title} Preview`}
              className="w-full h-full object-cover object-top opacity-60 transition-opacity group-hover:opacity-100"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={cn(
            `fallback-icon absolute inset-0 flex flex-col items-center justify-center p-2 sm:p-3 text-center ${thumbnailUrl ? 'hidden' : ''}`,
            isLight
              ? "bg-gradient-to-br from-slate-50 via-slate-100/90 to-slate-50"
              : "bg-gradient-to-br from-slate-900/80 via-[#0d1224]/90 to-[#070b19]/85"
          )}>
            <div className={cn(
              "w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center mb-1 sm:mb-1.5",
              isLight ? "bg-white border border-slate-200 shadow-sm" : "bg-white/[0.03] border border-white/[0.06] shadow-inner"
            )}>
              <FileFormatIcon format={resource.fileFormat} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
            <span className={cn(
              "text-[9px] sm:text-[10px] font-medium select-none max-w-full truncate px-1 transition-colors",
              isLight ? "text-slate-500 group-hover:text-blue-600" : "text-slate-400 group-hover:text-cyan-400"
            )}>
              {resource.title}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
          <span className="badge badge-purple text-[9px] sm:text-[10px] px-1.5 py-0.5">{resource.branch.toUpperCase()}</span>
          {resource.semester && (
            <span className="badge badge-cyan text-[9px] sm:text-[10px] px-1.5 py-0.5">Sem {resource.semester}</span>
          )}
          {resource.subject && (
            <span className={cn(
              "text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full hidden sm:inline-flex",
              isLight ? "bg-slate-100 text-slate-500" : "bg-white/5 text-slate-400"
            )}>
              {resource.subject}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 sm:pt-3 flex items-center justify-between gap-1 sm:gap-2 mt-auto">
        <div className={cn(
          "flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs",
          isLight ? "text-slate-400" : "text-slate-500"
        )}>
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
              isLiked
                ? "text-red-400 bg-red-400/10"
                : "text-slate-500 hover:text-red-400 hover:bg-red-400/10"
            )}
          >
            <Heart className={cn("w-3 sm:w-3.5 h-3 sm:h-3.5", isLiked && "fill-red-400")} />
          </button>
          <button
            onClick={handleWishlist}
            className={cn(
              "p-1 sm:p-1.5 rounded-lg transition-all",
              inWishlist
                ? "text-cyan-400 bg-cyan-400/10"
                : "text-slate-500 hover:text-cyan-400 hover:bg-cyan-400/10"
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
    <div className="glass-card p-3 sm:p-4 flex flex-col gap-2.5 h-[190px] sm:h-[230px]">
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="skeleton w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl shrink-0" />
        <div className="flex-1 space-y-1.5 sm:space-y-2">
          <div className="skeleton h-3 sm:h-4 w-12 sm:w-16 rounded" />
          <div className="skeleton h-3 sm:h-4 w-full rounded" />
        </div>
      </div>
      <div className="skeleton h-2 sm:h-3 w-full rounded" />
      <div className="skeleton h-16 rounded-lg mt-auto" />
      <div className="flex gap-1.5 sm:gap-2 mt-2">
        <div className="skeleton h-4 sm:h-5 w-10 sm:w-12 rounded-full" />
        <div className="skeleton h-4 sm:h-5 w-8 sm:w-10 rounded-full" />
      </div>
    </div>
  );
}
