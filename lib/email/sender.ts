/**
 * lib/email/sender.ts
 *
 * Unified email sender — tries Gmail SMTP first (no domain needed),
 * falls back to Resend if Gmail is not configured.
 *
 * Gmail SMTP setup (free, no domain required):
 *   1. Go to myaccount.google.com → Security → 2-Step Verification → App Passwords
 *   2. Create an App Password for "Mail"
 *   3. Set GMAIL_USER=yourmail@gmail.com and GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 *      in .env.local and Vercel environment variables.
 */

import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  provider?: "gmail" | "resend";
  error?: string;
}

// ── Gmail SMTP transport ────────────────────────────────────────────────────
function createGmailTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

// ── Send via Gmail SMTP ─────────────────────────────────────────────────────
async function sendViaGmail(opts: SendEmailOptions): Promise<SendResult> {
  const transport = createGmailTransport();
  if (!transport) {
    return { success: false, error: "Gmail not configured" };
  }

  const fromName = opts.fromName || "CampusVault GBPIET";
  const fromEmail = process.env.GMAIL_USER!;

  try {
    const info = await transport.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return { success: true, messageId: info.messageId, provider: "gmail" };
  } catch (err: any) {
    return { success: false, error: err.message, provider: "gmail" };
  }
}

// ── Send via Resend ─────────────────────────────────────────────────────────
async function sendViaResend(opts: SendEmailOptions): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const fromName = opts.fromName || "CampusVault GBPIET";
  const fromEmail = process.env.RESEND_FROM_EMAIL || `${fromName} <onboarding@resend.dev>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.message || "Resend API error";
      return { success: false, error: errMsg, provider: "resend" };
    }

    return { success: true, messageId: data.id, provider: "resend" };
  } catch (err: any) {
    return { success: false, error: err.message, provider: "resend" };
  }
}

/**
 * Main send function.
 * Priority: Gmail SMTP → Resend
 * Gmail works with any recipient without domain verification.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<SendResult> {
  // Try Gmail first (works without a domain — just needs App Password)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const result = await sendViaGmail(opts);
    if (result.success) return result;
    console.warn(`[Email] Gmail failed for ${opts.to}: ${result.error}. Falling back to Resend.`);
  }

  // Fallback: Resend (requires verified domain for non-owner emails)
  return sendViaResend(opts);
}

export function isEmailConfigured(): boolean {
  const hasGmail = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  const hasResend = !!process.env.RESEND_API_KEY;
  return hasGmail || hasResend;
}

export function getActiveProvider(): string {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) return "Gmail SMTP";
  if (process.env.RESEND_API_KEY) return "Resend (domain required)";
  return "None configured";
}
