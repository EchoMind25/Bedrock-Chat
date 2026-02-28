/**
 * POST /api/parent/create-teen
 *
 * Allows an authenticated parent to create a teen account with just a
 * username and password — no email required. The teen is auto-confirmed
 * via the admin API and immediately linked to the parent's family.
 *
 * Auth: requires a valid Supabase session cookie (parent must be logged in).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

interface CreateTeenBody {
	username: string;
	password: string;
}

function parseBody(raw: unknown): CreateTeenBody | null {
	if (typeof raw !== "object" || raw === null) return null;
	const b = raw as Record<string, unknown>;
	if (typeof b.username !== "string" || typeof b.password !== "string") return null;
	return {
		username: (b.username as string).trim(),
		password: b.password as string,
	};
}

export async function POST(request: NextRequest) {
	// ── 1. Verify caller is an authenticated parent ───────────────────────────
	const supabase = await createClient();
	const { data: { user }, error: authError } = await supabase.auth.getUser();

	if (authError || !user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Check that the caller's profile is a parent account
	const { data: callerProfile } = await supabase
		.from("profiles")
		.select("account_type")
		.eq("id", user.id)
		.single();

	if (!callerProfile || callerProfile.account_type !== "parent") {
		return NextResponse.json({ error: "Only parent accounts can create teen accounts" }, { status: 403 });
	}

	// ── 2. Parse and validate body ────────────────────────────────────────────
	const rawBody = await request.json().catch(() => null);
	const body = rawBody ? parseBody(rawBody) : null;

	if (!body) {
		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	}

	if (body.username.length < 3) {
		return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
	}

	if (body.password.length < 8) {
		return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
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

	// ── 5. Create teen user via admin API (auto-confirmed, no email needed) ───
	const placeholderEmail = `${body.username.toLowerCase()}@anonymous.bedrock.local`;

	const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
		email: placeholderEmail,
		password: body.password,
		email_confirm: true,
		user_metadata: {
			username: body.username,
			account_type: "teen",
			has_email: false,
			created_by_parent: user.id,
		},
	});

	if (createError || !newUser?.user) {
		console.error("[CREATE_TEEN] User creation error:", createError?.message);
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
		waitlist_status: "approved", // Teen accounts are immediately active
	});

	if (profileError && !profileError.message.includes("duplicate")) {
		console.error("[CREATE_TEEN] Profile creation error:", profileError.message);
		// Non-fatal — profile may have been created by a trigger
	}

	// ── 7. Find or create the parent's family, then link teen ─────────────────
	// Look up existing family membership for this parent
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
		// Create a new family account for this parent
		const { data: newFamily, error: familyError } = await adminClient
			.from("family_accounts")
			.insert({
				name: "Family",
				monitoring_level: 1,
				created_by: user.id,
			})
			.select("id")
			.single();

		if (familyError || !newFamily) {
			console.error("[CREATE_TEEN] Family creation error:", familyError?.message);
			return NextResponse.json({ error: "Failed to create family" }, { status: 500 });
		}

		familyId = newFamily.id;

		// Add the parent as a family member
		await adminClient.from("family_members").insert({
			family_id: familyId,
			user_id: user.id,
			role: "parent",
		});
	}

	// Add teen as a child member of the family
	const { error: linkError } = await adminClient.from("family_members").insert({
		family_id: familyId,
		user_id: teenId,
		role: "child",
	});

	if (linkError) {
		console.error("[CREATE_TEEN] Family link error:", linkError.message);
		return NextResponse.json({ error: "Failed to link teen to family" }, { status: 500 });
	}

	return NextResponse.json({
		success: true,
		teen: {
			id: teenId,
			username: body.username,
		},
	});
}
