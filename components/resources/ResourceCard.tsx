"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Download, Heart, BookmarkPlus, FileText, Image as ImageIcon, Archive, File } from "lucide-react";
import { Resource, ResourceType } from "@/lib/types";
import { getResourceTypeLabel, formatRelativeTime, cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import { useToggleWishlist, useIsInWishlist } from "@/lib/hooks/useWishlist";
import { useLikeResource } from "@/lib/hooks/useResources";
import toast from "react-hot-toast";

/**
 * Accent class per resource type. Exam papers get the two strongest colours
 * because finding them is the main job of the library; everything else stays
 * deliberately quiet so the two that matter stand out at a glance.
 */
function typeAccent(type: ResourceType): string {
  switch (type) {
    case "pyq": return "type-pyq";
    case "ct": return "type-ct";
    case "notes": return "type-notes";
    case "study_material":
    case "lab_manual": return "type-book";
    default: return "type-other";
  }
}

/** Short labels — "PYQ Paper" wastes half the width of a badge on a phone. */
function shortTypeLabel(type: ResourceType): string {
  switch (type) {
    case "pyq": return "PYQ";
    case "ct": return "CT";
    case "study_material": return "Book";
    case "lab_manual": return "Lab";
    default: return getResourceTypeLabel(type);
  }
}

function FileFormatIcon({ format, className = "w-4 h-4" }: { format: string; className?: string }) {
  switch (format) {
    case "pdf": return <FileText className={cn("text-red-400/80", className)} />;
    case "image": return <ImageIcon className={cn("text-emerald-400/80", className)} />;
    case "zip": return <Archive className={cn("text-amber-400/80", className)} />;
    default: return <File className={cn("text-sky-400/80", className)} />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: "type-book",
    pending: "type-notes",
    rejected: "type-other",
  };
  return <span className={`type-badge ${styles[status] || "type-other"}`}>{status}</span>;
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

  // Cloudinary renders a PDF's first page as a .jpg at the same path.
  const isCloudinaryPdf =
    resource.fileFormat === "pdf" && resource.fileUrl.includes("res.cloudinary.com");
  const thumbnailUrl = isCloudinaryPdf ? resource.fileUrl.replace(/\.pdf$/i, ".jpg") : null;

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut", delay: Math.min(index, 6) * 0.025 }}
      className="glass-card resource-card group cursor-pointer hover:border-cyan-400/25 hover:bg-white/[0.055]"
    >
      {/* Preview — first page of the PDF, or the format icon as a fallback */}
      <div className="resource-thumb">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-top opacity-75 group-hover:opacity-100 transition-opacity"
            onError={(e) => {
              // Fall back to the icon underneath rather than leaving a gap.
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        {!thumbnailUrl && <FileFormatIcon format={resource.fileFormat} className="w-5 h-5" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 self-stretch">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`type-badge ${typeAccent(resource.type)}`}>
            {shortTypeLabel(resource.type)}
          </span>
          {resource.semester && <span className="meta-chip">Sem {resource.semester}</span>}
          <span className="meta-chip uppercase">{resource.branch}</span>
          {showStatus && <StatusBadge status={resource.status} />}
        </div>

        <h3 className="resource-title group-hover:text-cyan-400 transition-colors">
          {resource.title}
        </h3>

        {resource.subject && (
          <p className="text-[11px] text-slate-500 truncate leading-tight">{resource.subject}</p>
        )}

        {/* Footer pinned to the bottom so every card's action row lines up */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-1.5">
          <div className="flex items-center gap-2.5 text-[11px] text-slate-500 min-w-0">
            <span className="flex items-center gap-1 shrink-0">
              <Download className="w-3 h-3" />
              {resource.downloads || 0}
            </span>
            <span className="hidden sm:flex items-center gap-1 shrink-0">
              <Heart className="w-3 h-3" />
              {resource.likes || 0}
            </span>
            <span className="truncate">{formatRelativeTime(resource.createdAt)}</span>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={handleLike}
              aria-label={isLiked ? "Unlike" : "Like"}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isLiked ? "text-red-400 bg-red-400/10" : "text-slate-500 hover:text-red-400 hover:bg-red-400/10"
              )}
            >
              <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-red-400")} />
            </button>
            <button
              onClick={handleWishlist}
              aria-label={inWishlist ? "Remove from saved" : "Save for later"}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                inWishlist ? "text-cyan-400 bg-cyan-400/10" : "text-slate-500 hover:text-cyan-400 hover:bg-cyan-400/10"
              )}
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** Skeleton mirroring the real card's two layouts so nothing shifts on load. */
export function ResourceCardSkeleton() {
  return (
    <div className="glass-card resource-card">
      {/* Sized to match .resource-thumb without using the class: that rule is
          defined later in the stylesheet and would override the skeleton's
          shimmer background, leaving a flat block. */}
      <div className="skeleton shrink-0 w-[3.25rem] h-16 sm:w-full sm:h-[6.5rem] rounded-lg" />
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex gap-1.5">
          <div className="skeleton h-4 w-10 rounded-md" />
          <div className="skeleton h-4 w-12 rounded-md" />
        </div>
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/2 rounded mt-auto" />
      </div>
    </div>
  );
}
