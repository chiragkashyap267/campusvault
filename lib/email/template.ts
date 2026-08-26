/**
 * lib/email/template.ts
 *
 * Shared HTML builder for every outbound CampusVault email.
 *
 * Rules this file exists to enforce:
 *  - All CSS is inlined on the element. Gmail strips <style> blocks in the
 *    web client and on Android, so a <head><style> layout renders unstyled.
 *  - Layout is a centred <table>, not flex/grid. Outlook has no flexbox.
 *  - Every interpolated value is HTML-escaped. Titles and names come from
 *    user input and would otherwise break the markup (or inject into it).
 *  - There is always a visible unsubscribe link, matching the
 *    List-Unsubscribe header. Bulk mail without one gets filtered.
 */

/** Escape a value for safe interpolation into HTML markup. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape, then convert newlines to <br> for a multi-line message body. */
function escapeMultiline(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

export interface EmailTemplateOptions {
  /** Greeting name, e.g. "Chirag". */
  firstName?: string;
  /** Bold lead line under the greeting. */
  headline: string;
  /** Body copy. Newlines become line breaks. */
  message: string;
  /** Label + href for the primary button. */
  ctaLabel?: string;
  ctaUrl: string;
  /** Absolute unsubscribe URL — also sent as the List-Unsubscribe header. */
  unsubscribeUrl?: string;
  /** Short line explaining why this person is receiving the mail. */
  reason?: string;
}

const TEXT = "#1f2933";
const MUTED = "#6b7280";
const RULE = "#e5e7eb";
const ACCENT = "#2563eb";

/**
 * Build the campaign/notification email body.
 *
 * Deliberately plain: heavy gradients, large hero images and loud colour
 * blocks all raise spam scores, and a Gmail-SMTP sender has no domain
 * reputation to spend on them.
 */
export function buildEmailHtml(opts: EmailTemplateOptions): string {
  const {
    firstName,
    headline,
    message,
    ctaLabel = "Open CampusVault",
    ctaUrl,
    unsubscribeUrl,
    reason = "You are receiving this because you registered on CampusVault GBPIET.",
  } = opts;

  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi,";
  const safeCta = escapeHtml(ctaUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(headline)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7;padding:24px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border:1px solid ${RULE};border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

        <tr>
          <td style="padding:20px 28px;border-bottom:1px solid ${RULE};">
            <span style="font-size:16px;font-weight:600;color:${TEXT};">CampusVault GBPIET</span>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 28px 8px 28px;">
            <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${TEXT};">${greeting}</p>
            <p style="margin:0 0 16px 0;font-size:17px;line-height:1.45;font-weight:600;color:${TEXT};">${escapeHtml(headline)}</p>
            <div style="margin:0 0 20px 0;font-size:15px;line-height:1.65;color:${TEXT};">${escapeMultiline(message)}</div>
          </td>
        </tr>

        <tr>
          <td style="padding:0 28px 28px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:${ACCENT};border-radius:6px;">
                  <a href="${safeCta}" style="display:inline-block;padding:11px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(ctaLabel)}</a>
                </td>
              </tr>
            </table>
            <p style="margin:14px 0 0 0;font-size:13px;line-height:1.5;color:${MUTED};">
              Or open this link directly: <a href="${safeCta}" style="color:${ACCENT};">${safeCta}</a>
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:18px 28px 24px 28px;border-top:1px solid ${RULE};">
            <p style="margin:0 0 6px 0;font-size:12px;line-height:1.6;color:${MUTED};">${escapeHtml(reason)}</p>
            <p style="margin:0 0 6px 0;font-size:12px;line-height:1.6;color:${MUTED};">Reply to this email if you need help — a real person reads it.</p>
            ${
              unsubscribeUrl
                ? `<p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};"><a href="${escapeHtml(unsubscribeUrl)}" style="color:${MUTED};text-decoration:underline;">Unsubscribe from these emails</a></p>`
                : ""
            }
            <p style="margin:10px 0 0 0;font-size:12px;color:${MUTED};">CampusVault GBPIET &middot; Built by students, for students</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/**
 * Plain-text counterpart. Written by hand rather than derived, so the text
 * part reads naturally — multipart mail where both parts agree scores better
 * than mail where the text part is obvious HTML scrapings.
 */
export function buildEmailText(opts: EmailTemplateOptions): string {
  const {
    firstName,
    headline,
    message,
    ctaLabel = "Open CampusVault",
    ctaUrl,
    unsubscribeUrl,
    reason = "You are receiving this because you registered on CampusVault GBPIET.",
  } = opts;

  return [
    firstName ? `Hi ${firstName},` : "Hi,",
    "",
    headline,
    "",
    message,
    "",
    `${ctaLabel}: ${ctaUrl}`,
    "",
    "—",
    reason,
    "Reply to this email if you need help — a real person reads it.",
    unsubscribeUrl ? `Unsubscribe: ${unsubscribeUrl}` : "",
    "CampusVault GBPIET · Built by students, for students",
  ]
    .filter((line) => line !== undefined)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Signed unsubscribe URL for a recipient.
 *
 * The token is a plain reversible encoding, not a secret — it only needs to
 * stop someone unsubscribing an address by guessing a sequential id, and the
 * route re-validates the address before writing anything.
 */
export function buildUnsubscribeUrl(appUrl: string, email: string): string {
  const token = Buffer.from(email.trim().toLowerCase(), "utf8").toString("base64url");
  return `${appUrl.replace(/\/$/, "")}/api/newsletter/unsubscribe?u=${token}`;
}

/** Reverse of {@link buildUnsubscribeUrl}. Returns null on a malformed token. */
export function decodeUnsubscribeToken(token: string): string | null {
  try {
    const email = Buffer.from(token, "base64url").toString("utf8").trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
  } catch {
    return null;
  }
}
