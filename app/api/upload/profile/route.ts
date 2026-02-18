import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const BANNER_MAX_SIZE = 5 * 1024 * 1024; // 5MB

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
  const type = formData.get("type") as string | null;

  if (!file || !type || !["avatar", "banner"].includes(type)) {
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
  const maxSize = type === "avatar" ? AVATAR_MAX_SIZE : BANNER_MAX_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json(
      {
        error: `File too large. Max ${type === "avatar" ? "2MB" : "5MB"}`,
      },
      { status: 400 }
    );
  }

  // Process with sharp: strip ALL EXIF/metadata, resize, convert to WebP
  const buffer = Buffer.from(await file.arrayBuffer());
  let processed: Buffer;

  try {
    if (type === "avatar") {
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
  const path = `${user.id}/${type}.webp`;
  const { error: uploadError } = await serviceSupabase.storage
    .from("user-assets")
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
    .from("user-assets")
    .getPublicUrl(path);

  const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  // Update profiles table
  const column = type === "avatar" ? "avatar_url" : "banner_url";
  const { error: updateError } = await serviceSupabase
    .from("profiles")
    .update({ [column]: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: publicUrl });
}
