/**
 * Points system configuration and calculation logic.
 * All point values, caps, and reward rules are defined here.
 *
 * Privacy-first: No dark patterns, no FOMO, no predatory mechanics.
 * COPPA-compliant: Transparent economy, no purchase pressure.
 */

import type {
	PointAction,
	ShopItem,
	Achievement,
	AchievementCategory,
} from "./types/engagement";

// ── Point Values ────────────────────────────────────────────

export const POINT_VALUES: Record<
	Exclude<PointAction, "points_spent">,
	number
> = {
	message_sent: 1,
	voice_call: 5, // Per 10 minutes
	server_created: 50,
	friend_invited: 25, // Friend must actually join
	daily_login: 10,
	login_streak_bonus: 50, // 7-day streak bonus
	server_joined: 15,
	server_browsed: 5, // Max 1 per day
	profile_completed: 30, // One-time
	easter_egg: 0, // Variable, defined per egg
	achievement_unlocked: 0, // Variable, defined per achievement
} as const;

// ── Daily Caps ──────────────────────────────────────────────

export const DAILY_CAPS = {
	totalPoints: 500,
	messagePoints: 100, // Max 100 messages rewarded per day
	browsingSessionsPerDay: 1,
	minMessageInterval: 2000, // 2 seconds between rewarded messages
	minVoiceCallMinutes: 10, // Must be >10 min to earn
} as const;

// ── Streak Configuration ────────────────────────────────────

export const STREAK_CONFIG = {
	maxStreak: 7, // Caps at 7 days (70 points/week + 50 bonus)
	streakBonusDays: 7, // Bonus awarded every 7 days
	streakBonusPoints: 50,
} as const;

// ── Shop Items ──────────────────────────────────────────────

export const SHOP_ITEMS: ShopItem[] = [
	// Profile Customization
	{
		id: "status-animation",
		name: "Status Animations",
		description: "Add animated effects to your status indicator",
		category: "profile",
		cost: 50,
		icon: "sparkles",
		isOneTime: true,
		isPurchased: false,
		isAvailable: true,
	},
	{
		id: "profile-theme",
		name: "Profile Theme",
		description: "Customize your profile card with unique color schemes",
		category: "profile",
		cost: 100,
		icon: "palette",
		isOneTime: true,
		isPurchased: false,
		isAvailable: true,
	},
	{
		id: "presence-trail",
		name: "Presence Trail",
		description: "Leave a particle trail as you navigate servers",
		category: "profile",
		cost: 150,
		icon: "wind",
		isOneTime: true,
		isPurchased: false,
		isAvailable: true,
	},

	// Server Features
	{
		id: "custom-server-env",
		name: "Custom Server Environment",
		description: "Unlock unique visual themes for your server",
		category: "server",
		cost: 500,
		icon: "layout-grid",
		isOneTime: true,
		isPurchased: false,
		isAvailable: true,
	},
	{
		id: "advanced-moderation",
		name: "Advanced Moderation Tools",
		description: "AutoMod rules, keyword filters, and raid protection",
		category: "server",
		cost: 300,
		icon: "shield",
		isOneTime: true,
		isPurchased: false,
		isAvailable: true,
	},
	{
		id: "server-analytics",
		name: "Server Analytics",
		description: "Member growth, activity trends, and engagement metrics",
		category: "server",
		cost: 200,
		icon: "bar-chart-3",
		isOneTime: true,
		isPurchased: false,
		isAvailable: true,
	},

	// Future Items
	{
		id: "api-credits",
		name: "Claude Opus API Credits",
		description: "Use AI-powered features within Bedrock Chat",
		category: "future",
		cost: 0,
		icon: "brain",
		isOneTime: false,
		isPurchased: false,
		isAvailable: false,
	},
	{
		id: "feature-requests",
		name: "Feature Request Priority",
		description: "Boost your feature requests for faster consideration",
		category: "future",
		cost: 0,
		icon: "rocket",
		isOneTime: false,
		isPurchased: false,
		isAvailable: false,
	},
	{
		id: "priority-support",
		name: "Priority Support",
		description: "Get faster response times from the support team",
		category: "future",
		cost: 0,
		icon: "headphones",
		isOneTime: false,
		isPurchased: false,
		isAvailable: false,
	},
];

