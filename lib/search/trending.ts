import type { Resource } from "@/lib/types";

/**
 * A resource needs at least this many downloads to count as trending.
 *
 * The point of the threshold is that the row is allowed to be short. Ordering
 * by downloads alone always returns `count` rows, so once the genuinely-used
 * papers ran out it filled the rest with uploads nobody had ever opened —
 * "Trending" recommending things on no evidence at all.
 */
export const MIN_TRENDING_DOWNLOADS = 1;

/**
 * Rank resources by how much students actually use them.
 *
 * Downloads are the signal. A like is one tap on a card; a download means
 * someone wanted the paper enough to open it.
 *
 * Kept free of any Firebase import so it can be tested directly.
 */
export function rankByUsage(
  resources: Resource[],
  count: number,
  minDownloads: number = MIN_TRENDING_DOWNLOADS
): Resource[] {
  return resources
    .filter((r) => (r.downloads ?? 0) >= minDownloads)
    .sort((a, b) => {
      const byDownloads = (b.downloads ?? 0) - (a.downloads ?? 0);
      if (byDownloads !== 0) return byDownloads;

      // Ties are the normal case while counts are still in single figures.
      // Without a tie-break the order falls back to document id, so the same
      // papers sat in the row no matter what anyone downloaded.
      const byLikes = (b.likes ?? 0) - (a.likes ?? 0);
      if (byLikes !== 0) return byLikes;

      // Newest last, so a fresh upload that matches an old one on both counts
      // gets the visible slot.
      return parseTime(b.createdAt) - parseTime(a.createdAt);
    })
    .slice(0, count);
}

/** Missing or unparseable dates sort oldest rather than throwing off the order. */
function parseTime(value: string | undefined): number {
  const ms = Date.parse(value || "");
  return Number.isNaN(ms) ? 0 : ms;
}
