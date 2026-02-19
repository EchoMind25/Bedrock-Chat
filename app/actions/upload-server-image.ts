"use server";

import { createClient } from "@/lib/supabase/server";

type ImageType = "logo" | "banner";

const BUCKET = "server-assets";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Validate MIME type by inspecting file magic bytes — not just the extension or Content-Type header
function detectMimeFromBytes(bytes: Uint8Array): string | null {
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  // GIF: 47 49 46 38 (GIF8)
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "image/gif";
  }
  // WebP: RIFF????WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export async function uploadServerImage(
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  const file = formData.get("file") as File | null;
  const serverId = formData.get("serverId") as string | null;
  const type = formData.get("type") as ImageType | null;

  if (!file || !serverId || !type) {
    return { error: "Missing required fields" };
  }

  if (type !== "logo" && type !== "banner") {
    return { error: "Invalid image type" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "File size exceeds 5MB limit" };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validate MIME type via magic bytes — not the extension or stated Content-Type
  const detectedMime = detectMimeFromBytes(new Uint8Array(buffer));
  if (!detectedMime) {
    return {
      error: "Invalid image format. Please upload a PNG, JPEG, WebP, or GIF.",
    };
  }

  // Authenticate
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Authentication required" };
  }

  // Verify the user owns this server (path-scoping enforced server-side)
  const { data: serverData, error: serverError } = await supabase
    .from("servers")
    .select("owner_id")
    .eq("id", serverId)
    .single();

  if (serverError || !serverData) {
    return { error: "Server not found" };
  }

  if (serverData.owner_id !== user.id) {
    return {
      error: "You don't have permission to upload images for this server",
    };
  }

  // Upload full-resolution original — Supabase Image Transformations
  // handle resizing on-the-fly via CDN (no server-side processing needed).
  const processedBuffer = buffer;

  // Upload path scoped to server: {serverId}/{type}.{ext}
  // upsert: true overwrites the previous image on re-upload
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const ext = extMap[detectedMime] ?? "jpg";
  const uploadPath = `${serverId}/${type}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(uploadPath, processedBuffer, {
      contentType: detectedMime,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(uploadPath);

  // Append cache-busting timestamp so re-uploads force component re-render
  const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  return { url: publicUrl };
}
