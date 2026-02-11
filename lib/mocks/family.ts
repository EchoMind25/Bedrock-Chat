import type {
	TeenAccount,
	ActivityStats,
	ContentFlag,
	ServerApproval,
	FriendApproval,
	TransparencyLogEntry,
	DailyActivity,
} from "@/lib/types/family";
import type { User } from "@/store/auth.store";

// Mock parent user
export const mockParent: User = {
	id: "parent-1",
	email: "parent@bedrock.chat",
	username: "concerned_parent",
	displayName: "Sarah Johnson",
	avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=parent1",
	accountType: "parent",
	createdAt: new Date("2025-01-15"),
	settings: {
		theme: "dark",
		notifications: true,
		reducedMotion: false,
	},
};

// Mock teen users
export const mockTeenUser1: User = {
	id: "teen-1",
	email: "teen1@bedrock.chat",
	username: "alex_cool",
	displayName: "Alex Johnson",
	avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=teen1",
	accountType: "teen",
	createdAt: new Date("2026-01-20"),
	settings: {
		theme: "dark",
		notifications: true,
		reducedMotion: false,
	},
};

export const mockTeenUser2: User = {
	id: "teen-2",
	email: "teen2@bedrock.chat",
	username: "jamie_plays",
	displayName: "Jamie Johnson",
	avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=teen2",
	accountType: "teen",
	createdAt: new Date("2026-02-01"),
	settings: {
		theme: "light",
		notifications: true,
		reducedMotion: false,
	},
};

// Generate daily activity for the past 7 days
function generateDailyActivity(): DailyActivity[] {
	const activities: DailyActivity[] = [];
	const now = new Date();

	for (let i = 6; i >= 0; i--) {
		const date = new Date(now);
		date.setDate(date.getDate() - i);

		activities.push({
			date: date.toISOString().split("T")[0],
			messages: Math.floor(Math.random() * 50) + 10,
			timeSpent: Math.random() * 3 + 0.5, // 0.5 - 3.5 hours
		});
	}

	return activities;
}

// Mock activity stats for teen 1
const mockActivity1: ActivityStats = {
	messagesSent7Days: 234,
	serversJoined: 8,
	friendsAdded: 12,
	timeSpent7Days: 14.5,
	dailyActivity: generateDailyActivity(),
};

// Mock activity stats for teen 2
const mockActivity2: ActivityStats = {
	messagesSent7Days: 89,
	serversJoined: 3,
	friendsAdded: 5,
	timeSpent7Days: 6.2,
	dailyActivity: generateDailyActivity(),
};

// Mock content flags
const mockContentFlags: ContentFlag[] = [
	{
		id: "flag-1",
		type: "language",
		message: {
			id: "msg-1",
			content: "This message contains potentially inappropriate language",
			channelId: "channel-3",
			channelName: "random",
			serverId: "server-1",
			serverName: "Bedrock Community",
			timestamp: new Date("2026-02-10T15:30:00"),
		},
		confidence: 0.87,
		status: "pending",
		createdAt: new Date("2026-02-10T15:30:10"),
	},
	{
		id: "flag-2",
		type: "bullying",
		message: {
			id: "msg-2",
			content: "Someone said something mean to me",
			channelId: "channel-3",
			channelName: "random",
			serverId: "server-1",
			serverName: "Bedrock Community",
			timestamp: new Date("2026-02-09T18:45:00"),
		},
		confidence: 0.65,
		status: "dismissed",
		createdAt: new Date("2026-02-09T18:45:15"),
	},
	{
		id: "flag-3",
		type: "spam",
		message: {
			id: "msg-3",
			content: "Check out this cool link!!!",
			channelId: "channel-4",
			channelName: "tech-talk",
			serverId: "server-1",
			serverName: "Bedrock Community",
			timestamp: new Date("2026-02-08T12:20:00"),
		},
		confidence: 0.92,
		status: "addressed",
		createdAt: new Date("2026-02-08T12:20:05"),
	},
];

