import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const download = req.nextUrl.searchParams.get("download"); // filename for download

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Only allow Cloudinary URLs
  if (!url.includes("res.cloudinary.com")) {
    return NextResponse.json({ error: "Only Cloudinary URLs allowed" }, { status: 403 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        // Pass accept header so Cloudinary knows what we want
        Accept: "application/pdf,*/*",
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { 
            error: "PDF delivery is restricted by Cloudinary account settings.",
            code: "CLOUDINARY_PDF_RESTRICTED",
            message: "To view/download PDFs, go to your Cloudinary Console -> Settings -> Security and ensure PDF delivery is enabled."
          },
          { status: response.status }
        );
      }
      return NextResponse.json(
        { error: `Upstream error: ${response.status}` },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "application/pdf";

    const headers: Record<string, string> = {
      "Content-Type": contentType.includes("pdf") ? "application/pdf" : contentType,
      "Content-Length": buffer.byteLength.toString(),
      // Allow embedding in iframe from same origin
      "X-Frame-Options": "SAMEORIGIN",
      // Cache for 1 hour
      "Cache-Control": "public, max-age=3600",
    };

    if (download) {
      // Force download with given filename
      headers["Content-Disposition"] = `attachment; filename="${download}"`;
    } else {
      // Inline (for preview)
      headers["Content-Disposition"] = "inline";
    }

    return new NextResponse(buffer, { status: 200, headers });
  } catch (err) {
    console.error("Proxy error:", err);
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}
