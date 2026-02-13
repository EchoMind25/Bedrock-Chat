/**
 * Types for the points and engagement system.
 * Privacy-first, COPPA-compliant, no dark patterns.
 */

// ── Point Transactions ──────────────────────────────────────

export type PointAction =
	| "message_sent"
	| "voice_call"
	| "server_created"
	| "friend_invited"
	| "daily_login"
	| "login_streak_bonus"
	| "server_joined"
	| "server_browsed"
	| "profile_completed"
	| "easter_egg"
	| "achievement_unlocked"
	| "points_spent";

export interface PointTransaction {
	id: string;
	action: PointAction;
	points: number; // Positive for earning, negative for spending
	timestamp: Date;
	metadata?: Record<string, string>; // e.g. { serverId, easterEggId }
}

// ── Achievements ────────────────────────────────────────────

export type AchievementCategory =
	| "social"
	| "explorer"
	| "creator"
	| "streak"
	| "easter_egg";

export interface Achievement {
	id: string;
	name: string;
	description: string;
	icon: string; // Lucide icon name or emoji
	category: AchievementCategory;
	points: number; // Points awarded on unlock
	requirement: number; // Value needed to unlock
	progress: number; // Current progress (0 to requirement)
	unlockedAt: Date | null;
}

// ── Easter Eggs ─────────────────────────────────────────────

export type EasterEggType =
	| "interaction" // Hidden UI interactions (click logo 7x, konami)
	| "seasonal" // Holiday-themed events
	| "achievement_chain" // Complete X to unlock Y
	| "community"; // Shared discoveries

export interface EasterEgg {
	id: string;
	name: string;
	description: string; // Shown after discovery
	hint: string; // Subtle hint for undiscovered
	type: EasterEggType;
	points: number;
	discoveredAt: Date | null;
	isActive: boolean; // Seasonal eggs can be inactive
}

// ── Activity Feed ───────────────────────────────────────────

export type ActivityType =
	| "points_earned"
	| "achievement_unlocked"
	| "easter_egg_found"
	| "milestone_reached"
	| "streak_extended"
	| "server_joined"
	| "item_purchased";

export interface ActivityEntry {
	id: string;
	type: ActivityType;
	title: string;
	description: string;
	points?: number;
	timestamp: Date;
	icon?: string;
}

// ── Spendable Items ─────────────────────────────────────────

export type ShopCategory =
	| "profile"
	| "server"
	| "future";

export interface ShopItem {
	id: string;
	name: string;
	description: string;
	category: ShopCategory;
	cost: number;
	icon: string;
	isOneTime: boolean; // Can only purchase once
	isPurchased: boolean;
	isAvailable: boolean; // false for "coming soon"
}

// ── Server Discovery ────────────────────────────────────────

export type ServerActivityLevel = "live" | "moderate" | "quiet";

export type ServerCategory =
	| "gaming"
	| "study"
	| "hobbies"
	| "tech"
	| "music"
	| "art"
	| "social"
	| "other";

export interface DiscoverableServer {
	id: string;
	name: string;
	description: string;
	icon: string | null;
	memberCount: number;
	activityLevel: ServerActivityLevel;
	category: ServerCategory;
	tags: string[];
	themeColor?: string; // OKLCH
	isJoined: boolean;
	createdAt: Date;
}

// ── Presence Trail ──────────────────────────────────────────

export interface PresenceTrailConfig {
	enabled: boolean;
	color: string; // OKLCH or hex
	intensity: number; // 0-1 (subtle to vibrant)
	idleTimeout: number; // Seconds before auto-disable (default 30)
}

// ── Streak ──────────────────────────────────────────────────

export interface LoginStreak {
	currentStreak: number; // Days in a row
	longestStreak: number;
	lastLoginDate: string; // YYYY-MM-DD format
	todayCollected: boolean;
}

// ── Daily Caps ──────────────────────────────────────────────

export interface DailyCaps {
	date: string; // YYYY-MM-DD
	pointsEarned: number;
	messagesRewarded: number;
	browsingRewarded: boolean;
}

// ── Milestones ──────────────────────────────────────────────

export const MILESTONES = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000] as const;

export type Milestone = (typeof MILESTONES)[number];
