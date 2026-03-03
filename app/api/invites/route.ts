import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import { createInvite } from "@/lib/services/invite-service";

/**
 * POST /api/invites — Create a new invite link
 *
 * Requires authentication. Only server admins/owners can create invites.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`invite-create:${ip}`, 20, 60_000);

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
  if (!serverId) {
    return NextResponse.json({ error: "serverId is required" }, { status: 400 });
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
    const result = await createInvite(supabase, {
      serverId,
      inviterId: user.id,
      targetType: (body.targetType as "channel" | "server" | "voice") || "server",
      channelId: (body.channelId as string) || null,
      maxUses: (body.maxUses as number) || 0,
      expiresAt: (body.expiresAt as string) || null,
      isTemporary: (body.isTemporary as boolean) || false,
      mappedRoleId: (body.mappedRoleId as string) || null,
      label: (body.label as string) || null,
      requiresFamilyAccount: (body.requiresFamilyAccount as boolean) || false,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("[API] Error creating invite:", err);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
}
