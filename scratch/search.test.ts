import { buildIndex, searchResources, parseQuery } from "../lib/search/engine";
import type { Resource } from "../lib/types";

const mk = (o: Partial<Resource>): Resource => ({
  id: Math.random().toString(36).slice(2),
  title: "", description: "", subject: "", type: "pyq", branch: "mca",
  semester: 1, status: "approved", fileUrl: "", fileFormat: "pdf",
  downloads: 0, likes: 0, likedBy: [], tags: [],
  uploaderId: "u", uploaderName: "n", createdAt: new Date().toISOString(),
  ...o,
} as Resource);

const DOCS: Resource[] = [
  mk({ title: "DBMS End Sem 2023", subject: "Data base management system", type: "pyq", semester: 1 }),
  mk({ title: "Operating System Unit 2 Notes", subject: "Operating System", type: "notes", semester: 1 }),
  mk({ title: "Computer Networks CT-1", subject: "Computer networks", type: "ct", semester: 2 }),
  mk({ title: "Java OOP Question Paper 2022", subject: "Object oriented programming with Java", type: "pyq", semester: 2 }),
  mk({ title: "Cloud Computing Notes", subject: "Cloud Computing", type: "notes", semester: 3 }),
  mk({ title: "Discrete Structures PYQ", subject: "Discrete Structures", type: "pyq", semester: 1 }),
  mk({ title: "Big Data Analytics End Sem", subject: "Big Data analytics", type: "pyq", semester: 3 }),
];

const idx = buildIndex(DOCS);
const top = (q: string, n = 3) =>
  searchResources(idx, q, { limit: n }).map(r => r.resource.title);

let pass = 0, fail = 0;
function check(name: string, got: string[], mustInclude: string) {
  const ok = got.length > 0 && got[0].includes(mustInclude);
  if (ok) { pass++; console.log(`  PASS  ${name}\n        → ${got[0]}`); }
  else { fail++; console.log(`  FAIL  ${name}\n        expected top hit containing "${mustInclude}", got: ${JSON.stringify(got)}`); }
}
function checkAny(name: string, got: string[], mustInclude: string) {
  const ok = got.some(t => t.includes(mustInclude));
  if (ok) { pass++; console.log(`  PASS  ${name}\n        → ${JSON.stringify(got)}`); }
  else { fail++; console.log(`  FAIL  ${name}\n        expected any hit containing "${mustInclude}", got: ${JSON.stringify(got)}`); }
}
function checkEmpty(name: string, got: string[]) {
  if (got.length === 0) { pass++; console.log(`  PASS  ${name} (correctly no results)`); }
  else { fail++; console.log(`  FAIL  ${name} expected none, got ${JSON.stringify(got)}`); }
}

console.log("\n── Acronym → full subject name ──");
check("dbms", top("dbms"), "DBMS");
check("cn", top("cn"), "Computer Networks");
check("os", top("os"), "Operating System");
check("bda", top("bda"), "Big Data");

console.log("\n── Multi-token AND ──");
checkAny("dbms pyq", top("dbms pyq"), "DBMS");
checkAny("os notes", top("os notes"), "Operating System");
checkEmpty("dbms lab manual (no such doc)", top("dbms lab manual"));

console.log("\n── Type synonyms ──");
checkAny("question paper", top("question paper", 5), "Question Paper");
checkAny("class test", top("class test", 5), "CT-1");

console.log("\n── Typo tolerance ──");
check("netwrks (typo)", top("netwrks"), "Computer Networks");
check("operatng (typo)", top("operatng"), "Operating System");

console.log("\n── Prefix ──");
check("discre", top("discre"), "Discrete");

console.log("\n── Inline filter parsing ──");
const p1 = parseQuery("dbms sem 3 pyq");
console.log("  parseQuery('dbms sem 3 pyq') =", JSON.stringify(p1));
if (p1.semester === 3 && p1.rest === "dbms pyq") { pass++; console.log("  PASS  sem extracted"); }
else { fail++; console.log("  FAIL  sem extraction"); }

const p2 = parseQuery("3rd sem cn mca");
console.log("  parseQuery('3rd sem cn mca') =", JSON.stringify(p2));
if (p2.semester === 3 && p2.branch === "mca" && p2.rest === "cn") { pass++; console.log("  PASS  ordinal + branch"); }
else { fail++; console.log("  FAIL  ordinal + branch"); }


// ── BCA + tolerant subject matching ────────────────────────────────────────
import { subjectMatches } from "../lib/search/engine";
console.log("\n-- subject matching (the retrieval fix) --");
const sm = (a: string, b: string, want: boolean, label: string) => {
  const got = subjectMatches(a, b);
  got === want ? (pass++, console.log(`  PASS  ${label}`))
               : (fail++, console.log(`  FAIL  ${label} — got ${got}, want ${want}`));
};
sm("Data base management system", "Database Management System", true, "spacing/case differences match");
sm("Data Structures & Algorithms", "Data Structures and Algorithms", true, "punctuation vs word");
sm("DBMS", "Database Management System", true, "acronym vs full name");
sm("Database Management System", "DBMS", true, "full name vs acronym");
sm("Operating System", "Operating Systems", true, "singular vs plural");
sm("Computer Networks", "Computer Organization", false, "shared word is NOT enough");
sm("Cloud Computing", "Data Science", false, "unrelated subjects do not match");
sm("", "DBMS", false, "empty subject never matches");

console.log("\n-- BCA branch parsing --");
const p3 = parseQuery("bca sem 2 dbms");
console.log("  parseQuery('bca sem 2 dbms') =", JSON.stringify(p3));
if (p3.branch === "bca" && p3.semester === 2 && p3.rest === "dbms") { pass++; console.log("  PASS  bca + sem parsed"); }
else { fail++; console.log("  FAIL  bca parsing"); }
const p4 = parseQuery("b tech 3rd sem cn");
console.log("  parseQuery('b tech 3rd sem cn') =", JSON.stringify(p4));
if (p4.branch === "btech" && p4.semester === 3) { pass++; console.log("  PASS  'b tech' two-token form"); }
else { fail++; console.log("  FAIL  'b tech' parsing"); }

console.log(`\n=== FINAL: ${pass} passed, ${fail} failed ===\n`);
process.exit(fail ? 1 : 0);
