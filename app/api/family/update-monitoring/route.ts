/**
 * PATCH /api/family/update-monitoring
 *
 * Updates the monitoring level for a teen (per-teen override) or the family
 * default. Logs the change to the transparency log.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { numericLevelToDb, dbLevelToNumeric } from "@/lib/family/monitoring";
import type { MonitoringLevel } from "@/lib/types/family";

export async function PATCH(request: NextRequest) {
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
    return NextResponse.json({ error: "Only parent accounts can change monitoring levels" }, { status: 403 });
  }

  // ── 3. Parse body ─────────────────────────────────────────────────────────
  const rawBody = await request.json().catch(() => null);
  const teenUserId: string | undefined =
    typeof rawBody?.teen_user_id === "string" ? rawBody.teen_user_id : undefined;
  const level: MonitoringLevel | undefined =
    typeof rawBody?.level === "number" && [1, 2, 3, 4].includes(rawBody.level)
      ? (rawBody.level as MonitoringLevel)
      : undefined;

  if (!teenUserId || !level) {
    return NextResponse.json(
      { error: "teen_user_id and level (1-4) are required" },
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

  // ── 5. Find parent's family and verify teen ownership ─────────────────────
  const { data: parentMembership } = await adminClient
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .eq("role", "parent")
    .maybeSingle();

  if (!parentMembership?.family_id) {
    return NextResponse.json({ error: "No family found" }, { status: 404 });
  }

  const { data: teenMembership } = await adminClient
    .from("family_members")
    .select("id, monitoring_level_override")
    .eq("family_id", parentMembership.family_id)
    .eq("user_id", teenUserId)
    .eq("role", "child")
    .maybeSingle();

  if (!teenMembership) {
    return NextResponse.json({ error: "This teen is not in your family" }, { status: 403 });
  }

  // ── 6. Get old level for the log ──────────────────────────────────────────
  const { data: familyAccount } = await adminClient
    .from("family_accounts")
    .select("monitoring_level")
    .eq("id", parentMembership.family_id)
    .single();

  const oldLevelStr =
    (teenMembership.monitoring_level_override as string | null) ??
    (familyAccount?.monitoring_level as string | null) ??
    "minimal";
  const oldLevel = dbLevelToNumeric(oldLevelStr);

  // ── 7. Update per-teen monitoring_level_override ──────────────────────────
  const newLevelStr = numericLevelToDb(level);

  await adminClient
    .from("family_members")
    .update({ monitoring_level_override: newLevelStr })
    .eq("id", teenMembership.id);

  // ── 8. Log to transparency log ────────────────────────────────────────────
  try {
    await adminClient.from("family_activity_log").insert({
      family_id: parentMembership.family_id,
      user_id: user.id,
      activity_type: "changed_monitoring_level",
      details: {
        teen_user_id: teenUserId,
        old_level: oldLevelStr,
        new_level: newLevelStr,
        old_level_numeric: oldLevel,
        new_level_numeric: level,
      },
      visible_to_child: true,
    });
  } catch { /* non-fatal */ }

  return NextResponse.json({ success: true, level: newLevelStr });
}
