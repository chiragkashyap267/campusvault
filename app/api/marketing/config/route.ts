import { NextResponse } from "next/server";

export async function GET() {
  try {
    const hasServerApiKey = !!process.env.RESEND_API_KEY;
    return NextResponse.json({ hasServerApiKey });
  } catch (error: any) {
    console.error("Config check error:", error);
    return NextResponse.json({ hasServerApiKey: false, error: error.message }, { status: 500 });
  }
}
