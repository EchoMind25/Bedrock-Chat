/**
 * GET /api/family/teen-servers?teenId={uuid}
 *
 * Returns the list of servers a teen is a member of, including server metadata.
 * Uses the admin client to bypass RLS. Only the authenticated parent of the teen
 * may call this endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ENABLE_FAMILY_ACCOUNTS } from "@/lib/feature-flags";

export async function GET(request: NextRequest) {
  if (!ENABLE_FAMILY_ACCOUNTS) {
    return NextResponse.json({ error: "Family accounts are not yet available" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const teenUserId = searchParams.get("teenId");

  if (!teenUserId) {
    return NextResponse.json({ error: "teenId is required" }, { status: 400 });
  }

  // ── 1. Verify caller is authenticated parent ──────────────────────────────
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single();

  if (!callerProfile || callerProfile.account_type !== "parent") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 2. Use admin client to bypass RLS ─────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey);

  // ── 3. Verify teen belongs to this parent's family ────────────────────────
  const { data: parentMembership } = await admin
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .eq("role", "parent")
    .maybeSingle();

  if (!parentMembership) {
    return NextResponse.json({ error: "No family found" }, { status: 404 });
  }

  const { data: teenMembership } = await admin
    .from("family_members")
    .select("user_id")
    .eq("family_id", parentMembership.family_id)
    .eq("user_id", teenUserId)
    .eq("role", "child")
    .maybeSingle();

  if (!teenMembership) {
    return NextResponse.json({ error: "Teen not found in family" }, { status: 404 });
  }

  // ── 4. Fetch teen's server memberships ──────────────────────────────────
  const { data: memberships, error: membershipsError } = await admin
    .from("server_members")
    .select("server_id")
    .eq("user_id", teenUserId);

  if (membershipsError) {
    console.error("[teen-servers] memberships error:", membershipsError.message);
    return NextResponse.json({ error: "Failed to load servers" }, { status: 500 });
  }

  const serverIds = (memberships ?? []).map((m: { server_id: string }) => m.server_id);

  if (serverIds.length === 0) {
    return NextResponse.json({ servers: [] });
  }

  // ── 5. Fetch server details ───────────────────────────────────────────────
  const { data: serverRows, error: serverError } = await admin
    .from("servers")
    .select("id, name, description, icon_url, member_count, is_family_friendly")
    .in("id", serverIds);

  if (serverError) {
    console.error("[teen-servers] servers error:", serverError.message);
    return NextResponse.json({ error: "Failed to load server details" }, { status: 500 });
  }

  const servers = (serverRows ?? []).map((s: { id: string; name: string; description: string | null; icon_url: string | null; member_count: number; is_family_friendly: boolean }) => ({
    id: s.id,
    name: s.name,
    description: s.description ?? null,
    icon: s.icon_url ?? null,
    memberCount: s.member_count ?? 0,
    isFamilyFriendly: s.is_family_friendly ?? false,
  }));

  return NextResponse.json({ servers });
}
