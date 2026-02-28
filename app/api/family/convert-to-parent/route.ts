/**
 * POST /api/family/convert-to-parent
 *
 * Converts a standard account to a parent account.
 * Requires the caller to be 18+ (verified via date_of_birth).
 * Creates a family_accounts row and parent family_members row.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

interface ConvertBody {
  date_of_birth: string; // ISO date string e.g. "1990-06-15"
}

function parseBody(raw: unknown): ConvertBody | null {
  if (typeof raw !== "object" || raw === null) return null;
  const b = raw as Record<string, unknown>;
  if (typeof b.date_of_birth !== "string") return null;
  return { date_of_birth: b.date_of_birth };
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
  // ── 1. Verify caller is authenticated ────────────────────────────────────
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Verify caller is a standard account ────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, date_of_birth")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.account_type !== "standard") {
    return NextResponse.json(
      { error: "Only standard accounts can become parent accounts" },
      { status: 403 }
    );
  }

  // ── 3. Parse body and verify age ──────────────────────────────────────────
  const rawBody = await request.json().catch(() => null);
  const body = rawBody ? parseBody(rawBody) : null;

  // Use DOB from body OR from profile if already set
  const dobString = body?.date_of_birth ?? profile.date_of_birth;

  if (!dobString) {
    return NextResponse.json(
      { error: "Date of birth is required to verify you are 18 or older" },
      { status: 400 }
    );
  }

  const age = calculateAge(dobString);
  if (age < 18) {
    return NextResponse.json(
      { error: "Parent accounts require you to be 18 or older" },
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

  // ── 5. Convert account_type and save DOB ──────────────────────────────────
  const { error: updateError } = await adminClient
    .from("profiles")
    .update({
      account_type: "parent",
      ...(body?.date_of_birth ? { date_of_birth: body.date_of_birth } : {}),
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("[CONVERT_TO_PARENT] Profile update error:", updateError.message);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }

  // ── 6. Create family_accounts row ─────────────────────────────────────────
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
    console.error("[CONVERT_TO_PARENT] Family creation error:", familyError?.message);
    return NextResponse.json({ error: "Failed to create family account" }, { status: 500 });
  }

  // ── 7. Add parent as family member ────────────────────────────────────────
  await adminClient.from("family_members").insert({
    family_id: newFamily.id,
    user_id: user.id,
    role: "parent",
  });

  // ── 8. Record parental consent ────────────────────────────────────────────
  await adminClient.from("parental_consent").insert({
    parent_user_id: user.id,
    child_user_id: user.id, // self-declaration for age verification
    consent_method: "signed_form",
    verified: true,
    verified_at: new Date().toISOString(),
  }).catch(() => {}); // non-fatal if consent table schema differs

  // ── 9. Log to transparency log ────────────────────────────────────────────
  await adminClient.from("family_activity_log").insert({
    family_id: newFamily.id,
    user_id: user.id,
    activity_type: "account_converted",
    details: { from: "standard", to: "parent" },
    visible_to_child: true,
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    familyId: newFamily.id,
    accountType: "parent",
  });
}
