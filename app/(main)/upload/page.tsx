"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle, Loader2, ChevronRight, File, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useAuthStore } from "@/lib/store/authStore";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { createResource } from "@/lib/firebase/firestore";
import { BRANCHES, RESOURCE_TYPES, SEMESTERS, MCA_SUBJECTS, BTECH_SUBJECTS } from "@/lib/constants";
import { UploadFormData, FileFormat } from "@/lib/types";
import { getFileFormat, formatBytes, cn } from "@/lib/utils";
import toast from "react-hot-toast";

const STEPS = ["File", "Details", "Review", "Submit"];

const MCA_SUBJECTS_BY_SEM: Record<string | number, string[]> = {
  1: [
    "Discrete Structures",
    "Data base management system",
    "Operating System",
    "Computer Organization",
    "Technical Communication Skills",
    "Python Programming",
  ],
  2: [
    "Computer based numerical and statistical techniques",
    "Data Structures and analysis of algorithm",
    "Object oriented programming with Java",
    "Computer networks",
    "Artificial intelligence",
    "Accounting and Financial Management",
  ],
  3: [
    "Big Data analytics",
    "Cloud Computing",
    "Compiler Design",
    "Entrepreneurship",
    "Graph Theory",
    "Internet of Things",
    "Multimedia",
    "Principal of Management",
  ],
  4: [
    "Data Science",
    "Digital Marketing",
    "Network Security",
    "Software Testing & Quality Assurance",
  ]
};

// Auto-detect semester from file name or title
function detectSemester(name: string): number {
  const n = name.toUpperCase();
  if (/\b(SEM\s*1|1ST\s*SEM|FIRST\s*SEM)\b/i.test(n)) return 1;
  if (/\b(SEM\s*2|2ND\s*SEM|SECOND\s*SEM)\b/i.test(n)) return 2;
  if (/\b(SEM\s*3|3RD\s*SEM|THIRD\s*SEM)\b/i.test(n)) return 3;
  if (/\b(SEM\s*4|4TH\s*SEM|FOURTH\s*SEM)\b/i.test(n)) return 4;
  
  // Subject-based fallback semester detection
  if (/\b(discrete|database|dbms|operating\s*system|os|python)\b/i.test(n)) return 1;
  if (/\b(cbnst|numerical|data\s*structure|dsa|java|oop|network|cn|artificial|ai|accounting)\b/i.test(n)) return 2;
  if (/\b(big\s*data|cloud|compiler|entrepreneurship|graph|iot|multimedia|management)\b/i.test(n)) return 3;
  if (/\b(data\s*science|ds|digital\s*marketing|network\s*security|ns|software\s*testing|stqa)\b/i.test(n)) return 4;
  
  return 1; // default
}

// Auto-detect resource type from file name or title
function detectType(name: string): "pyq" | "ct" | "notes" | "assignment" | "lab_manual" | "software" | "study_material" | "pdf" | "other" {
  const n = name.toUpperCase();
  if (/\b(FINAL|END\s*SEM|ENDSEM|PYQ|PREVIOUS|OLD\s*QUESTION|END\s*TERM)\b/i.test(n)) return "pyq";
  if (/\b(CT|CLASS\s*TEST|MID\s*TERM|MIDSEM|MID-SEM|TEST)\b/i.test(n)) return "ct";
  if (/\b(ASSIGNMENT|ASSGN)\b/i.test(n)) return "assignment";
  if (/\b(LAB|PRACTICAL|MANUAL)\b/i.test(n)) return "lab_manual";
  if (/\b(SOFTWARE|TOOL|EXE|ZIP)\b/i.test(n)) return "software";
  if (/\b(BOOK|REFERENCE|MATERIAL)\b/i.test(n)) return "study_material";
  if (/\b(NOTE|HANDWRITTEN|HANDOUT)\b/i.test(n)) return "notes";
  return "notes"; // default
}

