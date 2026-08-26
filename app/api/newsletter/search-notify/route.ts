import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import {
  doc, getDoc, setDoc, serverTimestamp, Timestamp
} from "firebase/firestore";
import { sendEmail, closeEmailTransport } from "@/lib/email/sender";
import { buildEmailHtml, buildEmailText, buildUnsubscribeUrl } from "@/lib/email/template";
import { getEmailAppUrl } from "@/lib/email/app-url";

const COOLDOWN_HOURS = 24;

/**
 * POST /api/newsletter/search-notify
 *
 * Fired (debounced) when a signed-in student searches. Emails them a link back
 * to their own results. Rate-limited to one mail per query per user per day.
 */
export async function POST(req: NextRequest) {
  try {
    const { studentEmail, studentName, searchQuery, branch = "" } = await req.json();

    if (!studentEmail || !searchQuery) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const email = String(studentEmail).trim().toLowerCase();
    const displayQuery = String(searchQuery).trim();

    // Nothing configured — skip silently rather than breaking the search UI.
    const hasGmail = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
    if (!hasGmail && !process.env.RESEND_API_KEY) {
      return NextResponse.json({ skipped: true, reason: "No email provider configured." });
    }

    // ── Respect opt-outs ─────────────────────────────────────────────
    try {
      const optOut = await getDoc(doc(db, "unsubscribes", email.replace(/[@.]/g, "_")));
      if (optOut.exists()) {
        return NextResponse.json({ skipped: true, reason: "Recipient unsubscribed." });
      }
    } catch {
      /* opt-out check is best-effort */
    }

    // ── Cooldown check via Firestore ─────────────────────────────────
    const safeQuery = displayQuery.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 60);
    const cooldownId = `${email.replace(/[@.]/g, "_")}__${safeQuery}`;
    const cooldownRef = doc(db, "newsletter_cooldowns", cooldownId);

    const cooldownSnap = await getDoc(cooldownRef);
    if (cooldownSnap.exists()) {
      const lastSent = cooldownSnap.data()?.lastSent as Timestamp | undefined;
      if (lastSent) {
        const hoursSince = (Date.now() - lastSent.toMillis()) / (1000 * 60 * 60);
        if (hoursSince < COOLDOWN_HOURS) {
          return NextResponse.json({
            skipped: true,
            reason: `Cooldown active. Next email in ${Math.ceil(COOLDOWN_HOURS - hoursSince)}h.`,
          });
        }
      }
    }

    // ── Build the email ──────────────────────────────────────────────
    const appUrl = getEmailAppUrl();
    const resourceUrl = `${appUrl}/resources?search=${encodeURIComponent(displayQuery)}`;
    const unsubscribeUrl = buildUnsubscribeUrl(appUrl, email);

    const template = {
      firstName: String(studentName || "").split(" ")[0] || "Student",
      headline: `Your CampusVault search: "${displayQuery}"`,
      message: [
        `Here is a direct link back to your results for "${displayQuery}"${branch ? ` in ${String(branch).toUpperCase()}` : ""}.`,
        "",
        "The library covers PYQ and class-test papers, handwritten notes, reference books and lab manuals — all filtered by branch, semester and subject.",
        "",
        "If you did not find what you needed, it may not be uploaded yet. Uploading your own copy helps the next person searching for it.",
      ].join("\n"),
      ctaLabel: "View your results",
      ctaUrl: resourceUrl,
      unsubscribeUrl,
      reason: "You are receiving this because you searched while signed in to CampusVault.",
    };

    const result = await sendEmail({
      to: email,
      // A plain, descriptive subject. Emoji and urgency wording in the subject
      // line are among the strongest spam signals for a consumer sender.
      subject: `Your CampusVault search results: ${displayQuery}`,
      html: buildEmailHtml(template),
      text: buildEmailText(template),
      fromName: "CampusVault GBPIET",
      unsubscribeUrl,
      entityRefId: `search-${cooldownId}-${Date.now()}`,
    });

    if (!result.success) {
      console.error(`[SearchNotify] Failed for ${email}: ${result.error}`);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await setDoc(cooldownRef, {
      email,
      query: displayQuery,
      lastSent: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      provider: result.provider,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error.";
    console.error("[SearchNotify] Error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    closeEmailTransport();
  }
}
