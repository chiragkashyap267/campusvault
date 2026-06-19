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
  templateStyle,
  appUrl,
}: {
  firstName: string;
  headline: string;
  message: string;
  templateStyle: string;
  appUrl: string;
}) {
  const grad = THEME_GRADIENTS[templateStyle] || THEME_GRADIENTS.royal;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { background:#f1f5f9; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; }
    .wrapper { max-width:600px; margin:40px auto; padding:0 16px; }
    .card { background:#fff; border-radius:24px; overflow:hidden; box-shadow:0 8px 40px rgba(30,64,175,0.1); border:1px solid rgba(30,64,175,0.08); }
    .header { background:${grad}; padding:40px 32px; text-align:center; color:#fff; }
    .logo-row { display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:12px; }
    .logo-icon { width:40px; height:40px; background:rgba(255,255,255,0.2); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:22px; }
    .logo-text { font-size:20px; font-weight:800; color:#fff; }
    .header p { font-size:13px; opacity:0.85; margin-top:4px; }
    .content { padding:36px 32px 28px; }
    .greeting { font-size:20px; font-weight:800; color:#0f172a; margin-bottom:10px; }
    .body-text { font-size:14px; color:#334155; line-height:1.7; margin-bottom:28px; white-space:pre-wrap; }
    .cta-wrap { text-align:center; margin-bottom:32px; }
    .cta-btn { display:inline-block; background:${grad}; color:#fff !important; font-size:15px; font-weight:700; text-decoration:none; padding:16px 40px; border-radius:14px; box-shadow:0 6px 20px rgba(30,64,175,0.3); }
    .upload-box { background:linear-gradient(135deg,#eff6ff,#f5f3ff); border:1px solid rgba(37,99,235,0.15); border-radius:16px; padding:20px 24px; margin-bottom:24px; }
    .upload-box h3 { font-size:14px; font-weight:800; color:#1e40af; margin-bottom:6px; }
    .upload-box p { font-size:13px; color:#334155; line-height:1.6; }
    .upload-btn { display:inline-block; margin-top:14px; background:#fff; border:2px solid #2563eb; color:#2563eb !important; font-size:13px; font-weight:700; text-decoration:none; padding:10px 24px; border-radius:10px; }
    .footer { background:#f8fafc; border-top:1px solid #e2e8f0; padding:24px 32px; text-align:center; }
    .footer p { font-size:12px; color:#94a3b8; line-height:1.6; }
    .footer a { color:#2563eb; text-decoration:none; font-weight:600; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo-row">
          <div class="logo-icon">📚</div>
          <span class="logo-text">CampusVault <span style="opacity:0.8;">GBPIET</span></span>
        </div>
        <p>Your Central Academic Portal</p>
      </div>
      <div class="content">
        <div class="greeting">Hey ${firstName}! 👋</div>
        <div class="body-text">${message}</div>
        <div class="upload-box">
          <h3>📤 Help Your Batchmates — Upload Your Notes!</h3>
          <p>Do you have CT papers, handwritten notes, books, or lab manuals? Upload them to CampusVault and earn leaderboard points while helping 100s of students!</p>
          <a href="${appUrl}/upload" class="upload-btn">Upload Resources Now →</a>
        </div>
        <div class="cta-wrap">
          <a href="${appUrl}/resources" class="cta-btn">Browse All Resources →</a>
        </div>
      </div>
      <div class="footer">
        <p style="font-weight:800;color:#64748b;font-size:13px;margin-bottom:8px;">© 2026 CampusVault GBPIET</p>
        <p>You received this as a registered student on CampusVault.<br>
        Built completely free for GBPIET students by students.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
