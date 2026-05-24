"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Plus, Trash2, Download, Loader2, FileText, Save, CloudOff, LogIn } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { getNotes, saveNote, deleteNote } from "@/lib/firebase/firestore";
import { Note } from "@/lib/types";
import { formatRelativeTime, debounce, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";

// Lazy-load heavy markdown editor
const MDEditor = dynamic(() => import("@uiw/react-md-editor").then(m => m.default), {
  ssr: false,
  loading: () => <div className="skeleton h-64 rounded-xl" />,
});

const LOCAL_NOTES_KEY = "cv_guest_notes";

function loadLocalNotes(): Note[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_NOTES_KEY) || "[]"); }
  catch { return []; }
}

function saveLocalNotes(notes: Note[]) {
  localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
}

export default function NotesPage() {
  const { user, loading } = useAuthStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load notes based on auth state
  useEffect(() => {
    if (loading) return;
    if (user) {
      getNotes(user.uid).then((n) => { setNotes(n); setFetching(false); });
    } else {
      setNotes(loadLocalNotes());
      setFetching(false);
    }
  }, [user, loading]);

  const autoSave = useCallback(
    debounce(async (noteId: string | undefined, t: string, c: string) => {
      if (!t.trim()) return;
      setSaving(true);
      try {
        if (user) {
          // Save to Firestore
          const id = await saveNote(user.uid, { title: t, content: c }, noteId && noteId !== "" ? noteId : undefined);
          setNotes((prev) => {
            const exists = prev.find((n) => n.id === id);
            const updated: Note = {
              id,
              uid: user.uid,
              title: t,
              content: c,
              createdAt: exists?.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            if (exists) return prev.map((n) => n.id === id ? updated : n);
            return [updated, ...prev];
          });
          setActiveNote((prev) => prev ? { ...prev, id } : null);
        } else {
          // Save to localStorage
          const now = new Date().toISOString();
          const id = noteId || `local_${Date.now()}`;
          setNotes((prev) => {
            const exists = prev.find((n) => n.id === id);
            const updated: Note = {
              id,
              uid: "guest",
              title: t,
              content: c,
              createdAt: exists?.createdAt || now,
              updatedAt: now,
            };
            const newList = exists ? prev.map((n) => n.id === id ? updated : n) : [updated, ...prev];
            saveLocalNotes(newList);
            return newList;
          });
          setActiveNote((prev) => prev ? { ...prev, id } : null);
        }
      } finally {
        setSaving(false);
      }
    }, 2000),
    [user]
  );

  useEffect(() => {
    if (activeNote !== null) {
      autoSave(activeNote.id || undefined, title, content);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  const createNew = () => {
    const blank: Note = {
      id: "",
      uid: user?.uid || "guest",
      title: "Untitled Note",
      content: "# New Note\n\nStart writing...",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveNote(blank);
    setTitle(blank.title);
    setContent(blank.content);
  };

  const selectNote = (note: Note) => {
    setActiveNote(note);
    setTitle(note.title);
    setContent(note.content);
  };

  const handleDelete = async (noteId: string) => {
    if (!noteId) return;
    if (user) {
      await deleteNote(user.uid, noteId);
    }
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    if (!user) saveLocalNotes(updated);
    if (activeNote?.id === noteId) { setActiveNote(null); setTitle(""); setContent(""); }
    toast.success("Note deleted");
  };

  const exportPDF = async () => {
    if (!content) return;
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFont("helvetica");
    doc.setFontSize(18);
    doc.text(title || "Note", 14, 20);
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(content.replace(/[#*`]/g, ""), 180);
    doc.text(lines, 14, 35);
    doc.save(`${title || "note"}.pdf`);
    toast.success("PDF exported!");
  };

  return (
    <div className="min-h-screen">
      <div className="flex h-[calc(100vh-64px)] flex-col">

        {/* Guest warning banner */}
        {!loading && !user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-2.5 bg-amber-400/10 border-b border-amber-400/20 text-amber-300 text-sm shrink-0"
          >
            <CloudOff className="w-4 h-4 shrink-0" />
            <span className="flex-1">Notes are saved <strong>locally only</strong> — sign in to sync across devices.</span>
            <Link href="/login" className="flex items-center gap-1 font-semibold text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap">
              <LogIn className="w-3.5 h-3.5" /> Sign in
            </Link>
          </motion.div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 shrink-0 border-r border-white/[0.06] glass flex flex-col">
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="font-display font-bold text-white text-sm">Notes</h2>
              <button onClick={createNew} className="p-1.5 rounded-lg bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20 transition-all">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {fetching ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />)
              ) : notes.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-8">No notes yet. Create one!</p>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={cn(
                      "group p-3 rounded-lg cursor-pointer transition-all flex items-start justify-between gap-2",
                      activeNote?.id === note.id ? "bg-cyan-400/10 border border-cyan-400/20" : "hover:bg-white/5"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{note.title}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">{formatRelativeTime(note.updatedAt)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                      className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* Editor */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {activeNote !== null ? (
              <>
                <div className="p-4 border-b border-white/[0.06] flex items-center gap-3 shrink-0">
                  <input
                    className="flex-1 bg-transparent text-white font-display font-bold text-lg outline-none placeholder-slate-600"
                    placeholder="Note title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    {saving && <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />}
                    {!saving && <Save className="w-4 h-4 text-slate-600" />}
                    <button onClick={exportPDF} className="btn-ghost px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden" data-color-mode="dark">
                  <MDEditor
                    value={content}
                    onChange={(v) => setContent(v || "")}
                    height="100%"
                    preview="live"
                    style={{ background: "transparent", border: "none", height: "100%" }}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center p-8">
                <FileText className="w-12 h-12 text-slate-700" />
                <p className="text-slate-500 text-sm">Select a note or create a new one</p>
                <button onClick={createNew} className="btn-primary px-6 py-2.5 rounded-xl text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" /> New Note
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
