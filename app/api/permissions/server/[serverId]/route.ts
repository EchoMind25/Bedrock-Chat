import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

function rateLimitResponse(retryAfterMs: number) {
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
  );
}

// GET /api/permissions/server/[serverId]
// Fetch all server-level base permissions for roles
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`server-perms:${ip}`, 30, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  try {
    const { serverId } = await params;
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch server permissions
    const { data: permissions, error: fetchError } = await supabase
      .from("server_permissions")
      .select("*")
      .eq("server_id", serverId);

    if (fetchError) {
      console.error("[API] Error fetching server permissions:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch server permissions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ permissions: permissions || [] });
  } catch (error) {
    console.error("[API] Server permissions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/permissions/server/[serverId]
// Update server-level base permissions for a role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`server-perms:${ip}`, 30, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  try {
    const { serverId } = await params;
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { roleId, permissions } = body;

    // Validate input
    if (!roleId || permissions === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify user is server owner or admin
    const { data: membership } = await supabase
      .from("server_members")
      .select("role")
      .eq("server_id", serverId)
      .eq("user_id", user.id)
      .single();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Upsert server permission
    const { data: permission, error: upsertError } = await supabase
      .from("server_permissions")
      .upsert(
        {
          server_id: serverId,
          role_id: roleId,
          permissions,
        },
        {
          onConflict: "server_id,role_id",
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("[API] Error upserting server permission:", upsertError);
      return NextResponse.json(
        { error: "Failed to save server permission" },
        { status: 500 }
      );
    }

    return NextResponse.json({ permission });
  } catch (error) {
    console.error("[API] Server permissions PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
