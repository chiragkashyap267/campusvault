/**
 * lib/email/campaigns.ts
 *
 * Default campaign copy, in one place so the admin UI and the daily cron
 * cannot drift apart. They previously each hardcoded their own version, and
 * only one of them got cleaned up.
 *
 * Why the wording is this plain
 * -----------------------------
 * Mail sent through Gmail SMTP goes out from an ordinary @gmail.com address.
 * That address has no domain reputation to spend, so the single biggest lever
 * on whether it reaches an inbox is whether the message reads like something a
 * person wrote. Consumer spam filters score hardest against exactly the things
 * marketing copy reaches for:
 *
 *   - emoji in the subject line
 *   - urgency and fear of missing out ("Don't fall behind", "waiting for you")
 *   - exclamation marks and ALL CAPS
 *   - stacked emoji bullet lists
 *   - "act now" style closers
 *
 * Keep new campaigns in this register. A duller subject line that reaches the
 * inbox beats a livelier one that reaches the spam folder.
 */

export interface CampaignCopy {
  subject: string;
  headline: string;
  message: string;
}

/** The weekly digest sent by the cron and by "blast to everyone" in the admin UI. */
export const WEEKLY_DIGEST: CampaignCopy = {
  subject: "CampusVault weekly update — new papers and notes",
  headline: "This week's new resources",
  message: `Students have uploaded new material to CampusVault this week.

What's available:
- PYQ and class test papers, sorted by subject and semester
- Handwritten notes and study guides
- Reference books and lab manuals

You can browse everything by branch, semester and subject from the resource library.

If you have papers or notes that aren't on the site yet, uploading them takes a minute and helps everyone in your batch.

— The CampusVault team, GBPIET`,
};
