// ─── User Types ───────────────────────────────────────────────
export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  bio?: string;
  role?: "user" | "admin";
  uploadCount?: number;
  totalDownloads?: number;
  createdAt?: string;
  socialLinks?: SocialLinks;
}

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
}

// ─── Resource Types ───────────────────────────────────────────
export type ResourceType =
  | "pyq"
  | "ct"
  | "notes"
  | "assignment"
  | "practical"
  | "project"
  | "lab_manual"
  | "software"
  | "study_material"
  | "pdf"
  | "form"
  | "other";

export type Branch =
  | "mca"
  | "btech"
  | "mtech"
  | "phd"
  | "cse"
  | "ece"
  | "me"
  | "ce"
  | "ee"
  | "it"
  | "other";

export type Semester = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type ResourceStatus = "pending" | "approved" | "rejected";

export type FileFormat = "pdf" | "image" | "zip" | "doc" | "other";

export interface Resource {
  id: string;
  title: string;
  description: string;
  subject: string;
  branch: Branch;
  semester: Semester;
  type: ResourceType;
  fileUrl: string;
  fileFormat: FileFormat;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploaderName: string;
  uploaderPhoto?: string;
  status: ResourceStatus;
  downloads: number;
  likes: number;
  likedBy?: string[];
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  featured?: boolean;
  size?: number; // bytes
}

export interface ResourceFilters {
  search?: string;
  type?: ResourceType | "";
  branch?: Branch | "";
  semester?: Semester | "";
  subject?: string;
  sortBy?: "recent" | "trending" | "downloads" | "likes";
}

// ─── Comment Types ────────────────────────────────────────────
export interface Comment {
  id: string;
  resourceId: string;
  uid: string;
  displayName: string;
  photoURL?: string;
  text: string;
  createdAt: string;
}

// ─── Wishlist Types ───────────────────────────────────────────
export interface WishlistItem {
  id: string;
  resourceId: string;
  savedAt: string;
}

// ─── Notes Types ──────────────────────────────────────────────
export interface Note {
  id: string;
  uid: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Todo Types ───────────────────────────────────────────────
export type Priority = "low" | "medium" | "high";

export interface Todo {
  id: string;
  uid: string;
  title: string;
  description?: string;
  done: boolean;
  priority: Priority;
  dueDate?: string;
  category?: "assignment" | "exam" | "project" | "general";
  createdAt: string;
}

// ─── Upload Types ─────────────────────────────────────────────
export interface UploadFormData {
  title: string;
  description: string;
  subject: string;
  branch: Branch;
  semester: Semester;
  type: ResourceType;
  tags: string[];
  file: File | null;
}

// ─── Analytics Types ─────────────────────────────────────────
export interface AdminStats {
  totalResources: number;
  pendingResources: number;
  totalUsers: number;
  totalDownloads: number;
  totalLikes: number;
}
