import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { decodeUnsubscribeToken } from "@/lib/email/template";

/**
 * Unsubscribe endpoint referenced by the List-Unsubscribe header and by the
 * footer link in every campaign email.
 *
 * GET  — a person clicked the footer link; record the opt-out, show a page.
 * POST — Gmail/Yahoo one-click unsubscribe (List-Unsubscribe-Post). Mail
 *        providers require this to respond 200 without any confirmation step.
 */

/**
 * Firestore's client SDK retries a failed write indefinitely rather than
 * rejecting. A mail provider's one-click unsubscribe expects a prompt reply
 * and penalises an endpoint that stalls, so the write is raced against a
 * deadline and the response never waits longer than this.
 */
const WRITE_TIMEOUT_MS = 8000;

async function recordOptOut(email: string) {
  const docId = email.replace(/[@.]/g, "_");
  const write = setDoc(
    doc(db, "unsubscribes", docId),
    { email, unsubscribedAt: serverTimestamp() },
    { merge: true }
  );

  await Promise.race([
    write,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Firestore write timed out")), WRITE_TIMEOUT_MS)
    ),
  ]);
}

function page(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — CampusVault GBPIET</title>
</head>
<body style="margin:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:460px;margin:64px auto;padding:32px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;">
    <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#1f2933;">CampusVault GBPIET</p>
    <h1 style="margin:0 0 12px;font-size:18px;color:#1f2933;">${title}</h1>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;">${body}</p>
  </div>
</body>
</html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("u");
  if (!token) return page("Invalid link", "This unsubscribe link is missing its token.", 400);

  const email = decodeUnsubscribeToken(token);
  if (!email) return page("Invalid link", "This unsubscribe link is not valid.", 400);

  try {
    await recordOptOut(email);
    return page(
      "You're unsubscribed",
      `<strong>${email}</strong> will no longer receive CampusVault emails. You can still use the site normally.`
    );
  } catch (err) {
    console.error("[Unsubscribe] Failed to record opt-out:", err);
    return page(
      "Something went wrong",
      "We could not record your request. Please reply to the email and we'll remove you manually.",
      500
    );
  }
}

/** One-click unsubscribe. Must return 200 quickly with no confirmation UI. */
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("u");
  const email = token ? decodeUnsubscribeToken(token) : null;
  if (!email) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

  try {
    await recordOptOut(email);
  } catch (err) {
    console.error("[Unsubscribe] Failed to record one-click opt-out:", err);
    // Still 200 — providers retry or penalise a failing endpoint, and the
    // opt-out is also reachable via the GET link in the footer.
  }
  return NextResponse.json({ success: true });
}
