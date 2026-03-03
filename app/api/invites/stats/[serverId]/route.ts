import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import { getInviteStats } from "@/lib/services/invite-service";

/**
 * GET /api/invites/stats/[serverId] — Aggregated invite stats for migration dashboard
 *
 * Requires authentication and admin/owner role.
 * Returns total invites, active invites, total joins, and daily join counts.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> },
) {
  const { serverId } = await params;

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`invite-stats:${ip}`, 20, 60_000);

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

  // Verify admin/owner
  const { data: membership } = await supabase
    .from("server_members")
    .select("role")
    .eq("server_id", serverId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const stats = await getInviteStats(supabase, serverId);
    return NextResponse.json(stats, { status: 200 });
  } catch (err) {
    console.error("[API] Error fetching invite stats:", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
