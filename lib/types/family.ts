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
	| "denied_friend";

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
		serverWhitelist?: string[]; // Only for level 4
		timeLimit?: number; // Hours per day, only for level 4
		allowedHours?: { start: number; end: number }; // Only for level 4
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
