import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/cron/email-blast
 *
 * Called automatically by Vercel Cron (see vercel.json).
 * Protected by CRON_SECRET env var — Vercel passes it as Authorization header.
 *
 * Schedule: Every Monday at 9:00 AM UTC (see vercel.json)
 */
export async function GET(req: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[Cron] Unauthorized request to email-blast cron");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[Cron] 🚀 Weekly email blast triggered at", new Date().toISOString());

  // ── Build the motivational blast payload ───────────────────────────────────
  const subject = "📚 New Study Resources Are Waiting — CampusVault GBPIET";
  const headline = "Don't Fall Behind — Check What's New on CampusVault!";
  const message = `Your batchmates have been busy uploading resources this week!

Here's what's fresh on CampusVault GBPIET:
📄 New PYQ & Class Test Papers — sorted by subject & semester
📝 Handwritten Notes from toppers — ready to download
📚 Reference books & lab manuals — uploaded by your seniors

🎯 Exam season is coming — the students who prepare early always perform better.

Open CampusVault now to browse everything or contribute your own notes. Every upload earns you leaderboard points and helps 100s of fellow students at GBPIET!

See you at the top of the leaderboard 🏆

— The CampusVault Team`;

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
      `[Cron] ✅ Weekly blast complete — Sent: ${result.sent}, Failed: ${result.failed}, Total: ${result.total}`
    );

    return NextResponse.json({
      success: true,
      message: `Weekly blast complete`,
      ...result,
    });
  } catch (err: any) {
    console.error("[Cron] Fatal error:", err);
    return NextResponse.json({ error: err.message || "Cron failed" }, { status: 500 });
  }
}
