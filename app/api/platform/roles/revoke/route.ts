import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformRole, auditLog } from "@/lib/platform-roles.server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export async function POST(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed, retryAfterMs } = checkRateLimit(`role-revoke:${ip}`, 10, 60_000);

	if (!allowed) {
		return NextResponse.json(
			{ error: "Too many requests" },
			{ status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
		);
	}

	try {
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const actorRole = await requirePlatformRole(user.id, "super_admin");

		const body = await request.json();
		const { targetUserId, reason } = body as { targetUserId: string; reason?: string };

		if (!targetUserId) {
			return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
		}

		// Cannot revoke own super_admin
		if (targetUserId === user.id) {
			return NextResponse.json({ error: "Cannot revoke your own role" }, { status: 403 });
		}

		const serviceClient = createServiceClient();

		// Get current role for audit
		const { data: targetProfile } = await serviceClient
			.from("profiles")
			.select("platform_role")
			.eq("id", targetUserId)
			.single();

		if (!targetProfile) {
			return NextResponse.json({ error: "Target user not found" }, { status: 404 });
		}

		const oldRole = targetProfile.platform_role;

		// Reset to user role
		const { error: updateError } = await serviceClient
			.from("profiles")
			.update({
				platform_role: "user",
				platform_role_granted_by: null,
				platform_role_granted_at: null,
			})
			.eq("id", targetUserId);

		if (updateError) {
			return NextResponse.json({ error: "Failed to revoke role" }, { status: 500 });
		}

		// Delete permissions row
		await serviceClient
			.from("platform_permissions")
			.delete()
			.eq("user_id", targetUserId);

		// Audit log
		await auditLog({
			actorId: user.id,
			actorRole,
			action: "role_revoked",
			targetUserId,
			metadata: { old_role: oldRole, reason: reason ?? null },
			ipAddress: ip !== "unknown" ? ip : undefined,
		});

		return NextResponse.json({ success: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Internal error";
		if (message === "UNAUTHORIZED") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		if (message === "FORBIDDEN") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
