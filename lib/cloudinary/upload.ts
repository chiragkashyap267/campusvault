// Cloudinary upload utility (client-side direct upload using signed URL from API)

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
}

/**
 * @param kind Which upload profile to sign against. "moment" restricts to
 *   images under 8MB and stores them in their own folder, keeping the photo
 *   wall separate from academic files.
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (percent: number) => void,
  kind: "resource" | "moment" = "resource"
): Promise<CloudinaryUploadResult> {
  // 1. Get signed params from our API route
  const sigRes = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      kind,
    }),
  });

  if (!sigRes.ok) {
    const err = await sigRes.json();
    throw new Error(err.error || "Failed to get upload signature");
  }

  const { signature, timestamp, apiKey, cloudName, uploadPreset, folder, resourceType } =
    await sigRes.json();

  // 2. Upload directly to Cloudinary using the correct resource_type endpoint
  const formData = new FormData();
  formData.append("file", file);
  formData.append("signature", signature);
  formData.append("timestamp", String(timestamp));
  formData.append("api_key", apiKey);
  formData.append("folder", folder);

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType || "auto"}/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", cloudinaryUrl, true);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as CloudinaryUploadResult);
        } catch {
          reject(new Error("Upload succeeded but the response could not be read."));
        }
        return;
      }
      // Cloudinary reports real problems as JSON, so surface its own wording
      // rather than a generic failure.
      let detail = `HTTP ${xhr.status}`;
      try {
        const parsed = JSON.parse(xhr.responseText);
        if (parsed?.error?.message) detail = parsed.error.message;
      } catch {
        if (xhr.responseText) detail = xhr.responseText.slice(0, 200);
      }
      reject(new Error(`Upload rejected: ${detail}`));
    });

    /**
     * The `error` event means the request never completed at the network
     * level — the server's own rejections arrive through `load` above with a
     * status. In practice that is almost always something on the client side
     * blocking the request rather than a fault in the app, so the message says
     * so instead of the bare "Network error" it used to give, which was
     * impossible to act on.
     */
    xhr.addEventListener("error", () => {
      reject(
        new Error(
          "Could not reach the upload server. This is usually an ad blocker or " +
          "privacy extension blocking cloudinary.com, or a network that blocks it. " +
          "Try pausing extensions, or switching to mobile data or another browser."
        )
      );
    });

    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled.")));

    // Without a timeout a stalled connection hangs the upload forever with no
    // feedback. Generous, because this runs on student phones on campus wifi.
    xhr.timeout = 120000;
    xhr.addEventListener("timeout", () =>
      reject(new Error("Upload timed out. Check your connection and try again."))
    );

    xhr.send(formData);
  });
}

export function getOptimizedUrl(
  publicId: string,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const { width = 800, quality = 80 } = options;
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},q_${quality},f_auto/${publicId}`;
}

export function getThumbnailUrl(publicId: string): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_400,h_300,c_fill,q_70,f_auto/${publicId}`;
}
