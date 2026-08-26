import { NextResponse } from "next/server";
import { getActiveProvider, verifyEmailTransport } from "@/lib/email/sender";

/**
 * GET /api/marketing/config
 *
 * Reports which email provider is actually live and whether its credentials
 * work. Previously this only reported whether RESEND_API_KEY was set, which
 * said nothing about whether mail would reach anyone — the exact question you
 * need answered when a blast silently only lands in one inbox.
 */
export async function GET() {
  try {
    const hasGmail = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
    const hasResend = !!process.env.RESEND_API_KEY;
    const hasVerifiedResendDomain = !!process.env.RESEND_FROM_EMAIL;

    // Only Gmail can be checked without sending anything.
    const verification = hasGmail ? await verifyEmailTransport() : null;

    const warnings: string[] = [];
    if (!hasGmail && hasResend && !hasVerifiedResendDomain) {
      warnings.push(
        "Resend is running without a verified sending domain, so it can only " +
        "deliver to the Resend account owner's own address. Set GMAIL_USER and " +
        "GMAIL_APP_PASSWORD to reach every recipient."
      );
    }
    if (!hasGmail && !hasResend) {
      warnings.push("No email provider is configured — nothing will send.");
    }
    if (verification && !verification.ok) {
      warnings.push(`Gmail SMTP credentials rejected: ${verification.error}`);
    }

    return NextResponse.json({
      provider: getActiveProvider(),
      hasGmail,
      hasResend,
      // Kept for the existing admin UI, which reads this field.
      hasServerApiKey: hasResend,
      gmailVerified: verification?.ok ?? null,
      canReachAllRecipients: hasGmail || hasVerifiedResendDomain,
      warnings,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Config check error:", error);
    return NextResponse.json({ hasServerApiKey: false, error: msg }, { status: 500 });
  }
}