// Mock pending server approvals
const mockPendingServers: ServerApproval[] = [
	{
		id: "approval-1",
		server: {
			id: "server-5",
			name: "Gaming Hub",
			icon: "🎮",
			memberCount: 1547,
			description: "A community for gamers to hang out and play together",
		},
		status: "pending",
		requestedAt: new Date("2026-02-11T10:30:00"),
	},
	{
		id: "approval-2",
		server: {
			id: "server-6",
			name: "Study Group",
			icon: "📚",
			memberCount: 42,
			description: "High school students helping each other with homework",
		},
		status: "pending",
		requestedAt: new Date("2026-02-10T14:20:00"),
	},
];

// Mock pending friend approvals
const mockPendingFriends: FriendApproval[] = [
	{
		id: "friend-approval-1",
		friend: {
			id: "user-10",
			username: "mike_gamer",
			displayName: "Mike Chen",
			avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
		},
		status: "pending",
		requestedAt: new Date("2026-02-11T09:15:00"),
	},
	{
		id: "friend-approval-2",
		friend: {
			id: "user-11",
			username: "sarah_art",
			displayName: "Sarah Williams",
			avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
		},
		status: "pending",
		requestedAt: new Date("2026-02-10T16:45:00"),
	},
];

// Mock transparency log
const mockTransparencyLog: TransparencyLogEntry[] = [
	{
		id: "log-1",
		action: "changed_monitoring_level",
		details: "Monitoring level changed from Minimal to Moderate",
		timestamp: new Date("2026-02-10T08:00:00"),
		metadata: {
			oldLevel: 1,
			newLevel: 2,
		},
	},
	{
		id: "log-2",
		action: "viewed_messages",
		details: "Parent viewed messages in #random",
		timestamp: new Date("2026-02-09T19:30:00"),
		metadata: {
			channelId: "channel-3",
			channelName: "random",
			serverId: "server-1",
			serverName: "Bedrock Community",
		},
	},
	{
		id: "log-3",
		action: "viewed_friends",
		details: "Parent viewed friends list",
		timestamp: new Date("2026-02-08T14:15:00"),
	},
	{
		id: "log-4",
		action: "approved_server",
		details: "Parent approved server Tech Enthusiasts",
		timestamp: new Date("2026-02-07T10:20:00"),
		metadata: {
			serverId: "server-2",
			serverName: "Tech Enthusiasts",
		},
	},
	{
		id: "log-5",
		action: "denied_friend",
		details: "Parent denied friend request from unknown_user",
		timestamp: new Date("2026-02-06T16:45:00"),
		metadata: {
			friendId: "user-99",
			friendName: "unknown_user",
		},
	},
];

// Mock teen accounts
export const mockTeenAccount1: TeenAccount = {
	id: "teen-account-1",
	user: mockTeenUser1,
	parentId: mockParent.id,
	monitoringLevel: 2,
	activity: mockActivity1,
	contentFlags: mockContentFlags,
	pendingServers: mockPendingServers,
	pendingFriends: mockPendingFriends,
	transparencyLog: mockTransparencyLog,
	restrictions: {},
	createdAt: new Date("2026-01-20"),
	lastActivityAt: new Date("2026-02-11T14:30:00"),
};

export const mockTeenAccount2: TeenAccount = {
	id: "teen-account-2",
	user: mockTeenUser2,
	parentId: mockParent.id,
	monitoringLevel: 3,
	activity: mockActivity2,
	contentFlags: [],
	pendingServers: [],
	pendingFriends: [mockPendingFriends[0]],
	transparencyLog: [
		{
			id: "log-10",
			action: "changed_monitoring_level",
			details: "Monitoring level changed from Moderate to Supervised",
			timestamp: new Date("2026-02-05T12:00:00"),
			metadata: {
				oldLevel: 2,
				newLevel: 3,
			},
		},
	],
	restrictions: {},
	createdAt: new Date("2026-02-01"),
	lastActivityAt: new Date("2026-02-11T11:20:00"),
};

// Export all mock data
export const mockTeenAccounts = [mockTeenAccount1, mockTeenAccount2];

// Helper to generate initial mock data
export function generateMockFamilyData() {
	return {
		parent: mockParent,
		teenAccounts: mockTeenAccounts,
	};
}
