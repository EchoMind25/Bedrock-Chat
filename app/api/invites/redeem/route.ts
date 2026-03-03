import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import { redeemInvite } from "@/lib/services/invite-service";

/**
 * POST /api/invites/redeem — Redeem an invite code and join a server
 *
 * Requires authentication. Validates the invite, joins the server,
 * and auto-assigns the mapped role if configured.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`invite-redeem:${ip}`, 10, 60_000);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
    );
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const code = body.code as string | undefined;
  if (!code || typeof code !== "string" || code.trim().length === 0) {
    return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
  }

  try {
    const result = await redeemInvite(supabase, code, user.id);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to redeem invite";

    if (message.includes("expired")) {
      return NextResponse.json({ error: message }, { status: 410 });
    }
    if (message.includes("Invalid") || message.includes("maximum") || message.includes("family")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("[API] Error redeeming invite:", err);
    return NextResponse.json({ error: "Failed to redeem invite" }, { status: 500 });
  }
}