// Auto-detect subject from file name or title
function detectSubject(name: string, semester: number): string {
  const n = name.toLowerCase();
  
  // Semester 1
  if (semester === 1) {
    if (n.includes("discrete")) return "Discrete Structures";
    if (n.includes("dbms") || n.includes("database")) return "Data base management system";
    if (n.includes("operating") || n.includes("os")) return "Operating System";
    if (n.includes("computer organization") || n.includes("co")) return "Computer Organization";
    if (n.includes("communication") || n.includes("technical")) return "Technical Communication Skills";
    if (n.includes("python")) return "Python Programming";
  }
  
  // Semester 2
  if (semester === 2) {
    if (n.includes("cbnst") || n.includes("numerical") || n.includes("statistical")) return "Computer based numerical and statistical techniques";
    if (n.includes("dsa") || n.includes("data structure")) return "Data Structures and analysis of algorithm";
    if (n.includes("java") || n.includes("oop")) return "Object oriented programming with Java";
    if (n.includes("network") || n.includes("cn")) return "Computer networks";
    if (n.includes("ai") || n.includes("artificial")) return "Artificial intelligence";
    if (n.includes("accounting") || n.includes("financial")) return "Accounting and Financial Management";
  }
  
  // Semester 3
  if (semester === 3) {
    if (n.includes("big data") || n.includes("analytics")) return "Big Data analytics";
    if (n.includes("cloud")) return "Cloud Computing";
    if (n.includes("compiler")) return "Compiler Design";
    if (n.includes("entrepreneurship")) return "Entrepreneurship";
    if (n.includes("graph")) return "Graph Theory";
    if (n.includes("iot") || n.includes("internet of things")) return "Internet of Things";
    if (n.includes("multimedia")) return "Multimedia";
    if (n.includes("management") || n.includes("principal")) return "Principal of Management";
  }
  
  // Semester 4
  if (semester === 4) {
    if (n.includes("data science") || n.includes("ds")) return "Data Science";
    if (n.includes("digital marketing")) return "Digital Marketing";
    if (n.includes("security") || n.includes("ns")) return "Network Security";
    if (n.includes("stqa") || n.includes("software testing") || n.includes("qa")) return "Software Testing & Quality Assurance";
  }
  
  return ""; // default empty
}

