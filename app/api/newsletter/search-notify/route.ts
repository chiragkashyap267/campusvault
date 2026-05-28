import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import {
  doc, getDoc, setDoc, serverTimestamp, Timestamp
} from "firebase/firestore";

const COOLDOWN_HOURS = 24;

export async function POST(req: NextRequest) {
  try {
    const {
      studentEmail,
      studentName,
      searchQuery,
      branch = "",
    } = await req.json();

    if (!studentEmail || !searchQuery) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // Silently skip if no API key configured — don't break the UI
      return NextResponse.json({ skipped: true, reason: "No RESEND_API_KEY configured." });
    }

    // ── Cooldown check via Firestore ─────────────────────────────────
    const safeQuery = searchQuery.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 60);
    const cooldownId = `${studentEmail.replace(/[@.]/g, "_")}__${safeQuery}`;
    const cooldownRef = doc(db, "newsletter_cooldowns", cooldownId);

    const cooldownSnap = await getDoc(cooldownRef);
    if (cooldownSnap.exists()) {
      const lastSent = cooldownSnap.data()?.lastSent as Timestamp | undefined;
      if (lastSent) {
        const hoursSince = (Date.now() - lastSent.toMillis()) / (1000 * 60 * 60);
        if (hoursSince < COOLDOWN_HOURS) {
          return NextResponse.json({
            skipped: true,
            reason: `Cooldown active. Next email in ${Math.ceil(COOLDOWN_HOURS - hoursSince)}h.`
          });
        }
      }
    }

    // ── Build personalized HTML email ────────────────────────────────
    const firstName = studentName?.split(" ")[0] || "Student";
    const displayQuery = searchQuery.trim();
    const resourceUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://campusvault.vercel.app"}/resources?search=${encodeURIComponent(searchQuery)}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We found resources for "${displayQuery}" — CampusVault</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #f1f5f9;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 600px;
      margin: 40px auto;
      padding: 0 16px;
    }
    .card {
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(30, 64, 175, 0.1), 0 2px 8px rgba(30, 64, 175, 0.05);
      border: 1px solid rgba(30, 64, 175, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #7c3aed 100%);
      padding: 40px 32px 36px;
      text-align: center;
      color: #ffffff;
      position: relative;
    }
    .header-logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }
    .header-logo-icon {
      width: 40px;
      height: 40px;
      background: rgba(255,255,255,0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .header h1 {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
    }
    .header p {
      font-size: 13px;
      opacity: 0.85;
      margin-top: 4px;
    }
    .search-pill {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 99px;
      padding: 6px 18px;
      font-size: 13px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 20px;
      letter-spacing: 0.01em;
    }
    .content {
      padding: 36px 32px 28px;
    }
    .greeting {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px;
      color: #64748b;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .highlight-box {
      background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%);
      border: 1px solid rgba(37, 99, 235, 0.15);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 28px;
    }
    .highlight-box .label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #2563eb;
      margin-bottom: 8px;
    }
    .highlight-box .query {
      font-size: 22px;
      font-weight: 900;
      color: #1e40af;
      letter-spacing: -0.5px;
      line-height: 1.2;
    }
    .features {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 32px;
    }
    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }
    .feature-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }
    .feature-text {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }
    .feature-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    .cta-section {
      text-align: center;
      padding-bottom: 8px;
    }
    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 14px;
      box-shadow: 0 6px 20px rgba(30, 64, 175, 0.35);
      letter-spacing: -0.2px;
    }
    .cta-sub {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 12px;
    }
    .footer {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 24px 32px;
      text-align: center;
    }
    .footer p {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;
    }
    .footer .brand {
      font-weight: 800;
      color: #64748b;
      font-size: 13px;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <!-- Header -->
      <div class="header">
        <div class="header-logo">
          <div class="header-logo-icon">📚</div>
          <span style="font-size:18px;font-weight:800;color:#fff;">CampusVault <span style="opacity:0.8;">GBPIET</span></span>
        </div>
        <p>Your Central Academic Portal</p>
        <div class="search-pill">🔍 &nbsp;You searched: "${displayQuery}"</div>
      </div>

      <!-- Content -->
      <div class="content">
        <div class="greeting">Hey ${firstName}! 👋</div>
        <p class="subtitle">
          We saw you just searched for something on CampusVault — so we rounded up the best resources matching your query right here!
        </p>

        <div class="highlight-box">
          <div class="label">📌 Your Search Query</div>
          <div class="query">"${displayQuery}"</div>
          ${branch ? `<p style="font-size:12px;color:#64748b;margin-top:6px;">Program: ${branch.toUpperCase()}</p>` : ""}
        </div>

        <div class="features">
          <div class="feature-item">
            <div class="feature-icon" style="background:#eff6ff;">📄</div>
            <div>
              <div class="feature-text">PYQ & CT Papers</div>
              <div class="feature-sub">Previous year exam papers matched to your search</div>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon" style="background:#f0fdf4;">📝</div>
            <div>
              <div class="feature-text">Handwritten Notes</div>
              <div class="feature-sub">Topper notes and study guides by subject</div>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon" style="background:#fdf4ff;">📚</div>
            <div>
              <div class="feature-text">Books & Lab Manuals</div>
              <div class="feature-sub">Full reference books and practicals</div>
            </div>
          </div>
        </div>

        <div class="cta-section">
          <a href="${resourceUrl}" class="cta-btn">View All Resources →</a>
          <p class="cta-sub">Tap to open your personalized search results on CampusVault</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p class="brand">© 2026 CampusVault GBPIET</p>
        <p>
          You received this because you're subscribed to academic digests.<br>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://campusvault.vercel.app"}/marketing">Manage preferences</a> · Built free for GBPIET students.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // ── Send via Resend ──────────────────────────────────────────────
    const payload = {
      from: "CampusVault GBPIET <onboarding@resend.dev>",
      to: studentEmail,
      subject: `📚 Resources found for "${displayQuery}" — CampusVault`,
      html: htmlContent,
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend newsletter error:", data);
      return NextResponse.json({ error: data.message || "Resend API error" }, { status: res.status });
    }

    // ── Record cooldown in Firestore ─────────────────────────────────
    await setDoc(cooldownRef, {
      studentEmail,
      searchQuery,
      lastSent: serverTimestamp(),
    });

    return NextResponse.json({ success: true, messageId: data.id });

  } catch (err: any) {
    console.error("Newsletter auto-send error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
