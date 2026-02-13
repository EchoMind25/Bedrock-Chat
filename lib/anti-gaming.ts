/**
 * Anti-gaming measures for the points system.
 * Prevents exploitation while keeping legitimate users rewarded.
 *
 * No false positives: Only obvious spam is blocked.
 * Transparent: Users can see caps and limits in the UI.
 */

import { DAILY_CAPS } from "./points-system";

// ── Message Rate Limiter ────────────────────────────────────

interface RateLimiterState {
	lastMessageTime: number;
	messageCount: number;
	windowStart: number;
}

const DEFAULT_STATE: RateLimiterState = {
	lastMessageTime: 0,
	messageCount: 0,
	windowStart: 0,
};

let rateLimiterState: RateLimiterState = { ...DEFAULT_STATE };

/**
 * Check if a message should earn points.
 * Returns false if the message is too rapid (< 2s since last)
 * or if the daily message cap has been reached.
 */
export function shouldRewardMessage(dailyMessagesRewarded: number): boolean {
	const now = Date.now();

	// Check daily cap
	if (dailyMessagesRewarded >= DAILY_CAPS.messagePoints) {
		return false;
	}

	// Check rate limit (minimum 2s between rewarded messages)
	if (now - rateLimiterState.lastMessageTime < DAILY_CAPS.minMessageInterval) {
		return false;
	}

	// Check burst detection (no more than 10 messages in 30 seconds)
	const BURST_WINDOW = 30_000;
	const BURST_LIMIT = 10;

	if (now - rateLimiterState.windowStart > BURST_WINDOW) {
		rateLimiterState.windowStart = now;
		rateLimiterState.messageCount = 0;
	}

	rateLimiterState.messageCount++;

	if (rateLimiterState.messageCount > BURST_LIMIT) {
		return false;
	}

	rateLimiterState.lastMessageTime = now;
	return true;
}

/**
 * Reset the rate limiter (for testing or new sessions).
 */
export function resetRateLimiter(): void {
	rateLimiterState = { ...DEFAULT_STATE };
}

// ── Voice Call Validator ────────────────────────────────────

/**
 * Calculate points earned from a voice call.
 * Must be at least 10 minutes to earn any points.
 * 5 points per 10-minute block.
 */
export function calculateVoicePoints(durationMinutes: number): number {
	if (durationMinutes < DAILY_CAPS.minVoiceCallMinutes) {
		return 0;
	}
	// 5 points per 10-minute block, rounded down
	return Math.floor(durationMinutes / 10) * 5;
}

// ── Daily Cap Checker ───────────────────────────────────────

/**
 * Calculate how many points can actually be awarded given the daily cap.
 * Returns the adjusted amount (may be less than requested).
 */
export function applyDailyCap(
	requestedPoints: number,
	currentDailyTotal: number,
): number {
	const remaining = DAILY_CAPS.totalPoints - currentDailyTotal;
	if (remaining <= 0) return 0;
	return Math.min(requestedPoints, remaining);
}

// ── Spam Content Detector ───────────────────────────────────

/**
 * Basic check for spammy message content.
 * Returns true if the message appears to be spam.
 */
export function isSpamMessage(content: string): boolean {
	// Empty or whitespace-only
	if (!content.trim()) return true;

	// Single character repeated (e.g., "aaaaaaa")
	if (content.length > 5 && new Set(content.replace(/\s/g, "")).size <= 1) {
		return true;
	}

	// Extremely short (single char)
	if (content.trim().length === 1) return true;

	return false;
}
