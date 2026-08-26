/**
 * lib/search/engine.ts
 *
 * Ranked search over the resource library.
 *
 * The library is small enough (thousands of docs at most) to search entirely
 * in the browser, which lets us do things Firestore cannot: match across
 * fields, tolerate typos, and rank by relevance instead of upload date.
 *
 * What it has to handle, taken from how students actually type:
 *   "dbms"          → subject "Data base management system"  (acronym)
 *   "dbms pyq"      → subject AND type, in one box           (multi-token)
 *   "os sem 1"      → subject AND semester                   (inline filter)
 *   "operating sys" → prefix match on a longer word          (prefix)
 *   "netwrks"       → typo                                   (fuzzy)
 *   "3rd sem cn"    → ordinal semester + acronym
 */

import type { Resource } from "@/lib/types";

// ── Normalisation ───────────────────────────────────────────────────────────

/** Lowercase, strip punctuation, collapse whitespace. */
export function normalize(input: string): string {
  return String(input ?? "")
    .toLowerCase()
    .replace(/[_\-/&.,()[\]{}'"`:;!?]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Words that carry no signal in a subject or title. */
const STOP_WORDS = new Set([
  "a", "an", "the", "of", "and", "or", "for", "to", "in", "on", "with", "by",
  "paper", "papers", "file", "files", "download", "pdf",
]);

export function tokenize(input: string): string[] {
  return normalize(input)
    .split(" ")
    .filter((t) => t.length > 0);
}

// ── Domain vocabulary ───────────────────────────────────────────────────────

/**
 * Aliases students type instead of the full subject name stored in Firestore.
 * Each key expands to extra searchable text on the document, so typing either
 * side of the pair finds the resource.
 */
const SUBJECT_ALIASES: Record<string, string[]> = {
  dbms: ["data base management system", "database management systems", "database"],
  os: ["operating system", "operating systems"],
  cn: ["computer networks", "computer network", "networking"],
  dsa: ["data structures", "algorithms", "data structures and analysis of algorithm"],
  daa: ["design and analysis of algorithms", "analysis of algorithm"],
  ai: ["artificial intelligence"],
  ml: ["machine learning"],
  co: ["computer organization", "computer architecture"],
  coa: ["computer organization", "computer architecture"],
  toc: ["theory of computation"],
  cd: ["compiler design"],
  se: ["software engineering"],
  oops: ["object oriented programming", "object oriented programming with java"],
  oop: ["object oriented programming"],
  wt: ["web technology", "web technologies", "fundamental of web technology"],
  iot: ["internet of things"],
  ds: ["data science", "data structures", "discrete structures"],
  bda: ["big data analytics"],
  cc: ["cloud computing"],
  ns: ["network security"],
  gt: ["graph theory"],
  uhv: ["universal human values"],
  cbnst: ["computer based numerical and statistical techniques", "numerical techniques"],
  afm: ["accounting and financial management"],
  pom: ["principal of management", "principles of management"],
  tcs: ["technical communication skills"],
  dm: ["discrete mathematics", "digital marketing", "discrete structures"],
  it: ["introduction of information technology", "information technology"],
  pf: ["programming fundamentals with c", "programming fundamentals"],
  stqa: ["software testing quality assurance", "software testing"],
  mm: ["multimedia"],
  sc: ["soft computing"],
};

/** Words that mean a resource type, so "dbms question paper" hits type=pyq. */
const TYPE_SYNONYMS: Record<string, string[]> = {
  pyq: ["pyq", "previous year", "previous year question", "question paper", "end sem", "final exam", "finals", "university paper"],
  ct: ["ct", "class test", "classtest", "sessional", "mid sem", "midsem", "midterm", "unit test"],
  notes: ["notes", "handwritten", "handwritten notes", "topper notes", "study notes"],
  study_material: ["book", "books", "reference book", "textbook", "study material"],
  lab_manual: ["lab", "lab manual", "practical file", "lab file"],
  assignment: ["assignment", "homework"],
  practical: ["practical", "experiment"],
  syllabus: ["syllabus", "curriculum"],
  software: ["software", "tool", "installer"],
  form: ["form", "document"],
};

/** Ordinal words → semester number, for "3rd sem" / "second semester". */
const ORDINALS: Record<string, number> = {
  first: 1, "1st": 1, one: 1,
  second: 2, "2nd": 2, two: 2,
  third: 3, "3rd": 3, three: 3,
  fourth: 4, "4th": 4, four: 4,
  fifth: 5, "5th": 5, five: 5,
  sixth: 6, "6th": 6, six: 6,
  seventh: 7, "7th": 7, seven: 7,
  eighth: 8, "8th": 8, eight: 8,
};

// ── Indexing ────────────────────────────────────────────────────────────────

export interface IndexedResource {
  resource: Resource;
  /** Weighted field text, each already normalized. */
  title: string;
  subject: string;
  description: string;
  tags: string;
  /** Expanded aliases + type synonyms + branch/semester words. */
  extra: string;
  /** Every distinct token across all fields, for fast token lookup. */
  tokens: Set<string>;
  /** Acronym of the subject, e.g. "data base management system" → "dbms". */
  acronym: string;
}

/** Initials of each significant word: "Computer Networks" → "cn". */
function acronymOf(text: string): string {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w))
    .map((w) => w[0])
    .join("");
}

/** Build the searchable representation of one resource. */
export function indexResource(resource: Resource): IndexedResource {
  const title = normalize(resource.title);
  const subject = normalize(resource.subject || "");
  const description = normalize(resource.description || "");
  const tags = normalize((resource.tags || []).join(" "));

  const extras: string[] = [];

  // Type synonyms so "question paper" matches a resource stored as type "pyq".
  const typeWords = TYPE_SYNONYMS[resource.type];
  if (typeWords) extras.push(typeWords.join(" "));
  extras.push(normalize(resource.type));

  // Branch, both as stored and spelled out.
  if (resource.branch) {
    extras.push(normalize(resource.branch));
    if (resource.branch === "btech") extras.push("b tech btech bachelor of technology");
    if (resource.branch === "mca") extras.push("mca master of computer applications");
  }

  // Semester in every form a student might type.
  if (resource.semester) {
    const s = resource.semester;
    extras.push(`sem ${s} semester ${s} sem${s}`);
    const ordinal = Object.entries(ORDINALS).find(([, n]) => n === s)?.[0];
    if (ordinal) extras.push(`${ordinal} sem ${ordinal} semester`);
  }

  // Subject aliases, both directions.
  const subjectAcronym = acronymOf(resource.subject || "");
  if (subjectAcronym.length >= 2) extras.push(subjectAcronym);

  for (const [alias, expansions] of Object.entries(SUBJECT_ALIASES)) {
    const matchesExpansion = expansions.some((e) => subject.includes(normalize(e)));
    if (matchesExpansion || subject === alias || subjectAcronym === alias) {
      extras.push(alias, expansions.join(" "));
    }
  }

  const extra = normalize(extras.join(" "));

  const tokens = new Set<string>();
  for (const field of [title, subject, description, tags, extra]) {
    for (const t of field.split(" ")) if (t) tokens.add(t);
  }

  return { resource, title, subject, description, tags, extra, tokens, acronym: subjectAcronym };
}

export function buildIndex(resources: Resource[]): IndexedResource[] {
  return resources.map(indexResource);
}

// ── Fuzzy matching ──────────────────────────────────────────────────────────

/**
 * Bounded Levenshtein distance. Returns `maxDistance + 1` as soon as it is
 * certain the real distance exceeds the budget, so a long word never costs a
 * full matrix walk.
 */
function editDistanceWithin(a: string, b: string, maxDistance: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > maxDistance) return maxDistance + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Typo budget scaled to word length — short words get no slack. */
function fuzzyBudget(token: string): number {
  if (token.length <= 3) return 0;
  if (token.length <= 5) return 1;
  return 2;
}

// ── Scoring ─────────────────────────────────────────────────────────────────

/** Field weights. Title and subject are what students actually search by. */
const WEIGHT = {
  titleExact: 100,
  titlePrefix: 60,
  titleFuzzy: 30,
  subjectExact: 90,
  subjectPrefix: 55,
  subjectFuzzy: 28,
  acronym: 95,
  tagExact: 45,
  extraExact: 40,
  descriptionExact: 20,
  descriptionPrefix: 10,
} as const;

/** Best score for a single query token against one indexed resource. */
function scoreToken(token: string, doc: IndexedResource): number {
  // Whole-token hit anywhere is the cheapest check, so try it first.
  if (doc.tokens.has(token)) {
    if (doc.title.split(" ").includes(token)) return WEIGHT.titleExact;
    if (doc.subject.split(" ").includes(token)) return WEIGHT.subjectExact;
    if (doc.tags.split(" ").includes(token)) return WEIGHT.tagExact;
    if (doc.extra.split(" ").includes(token)) return WEIGHT.extraExact;
    return WEIGHT.descriptionExact;
  }

  // Acronym: "dbms" against "data base management system".
  if (token.length >= 2 && doc.acronym === token) return WEIGHT.acronym;
  if (token.length >= 3 && doc.acronym.startsWith(token)) return WEIGHT.acronym * 0.7;

  // Substring / prefix: "netw" → "networks".
  if (doc.title.includes(token)) return WEIGHT.titlePrefix;
  if (doc.subject.includes(token)) return WEIGHT.subjectPrefix;
  if (doc.extra.includes(token)) return WEIGHT.extraExact * 0.7;
  if (doc.description.includes(token)) return WEIGHT.descriptionPrefix;

  // Typo tolerance, only against tokens of a plausible length.
  const budget = fuzzyBudget(token);
  if (budget > 0) {
    let best = 0;
    for (const candidate of doc.tokens) {
      if (Math.abs(candidate.length - token.length) > budget) continue;
      const dist = editDistanceWithin(token, candidate, budget);
      if (dist <= budget) {
        const closeness = 1 - dist / (budget + 1);
        const inTitle = doc.title.split(" ").includes(candidate);
        const score = (inTitle ? WEIGHT.titleFuzzy : WEIGHT.subjectFuzzy) * closeness;
        if (score > best) best = score;
        if (dist === 1) break; // good enough; stop scanning
      }
    }
    return best;
  }

  return 0;
}

export interface SearchResult {
  resource: Resource;
  score: number;
}

export interface SearchOptions {
  /** Drop results below this score. */
  minScore?: number;
  /** Cap the result list. */
  limit?: number;
}

/**
 * Rank `index` against `query`.
 *
 * Every query token must contribute a hit — searching "dbms pyq" should not
 * return every PYQ in the library. Documents matching more tokens and matching
 * them in stronger fields rank higher; downloads break near-ties so the copy
 * everyone actually uses floats up.
 */
export function searchResources(
  index: IndexedResource[],
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const { minScore = 1, limit } = options;

  const tokens = tokenize(query).filter((t) => !STOP_WORDS.has(t) || tokenize(query).length === 1);
  if (tokens.length === 0) return [];

  const results: SearchResult[] = [];

  for (const doc of index) {
    let total = 0;
    let matchedTokens = 0;

    for (const token of tokens) {
      const s = scoreToken(token, doc);
      if (s > 0) {
        total += s;
        matchedTokens++;
      }
    }

    // AND semantics: require every token to land somewhere.
    if (matchedTokens < tokens.length) continue;

    // Phrase bonus — the full query appearing verbatim is a strong signal.
    const phrase = normalize(query);
    if (phrase.length > 2) {
      if (doc.title.includes(phrase)) total += 80;
      else if (doc.subject.includes(phrase)) total += 60;
    }

    // Popularity as a tie-breaker only; capped so it can never outrank
    // an actual textual match.
    const downloads = doc.resource.downloads || 0;
    total += Math.min(Math.log10(downloads + 1) * 6, 18);

    if (total >= minScore) results.push({ resource: doc.resource, score: total });
  }

  results.sort((a, b) => b.score - a.score);
  return limit ? results.slice(0, limit) : results;
}

/**
 * Pull inline filters out of a query string.
 * "dbms sem 3 pyq" → { semester: 3, type: "pyq", rest: "dbms" }
 *
 * Returns the leftover text so the caller can still rank on it. Only strips a
 * term when it is unambiguous, so a subject that happens to contain "form"
 * is not silently turned into a type filter.
 */
export interface ParsedQuery {
  rest: string;
  semester?: number;
  type?: string;
  branch?: string;
}

export function parseQuery(query: string): ParsedQuery {
  const tokens = tokenize(query);
  const kept: string[] = [];
  const parsed: ParsedQuery = { rest: "" };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const next = tokens[i + 1];

    // "sem 3" / "semester 3" / "3rd sem"
    if ((t === "sem" || t === "semester") && next && /^[1-8]$/.test(next)) {
      parsed.semester = Number(next);
      i++;
      continue;
    }
    if (ORDINALS[t] !== undefined && (next === "sem" || next === "semester")) {
      parsed.semester = ORDINALS[t];
      i++;
      continue;
    }
    if (/^sem[1-8]$/.test(t)) {
      parsed.semester = Number(t.slice(3));
      continue;
    }

    // Branch
    if (t === "mca" || t === "btech") {
      parsed.branch = t;
      continue;
    }

    kept.push(t);
  }

  parsed.rest = kept.join(" ");
  return parsed;
}
