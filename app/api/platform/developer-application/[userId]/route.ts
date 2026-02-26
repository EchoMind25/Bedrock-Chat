import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformRole, auditLog } from "@/lib/platform-roles.server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ userId: string }> },
) {
	const { userId: targetUserId } = await params;
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed } = checkRateLimit(`dev-app-review:${ip}`, 10, 60_000);
	if (!allowed) {
		return NextResponse.json({ error: "Too many requests" }, { status: 429 });
	}

	try {
		const supabase = await createClient();
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();
		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const actorRole = await requirePlatformRole(user.id, "super_admin");

		const body = await request.json();
		const { action } = body as { action: "approve" | "reject" };

		if (!action || !["approve", "reject"].includes(action)) {
			return NextResponse.json(
				{ error: "action must be 'approve' or 'reject'" },
				{ status: 400 },
			);
		}

		const serviceClient = createServiceClient();

		// Verify the target user exists and is still a 'user' role
		const { data: targetProfile } = await serviceClient
			.from("profiles")
			.select("id, platform_role")
			.eq("id", targetUserId)
			.single();

		if (!targetProfile) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		if (targetProfile.platform_role !== "user") {
			return NextResponse.json(
				{ error: "User already has an elevated role" },
				{ status: 400 },
			);
		}

		if (action === "approve") {
			// Grant developer role
			const { error: updateError } = await serviceClient
				.from("profiles")
				.update({
					platform_role: "developer",
					platform_role_granted_by: user.id,
					platform_role_granted_at: new Date().toISOString(),
				})
				.eq("id", targetUserId);

			if (updateError) {
				return NextResponse.json({ error: "Failed to grant developer role" }, { status: 500 });
			}

			// Create developer permissions
			await serviceClient.from("platform_permissions").upsert({
				user_id: targetUserId,
				can_register_bots: true,
				can_publish_bots: false,
				can_view_bot_analytics: true,
				granted_by: user.id,
			});

			await auditLog({
				actorId: user.id,
				actorRole,
				action: "developer_application_approved",
				targetUserId,
				metadata: { granted_role: "developer" },
				ipAddress: ip !== "unknown" ? ip : undefined,
			});
		} else {
			await auditLog({
				actorId: user.id,
				actorRole,
				action: "developer_application_rejected",
				targetUserId,
				metadata: {},
				ipAddress: ip !== "unknown" ? ip : undefined,
			});
		}

		return NextResponse.json({ success: true, action });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Internal error";
		if (message === "FORBIDDEN") {
			return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
		}
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
