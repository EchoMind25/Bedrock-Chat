/**
 * POST /api/waitlist
 *
 * Collects email addresses for the beta launch waitlist.
 * Emails are stored in a separate table from auth users.
 * Post-launch, all waitlist emails will be deleted per our privacy promise.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export async function POST(request: NextRequest) {
	const ip =
		request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
	const { allowed, retryAfterMs } = checkRateLimit(
		`waitlist:${ip}`,
		3,
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
	if (!body?.email || typeof body.email !== "string") {
		return NextResponse.json(
			{ error: "Email is required" },
			{ status: 400 },
		);
	}

	const email = body.email.toLowerCase().trim();

	// Basic email format validation
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return NextResponse.json(
			{ error: "Invalid email format" },
			{ status: 400 },
		);
	}

	const supabase = createServiceClient();

	const { error } = await supabase.from("waitlist_signups").upsert(
		{ email },
		{ onConflict: "email", ignoreDuplicates: true },
	);

	if (error) {
		console.error("[WAITLIST] Insert error:", error.message);
		return NextResponse.json(
			{ error: "Something went wrong" },
			{ status: 500 },
		);
	}

	// Always return success (even for duplicates) to prevent email enumeration
	return NextResponse.json({ success: true });
}
