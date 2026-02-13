/**
 * Types for the server customization and theme system.
 * All colors use OKLCH format for wide gamut support.
 */

// ── Server Theme ───────────────────────────────────────────

export type ThemeEnvironment = "neon" | "industrial" | "organic" | "abstract";
export type ThemeLayout = "compact" | "spacious" | "minimal";

export interface ThemeColors {
	primary: string; // Main accent (OKLCH)
	secondary: string; // Supporting accent
	accent: string; // Highlights, links, buttons
	background: string; // Channel area background
	surface: string; // Cards, panels
	text: string; // Primary text
	textMuted: string; // Secondary text
	border: string; // Dividers, borders
	atmosphere: string; // Ambient overlay color
}

export interface ThemeEffects {
	parallax: boolean;
	particles: boolean;
	glassBlur: boolean;
	glow: boolean;
}

export interface ServerTheme {
	id: string;
	name: string;
	description: string;
	colors: ThemeColors;
	effects: ThemeEffects;
	layout: ThemeLayout;
	environment: ThemeEnvironment;
	isDefault: boolean; // Built-in theme (not editable)
	isCustom: boolean; // User-created (requires points unlock)
	createdAt: Date;
}

// ── Profile Theme ──────────────────────────────────────────

export interface ProfileTheme {
	id: string;
	name: string;
	cardBackground: string; // Gradient or solid (OKLCH)
	cardBorder: string; // Border color
	avatarGlow: string; // Glow color around avatar
	nameColor: string; // Display name color
	isDefault: boolean;
	cost: number; // Points cost (0 for defaults)
}

export interface StatusEffect {
	id: string;
	name: string;
	animation: "pulse" | "breathe" | "shimmer" | "none";
	color: string; // OKLCH
	cost: number; // Points (0 for default, 50 for custom)
}

// ── User Theme Preferences ─────────────────────────────────

export type ThemeOverrideMode =
	| "use_server" // Default: respect server theme
	| "force_personal" // Apply personal theme everywhere
	| "simple_mode"; // Minimal effects for performance

export interface UserThemePreferences {
	overrideMode: ThemeOverrideMode;
	personalThemeId: string | null; // Selected default theme for "force" mode
	highContrast: boolean;
	reducedMotion: boolean;
	largerText: boolean;
	messageDensity: "compact" | "cozy" | "spacious";
	fontSize: "small" | "medium" | "large";
	showAvatars: boolean;
	showTimestamps: boolean;
}

// ── AI Designer (Coming Soon) ──────────────────────────────

export type AIDesignStyle =
	| "neon"
	| "industrial"
	| "organic"
	| "abstract"
	| "custom";

export type AIDesignIntensity = "subtle" | "moderate" | "vibrant";

export interface AIDesignRequest {
	prompt: string;
	style: AIDesignStyle;
	preferences: {
		colorPalette: string[];
		intensity: AIDesignIntensity;
		effects: string[];
	};
}

export interface AIDesignResponse {
	theme: ServerTheme;
	reasoning: string;
	alternatives: ServerTheme[];
}

// ── CSS Variable Map ───────────────────────────────────────

export const THEME_CSS_VARS = {
	primary: "--server-primary",
	secondary: "--server-secondary",
	accent: "--server-accent",
	background: "--server-bg",
	surface: "--server-surface",
	text: "--server-text",
	textMuted: "--server-text-muted",
	border: "--server-border",
	atmosphere: "--server-atmosphere",
} as const;
