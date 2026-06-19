import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/sender";

const TEMPLATE_STYLES: Record<string, { bgGrad: string; textCol: string }> = {
  sky:     { bgGrad: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)", textCol: "#0284c7" },
  royal:   { bgGrad: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", textCol: "#1d4ed8" },
  gold:    { bgGrad: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", textCol: "#d97706" },
  emerald: { bgGrad: "linear-gradient(135deg, #10b981 0%, #047857 100%)", textCol: "#047857" },
};

export async function POST(req: NextRequest) {
  try {
    const {
      recipientEmail,
      subject,
      headline,
      message,
      templateStyle = "sky",
      studentName = "Student",
    } = await req.json();

    if (!recipientEmail || !subject || !headline || !message) {
      return NextResponse.json(
        { error: "Missing required fields (recipientEmail, subject, headline, message)." },
        { status: 400 }
      );
    }

    const theme = TEMPLATE_STYLES[templateStyle] || TEMPLATE_STYLES.sky;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://campusvaultgbpiet.vercel.app";

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
    .container { max-width:600px; margin:40px auto; background:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 10px 30px rgba(15,23,42,0.05); border:1px solid #e2e8f0; }
    .header { background:${theme.bgGrad}; padding:40px 20px; text-align:center; color:#ffffff; }
    .header h1 { margin:0; font-size:26px; font-weight:800; }
    .header p { margin:8px 0 0 0; font-size:13px; opacity:0.85; }
    .content { padding:40px 30px; color:#1e293b; }
    .greeting { font-size:18px; font-weight:700; margin-bottom:8px; color:#0f172a; }
    .badge { display:inline-block; font-size:10px; text-transform:uppercase; letter-spacing:1px; font-weight:800; padding:4px 10px; border-radius:99px; background-color:#f0fdfa; color:${theme.textCol}; margin-bottom:20px; }
    .headline { font-size:20px; font-weight:800; line-height:1.3; margin:0 0 16px 0; color:#0f172a; }
    .message-box { background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:24px; font-size:14px; line-height:1.6; color:#334155; margin-bottom:30px; white-space:pre-wrap; }
    .cta-btn { display:inline-block; background:${theme.bgGrad}; color:#ffffff !important; font-size:14px; font-weight:700; text-decoration:none; padding:14px 32px; border-radius:12px; }
    .footer { background-color:#f8fafc; border-top:1px solid #e2e8f0; padding:20px 30px; text-align:center; font-size:11px; color:#64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CampusVault GBPIET</h1>
      <p>Centralized Academic Resources &amp; Collaboration Portal</p>
    </div>
    <div class="content">
      <div class="greeting">Hey ${studentName},</div>
      <div class="badge">Study Digest</div>
      <h2 class="headline">${headline}</h2>
      <div class="message-box">${message}</div>
      <div style="text-align:center;">
        <a href="${appUrl}/resources" class="cta-btn">Access Academic Vault &#8594;</a>
      </div>
    </div>
    <div class="footer">
      <p>&#169; 2026 CampusVault GBPIET. Built free for GBPIET Students.</p>
    </div>
  </div>
</body>
</html>`;

    const result = await sendEmail({
      to: recipientEmail,
      subject,
      html: htmlContent,
      fromName: "CampusVault GBPIET",
    });

    if (!result.success) {
      console.error(`[Send] Failed to ${recipientEmail}: ${result.error}`);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log(`[Send] Sent to ${recipientEmail} via ${result.provider}`);
    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      recipient: recipientEmail,
      provider: result.provider,
    });

  } catch (error: any) {
    console.error("Marketing send error:", error);
    return NextResponse.json({ error: error.message || "Internal server error." }, { status: 500 });
  }
}