// ── Achievements ────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
	// Social
	{
		id: "first-message",
		name: "First Words",
		description: "Send your first message",
		icon: "message-circle",
		category: "social",
		points: 50,
		requirement: 1,
		progress: 0,
		unlockedAt: null,
	},
	{
		id: "chatterbox",
		name: "Chatterbox",
		description: "Send 100 messages",
		icon: "messages-square",
		category: "social",
		points: 100,
		requirement: 100,
		progress: 0,
		unlockedAt: null,
	},
	{
		id: "social-butterfly",
		name: "Social Butterfly",
		description: "Add 5 friends",
		icon: "users",
		category: "social",
		points: 75,
		requirement: 5,
		progress: 0,
		unlockedAt: null,
	},
	{
		id: "voice-debut",
		name: "Voice Debut",
		description: "Join your first voice call",
		icon: "mic",
		category: "social",
		points: 50,
		requirement: 1,
		progress: 0,
		unlockedAt: null,
	},

	// Explorer
	{
		id: "server-hopper",
		name: "Server Hopper",
		description: "Join 3 different servers",
		icon: "compass",
		category: "explorer",
		points: 75,
		requirement: 3,
		progress: 0,
		unlockedAt: null,
	},
	{
		id: "world-traveler",
		name: "World Traveler",
		description: "Join 10 different servers",
		icon: "globe",
		category: "explorer",
		points: 150,
		requirement: 10,
		progress: 0,
		unlockedAt: null,
	},
	{
		id: "browser",
		name: "Window Shopper",
		description: "Browse the server discovery 5 times",
		icon: "search",
		category: "explorer",
		points: 50,
		requirement: 5,
		progress: 0,
		unlockedAt: null,
	},

	// Creator
	{
		id: "founder",
		name: "Founder",
		description: "Create your first server",
		icon: "plus-circle",
		category: "creator",
		points: 100,
		requirement: 1,
		progress: 0,
		unlockedAt: null,
	},
	{
		id: "community-builder",
		name: "Community Builder",
		description: "Have 10 members in your server",
		icon: "building",
		category: "creator",
		points: 200,
		requirement: 10,
		progress: 0,
		unlockedAt: null,
	},

	// Streak
	{
		id: "consistent",
		name: "Consistent",
		description: "Maintain a 3-day login streak",
		icon: "flame",
		category: "streak",
		points: 50,
		requirement: 3,
		progress: 0,
		unlockedAt: null,
	},
	{
		id: "dedicated",
		name: "Dedicated",
		description: "Maintain a 7-day login streak",
		icon: "zap",
		category: "streak",
		points: 100,
		requirement: 7,
		progress: 0,
		unlockedAt: null,
	},
	{
		id: "unstoppable",
		name: "Unstoppable",
		description: "Maintain a 30-day login streak",
		icon: "trophy",
		category: "streak",
		points: 200,
		requirement: 30,
		progress: 0,
		unlockedAt: null,
	},

	// Easter Egg
	{
		id: "egg-hunter",
		name: "Egg Hunter",
		description: "Find your first easter egg",
		icon: "egg",
		category: "easter_egg",
		points: 50,
		requirement: 1,
		progress: 0,
		unlockedAt: null,
	},
	{
		id: "treasure-hunter",
		name: "Treasure Hunter",
		description: "Find 5 easter eggs",
		icon: "gem",
		category: "easter_egg",
		points: 150,
		requirement: 5,
		progress: 0,
		unlockedAt: null,
	},
];

// ── Helper Functions ────────────────────────────────────────

/** Get today's date as YYYY-MM-DD string */
export function getToday(): string {
	return new Date().toISOString().split("T")[0];
}

/** Check if a date string is today */
export function isToday(dateStr: string): boolean {
	return dateStr === getToday();
}

/** Check if a date string is yesterday */
export function isYesterday(dateStr: string): boolean {
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	return dateStr === yesterday.toISOString().split("T")[0];
}

/** Calculate points for a login streak */
export function calculateStreakPoints(currentStreak: number): number {
	const dailyPoints = POINT_VALUES.daily_login;
	const bonusPoints =
		currentStreak > 0 && currentStreak % STREAK_CONFIG.streakBonusDays === 0
			? STREAK_CONFIG.streakBonusPoints
			: 0;
	return dailyPoints + bonusPoints;
}

/** Check if daily cap has been reached */
export function isDailyCapped(pointsEarned: number): boolean {
	return pointsEarned >= DAILY_CAPS.totalPoints;
}

/** Get the next milestone for a given total */
export function getNextMilestone(
	total: number,
): number | null {
	const milestones = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000];
	return milestones.find((m) => m > total) ?? null;
}

/** Get achievement category color (OKLCH) */
export function getCategoryColor(category: AchievementCategory): string {
	const colors: Record<AchievementCategory, string> = {
		social: "oklch(0.65 0.15 285)", // Blue
		explorer: "oklch(0.65 0.2 145)", // Green
		creator: "oklch(0.65 0.25 265)", // Purple
		streak: "oklch(0.65 0.2 40)", // Orange
		easter_egg: "oklch(0.65 0.15 85)", // Yellow
	};
	return colors[category];
}
