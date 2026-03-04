/**
 * POST /api/family/dissolve
 *
 * Dissolves a family account entirely.
 * - Converts all teen accounts back to 'standard'
 * - Converts the parent account back to 'standard'
 * - Logs the action BEFORE deleting (cascade would wipe the log)
 * - Deletes the family_accounts row (cascades to members, logs, etc.)
 *
 * DESTRUCTIVE: Requires { confirm: true } in body.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ENABLE_FAMILY_ACCOUNTS } from "@/lib/feature-flags";

export async function POST(request: NextRequest) {
  if (!ENABLE_FAMILY_ACCOUNTS) {
    return NextResponse.json({ error: "Family accounts are not yet available" }, { status: 403 });
  }

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
    return NextResponse.json({ error: "Only parent accounts can dissolve a family" }, { status: 403 });
  }

  // ── 3. Require explicit confirmation ─────────────────────────────────────
  const rawBody = await request.json().catch(() => null);
  if (rawBody?.confirm !== true) {
    return NextResponse.json(
      { error: "Pass { confirm: true } to confirm this destructive action" },
      { status: 400 }
    );
  }

  // ── 4. Config guards ──────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);

  // ── 5. Find family ────────────────────────────────────────────────────────
  const { data: parentMembership } = await adminClient
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .eq("role", "parent")
    .maybeSingle();

  if (!parentMembership?.family_id) {
    return NextResponse.json({ error: "No family found" }, { status: 404 });
  }

  const familyId = parentMembership.family_id;

  // ── 6. Get all teen members ───────────────────────────────────────────────
  const { data: teenMembers } = await adminClient
    .from("family_members")
    .select("user_id")
    .eq("family_id", familyId)
    .eq("role", "child");

  const teenIds = (teenMembers ?? []).map((m) => m.user_id as string);

  // ── 7. Log BEFORE cascade delete ─────────────────────────────────────────
  try {
    await adminClient.from("family_activity_log").insert({
      family_id: familyId,
      user_id: user.id,
      activity_type: "family_dissolved",
      details: {
        parent_user_id: user.id,
        teen_count: teenIds.length,
        teen_user_ids: teenIds,
      },
      visible_to_child: true,
    });
  } catch { /* non-fatal */ }

  // ── 8. Convert teens back to standard ────────────────────────────────────
  for (const teenId of teenIds) {
    await adminClient
      .from("profiles")
      .update({ account_type: "standard" })
      .eq("id", teenId);
  }

  // ── 9. Delete the family (cascades to members, logs, keyword alerts, etc.) -
  await adminClient
    .from("family_accounts")
    .delete()
    .eq("id", familyId);

  // ── 10. Convert parent back to standard ───────────────────────────────────
  await adminClient
    .from("profiles")
    .update({ account_type: "standard" })
    .eq("id", user.id);

  return NextResponse.json({ success: true });
}
