export type PlatformRole = "user" | "developer" | "moderator" | "admin" | "super_admin";

export interface PlatformPermissions {
	// Developer permissions
	can_register_bots: boolean;
	can_publish_bots: boolean;
	can_view_bot_analytics: boolean;

	// Moderation permissions
	can_review_reports: boolean;
	can_moderate_content: boolean;
	can_ban_users: boolean;
	can_view_flagged_messages: boolean;

	// Admin permissions
	can_manage_servers: boolean;
	can_manage_users: boolean;
	can_view_user_pii: boolean;
	can_manage_bots: boolean;
	can_view_platform_analytics: boolean;

	// Super admin only
	can_grant_roles: boolean;
	can_manage_admins: boolean;
	can_access_audit_logs: boolean;
	can_modify_platform_settings: boolean;
}

export interface BotApplication {
	id: string;
	owner_id: string;
	name: string;
	description: string | null;
	avatar_url: string | null;
	webhook_url: string | null;
	webhook_secret: string;
	webhook_verified: boolean;
	bot_type: "custom" | "claude" | "webhook";
	status: "pending" | "approved" | "rejected" | "suspended";
	scopes: string[];
	privacy_policy_url: string | null;
	dpa_accepted_at: string | null;
	dpa_version: string | null;
	install_count: number;
	reviewed_by: string | null;
	reviewed_at: string | null;
	review_notes: string | null;
	is_teen_safe: boolean;
	created_at: string;
	updated_at: string;
}

export interface PlatformAuditEntry {
	id: string;
	actor_id: string;
	actor_role: PlatformRole;
	action: string;
	target_user_id: string | null;
	target_server_id: string | null;
	target_bot_id: string | null;
	target_report_id: string | null;
	metadata: Record<string, unknown>;
	ip_address: string | null;
	target_is_minor: boolean;
	created_at: string;
}

export const PLATFORM_ROLE_HIERARCHY: Record<PlatformRole, number> = {
	user: 0,
	developer: 1,
	moderator: 2,
	admin: 3,
	super_admin: 4,
};

export const DEFAULT_PERMISSIONS: PlatformPermissions = {
	can_register_bots: false,
	can_publish_bots: false,
	can_view_bot_analytics: false,
	can_review_reports: false,
	can_moderate_content: false,
	can_ban_users: false,
	can_view_flagged_messages: false,
	can_manage_servers: false,
	can_manage_users: false,
	can_view_user_pii: false,
	can_manage_bots: false,
	can_view_platform_analytics: false,
	can_grant_roles: false,
	can_manage_admins: false,
	can_access_audit_logs: false,
	can_modify_platform_settings: false,
};
