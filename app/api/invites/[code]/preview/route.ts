import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import { createServiceClient } from "@/lib/supabase/service";
import { getInvitePreview, incrementClickCount } from "@/lib/services/invite-service";

/**
 * GET /api/invites/[code]/preview — Public invite preview (NO AUTH REQUIRED)
 *
 * Returns public-safe server info for the invite landing page.
 * Uses service client to bypass RLS — only exposes aggregate, non-PII data:
 * - Server name, icon, member count, channel count
 * - Mapped role name/color
 * - Invite validity status
 *
 * PRIVACY:
 * - No member names, channel names, or messages exposed
 * - Click count uses server-side counter only (no tracking pixels)
 * - No cookies set, no device fingerprinting
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`invite-preview:${ip}`, 30, 60_000);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
    );
  }

  if (!code || code.trim().length === 0) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
  }

  try {
    const serviceClient = createServiceClient();
    const preview = await getInvitePreview(serviceClient, code);

    if (!preview) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Increment click count asynchronously (non-blocking)
    incrementClickCount(serviceClient, code);

    return NextResponse.json(preview, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  } catch (err) {
    console.error("[API] Error fetching invite preview:", err);
    return NextResponse.json({ error: "Failed to load invite" }, { status: 500 });
  }
}
