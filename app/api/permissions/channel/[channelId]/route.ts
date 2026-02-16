import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

function rateLimitResponse(retryAfterMs: number) {
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
  );
}

// GET /api/permissions/channel/[channelId]
// Fetch all permission overrides for a channel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`channel-perms:${ip}`, 30, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  try {
    const { channelId } = await params;
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch channel permission overrides
    const { data: overrides, error: fetchError } = await supabase
      .from("channel_permission_overrides")
      .select("*")
      .eq("channel_id", channelId);

    if (fetchError) {
      console.error("[API] Error fetching channel overrides:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch channel permissions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ overrides: overrides || [] });
  } catch (error) {
    console.error("[API] Channel permissions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/permissions/channel/[channelId]
// Create or update a permission override for a channel
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`channel-perms:${ip}`, 30, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  try {
    const { channelId } = await params;
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
    const { targetType, targetId, allow, deny } = body;

    // Validate input
    if (!targetType || !targetId || allow === undefined || deny === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (targetType !== "role" && targetType !== "user") {
      return NextResponse.json({ error: "Invalid target type" }, { status: 400 });
    }

    // Verify user has permission to modify channel permissions
    // (owner or admin role in the server)
    const { data: channel } = await supabase
      .from("channels")
      .select("server_id")
      .eq("id", channelId)
      .single();

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from("server_members")
      .select("role")
      .eq("server_id", channel.server_id)
      .eq("user_id", user.id)
      .single();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Upsert permission override
    const { data: override, error: upsertError } = await supabase
      .from("channel_permission_overrides")
      .upsert(
        {
          channel_id: channelId,
          target_type: targetType,
          target_id: targetId,
          allow,
          deny,
        },
        {
          onConflict: "channel_id,target_type,target_id",
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("[API] Error upserting channel override:", upsertError);
      return NextResponse.json(
        { error: "Failed to save permission override" },
        { status: 500 }
      );
    }

    return NextResponse.json({ override });
  } catch (error) {
    console.error("[API] Channel permissions POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/permissions/channel/[channelId]?overrideId=xxx
// Delete a permission override
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`channel-perms:${ip}`, 30, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  try {
    const { channelId } = await params;
    const { searchParams } = new URL(request.url);
    const overrideId = searchParams.get("overrideId");

    if (!overrideId) {
      return NextResponse.json({ error: "Missing overrideId" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has permission (owner or admin)
    const { data: channel } = await supabase
      .from("channels")
      .select("server_id")
      .eq("id", channelId)
      .single();

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from("server_members")
      .select("role")
      .eq("server_id", channel.server_id)
      .eq("user_id", user.id)
      .single();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Delete override
    const { error: deleteError } = await supabase
      .from("channel_permission_overrides")
      .delete()
      .eq("id", overrideId)
      .eq("channel_id", channelId);

    if (deleteError) {
      console.error("[API] Error deleting channel override:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete permission override" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Channel permissions DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
