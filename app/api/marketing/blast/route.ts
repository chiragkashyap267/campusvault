import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import {
  collection, getDocs, doc, setDoc, getDoc, serverTimestamp, Timestamp
} from "firebase/firestore";
import { sendEmail, closeEmailTransport, getActiveProvider } from "@/lib/email/sender";
import { buildEmailHtml, buildEmailText, buildUnsubscribeUrl } from "@/lib/email/template";
import { getEmailAppUrl } from "@/lib/email/app-url";

// Ask the platform for the longest run it will allow. Vercel Hobby caps at
// 60s regardless; Pro honours this.
export const maxDuration = 300;

// How many days between automated blasts to the same user
const BLAST_COOLDOWN_DAYS = 7;

// Gmail SMTP tolerates a steady trickle far better than a burst.
const SEND_INTERVAL_MS = 900;

// Free Gmail accounts cap around 500 recipients/day. Stop short of that so a
// single blast can never burn the whole quota and start bouncing mid-run.
const MAX_RECIPIENTS_PER_RUN = 400;

/**
 * Wall-clock budget for one invocation.
 *
 * A serverless function is killed at its platform limit with no chance to
 * respond, which would leave the caller unable to tell what was sent. So the
 * loop stops on its own and reports honestly instead.
 *
 * The 7-day per-user cooldown makes re-running safe and idempotent: anyone
 * already mailed is skipped, so the next run simply picks up where this one
 * left off. That is why the cron runs daily rather than weekly.
 */
const TIME_BUDGET_MS = 45_000;