export default function UploadPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [formData, setFormData] = useState<UploadFormData>({
    title: "",
    description: "",
    subject: "",
    branch: "mca",
    semester: 1,
    type: "notes",
    tags: [],
    file: null,
  });
  const [tagInput, setTagInput] = useState("");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".jpg", ".jpeg", ".png", ".webp"],
      "application/zip": [".zip"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    onDrop: (accepted, rejected) => {
      if (rejected.length) {
        toast.error(rejected[0].errors[0].message);
        return;
      }
      if (accepted[0]) {
        const file = accepted[0];
        const ext = file.name.substring(file.name.lastIndexOf("."));
        const baseName = file.name.replace(ext, "");
        const cleanTitle = baseName.replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();
        
        const detectedSem = detectSemester(cleanTitle);
        const detectedType = detectType(cleanTitle);
        const detectedSubj = detectSubject(cleanTitle, detectedSem);
        
        setFormData((f) => ({
          ...f,
          file: file,
          title: cleanTitle,
          semester: detectedSem as typeof f.semester,
          type: detectedType as typeof f.type,
          subject: detectedSubj,
        }));
        
        toast.success(`Auto-detected: Sem ${detectedSem}, Type: ${detectedType}`);
      }
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-12 text-center max-w-md">
          <Upload className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sign in to Upload</h2>
          <p className="text-slate-400 mb-6 text-sm">You need an account to contribute resources.</p>
          <a href="/login" className="btn-primary px-8 py-3 rounded-xl">Sign In</a>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!formData.file || !user) return;
    setUploading(true);
    try {
      const result = await uploadToCloudinary(formData.file, setProgress);
      await createResource({
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        branch: formData.branch,
        semester: formData.semester,
        type: formData.type,
        fileUrl: result.secure_url,
        fileFormat: getFileFormat(formData.file) as FileFormat,
        uploadedBy: user.uid,
        uploaderName: user.displayName || "Anonymous",
        uploaderPhoto: user.photoURL || undefined,
        status: "pending",
        tags: formData.tags,
        size: formData.file.size,
        featured: false,
      });
      setDone(true);
      toast.success("Upload submitted for review!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData((f) => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput("");
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-12 text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-full bg-green-400/10 border border-green-400/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Upload Submitted!</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Your resource is under review. Once approved by the admin, it will be visible to all students.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setDone(false); setStep(0); setFormData({ title: "", description: "", subject: "", branch: "mca", semester: 1, type: "notes", tags: [], file: null }); }} className="btn-ghost px-6 py-2.5 rounded-xl text-sm">
              Upload Another
            </button>
            <a href="/dashboard" className="btn-primary px-6 py-2.5 rounded-xl text-sm">
              View Dashboard
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  const subjectList = formData.branch === "mca" 
    ? (MCA_SUBJECTS_BY_SEM[formData.semester] || [])
    : BTECH_SUBJECTS;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">Upload Resource</h1>
          <p className="text-slate-400 text-sm">Share your knowledge with GBPIET students</p>
        </motion.div>

        {/* Step Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all",
                i < step ? "bg-cyan-400 text-black" : i === step ? "neon-border text-cyan-400" : "bg-white/5 text-slate-600"
              )}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={cn("text-xs hidden sm:block", i === step ? "text-white font-medium" : "text-slate-600")}>{s}</span>
              {i < STEPS.length - 1 && (
                <div className={cn("flex-1 h-px", i < step ? "bg-cyan-400/50" : "bg-white/10")} />
              )}
            </div>
          ))}
        </div>

        <div className="glass-card p-6">
          {/* Step 0: File */}
          {step === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-semibold text-white mb-4">Select File</h2>
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all",
                  isDragActive ? "border-cyan-400 bg-cyan-400/5" : "border-white/10 hover:border-cyan-400/40 hover:bg-white/[0.02]",
                  formData.file && "border-green-400/40 bg-green-400/5"
                )}
              >
                <input {...getInputProps()} />
                {formData.file ? (
                  <div>
                    <File className="w-10 h-10 text-green-400 mx-auto mb-3" />
                    <p className="font-medium text-white text-sm">{formData.file.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatBytes(formData.file.size)}</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-300 text-sm mb-1">
                      {isDragActive ? "Drop your file here" : "Drag & drop or click to select"}
                    </p>
                    <p className="text-xs text-slate-600">PDF, Images, ZIP, DOC — Max 50MB</p>
                  </div>
                )}
              </div>
              <button
                disabled={!formData.file}
                onClick={() => setStep(1)}
                className="btn-primary w-full py-3 rounded-xl mt-4 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="font-semibold text-white mb-4">Resource Details</h2>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Title *</label>
                <input className="input-field" placeholder="e.g. DBMS Unit 3 Notes" value={formData.title} onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea className="input-field min-h-[80px] resize-none" placeholder="Brief description of the resource..." value={formData.description} onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Branch</label>
                  <select className="input-field" value={formData.branch} onChange={(e) => setFormData((f) => ({ ...f, branch: e.target.value as typeof formData.branch }))}>
                    {BRANCHES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Semester</label>
                  <select className="input-field" value={formData.semester} onChange={(e) => setFormData((f) => ({ ...f, semester: Number(e.target.value) as typeof formData.semester }))}>
                    {SEMESTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Type</label>
                  <select className="input-field" value={formData.type} onChange={(e) => setFormData((f) => ({ ...f, type: e.target.value as typeof formData.type }))}>
                    {RESOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Subject</label>
                  <select className="input-field" value={formData.subject} onChange={(e) => setFormData((f) => ({ ...f, subject: e.target.value }))}>
                    <option value="">Select subject</option>
                    {subjectList.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {/* Tags */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tags (max 5)</label>
                <div className="flex gap-2">
                  <input className="input-field flex-1" placeholder="Add a tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
                  <button onClick={addTag} className="btn-ghost px-3 py-2 rounded-xl text-sm">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.tags.map((tag) => (
                    <span key={tag} className="badge badge-cyan text-xs flex items-center gap-1">
                      {tag}
                      <button onClick={() => setFormData((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn-ghost flex-1 py-3 rounded-xl text-sm">Back</button>
                <button disabled={!formData.title} onClick={() => setStep(2)} className="btn-primary flex-1 py-3 rounded-xl text-sm disabled:opacity-40">Review</button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-semibold text-white mb-4">Review Upload</h2>
              <div className="space-y-3 mb-6">
                <ReviewRow label="Title" value={formData.title} />
                <ReviewRow label="File" value={formData.file?.name || ""} />
                <ReviewRow label="Type" value={RESOURCE_TYPES.find(t => t.value === formData.type)?.label || formData.type} />
                <ReviewRow label="Branch" value={BRANCHES.find(b => b.value === formData.branch)?.label || formData.branch} />
                <ReviewRow label="Semester" value={`Semester ${formData.semester}`} />
                {formData.subject && <ReviewRow label="Subject" value={formData.subject} />}
                {formData.tags.length > 0 && <ReviewRow label="Tags" value={formData.tags.join(", ")} />}
              </div>
              <div className="glass p-3 rounded-xl border border-yellow-400/20 text-xs text-yellow-400 mb-4">
                ⚠️ Your upload will be reviewed by an admin before going public.
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-ghost flex-1 py-3 rounded-xl text-sm">Back</button>
                <button onClick={() => { setStep(3); handleSubmit(); }} className="btn-primary flex-1 py-3 rounded-xl text-sm">Submit</button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Uploading */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-4" />
              <p className="text-white font-semibold mb-2">Uploading...</p>
              <div className="w-full bg-white/5 rounded-full h-2 mb-2">
                <motion.div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-slate-500">{progress}% complete</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs text-white font-medium max-w-[60%] text-right truncate">{value}</span>
    </div>
  );
}
