/**
 * POST /api/auth/lookup-username
 *
 * Resolves a username to its associated email address for login.
 * Used when users log in with their username instead of email.
 * Rate-limited to prevent username enumeration.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export async function POST(request: NextRequest) {
	// Rate limit to prevent username enumeration
	const ip =
		request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
	const { allowed, retryAfterMs } = checkRateLimit(
		`lookup:${ip}`,
		10,
		60 * 1000,
	);
	if (!allowed) {
		return NextResponse.json(
			{ error: "Too many requests" },
			{
				status: 429,
				headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
			},
		);
	}

	const body = await request.json().catch(() => null);
	if (!body?.username || typeof body.username !== "string") {
		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	}

	const supabase = createServiceClient();

	// Look up profile by username (case-insensitive)
	const { data: profile } = await supabase
		.from("profiles")
		.select("id")
		.ilike("username", body.username)
		.maybeSingle();

	if (!profile) {
		// Generic error to prevent username enumeration
		return NextResponse.json(
			{ error: "Invalid credentials" },
			{ status: 401 },
		);
	}

	// Look up the auth user's email via admin API
	const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
	if (!authUser?.user?.email) {
		return NextResponse.json(
			{ error: "Invalid credentials" },
			{ status: 401 },
		);
	}

	return NextResponse.json({ email: authUser.user.email });
}
