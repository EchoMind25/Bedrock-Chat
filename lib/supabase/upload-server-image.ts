import { createClient } from "@/lib/supabase/client";

const BUCKET = "server-assets";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/**
 * Uploads a server logo or banner image to Supabase Storage (client-side).
 *
 * Path format: {serverId}/{type}.{ext}
 * Uses upsert so re-uploads overwrite the previous file.
 * Returns a public URL with a cache-busting query param.
 *
 * TODO: For production, route through an API endpoint that uses sharp
 *       to strip EXIF metadata (GPS coordinates, device info) before
 *       storing. The server action at app/actions/upload-server-image.ts
 *       already handles this — wire it in when ready.
 */
export async function uploadServerImage(
  serverId: string,
  file: File,
  type: "logo" | "banner",
): Promise<string> {
  // --- Client-side validation (defense-in-depth; bucket also enforces) ---

  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    throw new Error("Invalid file type. Use PNG, JPEG, WebP, or GIF.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File too large. Maximum size is 5 MB.");
  }

  // Derive extension from MIME (more reliable than parsing filename)
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const ext = extMap[file.type] ?? "png";
  const path = `${serverId}/${type}.${ext}`;

  const supabase = createClient();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // Cache-busting param forces browsers / Next.js <Image> to re-fetch
  return `${data.publicUrl}?v=${Date.now()}`;
}
