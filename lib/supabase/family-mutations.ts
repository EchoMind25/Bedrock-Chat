import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/stores/toast-store";
import type { TimeLimitConfig } from "@/lib/types/family";

// ─── Result type for all mutations ───────────────────────────────────────
interface MutationResult<T = void> {
	success: boolean;
	error?: string;
	data?: T;
}

// ─── Transparency Log ────────────────────────────────────────────────────
export async function persistTransparencyLogEntry(
	familyId: string,
	userId: string,
	activityType: string,
	details: Record<string, unknown>,
): Promise<MutationResult> {
	const supabase = createClient();
	const { error } = await supabase.from("family_activity_log").insert({
		family_id: familyId,
		user_id: userId,
		activity_type: activityType,
		details,
		visible_to_child: true,
	});
	if (error) {
		console.error("[FamilyMutations] Log error:", error.message);
		// Transparency log failures are silent — don't block parent actions
		return { success: false, error: error.message };
	}
	return { success: true };
}

// ─── Monitoring Level ────────────────────────────────────────────────────
export async function updateMonitoringLevel(
	familyId: string,
	level: string,
): Promise<MutationResult> {
	const supabase = createClient();
	const { error } = await supabase
		.from("family_accounts")
		.update({ monitoring_level: level })
		.eq("id", familyId);
	if (error) {
		console.error("[FamilyMutations] Monitoring level error:", error.message);
		toast.error(
			"Failed to save monitoring level",
			"Your change may not persist. Please try again.",
		);
		return { success: false, error: error.message };
	}
	return { success: true };
}

// ─── Keyword Alerts ──────────────────────────────────────────────────────
export async function insertKeywordAlert(
	familyId: string,
	teenUserId: string,
	keyword: string,
	isRegex: boolean,
	severity: string,
): Promise<MutationResult<{ id: string }>> {
	const supabase = createClient();
	const { data, error } = await supabase
		.from("family_keyword_alerts")
		.insert({
			family_id: familyId,
			teen_user_id: teenUserId,
			keyword,
			is_regex: isRegex,
			is_active: true,
			severity,
		})
		.select("id")
		.single();
	if (error) {
		console.error(
			"[FamilyMutations] Insert keyword alert error:",
			error.message,
		);
		toast.error(
			"Failed to save keyword alert",
			"The alert was not saved. Please try again.",
		);
		return { success: false, error: error.message };
	}
	return { success: true, data: { id: data.id } };
}

export async function deleteKeywordAlert(
	alertId: string,
): Promise<MutationResult> {
	const supabase = createClient();
	const { error } = await supabase
		.from("family_keyword_alerts")
		.delete()
		.eq("id", alertId);
	if (error) {
		console.error(
			"[FamilyMutations] Delete keyword alert error:",
			error.message,
		);
		toast.error("Failed to remove keyword alert", "Please try again.");
		return { success: false, error: error.message };
	}
	return { success: true };
}

export async function toggleKeywordAlertActive(
	alertId: string,
	isActive: boolean,
): Promise<MutationResult> {
	const supabase = createClient();
	const { error } = await supabase
		.from("family_keyword_alerts")
		.update({ is_active: isActive })
		.eq("id", alertId);
	if (error) {
		console.error(
			"[FamilyMutations] Toggle keyword alert error:",
			error.message,
		);
		toast.error("Failed to update keyword alert", "Please try again.");
		return { success: false, error: error.message };
	}
	return { success: true };
}

// ─── Time Limits ─────────────────────────────────────────────────────────
export async function upsertTimeLimit(
	familyId: string,
	teenUserId: string,
	config: TimeLimitConfig,
): Promise<MutationResult> {
	const supabase = createClient();
	const { error } = await supabase.from("family_time_limits").upsert(
		{
			family_id: familyId,
			teen_user_id: teenUserId,
			daily_limit_minutes: config.dailyLimitMinutes,
			weekday_start: config.weekdaySchedule?.start ?? null,
			weekday_end: config.weekdaySchedule?.end ?? null,
			weekend_start: config.weekendSchedule?.start ?? null,
			weekend_end: config.weekendSchedule?.end ?? null,
			is_active: config.isActive,
			override_until: config.overrideUntil?.toISOString() ?? null,
		},
		{ onConflict: "family_id,teen_user_id" },
	);
	if (error) {
		console.error("[FamilyMutations] Upsert time limit error:", error.message);
		toast.error(
			"Failed to save time limit",
			"Your changes may not persist. Please try again.",
		);
		return { success: false, error: error.message };
	}
	return { success: true };
}

export async function deleteTimeLimit(
	familyId: string,
	teenUserId: string,
): Promise<MutationResult> {
	const supabase = createClient();
	const { error } = await supabase
		.from("family_time_limits")
		.delete()
		.eq("family_id", familyId)
		.eq("teen_user_id", teenUserId);
	if (error) {
		console.error("[FamilyMutations] Delete time limit error:", error.message);
		toast.error("Failed to remove time limit", "Please try again.");
		return { success: false, error: error.message };
	}
	return { success: true };
}

// ─── Blocked Categories ──────────────────────────────────────────────────
export async function upsertBlockedCategory(
	familyId: string,
	teenUserId: string,
	categoryName: string,
	categoryDescription: string,
	categoryIcon: string,
	isActive: boolean,
): Promise<MutationResult> {
	const supabase = createClient();
	const { error } = await supabase.from("family_blocked_categories").upsert(
		{
			family_id: familyId,
			teen_user_id: teenUserId,
			category_name: categoryName,
			category_description: categoryDescription,
			category_icon: categoryIcon,
			is_active: isActive,
		},
		{ onConflict: "family_id,teen_user_id,category_name" },
	);
	if (error) {
		console.error(
			"[FamilyMutations] Upsert blocked category error:",
			error.message,
		);
		toast.error("Failed to update category block", "Please try again.");
		return { success: false, error: error.message };
	}
	return { success: true };
}

// ─── Restricted Servers ──────────────────────────────────────────────────
export async function insertRestrictedServer(
	familyId: string,
	teenUserId: string,
	serverId: string,
	restrictedBy: string,
): Promise<MutationResult> {
	const supabase = createClient();
	const { error } = await supabase.from("family_restricted_servers").insert({
		family_id: familyId,
		teen_user_id: teenUserId,
		server_id: serverId,
		restricted_by: restrictedBy,
	});
	if (error) {
		console.error(
			"[FamilyMutations] Insert restricted server error:",
			error.message,
		);
		toast.error("Failed to restrict server", "Please try again.");
		return { success: false, error: error.message };
	}
	return { success: true };
}

export async function deleteRestrictedServer(
	familyId: string,
	teenUserId: string,
	serverId: string,
): Promise<MutationResult> {
	const supabase = createClient();
	const { error } = await supabase
		.from("family_restricted_servers")
		.delete()
		.eq("family_id", familyId)
		.eq("teen_user_id", teenUserId)
		.eq("server_id", serverId);
	if (error) {
		console.error(
			"[FamilyMutations] Delete restricted server error:",
			error.message,
		);
		toast.error("Failed to unrestrict server", "Please try again.");
		return { success: false, error: error.message };
	}
	return { success: true };
}
