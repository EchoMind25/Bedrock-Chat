import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformRole, auditLog } from "@/lib/platform-roles.server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import type { PlatformRole, PlatformPermissions } from "@/lib/types/platform-role";

export async function POST(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed, retryAfterMs } = checkRateLimit(`role-grant:${ip}`, 10, 60_000);

	if (!allowed) {
		return NextResponse.json(
			{ error: "Too many requests" },
			{ status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
		);
	}

	try {
		// Authenticate
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Require super_admin
		const actorRole = await requirePlatformRole(user.id, "super_admin");

		// Parse body
		const body = await request.json();
		const { targetUserId, role, permissions } = body as {
			targetUserId: string;
			role: PlatformRole;
			permissions?: Partial<PlatformPermissions>;
		};

		if (!targetUserId || !role) {
			return NextResponse.json({ error: "targetUserId and role are required" }, { status: 400 });
		}

		// Cannot grant super_admin via API
		if (role === "super_admin") {
			return NextResponse.json(
				{ error: "super_admin must be granted directly in the database" },
				{ status: 403 },
			);
		}

		const serviceClient = createServiceClient();

		// Get current role for audit log
		const { data: targetProfile } = await serviceClient
			.from("profiles")
			.select("platform_role")
			.eq("id", targetUserId)
			.single();

		if (!targetProfile) {
			return NextResponse.json({ error: "Target user not found" }, { status: 404 });
		}

		const oldRole = targetProfile.platform_role;

		// Update role on profiles
		const { error: updateError } = await serviceClient
			.from("profiles")
			.update({
				platform_role: role,
				platform_role_granted_by: user.id,
				platform_role_granted_at: new Date().toISOString(),
			})
			.eq("id", targetUserId);

		if (updateError) {
			return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
		}

		// Upsert platform_permissions
		const permissionRow: Record<string, unknown> = {
			user_id: targetUserId,
			granted_by: user.id,
		};

		// Set default permissions based on role
		if (role === "developer") {
			permissionRow.can_register_bots = true;
			permissionRow.can_publish_bots = true;
			permissionRow.can_view_bot_analytics = true;
		} else if (role === "moderator") {
			permissionRow.can_register_bots = true;
			permissionRow.can_publish_bots = true;
			permissionRow.can_view_bot_analytics = true;
			permissionRow.can_review_reports = true;
			permissionRow.can_moderate_content = true;
			permissionRow.can_ban_users = true;
			permissionRow.can_view_flagged_messages = true;
		} else if (role === "admin") {
			permissionRow.can_register_bots = true;
			permissionRow.can_publish_bots = true;
			permissionRow.can_view_bot_analytics = true;
			permissionRow.can_review_reports = true;
			permissionRow.can_moderate_content = true;
			permissionRow.can_ban_users = true;
			permissionRow.can_view_flagged_messages = true;
			permissionRow.can_manage_servers = true;
			permissionRow.can_manage_users = true;
			permissionRow.can_view_user_pii = true;
			permissionRow.can_manage_bots = true;
			permissionRow.can_view_platform_analytics = true;
			permissionRow.can_access_audit_logs = true;
		}

		// Override with explicit permissions if provided
		if (permissions) {
			Object.assign(permissionRow, permissions);
		}

		const { error: permError } = await serviceClient
			.from("platform_permissions")
			.upsert(permissionRow, { onConflict: "user_id" });

		if (permError) {
			return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 });
		}

		// Audit log
		await auditLog({
			actorId: user.id,
			actorRole,
			action: "role_granted",
			targetUserId,
			metadata: { old_role: oldRole, new_role: role },
			ipAddress: ip !== "unknown" ? ip : undefined,
		});

		return NextResponse.json({ success: true, role });
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
