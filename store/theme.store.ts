import { create } from "zustand";
import { persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import {
	DEFAULT_THEMES,
	NEON_STREET,
	DEFAULT_PROFILE_THEMES,
} from "@/lib/themes/default-themes";
import {
	cacheTheme,
	getCachedTheme,
	setActiveTheme,
	getActiveTheme,
} from "@/lib/themes/theme-storage";
import { validateTheme } from "@/lib/themes/theme-validator";
import type {
	ServerTheme,
	ProfileTheme,
	UserThemePreferences,
	ThemeOverrideMode,
	ThemeColors,
	ThemeEffects,
	ThemeLayout,
} from "@/lib/themes/types";

// ── State Interface ────────────────────────────────────────

interface ThemeState {
	// Active theme (resolved from server + user preferences)
	activeTheme: ServerTheme;

	// Server-level themes (keyed by serverId)
	serverThemes: Record<string, string>; // serverId → themeId
	customThemes: ServerTheme[]; // User-created custom themes

	// Profile themes
	activeProfileThemeId: string;
	unlockedProfileThemeIds: string[];
	unlockedStatusEffectIds: string[];

	// User preferences
	preferences: UserThemePreferences;

	// Actions: Server themes
	setServerTheme: (serverId: string, themeId: string) => void;
	applyThemeForServer: (serverId: string) => void;
	saveCustomTheme: (theme: ServerTheme) => void;
	deleteCustomTheme: (themeId: string) => void;

	// Actions: Customization
	updateActiveColors: (colors: Partial<ThemeColors>) => void;
	updateActiveEffects: (effects: Partial<ThemeEffects>) => void;
	updateActiveLayout: (layout: ThemeLayout) => void;

	// Actions: Profile
	setProfileTheme: (themeId: string) => void;
	unlockProfileTheme: (themeId: string) => void;
	unlockStatusEffect: (effectId: string) => void;

	// Actions: User preferences
	setOverrideMode: (mode: ThemeOverrideMode) => void;
	setHighContrast: (enabled: boolean) => void;
	setReducedMotion: (enabled: boolean) => void;
	setLargerText: (enabled: boolean) => void;
	setMessageDensity: (density: "compact" | "cozy" | "spacious") => void;
	setFontSize: (size: "small" | "medium" | "large") => void;
	setShowAvatars: (show: boolean) => void;
	setShowTimestamps: (show: boolean) => void;

	// Helpers
	getThemeById: (themeId: string) => ServerTheme | undefined;
	getAllThemes: () => ServerTheme[];
	getProfileTheme: () => ProfileTheme;
	isThemeValid: (colors: ThemeColors) => boolean;
}

// ── Store ──────────────────────────────────────────────────

export const useThemeStore = create<ThemeState>()(
	conditionalDevtools(
		persist(
			(set, get) => ({
				activeTheme: NEON_STREET,
				serverThemes: {},
				customThemes: [],
				activeProfileThemeId: "default",
				unlockedProfileThemeIds: ["default"],
				unlockedStatusEffectIds: [
					"online",
					"idle",
					"dnd",
					"offline",
				],
				preferences: {
					overrideMode: "use_server",
					personalThemeId: null,
					highContrast: false,
					reducedMotion: false,
					largerText: false,
					messageDensity: "cozy",
					fontSize: "medium",
					showAvatars: true,
					showTimestamps: true,
				},

				// ── Server Theme Actions ───────────────

				setServerTheme: (serverId, themeId) => {
					set((s) => ({
						serverThemes: {
							...s.serverThemes,
							[serverId]: themeId,
						},
					}));

					// Cache in IndexedDB
					const theme = get().getThemeById(themeId);
					if (theme) {
						cacheTheme(serverId, theme);
						setActiveTheme(serverId, theme);
					}
				},

				applyThemeForServer: (serverId) => {
					const state = get();

					// Check user override preference
					if (state.preferences.overrideMode === "force_personal") {
						const personalId = state.preferences.personalThemeId;
						if (personalId) {
							const personal = state.getThemeById(personalId);
							if (personal) {
								set({ activeTheme: personal });
								return;
							}
						}
					}

					if (state.preferences.overrideMode === "simple_mode") {
						// Apply minimal effects version of the theme
						const base =
							state.getThemeById(
								state.serverThemes[serverId] ?? "neon-street",
							) ?? NEON_STREET;
						set({
							activeTheme: {
								...base,
								effects: {
									parallax: false,
									particles: false,
									glassBlur: true,
									glow: false,
								},
							},
						});
						return;
					}

					// Use server theme
					const themeId =
						state.serverThemes[serverId] ?? "neon-street";

					// Check in-memory LRU first
					const cached = getActiveTheme(serverId);
					if (cached) {
						set({ activeTheme: cached });
						return;
					}

					// Check store themes
					const theme = state.getThemeById(themeId);
					if (theme) {
						set({ activeTheme: theme });
						setActiveTheme(serverId, theme);
						return;
					}

					// Fallback
					set({ activeTheme: NEON_STREET });
				},

				saveCustomTheme: (theme) => {
					set((s) => {
						const existing = s.customThemes.findIndex(
							(t) => t.id === theme.id,
						);
						const updated = [...s.customThemes];
						if (existing >= 0) {
							updated[existing] = theme;
						} else {
							updated.push(theme);
						}
						return { customThemes: updated, activeTheme: theme };
					});
				},

				deleteCustomTheme: (themeId) => {
					set((s) => ({
						customThemes: s.customThemes.filter(
							(t) => t.id !== themeId,
						),
					}));
				},

				// ── Customization Actions ──────────────

				updateActiveColors: (colors) => {
					set((s) => ({
						activeTheme: {
							...s.activeTheme,
							colors: { ...s.activeTheme.colors, ...colors },
						},
					}));
				},

				updateActiveEffects: (effects) => {
					set((s) => ({
						activeTheme: {
							...s.activeTheme,
							effects: {
								...s.activeTheme.effects,
								...effects,
							},
						},
					}));
				},

				updateActiveLayout: (layout) => {
					set((s) => ({
						activeTheme: { ...s.activeTheme, layout },
					}));
				},

				// ── Profile Actions ────────────────────

				setProfileTheme: (themeId) => {
					const state = get();
					if (state.unlockedProfileThemeIds.includes(themeId)) {
						set({ activeProfileThemeId: themeId });
					}
				},

				unlockProfileTheme: (themeId) => {
					set((s) => ({
						unlockedProfileThemeIds: [
							...new Set([
								...s.unlockedProfileThemeIds,
								themeId,
							]),
						],
					}));
				},

				unlockStatusEffect: (effectId) => {
					set((s) => ({
						unlockedStatusEffectIds: [
							...new Set([
								...s.unlockedStatusEffectIds,
								effectId,
							]),
						],
					}));
				},

				// ── User Preference Actions ────────────

				setOverrideMode: (mode) =>
					set((s) => ({
						preferences: { ...s.preferences, overrideMode: mode },
					})),

				setHighContrast: (enabled) =>
					set((s) => ({
						preferences: {
							...s.preferences,
							highContrast: enabled,
						},
					})),

				setReducedMotion: (enabled) =>
					set((s) => ({
						preferences: {
							...s.preferences,
							reducedMotion: enabled,
						},
					})),

				setLargerText: (enabled) =>
					set((s) => ({
						preferences: {
							...s.preferences,
							largerText: enabled,
						},
					})),

				setMessageDensity: (density) =>
					set((s) => ({
						preferences: {
							...s.preferences,
							messageDensity: density,
						},
					})),

				setFontSize: (size) =>
					set((s) => ({
						preferences: { ...s.preferences, fontSize: size },
					})),

				setShowAvatars: (show) =>
					set((s) => ({
						preferences: {
							...s.preferences,
							showAvatars: show,
						},
					})),

				setShowTimestamps: (show) =>
					set((s) => ({
						preferences: {
							...s.preferences,
							showTimestamps: show,
						},
					})),

				// ── Helpers ────────────────────────────

				getThemeById: (themeId) => {
					const state = get();
					return (
						DEFAULT_THEMES.find((t) => t.id === themeId) ??
						state.customThemes.find((t) => t.id === themeId)
					);
				},

				getAllThemes: () => {
					const state = get();
					return [...DEFAULT_THEMES, ...state.customThemes];
				},

				getProfileTheme: () => {
					const state = get();
					return (
						DEFAULT_PROFILE_THEMES.find(
							(t) => t.id === state.activeProfileThemeId,
						) ?? DEFAULT_PROFILE_THEMES[0]
					);
				},

				isThemeValid: (colors) => {
					return validateTheme(colors).isValid;
				},
			}),
			{
				name: "bedrock-theme",
				partialize: (state) => ({
					serverThemes: state.serverThemes,
					customThemes: state.customThemes,
					activeProfileThemeId: state.activeProfileThemeId,
					unlockedProfileThemeIds: state.unlockedProfileThemeIds,
					unlockedStatusEffectIds: state.unlockedStatusEffectIds,
					preferences: state.preferences,
				}),
			},
		),
		{ name: "ThemeStore" },
	),
);
