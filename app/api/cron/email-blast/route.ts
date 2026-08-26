import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/cron/email-blast
 *
 * Called automatically by Vercel Cron (see vercel.json).
 * Protected by CRON_SECRET env var — Vercel passes it as Authorization header.
 *
 * Schedule: daily at 04:30 UTC (10:00 IST) — see vercel.json.
 *
 * Daily rather than weekly on purpose. One invocation can only send for as
 * long as the platform allows, so a large list is delivered over several runs.
 * The blast applies a 7-day per-user cooldown, so running every day sends each
 * student at most one mail a week and simply resumes where the last run
 * stopped.
 */
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[Cron] Unauthorized request to email-blast cron");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[Cron] 🚀 Weekly email blast triggered at", new Date().toISOString());

  // ── Build the weekly digest payload ────────────────────────────────────────
  // Kept deliberately plain. Emoji in the subject, urgency phrasing
  // ("Don't fall behind"), exclamation marks and all-caps are the wording
  // patterns consumer spam filters score hardest against — and a Gmail SMTP
  // sender has no domain reputation to absorb the penalty.
  const subject = "CampusVault weekly update — new papers and notes";
  const headline = "This week's new resources";
  const message = `Students have uploaded new material to CampusVault this week.

What's available:
- PYQ and class test papers, sorted by subject and semester
- Handwritten notes and study guides
- Reference books and lab manuals

You can browse everything by branch, semester and subject from the resource library.

If you have papers or notes that aren't on the site yet, uploading them takes a minute and helps everyone in your batch.

— The CampusVault team, GBPIET`;

  try {
    // Call our own blast API internally
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://campusvaultgbpiet.vercel.app";

    const response = await fetch(`${baseUrl}/api/marketing/blast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject,
        headline,
        message,
        templateStyle: "royal",
        skipCooldown: false, // respect 7-day per-user cooldown
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[Cron] Blast API error:", result);
      return NextResponse.json({ error: result.error || "Blast failed" }, { status: 500 });
    }

    console.log(
      `[Cron] ✅ Blast run complete — Sent: ${result.sent}, Skipped (cooldown): ${result.skipped}, ` +
      `Failed: ${result.failed}, Remaining: ${result.notAttempted ?? 0}, Total: ${result.total}`
    );

    return NextResponse.json({
      success: true,
      message: result.hasMore
        ? "Blast run complete — more recipients remain, tomorrow's run continues."
        : "Blast run complete — whole list processed.",
      ...result,
    });
  } catch (err: any) {
    console.error("[Cron] Fatal error:", err);
    return NextResponse.json({ error: err.message || "Cron failed" }, { status: 500 });
  }
}
