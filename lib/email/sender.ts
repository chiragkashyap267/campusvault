/**
 * lib/email/sender.ts
 *
 * Unified email sender — Gmail SMTP primary, Resend fallback.
 *
 * Deliverability notes (why this file looks the way it does):
 *  - A pooled transport is reused across a blast. Opening a fresh SMTP
 *    connection per recipient is slow and trips Gmail's rate limiter, which
 *    is what makes a blast look like it "only sent to one person".
 *  - Every message carries a plain-text alternative. HTML-only mail is one of
 *    the strongest spam signals there is.
 *  - List-Unsubscribe + List-Unsubscribe-Post are required by Gmail and Yahoo
 *    for bulk senders (since Feb 2024). Without them bulk mail is filtered.
 *  - `From` must match the authenticated Gmail account or Gmail rewrites it,
 *    and a rewritten From scores badly.
 *
 * Gmail SMTP setup (free, no domain required):
 *   1. myaccount.google.com → Security → 2-Step Verification → App Passwords
 *   2. Create an App Password for "Mail"
 *   3. Set GMAIL_USER=yourmail@gmail.com and GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 *      in .env.local and in Vercel environment variables.
 *
 * Gmail limits: ~500 recipients/day on a free account, ~2000 on Workspace.
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  /** Plain-text alternative. Auto-derived from `html` when omitted. */
  text?: string;
  fromName?: string;
  /** Where replies go. Defaults to the sending account. */
  replyTo?: string;
  /** Absolute URL that unsubscribes this recipient. Adds List-Unsubscribe. */
  unsubscribeUrl?: string;
  /** Stable per-message id used to stop Gmail collapsing a blast into a thread. */
  entityRefId?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  provider?: "gmail" | "resend";
  error?: string;
}

// ── Plain-text derivation ───────────────────────────────────────────────────
/**
 * Turn the HTML body into a readable text/plain part. Not a full renderer —
 * it just needs to be legible, because its presence (not its beauty) is what
 * spam filters weigh.
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    // Keep link targets visible: "text (https://…)"
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => {
      const clean = String(label).replace(/<[^>]+>/g, "").trim();
      return clean && !clean.startsWith("http") ? `${clean} (${href})` : String(href);
    })
    .replace(/<\/(p|div|tr|h[1-6]|li|table)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "  • ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .trim();
}

// ── Gmail SMTP transport (pooled + reused) ──────────────────────────────────
let cachedTransport: Transporter | null = null;
let cachedTransportKey = "";

function getGmailTransport(): Transporter | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  // App Passwords are displayed with spaces; SMTP wants them stripped.
  const normalizedPass = pass.replace(/\s+/g, "");
  const key = `${user}:${normalizedPass.length}`;

  if (cachedTransport && cachedTransportKey === key) return cachedTransport;

  cachedTransport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: normalizedPass },
    // Reuse one authenticated connection for a whole blast instead of
    // reconnecting per recipient.
    pool: true,
    maxConnections: 1,
    maxMessages: 100,
    // Stay under Gmail's per-connection throughput ceiling.
    rateDelta: 1000,
    rateLimit: 3,
  });
  cachedTransportKey = key;
  return cachedTransport;
}

/** Release the pooled SMTP connection. Call once a blast finishes. */
export function closeEmailTransport() {
  if (cachedTransport) {
    try {
      cachedTransport.close();
    } catch {
      /* already closed */
    }
    cachedTransport = null;
    cachedTransportKey = "";
  }
}

/** Verify SMTP credentials without sending. Used by the admin config check. */
export async function verifyEmailTransport(): Promise<{ ok: boolean; error?: string }> {
  const transport = getGmailTransport();
  if (!transport) return { ok: false, error: "GMAIL_USER / GMAIL_APP_PASSWORD not set" };
  try {
    await transport.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Send via Gmail SMTP ─────────────────────────────────────────────────────
async function sendViaGmail(opts: SendEmailOptions): Promise<SendResult> {
  const transport = getGmailTransport();
  if (!transport) return { success: false, error: "Gmail not configured" };

  const fromEmail = process.env.GMAIL_USER!;
  const fromName = opts.fromName || "CampusVault GBPIET";

  // Gmail rewrites a From it did not authenticate, and the rewrite costs
  // reputation — so the address always stays the authenticated account.
  const headers: Record<string, string> = {};

  if (opts.unsubscribeUrl) {
    // Both forms: Gmail prefers one-click POST, older clients use mailto.
    headers["List-Unsubscribe"] = `<${opts.unsubscribeUrl}>, <mailto:${fromEmail}?subject=unsubscribe>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  if (opts.entityRefId) {
    // Stops Gmail from collapsing a campaign into one clipped thread.
    headers["X-Entity-Ref-ID"] = opts.entityRefId;
  }

  // `Precedence: bulk` and `Auto-Submitted: auto-generated` used to be set here
  // and have been removed on purpose.
  //
  // Neither is required. `Auto-Submitted` (RFC 3834) marks machine-generated
  // mail like bounces and out-of-office replies, not newsletters, and
  // `Precedence: bulk` is a legacy header some filters use to skip the inbox.
  // Both announce "this is bulk mail from a robot".
  //
  // A message sent through a personal Gmail account has no domain reputation
  // to trade on; the one asset it does have is that it looks like ordinary
  // mail from a real person. Volunteering bulk markers throws that away.
  // List-Unsubscribe stays — it is a genuine trust signal and is what Gmail
  // actually asks bulk senders for.

  try {
    const info = await transport.sendMail({
      from: { name: fromName, address: fromEmail },
      sender: fromEmail,
      replyTo: opts.replyTo || fromEmail,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text || htmlToPlainText(opts.html),
      headers,
    });
    return { success: true, messageId: info.messageId, provider: "gmail" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      provider: "gmail",
    };
  }
}

// ── Send via Resend ─────────────────────────────────────────────────────────
async function sendViaResend(opts: SendEmailOptions): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "RESEND_API_KEY not configured" };

  const fromName = opts.fromName || "CampusVault GBPIET";
  const fromEmail = process.env.RESEND_FROM_EMAIL || `${fromName} <onboarding@resend.dev>`;

  const headers: Record<string, string> = {};
  if (opts.unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${opts.unsubscribeUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

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
        text: opts.text || htmlToPlainText(opts.html),
        reply_to: opts.replyTo,
        headers,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      let errMsg = data?.message || "Resend API error";
      // The single most common failure in this project: an unverified domain
      // limits delivery to the Resend account owner's own address.
      if (/verify a domain|testing emails|own email address/i.test(errMsg)) {
        errMsg =
          `${errMsg} — Resend only delivers to the account owner until a sending ` +
          `domain is verified. Configure GMAIL_USER + GMAIL_APP_PASSWORD to reach all recipients.`;
      }
      return { success: false, error: errMsg, provider: "resend" };
    }

    return { success: true, messageId: data.id, provider: "resend" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      provider: "resend",
    };
  }
}

/**
 * Main send function.
 * Priority: Gmail SMTP → Resend.
 * Gmail reaches any recipient without domain verification; Resend without a
 * verified domain reaches only the account owner.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<SendResult> {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const result = await sendViaGmail(opts);
    if (result.success) return result;
    console.warn(`[Email] Gmail failed for ${opts.to}: ${result.error}. Falling back to Resend.`);

    // A dead pooled connection stays dead — drop it so the next send redials.
    closeEmailTransport();

    if (!process.env.RESEND_API_KEY) return result;
  }

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
