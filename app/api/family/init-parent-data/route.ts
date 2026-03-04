/**
 * GET /api/family/init-parent-data
 *
 * Loads all family data for the authenticated parent using the admin client,
 * completely bypassing client-side RLS. This replaces the previous approach
 * of querying Supabase directly from the browser store, which was unreliable
 * due to session timing (auth.uid() returning null before the session is
 * fully restored) and RLS recursion issues.
 */

import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ENABLE_FAMILY_ACCOUNTS } from "@/lib/feature-flags";

export async function GET() {
  if (!ENABLE_FAMILY_ACCOUNTS) {
    return NextResponse.json({ error: "Family accounts are not yet available" }, { status: 403 });
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

  // ── 2. Use admin client to bypass RLS entirely ────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey);

  // ── 3. Find parent's family membership ────────────────────────────────────
  const { data: membership, error: membershipError } = await admin
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .eq("role", "parent")
    .maybeSingle();

  if (membershipError) {
    console.error("[init-parent-data] membership error:", membershipError.message);
    return NextResponse.json({ error: "Failed to load family" }, { status: 500 });
  }

  if (!membership) {
    // Parent has no family yet — return empty state (they'll create one via add-teen)
    return NextResponse.json({ familyId: null, teens: [], logs: [] });
  }

  const familyId = membership.family_id;

  // ── 4. Load family metadata ───────────────────────────────────────────────
  const { data: familyAccount } = await admin
    .from("family_accounts")
    .select("id, name, monitoring_level")
    .eq("id", familyId)
    .single();

  const defaultMonitoringLevel = familyAccount?.monitoring_level ?? "minimal";

  // ── 5. Load teen members with their profiles ───────────────────────────────
  const { data: teenMembers, error: teensError } = await admin
    .from("family_members")
    .select("user_id, monitoring_level_override")
    .eq("family_id", familyId)
    .eq("role", "child");

  if (teensError) {
    console.error("[init-parent-data] teens error:", teensError.message);
    return NextResponse.json({ error: "Failed to load teens" }, { status: 500 });
  }

  if (!teenMembers || teenMembers.length === 0) {
    return NextResponse.json({ familyId, teens: [], logs: [] });
  }

  // ── 6. Load profiles for all teens ────────────────────────────────────────
  const teenUserIds = teenMembers.map((m) => m.user_id);

  const { data: teenProfiles } = await admin
    .from("profiles")
    .select("id, username, display_name, avatar_url, account_type")
    .in("id", teenUserIds);

  // ── 7. Load family activity log ───────────────────────────────────────────
  const { data: logs } = await admin
    .from("family_activity_log")
    .select("*")
    .eq("family_id", familyId)
    .order("occurred_at", { ascending: false })
    .limit(50);

  // ── 8. Load per-teen restrictions (parallel per teen) ─────────────────────
  const teensWithData = await Promise.all(
    teenMembers.map(async (member) => {
      const profile = (teenProfiles ?? []).find((p) => p.id === member.user_id);
      if (!profile) return null;

      const [
        { data: keywords },
        { data: timeLimit },
        { data: blockedCats },
        { data: restrictedServers },
      ] = await Promise.all([
        admin.from("family_keyword_alerts").select("*")
          .eq("family_id", familyId).eq("teen_user_id", member.user_id),
        admin.from("family_time_limits").select("*")
          .eq("family_id", familyId).eq("teen_user_id", member.user_id)
          .maybeSingle(),
        admin.from("family_blocked_categories").select("*")
          .eq("family_id", familyId).eq("teen_user_id", member.user_id),
        admin.from("family_restricted_servers").select("*")
          .eq("family_id", familyId).eq("teen_user_id", member.user_id),
      ]);

      return {
        userId: member.user_id,
        monitoringLevelOverride: member.monitoring_level_override ?? null,
        defaultMonitoringLevel,
        username: profile.username,
        displayName: profile.display_name || profile.username,
        avatarUrl: profile.avatar_url || "",
        keywords: keywords ?? [],
        timeLimit: timeLimit ?? null,
        blockedCategories: blockedCats ?? [],
        restrictedServers: (restrictedServers ?? []).map((r: { server_id: string }) => r.server_id),
        logs: (logs ?? []).map((log: Record<string, unknown>) => ({
          id: log.id,
          action: log.activity_type,
          details: JSON.stringify(log.details),
          occurredAt: log.occurred_at,
          metadata: log.details,
        })),
      };
    })
  );

  const validTeens = teensWithData.filter(Boolean);

  return NextResponse.json({ familyId, teens: validTeens });
}
