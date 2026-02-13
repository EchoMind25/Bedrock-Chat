/**
 * Pre-built server themes. All WCAG 2.1 AA compliant.
 * Colors use OKLCH format for wider gamut and perceptual uniformity.
 */

import type { ServerTheme, ProfileTheme, StatusEffect } from "./types";

// ── Default Server Themes ──────────────────────────────────

export const NEON_STREET: ServerTheme = {
	id: "neon-street",
	name: "Neon Street",
	description: "Vibrant cyberpunk alley with neon glows and electric energy",
	colors: {
		primary: "oklch(0.65 0.25 310)", // Hot pink
		secondary: "oklch(0.55 0.25 265)", // Purple
		accent: "oklch(0.7 0.2 195)", // Cyan
		background: "oklch(0.1 0.03 285)", // Deep dark purple
		surface: "oklch(0.15 0.04 290 / 0.7)", // Glass purple
		text: "oklch(0.93 0.01 285)", // Near-white
		textMuted: "oklch(0.65 0.03 285)", // Soft lavender
		border: "oklch(0.3 0.06 310 / 0.4)", // Pink tint
		atmosphere: "oklch(0.4 0.15 310 / 0.08)", // Pink ambient
	},
	effects: {
		parallax: true,
		particles: true,
		glassBlur: true,
		glow: true,
	},
	layout: "spacious",
	environment: "neon",
	isDefault: true,
	isCustom: false,
	createdAt: new Date("2026-01-01"),
};

export const INDUSTRIAL_ZONE: ServerTheme = {
	id: "industrial-zone",
	name: "Industrial Zone",
	description: "Clean tech factory vibe with steel and orange accents",
	colors: {
		primary: "oklch(0.65 0.15 55)", // Steel orange
		secondary: "oklch(0.5 0.02 250)", // Blue-gray
		accent: "oklch(0.7 0.12 200)", // Steel blue
		background: "oklch(0.12 0.01 250)", // Dark charcoal
		surface: "oklch(0.17 0.01 250 / 0.8)", // Dark metal
		text: "oklch(0.9 0.005 250)", // Clean white
		textMuted: "oklch(0.6 0.01 250)", // Gray
		border: "oklch(0.28 0.01 250 / 0.5)", // Subtle gray
		atmosphere: "oklch(0.5 0.08 55 / 0.05)", // Warm ambient
	},
	effects: {
		parallax: false,
		particles: false,
		glassBlur: true,
		glow: false,
	},
	layout: "compact",
	environment: "industrial",
	isDefault: true,
	isCustom: false,
	createdAt: new Date("2026-01-01"),
};

export const ORGANIC_GARDEN: ServerTheme = {
	id: "organic-garden",
	name: "Organic Garden",
	description: "Nature-tech fusion with soft greens and earth tones",
	colors: {
		primary: "oklch(0.6 0.15 155)", // Forest green
		secondary: "oklch(0.55 0.08 85)", // Warm khaki
		accent: "oklch(0.65 0.12 175)", // Teal
		background: "oklch(0.11 0.015 155)", // Deep forest
		surface: "oklch(0.16 0.02 155 / 0.7)", // Green glass
		text: "oklch(0.92 0.01 155)", // Soft white
		textMuted: "oklch(0.6 0.03 155)", // Sage
		border: "oklch(0.3 0.04 155 / 0.3)", // Green tint
		atmosphere: "oklch(0.4 0.1 155 / 0.06)", // Green ambient
	},
	effects: {
		parallax: true,
		particles: false,
		glassBlur: true,
		glow: false,
	},
	layout: "spacious",
	environment: "organic",
	isDefault: true,
	isCustom: false,
	createdAt: new Date("2026-01-01"),
};

export const ABSTRACT_VOID: ServerTheme = {
	id: "abstract-void",
	name: "Abstract Void",
	description: "Deep space aesthetic with geometric minimalism",
	colors: {
		primary: "oklch(0.55 0.2 285)", // Deep purple
		secondary: "oklch(0.3 0.05 285)", // Very dark purple
		accent: "oklch(0.95 0.01 0)", // Pure white
		background: "oklch(0.06 0.02 285)", // Near-black
		surface: "oklch(0.1 0.02 285 / 0.8)", // Void glass
		text: "oklch(0.9 0.005 0)", // White
		textMuted: "oklch(0.55 0.02 285)", // Dim purple
		border: "oklch(0.2 0.03 285 / 0.4)", // Faint purple
		atmosphere: "oklch(0.3 0.1 285 / 0.04)", // Subtle purple
	},
	effects: {
		parallax: false,
		particles: false,
		glassBlur: true,
		glow: false,
	},
	layout: "minimal",
	environment: "abstract",
	isDefault: true,
	isCustom: false,
	createdAt: new Date("2026-01-01"),
};

