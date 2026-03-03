import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import { createBulkInvites } from "@/lib/services/invite-service";
import type { BulkInviteMapping } from "@/lib/services/invite-service";

/**
 * POST /api/invites/bulk — Create multiple invites, one per role mapping
 *
 * Requires authentication. Only server admins/owners can create bulk invites.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`invite-bulk:${ip}`, 5, 60_000);

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

  const serverId = body.serverId as string | undefined;
  const roleMappings = body.roleMappings as BulkInviteMapping[] | undefined;

  if (!serverId || !roleMappings || !Array.isArray(roleMappings) || roleMappings.length === 0) {
    return NextResponse.json(
      { error: "serverId and roleMappings[] are required" },
      { status: 400 },
    );
  }

  if (roleMappings.length > 20) {
    return NextResponse.json(
      { error: "Maximum 20 role mappings per request" },
      { status: 400 },
    );
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
    const results = await createBulkInvites(supabase, serverId, user.id, roleMappings);
    return NextResponse.json({ invites: results }, { status: 201 });
  } catch (err) {
    console.error("[API] Error creating bulk invites:", err);
    return NextResponse.json({ error: "Failed to create invites" }, { status: 500 });
  }
}
