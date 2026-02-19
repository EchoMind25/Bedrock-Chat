import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a server logo or banner image via the API route.
 *
 * The API route uses a service-role client (bypasses RLS), validates
 * server ownership, strips EXIF metadata with sharp, resizes, and
 * converts to WebP before storing in the server-assets bucket.
 *
 * Returns a public URL with a cache-busting query param.
 */
export async function uploadServerImage(
  serverId: string,
  file: File,
  type: "logo" | "banner",
): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Not authenticated");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("serverId", serverId);
  formData.append("type", type);

  const response = await fetch("/api/upload/server-image", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Upload failed");
  }

  const { url } = await response.json();
  return url;
}
