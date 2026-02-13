/**
 * Easter egg registry and detection system.
 * Client-side detection with unique IDs for server-side validation.
 *
 * Easter eggs are rewarded once per user per egg.
 * No FOMO: seasonal eggs rotate, but points are equal.
 */

import type { EasterEgg } from "./types/engagement";

// ── Easter Egg Registry ─────────────────────────────────────

export const EASTER_EGGS: EasterEgg[] = [
	{
		id: "konami-code",
		name: "The Konami Code",
		description: "You found the classic cheat code!",
		hint: "Up, up, down, down...",
		type: "interaction",
		points: 50,
		discoveredAt: null,
		isActive: true,
	},
	{
		id: "logo-click-7",
		name: "Persistent Clicker",
		description: "You clicked the logo 7 times. Why?",
		hint: "Sometimes persistence pays off with the logo.",
		type: "interaction",
		points: 25,
		discoveredAt: null,
		isActive: true,
	},
	{
		id: "dark-mode-toggle-10",
		name: "Indecisive",
		description: "Can't decide between dark and light mode?",
		hint: "Toggle your theme... a lot.",
		type: "interaction",
		points: 15,
		discoveredAt: null,
		isActive: true,
	},
	{
		id: "midnight-user",
		name: "Night Owl",
		description: "Chatting past midnight? We see you.",
		hint: "Some discoveries only happen after hours.",
		type: "interaction",
		points: 30,
		discoveredAt: null,
		isActive: true,
	},
	{
		id: "message-42",
		name: "The Answer",
		description: "The answer to life, the universe, and everything.",
		hint: "Douglas Adams knew the number.",
		type: "interaction",
		points: 42,
		discoveredAt: null,
		isActive: true,
	},
	{
		id: "first-emoji-react",
		name: "Reactor",
		description: "Your first emoji reaction! Express yourself.",
		hint: "React to something to discover this.",
		type: "interaction",
		points: 10,
		discoveredAt: null,
		isActive: true,
	},
	{
		id: "server-tour",
		name: "Grand Tourist",
		description: "Visited every channel in a server.",
		hint: "Explore every corner of a server.",
		type: "achievement_chain",
		points: 40,
		discoveredAt: null,
		isActive: true,
	},
	{
		id: "hidden-bedrock",
		name: "Bedrock Foundation",
		description: "You found the hidden bedrock layer.",
		hint: "Scroll to the very bottom of the server list.",
		type: "interaction",
		points: 100,
		discoveredAt: null,
		isActive: true,
	},
];

// ── Konami Code Detector ────────────────────────────────────

const KONAMI_SEQUENCE = [
	"ArrowUp",
	"ArrowUp",
	"ArrowDown",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"ArrowLeft",
	"ArrowRight",
	"b",
	"a",
];

export function createKonamiDetector(onDetected: () => void): {
	handleKeyDown: (e: KeyboardEvent) => void;
	reset: () => void;
} {
	let position = 0;

	return {
		handleKeyDown: (e: KeyboardEvent) => {
			if (e.key === KONAMI_SEQUENCE[position]) {
				position++;
				if (position === KONAMI_SEQUENCE.length) {
					position = 0;
					onDetected();
				}
			} else {
				position = 0;
			}
		},
		reset: () => {
			position = 0;
		},
	};
}

// ── Click Counter Detector ──────────────────────────────────

export function createClickCounter(
	targetClicks: number,
	timeWindowMs: number,
	onDetected: () => void,
): {
	handleClick: () => void;
	reset: () => void;
} {
	let clicks = 0;
	let timer: ReturnType<typeof setTimeout> | null = null;

	return {
		handleClick: () => {
			clicks++;
			if (timer) clearTimeout(timer);

			if (clicks >= targetClicks) {
				clicks = 0;
				onDetected();
			} else {
				timer = setTimeout(() => {
					clicks = 0;
				}, timeWindowMs);
			}
		},
		reset: () => {
			clicks = 0;
			if (timer) clearTimeout(timer);
		},
	};
}

// ── Time-Based Detector ─────────────────────────────────────

export function isMidnight(): boolean {
	const hour = new Date().getHours();
	return hour >= 0 && hour < 4;
}

// ── Helper ──────────────────────────────────────────────────

export function getEasterEggById(id: string): EasterEgg | undefined {
	return EASTER_EGGS.find((egg) => egg.id === id);
}

export function getActiveEasterEggs(): EasterEgg[] {
	return EASTER_EGGS.filter((egg) => egg.isActive);
}

export function getUndiscoveredEggs(
	discoveredIds: string[],
): EasterEgg[] {
	return EASTER_EGGS.filter(
		(egg) => egg.isActive && !discoveredIds.includes(egg.id),
	);
}
