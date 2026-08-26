import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Upload profiles.
 *
 * A Campus Moments photo and a 50MB lab manual have nothing in common, so they
 * do not share limits or a destination folder. Signing a moments upload with
 * the resource profile would let a photo post carry a 50MB zip.
 */
const PROFILES = {
  resource: {
    folder: "campusvault/resources",
    maxSize: 50 * 1024 * 1024,
    allowed: [
      "application/pdf",
      ...IMAGE_TYPES,
      "application/zip",
      "application/x-zip-compressed",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
  moment: {
    folder: "campusvault/moments",
    maxSize: 8 * 1024 * 1024,
    allowed: IMAGE_TYPES,
  },
} as const;

type ProfileKind = keyof typeof PROFILES;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, fileType, fileSize, kind } = body;

    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json({ error: "Missing file info" }, { status: 400 });
    }

    // Unknown kinds fall back to the resource profile, so existing callers that
    // send no `kind` keep working unchanged.
    const profileKind: ProfileKind = kind === "moment" ? "moment" : "resource";
    const profile = PROFILES[profileKind];

    if (fileSize > profile.maxSize) {
      const mb = Math.round(profile.maxSize / (1024 * 1024));
      return NextResponse.json({ error: `File too large (max ${mb}MB)` }, { status: 413 });
    }

    if (!(profile.allowed as readonly string[]).includes(fileType)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 415 });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = profile.folder;
    // Use 'image' for PDFs so Cloudinary supports first-page JPG previews on homepage cards!
    // 'image' for image files, 'auto' for everything else
    const resourceType = fileType === 'application/pdf' ? 'image' : 'auto';

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      folder,
      resourceType,
    });
  } catch (error) {
    console.error("Upload signature error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
