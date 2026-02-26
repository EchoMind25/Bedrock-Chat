import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformRole, auditLog } from "@/lib/platform-roles.server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export async function POST(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed, retryAfterMs } = checkRateLimit(
		`waitlist-approve:${ip}`,
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

		// Only super_admins can approve waitlisted users
		const actorRole = await requirePlatformRole(user.id, "super_admin");

		const body = await request.json();
		const { userIds } = body as { userIds: string[] };

		if (!Array.isArray(userIds) || userIds.length === 0) {
			return NextResponse.json(
				{ error: "userIds array required" },
				{ status: 400 },
			);
		}

		const serviceClient = createServiceClient();

		const { data, error } = await serviceClient
			.from("profiles")
			.update({ waitlist_status: "approved" })
			.in("id", userIds)
			.eq("waitlist_status", "pending")
			.select("id, username");

		if (error) {
			return NextResponse.json(
				{ error: "Failed to approve users" },
				{ status: 500 },
			);
		}

		// Audit log each approval
		for (const approved of data ?? []) {
			await auditLog({
				actorId: user.id,
				actorRole,
				action: "waitlist.approve",
				targetUserId: approved.id,
				metadata: { username: approved.username },
				ipAddress: ip !== "unknown" ? ip : undefined,
			});
		}

		return NextResponse.json({
			success: true,
			approved: data?.length ?? 0,
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
