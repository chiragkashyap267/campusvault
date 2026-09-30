"use client";

import { useParams, useRouter } from "next/navigation";
import { Download, Heart, BookmarkPlus, ArrowLeft, FileText, ExternalLink, MessageSquare, Loader2, AlertTriangle } from "lucide-react";
import { useResource, useDownloadResource, useLikeResource } from "@/lib/hooks/useResources";
import { useToggleWishlist, useIsInWishlist } from "@/lib/hooks/useWishlist";
import { getComments, addComment } from "@/lib/firebase/firestore";
import { useAuthStore } from "@/lib/store/authStore";
import { getResourceTypeLabel, formatRelativeTime, formatBytes, cn } from "@/lib/utils";
import { Comment } from "@/lib/types";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ResourceViewerPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { data: resource, isLoading } = useResource(id);
  const downloadMut = useDownloadResource();
  const likeMut = useLikeResource();
  const wishlistMut = useToggleWishlist();
  const { data: inWishlist } = useIsInWishlist(user?.uid, id);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<{ loading: boolean; error: string | null; code: string | null }>({
    loading: false,
    error: null,
    code: null
  });

  useEffect(() => {
    if (resource?.fileFormat === "pdf" && resource.fileUrl) {
      setPdfStatus({ loading: true, error: null, code: null });
      // Direct HEAD fetch to Cloudinary is instantaneous and downloads 0 bytes!
      fetch(resource.fileUrl, { method: "HEAD" })
        .then((res) => {
          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              setPdfStatus({
                loading: false,
                error: "PDF delivery is restricted by Cloudinary account settings.",
                code: "CLOUDINARY_PDF_RESTRICTED"
              });
            } else {
              setPdfStatus({
                loading: false,
                error: `Failed to load PDF (HTTP ${res.status})`,
                code: "LOAD_ERROR"
              });
            }
          } else {
            setPdfStatus({ loading: false, error: null, code: null });
          }
        })
        .catch(() => {
          // Fallback to proxy-HEAD check in case of CORS or network strictness
          fetch(getProxyUrl(resource.fileUrl), { method: "HEAD" })
            .then(async (proxyRes) => {
              if (!proxyRes.ok) {
                const data = await fetch(getProxyUrl(resource.fileUrl)).then(r => r.json()).catch(() => ({}));
                setPdfStatus({
                  loading: false,
                  error: data.error || `Failed (HTTP ${proxyRes.status})`,
                  code: data.code || null
                });
              } else {
                setPdfStatus({ loading: false, error: null, code: null });
              }
            })
            .catch(() => {
              setPdfStatus({ loading: false, error: "Failed to connect to PDF server", code: "CONN_ERROR" });
            });
        });
    } else {
      setPdfStatus({ loading: false, error: null, code: null });
    }
  }, [resource?.fileUrl]);

  const isLiked = user ? resource?.likedBy?.includes(user.uid) : false;

  useEffect(() => {
    if (id) getComments(id).then(setComments);
  }, [id]);

  // Proxy URL for inline viewing (sets correct Content-Type for Edge)  
  const getProxyUrl = (url: string) => {
    if (!url) return url;
    return `/api/proxy?url=${encodeURIComponent(url)}`;
  };

  // Direct CDN download flag (bypasses Next.js proxy for speed)
  const getDirectDownloadUrl = (url: string) => {
    if (!url) return url;
    if (url.includes("/upload/")) {
      return url.replace("/upload/", "/upload/fl_attachment/");
    }
    return url;
  };

  // Proxy URL that forces download with correct filename (fallback)
  const getDownloadUrl = (url: string, title: string) => {
    if (!url) return url;
    const filename = `${title.replace(/[^a-zA-Z0-9_\-]/g, "_")}.pdf`;
    return `/api/proxy?url=${encodeURIComponent(url)}&download=${encodeURIComponent(filename)}`;
  };

  const handleDownload = async () => {
    if (!resource) return;
    if (pdfStatus.code === "CLOUDINARY_PDF_RESTRICTED") {
      toast.error("Download blocked by Cloudinary settings. See steps below!");
      return;
    }
    const filename = `${resource.title.replace(/[^a-zA-Z0-9_\-]/g, "_")}.pdf`;
    const saveFrom = (url: string) => {
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", filename);
      document.body.appendChild(a);
      a.click();
      a.remove();
    };

    try {
      // Direct from the CDN for speed; the proxy is the fallback.
      saveFrom(getDirectDownloadUrl(resource.fileUrl));
    } catch (error) {
      console.error("Direct download failed, using proxy fallback:", error);
      saveFrom(getDownloadUrl(resource.fileUrl, resource.title));
    }

    toast.success("Download started!");

    // Counted outside the try above, on purpose.
    //
    // The count used to sit inside it, after the click. A failed write — which
    // was every write by anyone but an admin, until the rules were fixed —
    // threw straight into the fallback and handed the student a second copy of
    // the same paper. And the fallback never counted at all, so every download
    // that took the proxy route was invisible to the trending row.
    //
    // A lost count is not worth a duplicate download, so a failure here stays
    // in the console.
    try {
      await downloadMut.mutateAsync(id);
    } catch (error) {
      console.error("Could not record the download:", error);
    }
  };

  const handleLike = async () => {
    if (!user) { toast.error("Sign in to like"); return; }
    await likeMut.mutateAsync({ resourceId: id, uid: user.uid, liked: !isLiked });
  };

  const handleWishlist = async () => {
    if (!user) { toast.error("Sign in to save"); return; }
    await wishlistMut.mutateAsync({ uid: user.uid, resourceId: id, inWishlist: !!inWishlist });
    toast.success(inWishlist ? "Removed from saved" : "Saved!");
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    setPostingComment(true);
    try {
      const comment: Omit<Comment, "id" | "createdAt"> = {
        resourceId: id,
        uid: user.uid,
        displayName: user.displayName || "Anonymous",
        photoURL: user.photoURL || undefined,
        text: commentText.trim(),
      };
      await addComment(id, comment);
      setComments((prev) => [{
        ...comment,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      }, ...prev]);
      setCommentText("");
    } finally {
      setPostingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container min-h-screen max-w-3xl space-y-4">
        <div className="skeleton h-8 w-24 rounded-lg" />
        <div className="skeleton h-48 rounded-xl" />
        <div className="skeleton h-10 rounded-xl" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted mb-4">Resource not found.</p>
          <Link href="/resources" className="btn-ghost px-6 py-2 rounded-xl text-sm">← Back to Resources</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container min-h-screen">
      <div className="max-w-3xl mx-auto page-stack">
        {/* Back */}
        <Link href="/resources" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Resources
        </Link>

        {/* Resource Info */}
        <div className="glass-card p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-soft border border-brand/30 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-brand" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="badge badge-cyan text-xs">{getResourceTypeLabel(resource.type)}</span>
                <span className="badge badge-purple text-xs">{resource.branch.toUpperCase()}</span>
                <span className="badge badge-cyan text-xs">Sem {resource.semester}</span>
              </div>
              <h1 className="font-display text-xl font-bold text-ink mb-1">{resource.title}</h1>
              <p className="text-muted text-sm">{resource.description}</p>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted mb-5">
            <span>By {resource.uploaderName}</span>
            <span>·</span>
            <span>{formatRelativeTime(resource.createdAt)}</span>
            {resource.size && <><span>·</span><span>{formatBytes(resource.size)}</span></>}
            {resource.subject && <><span>·</span><span>{resource.subject}</span></>}
          </div>

          {/* Tags */}
          {resource.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {resource.tags.map((tag) => (
                <span key={tag} className="badge badge-cyan text-[10px]">{tag}</span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleDownload}
                className="btn-primary flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm whitespace-nowrap"
              >
                <Download className="w-4 h-4 shrink-0" />
                Download ({resource.downloads})
              </button>
              <a 
                href={resource.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-ghost flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap"
              >
                <ExternalLink className="w-4 h-4 shrink-0" /> Open
              </a>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleLike}
                className={cn(
                  "p-2.5 rounded-xl border transition-all flex-1 sm:flex-initial flex justify-center items-center", 
                  isLiked 
                    ? "border-red-400/30 bg-red-400/10 text-red-400" 
                    : "border-line text-muted hover:text-red-400 hover:border-red-400/20"
                )}
                title="Like"
              >
                <Heart className={cn("w-4 h-4", isLiked && "fill-red-400")} />
              </button>
              <button
                onClick={handleWishlist}
                className={cn(
                  "p-2.5 rounded-xl border transition-all flex-1 sm:flex-initial flex justify-center items-center", 
                  inWishlist 
                    ? "border-brand/30 bg-brand-soft text-brand" 
                    : "border-line text-muted hover:text-brand hover:border-brand/30"
                )}
                title="Save to Wishlist"
              >
                <BookmarkPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* PDF Preview */}
        {resource.fileFormat === "pdf" && (
          <div className="glass-card overflow-hidden rounded-xl">
            <div className="p-4 border-b border-line flex items-center justify-between">
              <p className="text-sm font-medium text-ink-soft">Preview</p>
              {pdfStatus.code !== "CLOUDINARY_PDF_RESTRICTED" && (
                <a 
                  href={getDirectDownloadUrl(resource.fileUrl)}
                  download={`${resource.title.replace(/[^a-zA-Z0-9_\-]/g, "_")}.pdf`}
                  className="text-xs text-brand hover:text-brand"
                >
                  Download PDF
                </a>
              )}
            </div>
            <div className="relative w-full bg-white min-h-[300px]">
              {pdfStatus.loading ? (
                <div className="h-[400px] flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-brand animate-spin" />
                  <p className="text-xs text-muted animate-pulse">Loading PDF preview...</p>
                </div>
              ) : pdfStatus.error ? (
                pdfStatus.code === "CLOUDINARY_PDF_RESTRICTED" ? (
                  <div className="p-6 md:p-8 text-center space-y-6 bg-white backdrop-blur-xl border border-yellow-500/20 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" />
                    
                    <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-amber-400" />
                    </div>

                    <div className="space-y-2 max-w-md mx-auto">
                      <h3 className="text-lg font-bold text-ink">Cloudinary PDF Delivery Restricted</h3>
                      <p className="text-sm text-muted leading-relaxed">
                        Your Cloudinary environment blocks raw PDF delivery by default with a <code className="text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded text-xs font-mono">401 Unauthorized</code> error.
                      </p>
                    </div>

                    <div className="bg-surface-2 border border-line rounded-xl p-5 text-left max-w-lg mx-auto space-y-3">
                      <h4 className="text-xs font-semibold text-ink-soft uppercase tracking-wider">How to Enable in 1 Minute:</h4>
                      <ol className="text-xs text-muted space-y-2 list-decimal list-inside leading-relaxed">
                        <li>Log in to your <a href="https://cloudinary.com/console" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-0.5">Cloudinary Console <ExternalLink className="w-3 h-3" /></a></li>
                        <li>Click the <strong className="text-ink">Settings</strong> gear icon (bottom-left corner)</li>
                        <li>Select the <strong className="text-ink">Security</strong> tab from the menu</li>
                        <li>Scroll down to the <strong className="text-ink">"PDF and ZIP files delivery"</strong> section</li>
                        <li>Uncheck <strong className="text-amber-400">"Restrict PDF and ZIP files delivery"</strong> (or check <strong className="text-brand">"Allow delivery of PDF and ZIP files"</strong>)</li>
                        <li>Click the <strong className="text-emerald-400">"Save"</strong> button at the bottom</li>
                      </ol>
                    </div>

                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={() => {
                          setPdfStatus({ loading: true, error: null, code: null });
                          fetch(getProxyUrl(resource.fileUrl))
                            .then(async (res) => {
                              if (res.ok) {
                                setPdfStatus({ loading: false, error: null, code: null });
                                toast.success("PDF delivery works perfectly now!");
                              } else {
                                const data = await res.json().catch(() => ({}));
                                setPdfStatus({
                                  loading: false,
                                  error: data.error || `Failed (HTTP ${res.status})`,
                                  code: data.code || null
                                });
                                toast.error("Still returning restricted error. Did you save the settings?");
                              }
                            })
                            .catch(() => {
                              setPdfStatus({ loading: false, error: "Failed to connect", code: "CONN_ERROR" });
                            });
                        }}
                        className="btn-primary px-5 py-2.5 rounded-xl text-sm"
                      >
                        Verify Settings & Refresh
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center gap-4 text-center px-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">Error Loading PDF Preview</p>
                      <p className="text-xs text-muted mt-1">{pdfStatus.error}</p>
                    </div>
                    <div className="flex gap-2">
                      <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-primary px-4 py-2 rounded-xl text-xs">
                        Open Direct URL
                      </a>
                    </div>
                  </div>
                )
              ) : (
                <>
                  <iframe
                    src={resource.fileUrl}
                    className="w-full h-[600px] border-0"
                    title={resource.title}
                  />
                  <div className="p-4 text-center border-t border-line flex flex-wrap gap-2 justify-center">
                    <p className="text-xs text-muted w-full mb-1">Preview not loading?</p>
                    <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-primary px-4 py-2 rounded-xl text-sm inline-block">
                      Open in Browser
                    </a>
                    <a href={getDirectDownloadUrl(resource.fileUrl)} download={`${resource.title.replace(/[^a-zA-Z0-9_\-]/g, "_")}.pdf`} className="btn-ghost px-4 py-2 rounded-xl text-sm inline-block">
                      Download
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Image preview */}
        {resource.fileFormat === "image" && (
          <div className="glass-card overflow-hidden rounded-xl">
            <Image src={resource.fileUrl} alt={resource.title} width={800} height={600} className="w-full object-contain max-h-[500px]" />
          </div>
        )}

        {/* Comments */}
        <div className="glass-card p-6">
          <h2 className="font-display font-bold text-ink mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand" />
            Comments ({comments.length})
          </h2>

          {user ? (
            <form onSubmit={handleComment} className="flex gap-2 mb-6">
              <input
                className="input-field flex-1"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" disabled={postingComment || !commentText.trim()} className="btn-primary px-4 py-2 rounded-xl text-sm disabled:opacity-40">
                {postingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
              </button>
            </form>
          ) : (
            <p className="text-muted text-sm mb-6">
              <Link href="/login" className="text-brand hover:underline">Sign in</Link> to comment.
            </p>
          )}

          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-soft to-brand-soft flex items-center justify-center text-xs font-bold text-brand shrink-0">
                  {c.displayName[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-ink">{c.displayName}</span>
                    <span className="text-[10px] text-slate-400">{formatRelativeTime(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-muted">{c.text}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-4">No comments yet. Be the first!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