export const DEFAULT_THEMES: ServerTheme[] = [
	NEON_STREET,
	INDUSTRIAL_ZONE,
	ORGANIC_GARDEN,
	ABSTRACT_VOID,
];

/**
 * Get a theme by ID. Returns undefined if not found.
 */
export function getDefaultTheme(id: string): ServerTheme | undefined {
	return DEFAULT_THEMES.find((t) => t.id === id);
}

/**
 * Create a blank custom theme template.
 */
export function createCustomThemeTemplate(serverId: string): ServerTheme {
	return {
		id: `custom-${serverId}`,
		name: "Custom Theme",
		description: "Your custom server environment",
		colors: { ...NEON_STREET.colors }, // Start from neon as base
		effects: {
			parallax: false,
			particles: false,
			glassBlur: true,
			glow: false,
		},
		layout: "spacious",
		environment: "neon",
		isDefault: false,
		isCustom: true,
		createdAt: new Date(),
	};
}

// ── Default Profile Themes ─────────────────────────────────

export const DEFAULT_PROFILE_THEMES: ProfileTheme[] = [
	{
		id: "default",
		name: "Default",
		cardBackground: "oklch(0.15 0.02 265 / 0.8)",
		cardBorder: "oklch(0.3 0.03 265 / 0.3)",
		avatarGlow: "oklch(0.65 0.25 265 / 0.3)",
		nameColor: "oklch(0.85 0.05 265)",
		isDefault: true,
		cost: 0,
	},
	{
		id: "aurora",
		name: "Aurora",
		cardBackground:
			"linear-gradient(135deg, oklch(0.15 0.05 155 / 0.8), oklch(0.12 0.04 265 / 0.8))",
		cardBorder: "oklch(0.4 0.1 155 / 0.3)",
		avatarGlow: "oklch(0.6 0.15 155 / 0.4)",
		nameColor: "oklch(0.8 0.1 155)",
		isDefault: false,
		cost: 100,
	},
	{
		id: "ember",
		name: "Ember",
		cardBackground:
			"linear-gradient(135deg, oklch(0.15 0.05 25 / 0.8), oklch(0.12 0.04 40 / 0.8))",
		cardBorder: "oklch(0.4 0.12 30 / 0.3)",
		avatarGlow: "oklch(0.6 0.2 30 / 0.4)",
		nameColor: "oklch(0.8 0.12 40)",
		isDefault: false,
		cost: 100,
	},
	{
		id: "frost",
		name: "Frost",
		cardBackground:
			"linear-gradient(135deg, oklch(0.15 0.03 210 / 0.8), oklch(0.12 0.02 230 / 0.8))",
		cardBorder: "oklch(0.4 0.08 210 / 0.3)",
		avatarGlow: "oklch(0.65 0.1 210 / 0.4)",
		nameColor: "oklch(0.85 0.06 210)",
		isDefault: false,
		cost: 100,
	},
	{
		id: "void",
		name: "Void",
		cardBackground:
			"linear-gradient(135deg, oklch(0.08 0.03 285 / 0.9), oklch(0.05 0.02 310 / 0.9))",
		cardBorder: "oklch(0.25 0.06 285 / 0.3)",
		avatarGlow: "oklch(0.5 0.2 285 / 0.3)",
		nameColor: "oklch(0.8 0.08 285)",
		isDefault: false,
		cost: 100,
	},
];

// ── Status Effects ─────────────────────────────────────────

export const STATUS_EFFECTS: Record<string, StatusEffect> = {
	online: {
		id: "online",
		name: "Online",
		animation: "none",
		color: "oklch(0.65 0.2 145)",
		cost: 0,
	},
	idle: {
		id: "idle",
		name: "Away",
		animation: "none",
		color: "oklch(0.7 0.18 85)",
		cost: 0,
	},
	dnd: {
		id: "dnd",
		name: "Do Not Disturb",
		animation: "none",
		color: "oklch(0.6 0.22 25)",
		cost: 0,
	},
	offline: {
		id: "offline",
		name: "Invisible",
		animation: "none",
		color: "oklch(0.45 0.02 265)",
		cost: 0,
	},
	// Premium animated statuses
	online_pulse: {
		id: "online_pulse",
		name: "Pulse (Online)",
		animation: "pulse",
		color: "oklch(0.65 0.2 145)",
		cost: 50,
	},
	online_breathe: {
		id: "online_breathe",
		name: "Breathe (Online)",
		animation: "breathe",
		color: "oklch(0.65 0.2 145)",
		cost: 50,
	},
	online_shimmer: {
		id: "online_shimmer",
		name: "Shimmer (Online)",
		animation: "shimmer",
		color: "oklch(0.65 0.2 145)",
		cost: 50,
	},
};
