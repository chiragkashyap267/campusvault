/**
 * lib/email/app-url.ts
 *
 * Resolves the public base URL used in outgoing email.
 *
 * Every route used to do `process.env.NEXT_PUBLIC_APP_URL || "https://…"`,
 * which looks safe but is not: the fallback only applies when the variable is
 * *missing*. If it is set to `http://localhost:3000` — the value in the env
 * template, and an easy one to paste into a hosting dashboard — that localhost
 * URL is what every recipient gets.
 *
 * That breaks two things at once:
 *   1. The button and the unsubscribe link point at the recipient's own
 *      machine, so neither works.
 *   2. A non-public URL in a message body is a strong spam signal. Filters
 *      treat localhost and bare IP links as a hallmark of malicious mail, so a
 *      single such link can outweigh everything else done for deliverability.
 *
 * Email must therefore never contain a local URL, regardless of how the
 * environment is configured.
 */

const PRODUCTION_FALLBACK = "https://campusvaultgbpiet.vercel.app";

/** True for anything that must never appear in an email sent to someone else. */
function isLocalUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|.*\.local)(:\d+)?(\/|$)/i.test(url);
}

function isUsablePublicUrl(value: string | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  return !isLocalUrl(trimmed);
}

/**
 * Base URL for links in outgoing email, without a trailing slash.
 *
 * Order of preference:
 *   1. NEXT_PUBLIC_APP_URL, when it is a real public URL
 *   2. the deployment's own hostname, as reported by the platform
 *   3. the known production URL
 */
export function getEmailAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (isUsablePublicUrl(configured)) {
    return configured.replace(/\/+$/, "");
  }

  if (configured && isLocalUrl(configured)) {
    console.warn(
      `[Email] NEXT_PUBLIC_APP_URL is "${configured}", which is a local address. ` +
      `Links in email would be unreachable for recipients and would hurt spam ` +
      `scoring, so it is being ignored. Set it to the public site URL.`
    );
  }

  // Vercel exposes the stable production hostname, and the per-deployment one.
  const platformHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (platformHost) {
    const withScheme = platformHost.startsWith("http") ? platformHost : `https://${platformHost}`;
    if (isUsablePublicUrl(withScheme)) return withScheme.replace(/\/+$/, "");
  }

  return PRODUCTION_FALLBACK;
}