interface Recipient {
  name: string;
  email: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/marketing/blast
 * Sends a campaign email to all registered users + newsletter subscribers.
 * Uses Gmail SMTP (no domain needed) → falls back to Resend.
 */
export async function POST(req: NextRequest) {
  try {
    const {
      subject,
      headline,
      message,
      skipCooldown = false,
    } = await req.json();

    if (!subject || !headline || !message) {
      return NextResponse.json({ error: "Missing subject, headline or message." }, { status: 400 });
    }

    // ── Collect recipients (deduplicated by email) ──────────────────
    const emailSet = new Set<string>();
    const recipients: Recipient[] = [];

    const addRecipient = (name: string, email: unknown) => {
      const norm = String(email ?? "").trim().toLowerCase();
      if (!EMAIL_RE.test(norm)) return;
      if (emailSet.has(norm)) return;
      emailSet.add(norm);
      recipients.push({ name: name || "Student", email: norm });
    };

    // 1. Registered users from Firestore `users` collection
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      usersSnap.forEach(d => {
        const data = d.data();
        if (data.email) addRecipient(data.displayName || "Student", data.email);
      });
    } catch (e) {
      console.warn("[Blast] Could not read users collection:", e);
    }

    // 2. Newsletter subscribers from `subscribers` collection
    try {
      const subSnap = await getDocs(collection(db, "subscribers"));
      subSnap.forEach(d => {
        const data = d.data();
        if (data.email) addRecipient(data.name || "Student", data.email);
      });
    } catch (e) {
      console.warn("[Blast] Could not read subscribers collection:", e);
    }

    // 3. Drop anyone who opted out. Sending to an unsubscribed address is the
    //    fastest way to get a sender marked as spam.
    let unsubscribed = 0;
    try {
      const optOutSnap = await getDocs(collection(db, "unsubscribes"));
      const optedOut = new Set<string>();
      optOutSnap.forEach(d => {
        const email = String(d.data()?.email ?? "").trim().toLowerCase();
        if (email) optedOut.add(email);
      });
      if (optedOut.size > 0) {
        for (let i = recipients.length - 1; i >= 0; i--) {
          if (optedOut.has(recipients[i].email)) {
            recipients.splice(i, 1);
            unsubscribed++;
          }
        }
      }
    } catch (e) {
      console.warn("[Blast] Could not read unsubscribes collection:", e);
    }

    if (recipients.length === 0) {
      return NextResponse.json({
        message: "No recipients found.",
        sent: 0, failed: 0, skipped: 0, unsubscribed, total: 0,
      });
    }

    const appUrl = getEmailAppUrl();

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    let capped = 0;
    let outOfTime = false;
    const startedAt = Date.now();
    const errors: string[] = [];

    // Per-recipient outcome, so "sent 16" can be checked against reality
    // instead of taken on faith. Addresses are masked: this response is read
    // in a browser and should not expose the whole mailing list.
    const log: { to: string; status: string; id?: string; error?: string }[] = [];
    const mask = (email: string) => {
      const [user, domain] = email.split("@");
      const head = user.slice(0, 2);
      return `${head}${"*".repeat(Math.max(user.length - 2, 1))}@${domain}`;
    };

    for (const recipient of recipients) {
      if (sent >= MAX_RECIPIENTS_PER_RUN) {
        capped++;
        continue;
      }
      if (Date.now() - startedAt > TIME_BUDGET_MS) {
        outOfTime = true;
        capped++;
        continue;
      }

      const cooldownKey = `blast__${recipient.email.replace(/[@.]/g, "_")}`;

      // ── Per-user cooldown check ──────────────────────────────────────
      if (!skipCooldown) {
        try {
          const cooldownSnap = await getDoc(doc(db, "blast_cooldowns", cooldownKey));
          if (cooldownSnap.exists()) {
            const lastSent = cooldownSnap.data()?.lastSent as Timestamp | undefined;
            if (lastSent) {
              const daysSince = (Date.now() - lastSent.toMillis()) / (1000 * 60 * 60 * 24);
              if (daysSince < BLAST_COOLDOWN_DAYS) {
                console.log(`[Blast] Skipping ${recipient.email} — cooldown active (${Math.ceil(BLAST_COOLDOWN_DAYS - daysSince)}d left)`);
                skipped++;
                log.push({ to: mask(recipient.email), status: "skipped-cooldown" });
                continue;
              }
            }
          }
        } catch (e) {
          console.warn(`[Blast] Cooldown check failed for ${recipient.email}:`, e);
        }
      }

      const firstName = recipient.name.split(" ")[0] || "Student";
      const unsubscribeUrl = buildUnsubscribeUrl(appUrl, recipient.email);
      const template = {
        firstName,
        headline: String(headline),
        message: String(message),
        ctaLabel: "Open CampusVault",
        ctaUrl: appUrl,
        unsubscribeUrl,
      };

      const result = await sendEmail({
        to: recipient.email,
        subject,
        html: buildEmailHtml(template),
        text: buildEmailText(template),
        fromName: "CampusVault GBPIET",
        unsubscribeUrl,
        // Unique per recipient so Gmail shows separate messages, not a thread.
        entityRefId: `blast-${cooldownKey}-${Date.now()}`,
      });

      if (result.success) {
        console.log(`[Blast] ✓ Sent to ${recipient.email} via ${result.provider} (ID: ${result.messageId})`);
        sent++;
        log.push({ to: mask(recipient.email), status: `accepted-by-${result.provider}`, id: result.messageId });

        if (!skipCooldown) {
          try {
            await setDoc(doc(db, "blast_cooldowns", cooldownKey), {
              email: recipient.email,
              lastSent: serverTimestamp(),
            });
          } catch (e) {
            console.warn(`[Blast] Could not record cooldown for ${recipient.email}:`, e);
          }
        }
      } else {
        console.error(`[Blast] ✗ Failed ${recipient.email}: ${result.error}`);
        errors.push(`${recipient.email}: ${result.error}`);
        failed++;
        log.push({ to: mask(recipient.email), status: "failed", error: result.error });
      }

      // Throttle so Gmail sees a steady trickle rather than a burst.
      await new Promise(resolve => setTimeout(resolve, SEND_INTERVAL_MS));
    }

    if (capped > 0) {
      console.warn(
        `[Blast] ${outOfTime ? "Time budget" : "Daily cap"} reached — ` +
        `${capped} recipient(s) not attempted this run. Re-run to continue; ` +
        `the cooldown skips anyone already mailed.`
      );
    }

    return NextResponse.json({
      success: true,
      total: recipients.length,
      sent,
      failed,
      skipped,
      unsubscribed,
      notAttempted: capped,
      provider: getActiveProvider(),
      appUrl,
      // "accepted-by-gmail" means Gmail's SMTP server took the message. It is
      // not proof of inbox placement: a message can be accepted and still be
      // filtered into spam at the recipient's end.
      log,
      // The caller (or tomorrow's cron run) should call again to finish.
      hasMore: capped > 0,
      stoppedReason: outOfTime ? "time-budget" : capped > 0 ? "daily-cap" : null,
      errors: errors.slice(0, 10),
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    console.error("[Blast] Fatal error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    // Release the pooled SMTP connection so the serverless instance can idle.
    closeEmailTransport();
  }
}
