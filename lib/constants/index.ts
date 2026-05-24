import { ResourceType, Branch, Semester } from "@/lib/types";

export const RESOURCE_TYPES: { value: ResourceType; label: string; icon: string }[] = [
  { value: "pyq", label: "PYQ Papers", icon: "📄" },
  { value: "ct", label: "CT Papers", icon: "📝" },
  { value: "form", label: "Forms & Documents", icon: "📋" },
];

export const BRANCHES: { value: Branch; label: string }[] = [
  { value: "mca", label: "MCA" },
  { value: "btech", label: "B.Tech" },
  { value: "mtech", label: "M.Tech" },
  { value: "phd", label: "Ph.D" },
];

export const SEMESTERS: { value: Semester; label: string }[] = [
  { value: 1, label: "Semester 1" },
  { value: 2, label: "Semester 2" },
  { value: 3, label: "Semester 3" },
  { value: 4, label: "Semester 4" },
  { value: 5, label: "Semester 5" },
  { value: 6, label: "Semester 6" },
  { value: 7, label: "Semester 7" },
  { value: 8, label: "Semester 8" },
];

export const MCA_SUBJECTS = [
  "Data Structures & Algorithms",
  "Database Management Systems",
  "Operating Systems",
  "Computer Networks",
  "Software Engineering",
  "Web Technologies",
  "Python Programming",
  "Java Programming",
  "C++ Programming",
  "Discrete Mathematics",
  "Theory of Computation",
  "Compiler Design",
  "Artificial Intelligence",
  "Machine Learning",
  "Cloud Computing",
  "Data Science",
  "Advanced DBMS",
  "Mobile Application Development",
  "Cyber Security",
  "Computer Architecture",
];

export const BTECH_SUBJECTS = [
  "Mathematics I",
  "Mathematics II",
  "Physics",
  "Chemistry",
  "Engineering Drawing",
  "Basic Electronics",
  "Basic Electrical Engineering",
  "C Programming",
  "Data Structures",
  "Algorithms",
  "Database Systems",
  "Operating Systems",
  "Computer Networks",
  "Microprocessors",
  "Digital Electronics",
  "Signal Processing",
  "Control Systems",
  "Thermodynamics",
  "Fluid Mechanics",
  "Mechanics of Materials",
];

export const NAV_LINKS = [
  { href: "/resources", label: "Resources" },
  { href: "/forms", label: "Forms" },
  { href: "/upload", label: "Upload" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/notes", label: "Notes" },
  { href: "/todo", label: "Todo" },
  { href: "/about", label: "About" },
];

export const SITE_NAME = "CampusVault GBPIET";
export const SITE_TAGLINE = "Your Ultimate Academic Vault for GBPIET Students";
export const SITE_DESCRIPTION =
  "A centralized resource-sharing and academic collaboration portal for MCA and B.Tech students of GBPIET.";
export const CREATOR_NAME = "Chirag Kashyap";
export const CREATOR_PROGRAM = "MCA";

export const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}`;

export const MAX_FILE_SIZE_MB = 50;
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const SORT_OPTIONS = [
  { value: "recent", label: "Most Recent" },
  { value: "trending", label: "Trending" },
  { value: "downloads", label: "Most Downloaded" },
  { value: "likes", label: "Most Liked" },
];
