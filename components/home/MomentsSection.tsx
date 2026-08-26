"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { getMoments, createMoment } from "@/lib/firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { useAuthStore } from "@/lib/store/authStore";
import type { Moment } from "@/lib/types";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const CAPTION_LIMIT = 60;

/**
 * Campus Moments — a wall of student photos that scrolls on its own.
 *
 * Anyone can see it; only a signed-in student can add to it. Upload is one
 * photo plus one line of text ("MCA batch 2026 group pic") — deliberately not
 * a form, because the whole point is that adding a picture takes ten seconds.
 *
 * The marquee is the same compositor-driven CSS animation as the news ticker:
 * the row is rendered twice and translated -50%, so nothing is measured at
 * runtime and the main thread does no work while it scrolls.
 */
export function MomentsSection() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  const { data: moments = [], isLoading } = useQuery({
    queryKey: ["moments"],
    queryFn: () => getMoments(24),
    staleTime: 5 * 60 * 1000,
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!pendingFile || !user) throw new Error("Nothing to upload");
      const result = await uploadToCloudinary(pendingFile);
      return createMoment({
        imageUrl: result.secure_url,
        caption: caption.trim().slice(0, CAPTION_LIMIT),
        uploaderId: user.uid,
        uploaderName: user.displayName || "Student",
      });
    },
    onSuccess: () => {
      toast.success("Added to Campus Moments");
      clearPending();
      queryClient.invalidateQueries({ queryKey: ["moments"] });
    },
    onError: (err: Error) => toast.error(err.message || "Upload failed"),
  });

  function clearPending() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    setCaption("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      toast.error("Please choose a JPG, PNG or WebP image");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be under 8MB");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  // Render the row twice so a -50% translation loops seamlessly.
  const track = moments.length > 0 ? [...moments, ...moments] : [];

  return (
    <section className="section-tight relative border-y border-white/5 bg-[#060b18]">
      <div className="container-app">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="section-title">Campus Moments</h2>
            <p className="section-subtitle">
              Photos from around GBPIET, posted by students.
            </p>
          </div>

          {user ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-ghost flex items-center gap-2 px-4 py-2 rounded-xl text-sm shrink-0"
            >
              <ImagePlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add a photo</span>
              <span className="sm:hidden">Add</span>
            </button>
          ) : (
            <a
              href="/login"
              className="text-xs text-slate-500 hover:text-cyan-400 transition-colors shrink-0 text-right"
            >
              Sign in to
              <br className="sm:hidden" /> add a photo
            </a>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          onChange={handlePick}
          className="hidden"
        />

        {/* Compose bar — appears only once a photo is chosen */}
        {pendingFile && previewUrl && (
          <div className="glass-card p-3 mb-5 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Selected photo preview"
              className="w-14 h-14 rounded-lg object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={caption}
                autoFocus
                maxLength={CAPTION_LIMIT}
                onChange={(e) => setCaption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && caption.trim()) upload.mutate();
                  if (e.key === "Escape") clearPending();
                }}
                placeholder="e.g. MCA batch 2026 group pic"
                className="input-field py-2 text-sm"
              />
              <p className="text-[11px] text-slate-600 mt-1">
                {CAPTION_LIMIT - caption.length} characters left
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => upload.mutate()}
                disabled={upload.isPending || !caption.trim()}
                className="btn-primary text-sm px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {upload.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
              </button>
              <button
                onClick={clearPending}
                disabled={upload.isPending}
                aria-label="Cancel"
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Marquee — full bleed, so photos run off both edges */}
      {isLoading ? (
        <div className="flex gap-3 px-4 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton w-36 h-36 sm:w-44 sm:h-44 rounded-xl shrink-0" />
          ))}
        </div>
      ) : moments.length === 0 ? (
        <div className="container-app">
          <div className="glass-card py-10 text-center">
            <ImagePlus className="w-8 h-8 text-slate-600 mx-auto mb-2.5" />
            <p className="text-sm text-slate-400">No moments yet.</p>
            <p className="text-xs text-slate-600 mt-1">
              {user ? "Be the first to add one." : "Sign in to add the first one."}
            </p>
          </div>
        </div>
      ) : (
        <div className="moments-marquee">
          <div className="moments-track">
            {track.map((m: Moment, i) => (
              <figure
                key={`${m.id}-${i}`}
                className="moments-item group"
                // The duplicated half is decorative; hide it from screen readers.
                aria-hidden={i >= moments.length}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.imageUrl}
                  alt={m.caption || "Campus moment"}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <figcaption className="moments-caption">
                  <span className="block truncate font-medium">{m.caption}</span>
                  <span className="block truncate text-[10px] opacity-70">
                    {m.uploaderName}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
