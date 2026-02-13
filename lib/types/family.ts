import type { User } from "@/store/auth.store";

export type MonitoringLevel = 1 | 2 | 3 | 4;

export interface ActivityStats {
	messagesSent7Days: number;
	serversJoined: number;
	friendsAdded: number;
	timeSpent7Days: number; // in hours
	dailyActivity: DailyActivity[];
}

export interface DailyActivity {
	date: string; // ISO date
	messages: number;
	timeSpent: number; // in hours
}

export interface ContentFlag {
	id: string;
	type: "language" | "bullying" | "adult-content" | "spam" | "other";
	message: {
		id: string;
		content: string;
		channelId: string;
		channelName: string;
		serverId: string;
		serverName: string;
		timestamp: Date;
	};
	confidence: number; // 0-1
	status: "pending" | "dismissed" | "addressed";
	createdAt: Date;
}

export interface ServerApproval {
	id: string;
	server: {
		id: string;
		name: string;
		icon: string | null;
		memberCount: number;
		description?: string;
	};
	status: "pending" | "approved" | "denied";
	requestedAt: Date;
	resolvedAt?: Date;
}

export interface FriendApproval {
	id: string;
	friend: {
		id: string;
		username: string;
		displayName: string;
		avatar: string;
	};
	status: "pending" | "approved" | "denied";
	requestedAt: Date;
	resolvedAt?: Date;
}

export type TransparencyLogAction =
	| "viewed_messages"
	| "viewed_friends"
	| "viewed_servers"
	| "viewed_flags"
	| "changed_monitoring_level"
	| "approved_server"
	| "denied_server"
	| "approved_friend"
	| "denied_friend"
	| "added_keyword_alert"
	| "removed_keyword_alert"
	| "changed_time_limit"
	| "blocked_category"
	| "unblocked_category"
	| "viewed_voice_metadata"
	| "exported_activity_log"
	| "changed_data_retention"
	| "restricted_server"
	| "unrestricted_server";

export interface TransparencyLogEntry {
	id: string;
	action: TransparencyLogAction;
	details: string;
	timestamp: Date;
	metadata?: {
		channelId?: string;
		channelName?: string;
		serverId?: string;
		serverName?: string;
		friendId?: string;
		friendName?: string;
		oldLevel?: MonitoringLevel;
		newLevel?: MonitoringLevel;
	};
}

export interface TeenAccount {
	id: string;
	user: User;
	parentId: string;
	monitoringLevel: MonitoringLevel;
	activity: ActivityStats;
	contentFlags: ContentFlag[];
	pendingServers: ServerApproval[];
	pendingFriends: FriendApproval[];
	transparencyLog: TransparencyLogEntry[];
	restrictions: {
		serverWhitelist?: string[];
		timeLimit?: number;
		allowedHours?: { start: number; end: number };
		keywordAlerts?: KeywordAlert[];
		keywordAlertMatches?: KeywordAlertMatch[];
		blockedCategories?: BlockedCategory[];
		timeLimitConfig?: TimeLimitConfig;
		screenTimeHistory?: ScreenTimeEntry[];
		voiceCallHistory?: VoiceCallMetadata[];
		dashboardSettings?: ParentDashboardSettings;
		restrictedServers?: string[];
	};
	createdAt: Date;
	lastActivityAt: Date;
}

export interface MonitoringLevelInfo {
	level: MonitoringLevel;
	name: string;
	description: string;
	features: string[];
	color: string; // OKLCH color
}

// Voice call metadata (NO audio content - privacy first)
export interface VoiceCallMetadata {
	id: string;
	channelId: string;
	channelName: string;
	serverId: string;
	serverName: string;
	startTime: Date;
	endTime: Date;
	duration: number; // seconds
	participants: Array<{
		userId: string;
		username: string;
		displayName: string;
		joinedAt: Date;
		leftAt: Date;
	}>;
}

export interface KeywordAlert {
	id: string;
	keyword: string;
	isRegex: boolean;
	isActive: boolean;
	severity: "low" | "medium" | "high";
	createdAt: Date;
	matchCount: number;
	lastMatchAt?: Date;
}

export interface KeywordAlertMatch {
	id: string;
	alertId: string;
	keyword: string;
	channelId: string;
	channelName: string;
	serverId: string;
	serverName: string;
	snippet: string;
	timestamp: Date;
	dismissed: boolean;
}

export interface BlockedCategory {
	id: string;
	name: string;
	description: string;
	isActive: boolean;
	icon: string;
}

export interface TimeLimitConfig {
	dailyLimitMinutes: number;
	weekdaySchedule: { start: string; end: string } | null; // "HH:MM"
	weekendSchedule: { start: string; end: string } | null;
	isActive: boolean;
	overrideUntil?: Date;
}

export interface ScreenTimeEntry {
	date: string; // ISO date
	totalMinutes: number;
	activeMinutes: number;
	idleMinutes: number;
	serverBreakdown: Array<{
		serverId: string;
		serverName: string;
		minutes: number;
	}>;
	voiceTotalMinutes: number;
}

export interface DataRetentionSettings {
	activityLogRetentionDays: number;
	messageAccessRetentionDays: number;
	voiceMetadataRetentionDays: number;
	autoDeleteEnabled: boolean;
}

export interface ParentDashboardSettings {
	emailNotifications: boolean;
	pushNotifications: boolean;
	dailyDigest: boolean;
	alertThreshold: "all" | "medium-high" | "high-only";
	dataRetention: DataRetentionSettings;
}

export const MONITORING_LEVELS: Record<MonitoringLevel, MonitoringLevelInfo> = {
	1: {
		level: 1,
		name: "Minimal",
		description: "Light oversight with basic visibility",
		features: [
			"View server list and friends",
			"Basic activity statistics",
			"No message access",
			"Teen has full autonomy",
		],
		color: "oklch(0.65 0.15 145)", // Green
	},
	2: {
		level: 2,
		name: "Moderate",
		description: "Balanced monitoring with manual review",
		features: [
			"All Minimal features",
			"View messages on-demand",
			"Activity trends and patterns",
			"Logged access (teen notified)",
		],
		color: "oklch(0.65 0.15 85)", // Yellow
	},
	3: {
		level: 3,
		name: "Supervised",
		description: "Active monitoring with AI assistance",
		features: [
			"All Moderate features",
			"AI content flags (language, bullying)",
			"Server/friend approval required",
			"Real-time alerts for concerns",
		],
		color: "oklch(0.65 0.15 40)", // Orange
	},
	4: {
		level: 4,
		name: "Restricted",
		description: "Maximum protection with strict controls",
		features: [
			"All Supervised features",
			"Server whitelist only",
			"Time limits and schedules",
			"Complete activity logs",
		],
		color: "oklch(0.65 0.15 15)", // Red
	},
};
