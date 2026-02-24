/**
 * Platform role utilities — server-side only.
 *
 * IMPORTANT: This file uses the Supabase service role key.
 * NEVER import in client components or "use client" files.
 *
 * All privileged platform operations (role grants, audit logging,
 * permission checks) must go through these functions to ensure
 * GDPR Art. 5(1)(f) compliance and COPPA protections.
 */

import { createServiceClient } from "@/lib/supabase/service";
import type { PlatformRole, PlatformPermissions } from "@/lib/types/platform-role";
import { PLATFORM_ROLE_HIERARCHY } from "@/lib/types/platform-role";

/**
 * Verifies that a user has at least the specified platform role.
 * Throws if the user doesn't exist or has insufficient privileges.
 * Returns the user's actual role on success.
 */
export async function requirePlatformRole(
	userId: string,
	minimumRole: PlatformRole
): Promise<PlatformRole> {
	const supabase = createServiceClient();

	const { data, error } = await supabase
		.from("profiles")
		.select("platform_role")
		.eq("id", userId)
		.single();

	if (error || !data) {
		throw new Error("UNAUTHORIZED");
	}

	const userLevel = PLATFORM_ROLE_HIERARCHY[data.platform_role as PlatformRole];
	const requiredLevel = PLATFORM_ROLE_HIERARCHY[minimumRole];

	if (userLevel < requiredLevel) {
		throw new Error("FORBIDDEN");
	}

	return data.platform_role as PlatformRole;
}

/**
 * Checks a specific granular permission for a user.
 * Throws if the permission is not granted.
 */
export async function requirePermission(
	userId: string,
	permission: keyof PlatformPermissions
): Promise<void> {
	const supabase = createServiceClient();

	const { data, error } = await supabase
		.from("platform_permissions")
		.select(permission)
		.eq("user_id", userId)
		.single();

	if (error || !data || !(data as Record<string, boolean>)[permission]) {
		throw new Error("FORBIDDEN");
	}
}

/**
 * Writes an entry to the platform audit log.
 * Automatically detects if the target is a minor (COPPA compliance).
 *
 * GDPR Art. 5(1)(f): Every privileged access to user data must be logged.
 */
export async function auditLog(params: {
	actorId: string;
	actorRole: PlatformRole;
	action: string;
	targetUserId?: string;
	targetServerId?: string;
	targetBotId?: string;
	targetReportId?: string;
	metadata?: Record<string, unknown>;
	ipAddress?: string;
}): Promise<void> {
	const supabase = createServiceClient();

	let targetIsMinor = false;

	// Check if target is a minor (COPPA compliance)
	if (params.targetUserId) {
		const { data: targetProfile } = await supabase
			.from("profiles")
			.select("date_of_birth, account_type")
			.eq("id", params.targetUserId)
			.single();

		if (targetProfile) {
			if (targetProfile.account_type === "teen") {
				targetIsMinor = true;
			} else if (targetProfile.date_of_birth) {
				const birthDate = new Date(targetProfile.date_of_birth);
				const ageDiff = Date.now() - birthDate.getTime();
				const ageYears = ageDiff / (1000 * 60 * 60 * 24 * 365.25);
				targetIsMinor = ageYears < 18;
			}
		}
	}

	await supabase.from("platform_role_audit_log").insert({
		actor_id: params.actorId,
		actor_role: params.actorRole,
		action: params.action,
		target_user_id: params.targetUserId ?? null,
		target_server_id: params.targetServerId ?? null,
		target_bot_id: params.targetBotId ?? null,
		target_report_id: params.targetReportId ?? null,
		metadata: params.metadata ?? {},
		ip_address: params.ipAddress ?? null,
		target_is_minor: targetIsMinor,
	});
}
