import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// TODO: Add email notification via Supabase Edge Function + Resend on bug_reports INSERT
// For beta, the admin dashboard at /admin/bugs is sufficient for monitoring.

const ALLOWED_SEVERITIES = ["blocker", "major", "minor"];

// Service-role client for storage + insert (bypasses RLS)
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // Authentication required
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();

  // If anonymous flag is set, strip user identity from the report
  const isAnonymous = formData.get("anonymous") === "true";

  const description = formData.get("description") as string | null;
  const stepsToReproduce = formData.get("steps_to_reproduce") as string | null;
  const severity = formData.get("severity") as string | null;
  const consoleErrors = formData.get("console_errors") as string | null;
  const screenshot = formData.get("screenshot") as File | null;
  const product = formData.get("product") as string | null;
  const appVersion = formData.get("app_version") as string | null;
  const currentRoute = formData.get("current_route") as string | null;
  const userAgent = formData.get("user_agent") as string | null;
  const viewport = formData.get("viewport") as string | null;
  const username = formData.get("username") as string | null;

  // Validate required fields
  if (!description?.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }
  if (!stepsToReproduce?.trim()) {
    return NextResponse.json({ error: "Steps to reproduce is required" }, { status: 400 });
  }
  if (!severity || !ALLOWED_SEVERITIES.includes(severity)) {
    return NextResponse.json({ error: "Valid severity is required" }, { status: 400 });
  }
  if (!product?.trim()) {
    return NextResponse.json({ error: "Product is required" }, { status: 400 });
  }

  // Upload screenshot if provided
  let screenshotUrl: string | null = null;
  if (screenshot && screenshot.size > 0) {
    const timestamp = Date.now();
    const userLabel = isAnonymous ? "anon" : user.id;
    const ext = screenshot.type === "image/png" ? "png" : "jpg";
    const path = `${product}/${timestamp}_${userLabel}.${ext}`;

    const buffer = Buffer.from(await screenshot.arrayBuffer());
    const { error: uploadError } = await serviceSupabase.storage
      .from("bug-screenshots")
      .upload(path, buffer, {
        contentType: screenshot.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[BugReport] Screenshot upload failed:", uploadError.message);
      // Continue without screenshot — don't block the report
    } else {
      const { data: urlData } = serviceSupabase.storage
        .from("bug-screenshots")
        .getPublicUrl(path);
      screenshotUrl = urlData.publicUrl;
    }
  }

  // Insert bug report
  const { data, error: insertError } = await serviceSupabase
    .from("bug_reports")
    .insert({
      product,
      description: description.trim(),
      steps_to_reproduce: stepsToReproduce.trim(),
      severity,
      console_errors: consoleErrors?.trim() || null,
      screenshot_url: screenshotUrl,
      current_route: currentRoute,
      app_version: appVersion,
      user_agent: userAgent,
      viewport,
      user_id: isAnonymous ? null : user.id,
      username: isAnonymous ? null : (username || null),
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[BugReport] Insert failed:", insertError.message);
    return NextResponse.json({ error: "Failed to submit bug report" }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
