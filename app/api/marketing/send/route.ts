import { NextRequest, NextResponse } from "next/server";
import { sendEmail, closeEmailTransport } from "@/lib/email/sender";
import { buildEmailHtml, buildEmailText, buildUnsubscribeUrl } from "@/lib/email/template";
import { getEmailAppUrl } from "@/lib/email/app-url";

/**
 * POST /api/marketing/send
 * Sends a single campaign email to one recipient.
 */
export async function POST(req: NextRequest) {
  try {
    const {
      recipientEmail,
      subject,
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

    const appUrl = getEmailAppUrl();
    const to = String(recipientEmail).trim().toLowerCase();
    const unsubscribeUrl = buildUnsubscribeUrl(appUrl, to);

    const template = {
      firstName: String(studentName).split(" ")[0] || "Student",
      headline: String(headline),
      message: String(message),
      ctaLabel: "View on CampusVault",
      ctaUrl: `${appUrl}/resources`,
      unsubscribeUrl,
    };

    const result = await sendEmail({
      to,
      subject,
      html: buildEmailHtml(template),
      text: buildEmailText(template),
      fromName: "CampusVault GBPIET",
      unsubscribeUrl,
      entityRefId: `send-${to}-${Date.now()}`,
    });

    if (!result.success) {
      console.error(`[Send] Failed to ${to}: ${result.error}`);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log(`[Send] Sent to ${to} via ${result.provider}`);
    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      recipient: to,
      provider: result.provider,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error.";
    console.error("Marketing send error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    closeEmailTransport();
  }
}
