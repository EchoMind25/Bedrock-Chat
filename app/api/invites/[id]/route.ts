import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import { deactivateInvite } from "@/lib/services/invite-service";

/**
 * PATCH /api/invites/[id] — Deactivate an invite (soft delete)
 *
 * Requires authentication and admin/owner role.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: inviteId } = await params;

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`invite-deactivate:${ip}`, 20, 60_000);

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

  // Look up invite to get server_id for auth check
  const { data: invite } = await supabase
    .from("server_invites")
    .select("id, server_id")
    .eq("id", inviteId)
    .single();

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  // Verify admin/owner
  const { data: membership } = await supabase
    .from("server_members")
    .select("role")
    .eq("server_id", invite.server_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await deactivateInvite(supabase, inviteId);

    // Audit log (non-critical)
    try {
      await supabase.from("audit_log").insert({
        server_id: invite.server_id,
        actor_id: user.id,
        action: "invite_deactivate",
        target_id: inviteId,
        target_type: "invite",
      });
    } catch {
      // Audit log failure is non-critical
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[API] Error deactivating invite:", err);
    return NextResponse.json({ error: "Failed to deactivate invite" }, { status: 500 });
  }
}
