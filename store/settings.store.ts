import { create } from "zustand";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import { createClient } from "@/lib/supabase/client";
import { logError } from "@/lib/utils/error-logger";

// ── localStorage fallback ─────────────────────────────────
// When DB columns don't exist yet (migration not applied),
// settings are persisted to localStorage so they survive refreshes.

const LS_KEY = "bedrock-settings-fallback";

function loadLocalFallback(): Record<string, unknown> {
	try {
		const raw = localStorage.getItem(LS_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

function saveLocalFallback(updates: Record<string, unknown>) {
	try {
		const existing = loadLocalFallback();
		localStorage.setItem(LS_KEY, JSON.stringify({ ...existing, ...updates }));
	} catch {
		// localStorage full or unavailable — silently ignore
	}
}

function clearLocalFallback() {
	try {
		localStorage.removeItem(LS_KEY);
	} catch {
		// ignore
	}
}

// ── Types ──────────────────────────────────────────────────

export interface UserSettings {
	user_id: string;

	// Theme
	theme: "dark" | "light" | "system";
	accent_color: string;

	// Typography
	message_font_size: "small" | "medium" | "large";
	font_family: "system" | "inter" | "sf-pro" | "jetbrains-mono" | "merriweather" | "opendyslexic";
	ui_font_size: "small" | "medium" | "large";
	line_height: "tight" | "normal" | "relaxed";

	// Chat visuals
	message_style: "flat" | "bubble" | "minimal";
	message_density: "compact" | "default" | "spacious";
	compact_mode: boolean;
	chat_background: string | null;
	timestamp_format: "relative" | "12h" | "24h" | "full";
	bubble_color_sent: string;
	bubble_color_received: string;

	// Display
	show_avatars: boolean;
	show_timestamps: boolean;
	show_online_status: boolean;
	larger_text: boolean;

	// Accessibility
	high_contrast: boolean;
	reduced_motion: boolean;
	animations_enabled: boolean;
	animation_speed: number;
	screen_reader_mode: boolean;
	color_blind_mode: "none" | "protanopia" | "deuteranopia" | "tritanopia";
	dyslexia_font: boolean;
	focus_indicator: "default" | "high-visibility" | "outline-only";

	// Privacy
	allow_dms: "everyone" | "friends" | "none";
	read_receipts: boolean;
	typing_indicators: boolean;

	// Notifications
	notifications_enabled: boolean;
	desktop_notifications: boolean;
	sound_enabled: boolean;
	notification_sound: string;
	mention_notifications: boolean;
	dm_notifications: boolean;

	// Voice
	input_device: string | null;
	output_device: string | null;
	input_volume: number;
	output_volume: number;
	noise_suppression: boolean;
	echo_cancellation: boolean;

	// Advanced
	developer_mode: boolean;

	// Theme sharing
	custom_theme_json: Record<string, unknown> | null;

	// Adaptive
	adaptive_theme: boolean;
}

export type SettingsUpdate = Partial<Omit<UserSettings, "user_id">>;

const DEFAULT_SETTINGS: Omit<UserSettings, "user_id"> = {
	theme: "dark",
	accent_color: "oklch(0.65 0.25 265)",
	message_font_size: "medium",
	font_family: "system",
	ui_font_size: "medium",
	line_height: "normal",
	message_style: "flat",
	message_density: "default",
	compact_mode: false,
	chat_background: null,
	timestamp_format: "relative",
	bubble_color_sent: "oklch(0.55 0.20 265)",
	bubble_color_received: "oklch(0.30 0.04 250)",
	show_avatars: true,
	show_timestamps: true,
	show_online_status: true,
	larger_text: false,
	high_contrast: false,
	reduced_motion: false,
	animations_enabled: true,
	animation_speed: 1.0,
	screen_reader_mode: false,
	color_blind_mode: "none",
	dyslexia_font: false,
	focus_indicator: "default",
	allow_dms: "everyone",
	read_receipts: true,
	typing_indicators: true,
	notifications_enabled: true,
	desktop_notifications: true,
	sound_enabled: true,
	notification_sound: "default",
	mention_notifications: true,
	dm_notifications: true,
	input_device: null,
	output_device: null,
	input_volume: 100,
	output_volume: 100,
	noise_suppression: true,
	echo_cancellation: true,
	developer_mode: false,
	custom_theme_json: null,
	adaptive_theme: false,
};

// ── State Interface ────────────────────────────────────────

interface SettingsState {
	settings: UserSettings | null;
	isLoading: boolean;
	error: string | null;

	loadSettings: () => Promise<void>;
	updateSettings: (updates: SettingsUpdate) => Promise<void>;
	clearSettings: () => void;
}

// ── Store ──────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>()(
	conditionalDevtools(
		(set, get) => ({
			settings: null,
			isLoading: false,
			error: null,

			loadSettings: async () => {
				set({ isLoading: true, error: null });

				try {
					const supabase = createClient();
					const {
						data: { user },
					} = await supabase.auth.getUser();
					if (!user) {
						set({ isLoading: false });
						return;
					}

					const { data, error } = await supabase
						.from("user_settings")
						.select("*")
						.eq("user_id", user.id)
						.single();

					// Grab localStorage fallback for columns not yet in DB
					const fallback = loadLocalFallback();

					if (error && error.code === "PGRST116") {
						// Row should exist via trigger. Use local defaults + localStorage fallback.
						set({
							settings: { user_id: user.id, ...DEFAULT_SETTINGS, ...fallback } as UserSettings,
							isLoading: false,
						});
						return;
					}

					if (error) {
						logError("STORE_INIT", error);
						set({ isLoading: false, error: error.message });
						return;
					}

					// Merge: defaults < DB data < localStorage fallback (for columns not yet in DB)
					set({
						settings: { ...DEFAULT_SETTINGS, ...data, ...fallback } as UserSettings,
						isLoading: false,
					});
				} catch (err) {
					logError("STORE_INIT", err);
					set({
						error: (err as Error).message,
						isLoading: false,
					});
				}
			},

			updateSettings: async (updates) => {
				const { settings } = get();
				if (!settings) return;

				// Optimistic update — apply locally FIRST for instant UI response
				set({ settings: { ...settings, ...updates } });

				// Always persist to localStorage as fallback
				saveLocalFallback(updates);

				try {
					const supabase = createClient();
					const { error } = await supabase
						.from("user_settings")
						.update({
							...updates,
							updated_at: new Date().toISOString(),
						})
						.eq("user_id", settings.user_id);

					if (error) {
						// PGRST204 = column not found in schema cache.
						// This means the migration hasn't been applied yet.
						// Keep the optimistic update — it's persisted in localStorage.
						if (error.code === "PGRST204") {
							// Silently ignore — localStorage fallback handles persistence
							return;
						}
						// For other errors, revert the optimistic update
						logError("STORE_INIT", error);
						set({ settings: { ...settings } });
					}
				} catch (err) {
					logError("STORE_INIT", err);
					// Keep optimistic update on network errors — localStorage has the data
				}
			},

			clearSettings: () => {
				clearLocalFallback();
				set({ settings: null, isLoading: false, error: null });
			},
		}),
		{ name: "SettingsStore" },
	),
);

export { DEFAULT_SETTINGS };
