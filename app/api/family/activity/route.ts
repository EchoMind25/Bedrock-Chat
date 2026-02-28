/**
 * GET /api/family/activity
 *
 * Returns aggregated teen activity data for the parent dashboard.
 * Data returned respects the teen's current monitoring level.
 *
 * Query params: ?teen_user_id=UUID&range=7d|14d|30d
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { dbLevelToNumeric, getMonitoringPermissions } from "@/lib/family/monitoring";

export async function GET(request: NextRequest) {
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
    return NextResponse.json({ error: "Only parent accounts can access activity data" }, { status: 403 });
  }

  // ── 3. Parse params ───────────────────────────────────────────────────────
  const { searchParams } = new URL(request.url);
  const teenUserId = searchParams.get("teen_user_id");
  const range = searchParams.get("range") ?? "7d";

  if (!teenUserId) {
    return NextResponse.json({ error: "teen_user_id is required" }, { status: 400 });
  }

  const days = range === "30d" ? 30 : range === "14d" ? 14 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // ── 4. Config guards ──────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);

  // ── 5. Verify teen is in parent's family ──────────────────────────────────
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
    .select("monitoring_level_override")
    .eq("family_id", parentMembership.family_id)
    .eq("user_id", teenUserId)
    .eq("role", "child")
    .maybeSingle();

  if (!teenMembership) {
    return NextResponse.json({ error: "This teen is not in your family" }, { status: 403 });
  }

  // ── 6. Get effective monitoring level ─────────────────────────────────────
  const { data: familyAccount } = await adminClient
    .from("family_accounts")
    .select("monitoring_level")
    .eq("id", parentMembership.family_id)
    .single();

  const levelStr =
    (teenMembership.monitoring_level_override as string | null) ??
    (familyAccount?.monitoring_level as string) ??
    "minimal";
  const level = dbLevelToNumeric(levelStr);
  const perms = getMonitoringPermissions(level);

  // ── 7. Fetch screen time data (available at all levels) ───────────────────
  const { data: screenTimeRows } = await adminClient
    .from("family_screen_time")
    .select("date, total_minutes, active_minutes")
    .eq("teen_user_id", teenUserId)
    .gte("date", since.split("T")[0])
    .order("date", { ascending: true });

  // ── 8. Fetch message counts (available at level 2+) ───────────────────────
  let messageCount = 0;
  const dailyMessages: Record<string, number> = {};

  if (perms.canSeeMessageCounts) {
    const { data: msgRows } = await adminClient
      .from("messages")
      .select("created_at")
      .eq("user_id", teenUserId)
      .gte("created_at", since);

    messageCount = msgRows?.length ?? 0;

    for (const msg of msgRows ?? []) {
      const day = (msg.created_at as string).split("T")[0];
      dailyMessages[day] = (dailyMessages[day] ?? 0) + 1;
    }
  }

  // ── 9. Build daily activity array ─────────────────────────────────────────
  const dailyActivity = (screenTimeRows ?? []).map((row) => ({
    date: row.date,
    messages: dailyMessages[row.date as string] ?? 0,
    timeSpent: ((row.total_minutes as number) ?? 0) / 60,
  }));

  // Fill missing days with zeros
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    if (!dailyActivity.find((da) => da.date === d)) {
      dailyActivity.push({ date: d, messages: dailyMessages[d] ?? 0, timeSpent: 0 });
    }
  }
  dailyActivity.sort((a, b) => a.date.localeCompare(b.date));

  const totalScreenMinutes = (screenTimeRows ?? []).reduce(
    (sum, r) => sum + ((r.total_minutes as number) ?? 0),
    0
  );

  return NextResponse.json({
    stats: {
      messagesSent7Days: messageCount,
      timeSpent7Days: totalScreenMinutes / 60,
      dailyActivity,
    },
    monitoringLevel: level,
    permissions: perms,
  });
}
