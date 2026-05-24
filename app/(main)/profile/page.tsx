"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store/authStore";
import { updateUserProfile } from "@/lib/firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { useDropzone } from "react-dropzone";
import { Camera, Save, Loader2, Globe, Link2, ExternalLink } from "lucide-react";
import { useUserResources } from "@/lib/hooks/useResources";
import { ResourceCard } from "@/components/resources/ResourceCard";
import Image from "next/image";
import { redirect } from "next/navigation";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, setUser, loading } = useAuthStore();
  if (!loading && !user) redirect("/login");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    github: user?.socialLinks?.github || "",
    linkedin: user?.socialLinks?.linkedin || "",
    twitter: user?.socialLinks?.twitter || "",
  });

  const { data: uploads } = useUserResources(user?.uid);
  const approved = uploads?.filter((r) => r.status === "approved") ?? [];

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: async ([file]) => {
      if (!file || !user) return;
      setUploading(true);
      try {
        const result = await uploadToCloudinary(file);
        await updateUserProfile(user.uid, { photoURL: result.secure_url });
        setUser({ ...user, photoURL: result.secure_url });
        toast.success("Profile photo updated!");
      } catch {
        toast.error("Failed to upload photo");
      } finally {
        setUploading(false);
      }
    },
  });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: form.displayName,
        bio: form.bio,
        socialLinks: { github: form.github, linkedin: form.linkedin, twitter: form.twitter },
      });
      setUser({ ...user, displayName: form.displayName, bio: form.bio });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="font-display text-2xl font-bold text-white">
          My Profile
        </motion.h1>

        {/* Avatar + Basic Info */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <div className="flex items-start gap-5 flex-wrap">
            {/* Avatar */}
            <div className="relative group" {...getRootProps()}>
              <input {...getInputProps()} />
              {user?.photoURL ? (
                <Image src={user.photoURL} alt="" width={80} height={80} className="rounded-full border-2 border-cyan-400/30 object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-2xl font-bold text-black">
                  {user?.displayName?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
              </div>
            </div>

            <div className="flex-1 space-y-3 min-w-0">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Display Name</label>
                <input className="input-field" value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Email</label>
                <input className="input-field opacity-50" value={user?.email || ""} disabled />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Bio</label>
                <textarea className="input-field resize-none" rows={2} placeholder="Tell others about yourself..." value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Social Links */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
          <h2 className="font-semibold text-white mb-4 text-sm">Social Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: "github", icon: <Globe className="w-4 h-4" />, placeholder: "github.com/username" },
              { key: "linkedin", icon: <Link2 className="w-4 h-4" />, placeholder: "linkedin.com/in/username" },
              { key: "twitter", icon: <ExternalLink className="w-4 h-4" />, placeholder: "twitter.com/username" },
            ].map((s) => (
              <div key={s.key} className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{s.icon}</div>
                <input
                  className="input-field pl-9"
                  placeholder={s.placeholder}
                  value={form[s.key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [s.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </motion.div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Profile"}
        </button>

        {/* Contributions */}
        {approved.length > 0 && (
          <section>
            <h2 className="font-display text-lg font-bold text-white mb-4">Public Contributions ({approved.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {approved.map((r, i) => <ResourceCard key={r.id} resource={r} index={i} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
