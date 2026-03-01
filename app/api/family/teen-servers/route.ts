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

export async function GET(request: NextRequest) {
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

  // ── 4. Fetch teen's server memberships with server details ────────────────
  const { data: memberships, error: membershipsError } = await admin
    .from("server_members")
    .select("servers(id, name, description, icon_url, member_count)")
    .eq("user_id", teenUserId);

  if (membershipsError) {
    console.error("[teen-servers] error:", membershipsError.message);
    return NextResponse.json({ error: "Failed to load servers" }, { status: 500 });
  }

  type ServerRow = { id: string; name: string; description: string | null; icon_url: string | null; member_count: number };
  const servers = (memberships ?? [])
    .flatMap((m: { servers: ServerRow[] }) => m.servers ?? [])
    .map((s: ServerRow) => ({
      id: s.id,
      name: s.name,
      description: s.description ?? null,
      icon: s.icon_url ?? null,
      memberCount: s.member_count ?? 0,
    }));

  return NextResponse.json({ servers });
}
