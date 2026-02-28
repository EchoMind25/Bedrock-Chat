/**
 * POST /api/family/remove-teen
 *
 * Removes a teen from the family.
 * The teen profile is NOT deleted — their account_type is converted back to
 * 'standard'. If the teen is under 18, account becomes an orphaned standard
 * account (parent should communicate with teen about next steps).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // ── 1. Auth check ─────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Verify parent ──────────────────────────────────────────────────────
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single();

  if (!callerProfile || callerProfile.account_type !== "parent") {
    return NextResponse.json({ error: "Only parent accounts can remove teens" }, { status: 403 });
  }

  // ── 3. Parse body ─────────────────────────────────────────────────────────
  const rawBody = await request.json().catch(() => null);
  const teenUserId: string | undefined =
    typeof rawBody?.teen_user_id === "string" ? rawBody.teen_user_id : undefined;

  if (!teenUserId) {
    return NextResponse.json({ error: "teen_user_id is required" }, { status: 400 });
  }

  // ── 4. Config guards ──────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);

  // ── 5. Verify this parent owns this teen ──────────────────────────────────
  const { data: parentMembership } = await adminClient
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .eq("role", "parent")
    .maybeSingle();

  if (!parentMembership?.family_id) {
    return NextResponse.json({ error: "No family found for this parent" }, { status: 404 });
  }

  const { data: teenMembership } = await adminClient
    .from("family_members")
    .select("id")
    .eq("family_id", parentMembership.family_id)
    .eq("user_id", teenUserId)
    .eq("role", "child")
    .maybeSingle();

  if (!teenMembership) {
    return NextResponse.json(
      { error: "This teen is not in your family" },
      { status: 403 }
    );
  }

  // ── 6. Log to transparency BEFORE removing (cascade will delete log) ──────
  await adminClient.from("family_activity_log").insert({
    family_id: parentMembership.family_id,
    user_id: user.id,
    activity_type: "teen_removed",
    details: { teen_user_id: teenUserId },
    visible_to_child: true,
  }).catch(() => {});

  // ── 7. Remove teen from family ────────────────────────────────────────────
  await adminClient
    .from("family_members")
    .delete()
    .eq("family_id", parentMembership.family_id)
    .eq("user_id", teenUserId)
    .eq("role", "child");

  // ── 8. Convert teen's account_type back to standard ──────────────────────
  await adminClient
    .from("profiles")
    .update({ account_type: "standard" })
    .eq("id", teenUserId);

  return NextResponse.json({ success: true });
}
