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
import type { ServerThemeConfig } from "@/lib/types/server-theme";
import { mapDbServerTheme, toDbServerTheme } from "@/lib/types/server-theme";
import { createClient } from "@/lib/supabase/client";

// ── State Interface ────────────────────────────────────────

interface ThemeState {
	// Active theme (resolved from server + user preferences)
	activeTheme: ServerTheme;

	// Server-level themes (keyed by serverId)
	serverThemes: Record<string, string>; // serverId → themeId
	customThemes: ServerTheme[]; // User-created custom themes

	// DB-backed server theme configs (per-server branding)
	serverThemeConfigs: Map<string, ServerThemeConfig>;

	// Profile themes
	activeProfileThemeId: string;
	unlockedProfileThemeIds: string[];
	unlockedStatusEffectIds: string[];

	// User preferences
	preferences: UserThemePreferences;

	// Per-server theme acceptance decisions
	serverThemeDecisions: Record<string, "accepted" | "rejected">;

	// Actions: Server theme decisions
	setServerThemeDecision: (serverId: string, decision: "accepted" | "rejected") => void;
	hasServerThemeDecision: (serverId: string) => boolean;

	// Actions: Server themes
	setServerTheme: (serverId: string, themeId: string) => void;
	applyThemeForServer: (serverId: string) => void;
	saveCustomTheme: (theme: ServerTheme) => void;
	deleteCustomTheme: (themeId: string) => void;

	// Actions: DB-backed server theme configs
	loadServerThemeConfig: (serverId: string) => Promise<ServerThemeConfig | null>;
	saveServerThemeConfig: (serverId: string, config: Partial<ServerThemeConfig>) => Promise<void>;
	getServerThemeConfig: (serverId: string) => ServerThemeConfig | undefined;

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
				serverThemeConfigs: new Map(),
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
				serverThemeDecisions: {},

				// ── Server Theme Decision Actions ──────

				setServerThemeDecision: (serverId, decision) => {
					set((s) => ({
						serverThemeDecisions: {
							...s.serverThemeDecisions,
							[serverId]: decision,
						},
					}));

					// If rejected, switch to force_personal for this server
					if (decision === "rejected") {
						const state = get();
						const personalId = state.preferences.personalThemeId;
						if (personalId) {
							const personal = state.getThemeById(personalId);
							if (personal) {
								set({ activeTheme: personal });
								return;
							}
						}
						// Fallback: apply default theme
						set({ activeTheme: NEON_STREET });
					}
				},

				hasServerThemeDecision: (serverId) => {
					return serverId in get().serverThemeDecisions;
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

				// ── DB-Backed Server Theme Config ─────

				loadServerThemeConfig: async (serverId) => {
					// Check cache first
					const cached = get().serverThemeConfigs.get(serverId);
					if (cached) return cached;

					try {
						const supabase = createClient();
						const { data, error } = await supabase
							.from("server_themes")
							.select("*")
							.eq("server_id", serverId)
							.single();

						if (error || !data) return null;

						const config = mapDbServerTheme(data as Record<string, unknown>);
						set((s) => {
							const configs = new Map(s.serverThemeConfigs);
							configs.set(serverId, config);
							return { serverThemeConfigs: configs };
						});
						return config;
					} catch {
						return null;
					}
				},

				saveServerThemeConfig: async (serverId, config) => {
					const supabase = createClient();
					const dbData = toDbServerTheme(config);

					// Use upsert so a row is created if none exists for this server
					const { error } = await supabase
						.from("server_themes")
						.upsert(
							{ server_id: serverId, ...dbData },
							{ onConflict: "server_id" },
						);

					if (error) throw error;

					// Update cache
					const existing = get().serverThemeConfigs.get(serverId);
					const updated = {
						...(existing || {} as ServerThemeConfig),
						...config,
						serverId,
						colors: config.colors
							? { ...(existing?.colors || {}), ...config.colors }
							: existing?.colors,
						effects: config.effects
							? { ...(existing?.effects || {}), ...config.effects }
							: existing?.effects,
						updatedAt: new Date(),
					} as ServerThemeConfig;
					set((s) => {
						const configs = new Map(s.serverThemeConfigs);
						configs.set(serverId, updated);
						return { serverThemeConfigs: configs };
					});
				},

				getServerThemeConfig: (serverId) => {
					return get().serverThemeConfigs.get(serverId);
				},

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
					serverThemeDecisions: state.serverThemeDecisions,
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
