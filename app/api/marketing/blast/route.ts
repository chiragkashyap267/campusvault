import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import {
  collection, getDocs, doc, setDoc, getDoc, serverTimestamp, Timestamp
} from "firebase/firestore";
import { sendEmail } from "@/lib/email/sender";

// How many days between automated blasts to the same user
const BLAST_COOLDOWN_DAYS = 7;

interface Recipient {
  name: string;
  email: string;
}

/**
 * POST /api/marketing/blast
 * Sends a campaign email to ALL registered users + newsletter subscribers.
 * Uses Gmail SMTP (no domain needed) → falls back to Resend.
 */
export async function POST(req: NextRequest) {
  try {
    const {
      subject,
      headline,
      message,
      templateStyle = "royal",
      skipCooldown = false,
    } = await req.json();

    if (!subject || !headline || !message) {
      return NextResponse.json({ error: "Missing subject, headline or message." }, { status: 400 });
    }

    // ── Collect recipients (deduplicated by email) ──────────────────
    const emailSet = new Set<string>();
    const recipients: Recipient[] = [];

    const addRecipient = (name: string, email: string) => {
      const norm = email.trim().toLowerCase();
      if (norm && !emailSet.has(norm)) {
        emailSet.add(norm);
        recipients.push({ name: name || "Student", email: norm });
      }
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

    if (recipients.length === 0) {
      return NextResponse.json({ message: "No recipients found.", sent: 0, failed: 0, total: 0 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://campusvaultgbpiet.vercel.app";

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      // ── Per-user cooldown check ──────────────────────────────────────
      if (!skipCooldown) {
        const cooldownKey = `blast__${recipient.email.replace(/[@.]/g, "_")}`;
        const cooldownRef = doc(db, "blast_cooldowns", cooldownKey);
        const cooldownSnap = await getDoc(cooldownRef);
        if (cooldownSnap.exists()) {
          const lastSent = cooldownSnap.data()?.lastSent as Timestamp | undefined;
          if (lastSent) {
            const daysSince = (Date.now() - lastSent.toMillis()) / (1000 * 60 * 60 * 24);
            if (daysSince < BLAST_COOLDOWN_DAYS) {
              console.log(`[Blast] Skipping ${recipient.email} — cooldown active (${Math.ceil(BLAST_COOLDOWN_DAYS - daysSince)}d left)`);
              // Count as sent so UI shows correct total
              sent++;
              continue;
            }
          }
        }
      }

      const firstName = recipient.name.split(" ")[0] || "Student";
      const htmlContent = buildEmailHtml({ firstName, headline, message, templateStyle, appUrl });

      const result = await sendEmail({
        to: recipient.email,
        subject,
        html: htmlContent,
        fromName: "CampusVault GBPIET",
      });

      if (result.success) {
        console.log(`[Blast] ✓ Sent to ${recipient.email} via ${result.provider} (ID: ${result.messageId})`);
        sent++;

        // Record cooldown
        if (!skipCooldown) {
          const cooldownKey = `blast__${recipient.email.replace(/[@.]/g, "_")}`;
          await setDoc(doc(db, "blast_cooldowns", cooldownKey), {
            email: recipient.email,
            lastSent: serverTimestamp(),
          });
        }
      } else {
        console.error(`[Blast] ✗ Failed ${recipient.email}: ${result.error}`);
        errors.push(`${recipient.email}: ${result.error}`);
        failed++;
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return NextResponse.json({
      success: true,
      total: recipients.length,
      sent,
      failed,
      errors: errors.slice(0, 10),
    });

  } catch (err: any) {
    console.error("[Blast] Fatal error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// ── Email HTML builder ──────────────────────────────────────────────────────
const THEME_GRADIENTS: Record<string, string> = {
  sky:     "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
  royal:   "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
  gold:    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  emerald: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
};

function buildEmailHtml({
  firstName,
  headline,
  message,
  appUrl,
}: {
  firstName: string;
  headline: string;
  message: string;
  templateStyle?: string;
  appUrl: string;
}) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${headline}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #333333;
      line-height: 1.6;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      border-bottom: 1px solid #eeeeee;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eeeeee;
      font-size: 12px;
      color: #777777;
    }
    .btn {
      display: inline-block;
      padding: 10px 20px;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin-top: 15px;
    }
    h2 { color: #1e293b; font-size: 20px; margin-top: 0; }
  </style>
</head>
<body>
  <div class="header">
    <strong>CampusVault GBPIET</strong>
  </div>
  
  <p>Hi ${firstName},</p>
  
  <h2>${headline}</h2>
  
  <div style="white-space: pre-wrap; margin-bottom: 25px;">${message}</div>
  
  <p>We are constantly adding new PYQs, notes, and lab manuals. If you have any study materials, you can help your batchmates by sharing them on the platform.</p>
  
  <p>
    <a href="${appUrl}" class="btn">Open CampusVault</a>
  </p>
  
  <div class="footer">
    <p>You received this email because you are registered as a student on CampusVault.</p>
    <p>This is an automated update. If you need assistance, reply to this email.</p>
    <p>&copy; 2026 CampusVault GBPIET (Built by students, for students)</p>
  </div>
</body>
</html>`;
}
