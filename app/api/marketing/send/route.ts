import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/sender";

// TEMPLATE_STYLES removed for simpler text-based emails
export async function POST(req: NextRequest) {
  try {
    const {
      recipientEmail,
      subject,
      headline,
      headline,
      message,
      studentName = "Student",
    } = await req.json();

    if (!recipientEmail || !subject || !headline || !message) {
      return NextResponse.json(
        { error: "Missing required fields (recipientEmail, subject, headline, message)." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://campusvaultgbpiet.vercel.app";

    const htmlContent = `<!DOCTYPE html>
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
  
  <p>Hi ${studentName},</p>
  
  <h2>${headline}</h2>
  
  <div style="white-space: pre-wrap; margin-bottom: 25px;">${message}</div>
  
  <p>
    <a href="${appUrl}/resources" class="btn">View on CampusVault</a>
  </p>
  
  <div class="footer">
    <p>This is an automated update from CampusVault GBPIET.</p>
    <p>&copy; 2026 CampusVault (Built by students, for students)</p>
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
