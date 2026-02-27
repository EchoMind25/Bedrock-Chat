/**
 * Analytics event catalog and type definitions.
 * All feature tracking MUST use FEATURE_EVENTS for consistency.
 */

export type EventType = "page_view" | "feature_use" | "performance" | "session" | "error";

export type AgeTier = "under_13" | "teen_13_15" | "teen_16_17" | "adult" | "unknown";

export interface AnalyticsEvent {
	event_type: EventType;
	event_name: string;
	event_data?: Record<string, string | number | boolean>;
	page_path?: string;
	referrer_path?: string;
	timestamp: string; // ISO 8601
}

export interface BatchPayload {
	session_token: string;
	device_category: "desktop" | "tablet" | "mobile";
	viewport_bucket: "sm" | "md" | "lg" | "xl";
	events: AnalyticsEvent[];
}

// ============================================================
// Feature event catalog — use these names for all trackFeature() calls
// ============================================================

export const FEATURE_EVENTS = {
	// Communication
	TEXT_MESSAGE_SEND: { name: "text_message_send", category: "communication" },
	VOICE_CHANNEL_JOIN: { name: "voice_channel_join", category: "communication" },
	VOICE_CHANNEL_LEAVE: { name: "voice_channel_leave", category: "communication" },
	FILE_UPLOAD: { name: "file_upload", category: "communication" },
	REACTION_ADD: { name: "reaction_add", category: "communication" },

	// Server management
	SERVER_CREATE: { name: "server_create", category: "server_mgmt" },
	SERVER_SETTINGS_OPEN: { name: "server_settings_open", category: "server_mgmt" },
	CHANNEL_CREATE: { name: "channel_create", category: "server_mgmt" },
	ROLE_ASSIGN: { name: "role_assign", category: "server_mgmt" },
	INVITE_CREATE: { name: "invite_create", category: "server_mgmt" },

	// User actions
	PROFILE_EDIT: { name: "profile_edit", category: "user_action" },
	SETTINGS_OPEN: { name: "settings_open", category: "user_action" },
	THEME_CHANGE: { name: "theme_change", category: "user_action" },
	NOTIFICATION_TOGGLE: { name: "notification_toggle", category: "user_action" },

	// Family features
	FAMILY_MONITOR_VIEW: { name: "family_monitor_view", category: "family" },
	FAMILY_SETTINGS_CHANGE: { name: "family_settings_change", category: "family" },

	// Search & navigation
	SEARCH_EXECUTE: { name: "search_execute", category: "navigation" },
	SIDEBAR_TOGGLE: { name: "sidebar_toggle", category: "navigation" },
} as const;

export type FeatureEventKey = keyof typeof FEATURE_EVENTS;

// ============================================================
// Performance metric names (used with event_type: 'performance')
// event_data MUST include: { duration_ms: number, is_error: boolean }
// ============================================================
export const PERFORMANCE_METRICS = [
	"page_load",
	"ttfb",
	"fcp",
	"lcp",
	"cls",
	"inp",
	"voice_connect",
	"api_latency",
] as const;

export type PerformanceMetric = (typeof PERFORMANCE_METRICS)[number];

// ============================================================
// Error event types (used with event_type: 'error')
// ============================================================
export const ERROR_TYPES = ["js_error", "api_error", "network_error", "voice_error"] as const;

export type ErrorType = (typeof ERROR_TYPES)[number];
