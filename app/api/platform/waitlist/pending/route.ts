import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformRole } from "@/lib/platform-roles.server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export async function GET(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed, retryAfterMs } = checkRateLimit(
		`waitlist-pending:${ip}`,
		20,
		60_000,
	);

	if (!allowed) {
		return NextResponse.json(
			{ error: "Too many requests" },
			{
				status: 429,
				headers: {
					"Retry-After": String(Math.ceil(retryAfterMs / 1000)),
				},
			},
		);
	}

	try {
		const supabase = await createClient();
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();
		if (authError || !user) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		// Only super_admins can view waitlist
		await requirePlatformRole(user.id, "super_admin");

		const { searchParams } = new URL(request.url);
		const limit = Math.min(
			Number(searchParams.get("limit")) || 50,
			100,
		);
		const offset = Number(searchParams.get("offset")) || 0;

		const serviceClient = createServiceClient();

		const { data, error, count } = await serviceClient
			.from("profiles")
			.select("id, username, display_name, account_type, has_email, created_at", {
				count: "exact",
			})
			.eq("waitlist_status", "pending")
			.order("created_at", { ascending: true })
			.range(offset, offset + limit - 1);

		if (error) {
			return NextResponse.json(
				{ error: "Failed to fetch waitlist" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			users: data ?? [],
			total: count ?? 0,
			limit,
			offset,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Internal error";
		if (message === "UNAUTHORIZED") {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}
		if (message === "FORBIDDEN") {
			return NextResponse.json(
				{ error: "Forbidden" },
				{ status: 403 },
			);
		}
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
