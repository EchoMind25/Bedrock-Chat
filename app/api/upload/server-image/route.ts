import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Service-role client for storage operations (bypasses RLS)
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the user's token via anon-key client
  const userSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
  } = await userSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const serverId = formData.get("serverId") as string | null;
  const type = formData.get("type") as string | null;

  if (!file || !serverId || !type || !["logo", "banner"].includes(type)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 5MB" },
      { status: 400 }
    );
  }

  // Verify server ownership
  const { data: serverData, error: serverError } = await serviceSupabase
    .from("servers")
    .select("owner_id")
    .eq("id", serverId)
    .single();

  if (serverError || !serverData) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  if (serverData.owner_id !== user.id) {
    return NextResponse.json(
      { error: "You don't have permission to upload images for this server" },
      { status: 403 }
    );
  }

  // Process with sharp: strip EXIF/metadata, resize, convert to WebP
  const buffer = Buffer.from(await file.arrayBuffer());
  let processed: Buffer;

  try {
    if (type === "logo") {
      processed = await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF orientation, then strips EXIF
        .resize(256, 256, { fit: "cover", position: "centre" })
        .webp({ quality: 85 })
        .toBuffer();
    } else {
      processed = await sharp(buffer)
        .rotate()
        .resize(1920, 480, { fit: "cover", position: "centre" })
        .webp({ quality: 85 })
        .toBuffer();
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 400 }
    );
  }

  // Upload to Supabase Storage
  const path = `${serverId}/${type}.webp`;
  const { error: uploadError } = await serviceSupabase.storage
    .from("server-assets")
    .upload(path, processed, {
      contentType: "image/webp",
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  // Get public URL with cache-bust param
  const { data: urlData } = serviceSupabase.storage
    .from("server-assets")
    .getPublicUrl(path);

  const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  // Update servers table
  const column = type === "logo" ? "icon_url" : "banner_url";
  const { error: updateError } = await serviceSupabase
    .from("servers")
    .update({ [column]: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", serverId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update server" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: publicUrl });
}
