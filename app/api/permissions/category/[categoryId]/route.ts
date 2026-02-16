import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

function rateLimitResponse(retryAfterMs: number) {
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
  );
}

// GET /api/permissions/category/[categoryId]
// Fetch all permission overrides for a category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`category-perms:${ip}`, 30, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  try {
    const { categoryId } = await params;
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch category permission overrides
    const { data: overrides, error: fetchError } = await supabase
      .from("category_permission_overrides")
      .select("*")
      .eq("category_id", categoryId);

    if (fetchError) {
      console.error("[API] Error fetching category overrides:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch category permissions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ overrides: overrides || [] });
  } catch (error) {
    console.error("[API] Category permissions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/permissions/category/[categoryId]
// Create or update a permission override for a category
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`category-perms:${ip}`, 30, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  try {
    const { categoryId } = await params;
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

    // Verify user has permission to modify category permissions
    // First get the server_id from the category
    const { data: category } = await supabase
      .from("channel_categories")
      .select("server_id")
      .eq("id", categoryId)
      .single();

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from("server_members")
      .select("role")
      .eq("server_id", category.server_id)
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
      .from("category_permission_overrides")
      .upsert(
        {
          category_id: categoryId,
          target_type: targetType,
          target_id: targetId,
          allow,
          deny,
        },
        {
          onConflict: "category_id,target_type,target_id",
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("[API] Error upserting category override:", upsertError);
      return NextResponse.json(
        { error: "Failed to save permission override" },
        { status: 500 }
      );
    }

    return NextResponse.json({ override });
  } catch (error) {
    console.error("[API] Category permissions POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/permissions/category/[categoryId]?overrideId=xxx
// Delete a permission override
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`category-perms:${ip}`, 30, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  try {
    const { categoryId } = await params;
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
    const { data: category } = await supabase
      .from("channel_categories")
      .select("server_id")
      .eq("id", categoryId)
      .single();

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from("server_members")
      .select("role")
      .eq("server_id", category.server_id)
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
      .from("category_permission_overrides")
      .delete()
      .eq("id", overrideId)
      .eq("category_id", categoryId);

    if (deleteError) {
      console.error("[API] Error deleting category override:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete permission override" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Category permissions DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
