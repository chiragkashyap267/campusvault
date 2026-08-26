import { ResourceType, Branch, Semester } from "@/lib/types";

export const RESOURCE_TYPES: { value: ResourceType; label: string; icon: string }[] = [
  { value: "pyq", label: "PYQ Papers", icon: "📄" },
  { value: "ct", label: "CT Papers", icon: "📝" },
  { value: "form", label: "Forms & Documents", icon: "📋" },
];

export const BRANCHES: { value: Branch; label: string }[] = [
  { value: "mca", label: "MCA" },
  { value: "bca", label: "BCA" },
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
  { href: "/resources", label: "Resources", adminOnly: false },
  { href: "/forms", label: "Forms", adminOnly: false },
  { href: "/upload", label: "Upload", adminOnly: false },
  { href: "/leaderboard", label: "Leaderboard", adminOnly: false },
  { href: "/marketing", label: "Marketing", adminOnly: true },
  { href: "/about", label: "About", adminOnly: false },
];

export const SITE_NAME = "CampusVault GBPIET";
export const SITE_TAGLINE = "Your Ultimate Academic Vault for GBPIET Students";
export const SITE_DESCRIPTION =
  "A centralized resource-sharing and academic collaboration portal for MCA and B.Tech students of GBPIET.";
export const CREATOR_NAME = "Chirag Kashyap";
export const CREATOR_PROGRAM = "MCA";

/**
 * The creator's links, in one place.
 *
 * These were previously hardcoded separately in the footer, the about page and
 * the contact page, and had already drifted: about/ contact pointed at a
 * `chiragkashyap` GitHub handle and a `chiragkashyap.dev` domain that are not
 * the real ones. Every surface now reads from here so they cannot diverge
 * again.
 */
export const CREATOR_LINKS = {
  github: "https://github.com/chiragkashyap267",
  linkedin: "https://www.linkedin.com/in/chirag-kashyap-00405633b",
  portfolio: "https://chiragkashyapwebdev.vercel.app/",
} as const;

/** Display form of the same links, for when the URL is shown as text. */
export const CREATOR_LINK_LABELS = {
  github: "github.com/chiragkashyap267",
  linkedin: "linkedin.com/in/chirag-kashyap",
  portfolio: "chiragkashyapwebdev.vercel.app",
} as const;

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

/**
 * Subjects offered per branch, per semester.
 *
 * These strings are matched against the `subject` field on uploaded resources,
 * so they need to read the way people actually tag their uploads. They were
 * previously hardcoded inside ResourceFinder; keeping them here means the
 * curriculum can be corrected in one place without touching the UI.
 *
 * NOTE: the BCA lists below are a standard three-year BCA structure, not
 * GBPIET's confirmed syllabus. Replace any that differ — a subject name that
 * does not match what students upload will retrieve nothing.
 */
export const SUBJECTS_BY_BRANCH: Record<string, Record<string, string[]>> = {
  mca: {
    bridge: [
      "Introduction of Information Technology",
      "Programming Fundamentals With C",
      "Fundamental of Web Technology",
    ],
    "1": [
      "Discrete Structures",
      "Data base management system",
      "Operating System",
      "Computer Organization",
      "Technical Communication Skills",
      "Python Programming",
    ],
    "2": [
      "Computer based numerical and statistical techniques",
      "Data Structures and analysis of algorithm",
      "Object oriented programming with Java",
      "Computer networks",
      "Artificial intelligence",
      "Accounting and Financial Management",
    ],
    "3": [
      "Big Data analytics",
      "Cloud Computing",
      "Compiler Design",
      "Entrepreneurship",
      "Graph Theory",
      "Internet of Things",
      "Multimedia",
      "Principal of Management",
      "Soft Computing",
      "Software Engineering",
      "Startup",
      "Universal Human Values",
    ],
    "4": [
      "Data Science",
      "Digital Marketing",
      "Network Security",
      "Software Testing & Quality Assurance",
    ],
  },

  bca: {
    "1": [
      "Computer Fundamentals",
      "Programming in C",
      "Mathematics I",
      "Digital Electronics",
      "Communication Skills",
    ],
    "2": [
      "Data Structures",
      "Object Oriented Programming with C++",
      "Mathematics II",
      "Computer Organization",
      "Environmental Studies",
    ],
    "3": [
      "Database Management System",
      "Operating System",
      "Java Programming",
      "Computer Networks",
      "Numerical Methods",
    ],
    "4": [
      "Web Technology",
      "Software Engineering",
      "Python Programming",
      "Design and Analysis of Algorithms",
      "Statistics",
    ],
    "5": [
      "Cloud Computing",
      "Artificial Intelligence",
      "Mobile Application Development",
      "Computer Graphics",
      "E-Commerce",
    ],
    "6": [
      "Cyber Security",
      "Data Science",
      "Internet of Things",
      "Project Work",
      "Management Information System",
    ],
  },
};

/** How many semesters each branch runs for. */
export const SEMESTER_COUNT: Record<string, number> = {
  mca: 4,
  bca: 6,
  btech: 8,
};
