/**
 * Ranking for the homepage "Trending Resources" row.
 *
 * The fixtures are the real download counts from the live library, so the
 * ties are the ones the site actually has rather than invented ones.
 */
import { rankByUsage, MIN_TRENDING_DOWNLOADS } from "../lib/search/trending";
import type { Resource } from "../lib/types";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function res(partial: Partial<Resource> & { id: string }): Resource {
  return {
    title: partial.id,
    description: "",
    subject: "",
    branch: "mca",
    semester: 1,
    type: "pyq",
    fileUrl: "",
    fileFormat: "pdf",
    uploadedBy: "u",
    uploaderName: "u",
    status: "approved",
    downloads: 0,
    likes: 0,
    tags: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  } as Resource;
}

// Real counts, top of the live library on 2026-09-30.
const LIVE = [
  res({ id: "CN CT#1", downloads: 3, likes: 0, createdAt: "2026-03-01T00:00:00.000Z" }),
  res({ id: "GIRLS HOSTEL OUTPASS", downloads: 2, likes: 1, createdAt: "2026-02-01T00:00:00.000Z" }),
  res({ id: "DATA STRUCTURES", downloads: 2, likes: 0, createdAt: "2026-05-01T00:00:00.000Z" }),
  res({ id: "CBNST FINAL EXAM#2", downloads: 2, likes: 0, createdAt: "2026-01-15T00:00:00.000Z" }),
  res({ id: "DS CT#1", downloads: 1, likes: 0 }),
  res({ id: "never opened A", downloads: 0, likes: 5 }),
  res({ id: "never opened B", downloads: 0, likes: 0 }),
];

console.log("\n── threshold ──");
{
  const out = rankByUsage(LIVE, 10);
  check("nothing with zero downloads survives", out.every((r) => r.downloads > 0));
  check(
    "a popular-but-never-downloaded upload is excluded",
    !out.some((r) => r.id === "never opened A"),
    "5 likes must not stand in for use"
  );
  check("all five used papers kept", out.length === 5, `got ${out.length}`);
}

console.log("\n── ordering ──");
{
  const out = rankByUsage(LIVE, 3);
  check("row is capped at count", out.length === 3);
  check("most-downloaded first", out[0].id === "CN CT#1", out[0]?.id);
  check(
    "a tie on downloads breaks on likes",
    out[1].id === "GIRLS HOSTEL OUTPASS",
    out[1]?.id
  );
  check(
    "a tie on downloads and likes breaks on recency",
    out[2].id === "DATA STRUCTURES",
    `${out[2]?.id} — newer of the two remaining 2-download papers`
  );
}

console.log("\n── short row rather than padding ──");
{
  // The state that prompted this: plenty uploaded, almost nothing downloaded.
  const barelyUsed = [
    res({ id: "used", downloads: 1 }),
    ...Array.from({ length: 30 }, (_, i) => res({ id: `untouched ${i}`, downloads: 0 })),
  ];
  const out = rankByUsage(barelyUsed, 3);
  check("returns one row, not three", out.length === 1, `got ${out.length}`);
  check("and it is the used one", out[0]?.id === "used");
}

console.log("\n── empty and edge cases ──");
{
  check("no resources at all", rankByUsage([], 3).length === 0);
  check(
    "nothing downloaded yet yields an empty row",
    rankByUsage([res({ id: "a" }), res({ id: "b" })], 3).length === 0
  );
  check(
    "a missing downloads field counts as zero",
    rankByUsage([res({ id: "a", downloads: undefined as unknown as number })], 3).length === 0
  );
  check(
    "an unparseable date does not break the sort",
    rankByUsage(
      [
        res({ id: "bad date", downloads: 2, createdAt: "not a date" }),
        res({ id: "good date", downloads: 2, createdAt: "2026-06-01T00:00:00.000Z" }),
      ],
      2
    )[0].id === "good date"
  );
  check(
    "threshold is configurable for a busier library",
    rankByUsage(LIVE, 10, 2).length === 4,
    "only the four papers with 2+ downloads"
  );
  check("default threshold is 1", MIN_TRENDING_DOWNLOADS === 1);
}

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
