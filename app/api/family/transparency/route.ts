/**
 * GET /api/family/transparency
 *
 * Fetches the transparency log (family_activity_log).
 * Parents see entries for their family. Teens see ALL entries about them.
 *
 * Query params: ?teen_user_id=UUID&limit=50&offset=0
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ENABLE_FAMILY_ACCOUNTS } from "@/lib/feature-flags";

export async function GET(request: NextRequest) {
  if (!ENABLE_FAMILY_ACCOUNTS) {
    return NextResponse.json({ error: "Family accounts are not yet available" }, { status: 403 });
  }

  // ── 1. Auth check ─────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Parse query params ─────────────────────────────────────────────────
  const { searchParams } = new URL(request.url);
  const teenUserId = searchParams.get("teen_user_id");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10), 0);

  // ── 3. Config guards ──────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);

  // ── 4. Get caller's profile ───────────────────────────────────────────────
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single();

  if (!callerProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // ── 5. Fetch log based on account type ────────────────────────────────────
  if (callerProfile.account_type === "parent") {
    // Parent: find their family and query log by family_id
    const { data: membership } = await adminClient
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .eq("role", "parent")
      .maybeSingle();

    if (!membership?.family_id) {
      return NextResponse.json({ entries: [], total: 0 });
    }

    let query = adminClient
      .from("family_activity_log")
      .select("*", { count: "exact" })
      .eq("family_id", membership.family_id)
      .order("occurred_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (teenUserId) {
      // Filter to show only log entries related to this teen
      // (activities logged by the parent, visible in that teen's context)
      query = query.eq("family_id", membership.family_id);
    }

    const { data: entries, count } = await query;

    return NextResponse.json({
      entries: (entries ?? []).map(mapEntry),
      total: count ?? 0,
    });
  }

  if (callerProfile.account_type === "teen") {
    // Teen: can only see their own family's log
    if (teenUserId && teenUserId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: membership } = await adminClient
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .eq("role", "child")
      .maybeSingle();

    if (!membership?.family_id) {
      return NextResponse.json({ entries: [], total: 0 });
    }

    const { data: entries, count } = await adminClient
      .from("family_activity_log")
      .select("*", { count: "exact" })
      .eq("family_id", membership.family_id)
      .order("occurred_at", { ascending: false })
      .range(offset, offset + limit - 1);

    return NextResponse.json({
      entries: (entries ?? []).map(mapEntry),
      total: count ?? 0,
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

function mapEntry(row: Record<string, unknown>) {
  return {
    id: row.id,
    action: row.activity_type,
    details: typeof row.details === "string" ? row.details : JSON.stringify(row.details),
    timestamp: row.occurred_at,
    metadata: row.details,
  };
}
