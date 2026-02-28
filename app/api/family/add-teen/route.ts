/**
 * POST /api/family/add-teen
 *
 * Enhanced replacement for /api/parent/create-teen.
 * Creates a teen account with DOB, COPPA consent recording, and optional
 * per-teen monitoring level override.
 *
 * Teen accounts use a placeholder email: {username}@anonymous.bedrock.local
 * Password recovery routes through the parent's email.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { numericLevelToDb } from "@/lib/family/monitoring";
import type { MonitoringLevel } from "@/lib/types/family";

interface AddTeenBody {
  username: string;
  password: string;
  date_of_birth: string;        // ISO date string, required for COPPA
  monitoring_level?: MonitoringLevel; // 1-4 override; undefined = use family default
  coppa_consent: boolean;       // must be true
}

function parseBody(raw: unknown): AddTeenBody | null {
  if (typeof raw !== "object" || raw === null) return null;
  const b = raw as Record<string, unknown>;
  if (typeof b.username !== "string") return null;
  if (typeof b.password !== "string") return null;
  if (typeof b.date_of_birth !== "string") return null;
  if (b.coppa_consent !== true) return null;
  return {
    username: (b.username as string).trim().toLowerCase(),
    password: b.password as string,
    date_of_birth: b.date_of_birth as string,
    monitoring_level: typeof b.monitoring_level === "number"
      ? (b.monitoring_level as MonitoringLevel)
      : undefined,
    coppa_consent: true,
  };
}

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export async function POST(request: NextRequest) {
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
    return NextResponse.json(
      { error: "Only parent accounts can create teen accounts" },
      { status: 403 }
    );
  }

  // ── 2. Parse and validate body ────────────────────────────────────────────
  const rawBody = await request.json().catch(() => null);
  const body = rawBody ? parseBody(rawBody) : null;

  if (!body) {
    return NextResponse.json(
      { error: "Invalid request. coppa_consent must be true." },
      { status: 400 }
    );
  }

  if (body.username.length < 3) {
    return NextResponse.json(
      { error: "Username must be at least 3 characters" },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9_]+$/.test(body.username)) {
    return NextResponse.json(
      { error: "Username may only contain letters, numbers, and underscores" },
      { status: 400 }
    );
  }

  if (body.password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const teenAge = calculateAge(body.date_of_birth);
  if (teenAge < 5 || teenAge > 17) {
    return NextResponse.json(
      { error: "Teen accounts are for children aged 5–17" },
      { status: 400 }
    );
  }

  // ── 3. Config guards ──────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);

  // ── 4. Username uniqueness check ──────────────────────────────────────────
  const { data: existing } = await adminClient
    .from("profiles")
    .select("id")
    .ilike("username", body.username)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
  }

  // ── 5. Create teen user via admin API (email-less, auto-confirmed) ─────────
  const placeholderEmail = `${body.username}@anonymous.bedrock.local`;

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email: placeholderEmail,
    password: body.password,
    email_confirm: true,
    user_metadata: {
      username: body.username,
      account_type: "teen",
      has_email: false,
      created_by_parent: user.id,
      date_of_birth: body.date_of_birth,
    },
  });

  if (createError || !newUser?.user) {
    console.error("[ADD_TEEN] User creation error:", createError?.message);
    return NextResponse.json({ error: "Failed to create teen account" }, { status: 500 });
  }

  const teenId = newUser.user.id;

  // ── 6. Create teen profile ────────────────────────────────────────────────
  const { error: profileError } = await adminClient.from("profiles").insert({
    id: teenId,
    username: body.username,
    display_name: body.username,
    account_type: "teen",
    has_email: false,
    date_of_birth: body.date_of_birth,
    waitlist_status: "approved",
  });

  if (profileError && !profileError.message.includes("duplicate")) {
    console.error("[ADD_TEEN] Profile creation error:", profileError.message);
    // Non-fatal — may have been created by a trigger
  }

  // ── 7. Find or create parent's family ─────────────────────────────────────
  const { data: existingMembership } = await adminClient
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .eq("role", "parent")
    .maybeSingle();

  let familyId: string;

  if (existingMembership?.family_id) {
    familyId = existingMembership.family_id;
  } else {
    const { data: newFamily, error: familyError } = await adminClient
      .from("family_accounts")
      .insert({
        name: "My Family",
        monitoring_level: "minimal",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (familyError || !newFamily) {
      console.error("[ADD_TEEN] Family creation error:", familyError?.message);
      return NextResponse.json({ error: "Failed to create family" }, { status: 500 });
    }

    familyId = newFamily.id;

    await adminClient.from("family_members").insert({
      family_id: familyId,
      user_id: user.id,
      role: "parent",
    });
  }

  // ── 8. Link teen to family with optional monitoring level override ─────────
  const monitoringOverride = body.monitoring_level
    ? numericLevelToDb(body.monitoring_level)
    : null;

  const { error: linkError } = await adminClient.from("family_members").insert({
    family_id: familyId,
    user_id: teenId,
    role: "child",
    ...(monitoringOverride ? { monitoring_level_override: monitoringOverride } : {}),
  });

  if (linkError) {
    console.error("[ADD_TEEN] Family link error:", linkError.message);
    return NextResponse.json({ error: "Failed to link teen to family" }, { status: 500 });
  }

  // ── 9. Record COPPA consent ───────────────────────────────────────────────
  await adminClient.from("parental_consent").insert({
    parent_user_id: user.id,
    child_user_id: teenId,
    consent_method: "signed_form",
    verified: true,
    verified_at: new Date().toISOString(),
  }).catch(() => {}); // non-fatal

  // ── 10. Log to transparency log ───────────────────────────────────────────
  await adminClient.from("family_activity_log").insert({
    family_id: familyId,
    user_id: user.id,
    activity_type: "account_converted",
    details: { action: "added_teen", teen_username: body.username, teen_age: teenAge },
    visible_to_child: true,
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    teen: { id: teenId, username: body.username },
  });
}
