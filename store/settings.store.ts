import { create } from "zustand";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import { createClient } from "@/lib/supabase/client";
import { logError } from "@/lib/utils/error-logger";

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

					if (error && error.code === "PGRST116") {
						// Row should exist via trigger. Use local defaults.
						set({
							settings: { user_id: user.id, ...DEFAULT_SETTINGS } as UserSettings,
							isLoading: false,
						});
						return;
					}

					if (error) {
						logError("STORE_INIT", error);
						set({ isLoading: false, error: error.message });
						return;
					}

					// Merge DB data with local defaults for any missing fields
					set({
						settings: { ...DEFAULT_SETTINGS, ...data } as UserSettings,
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
				const previous = settings;
				set({ settings: { ...settings, ...updates } });

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
						logError("STORE_INIT", error);
						// Revert on failure
						set({ settings: previous });
					}
				} catch (err) {
					logError("STORE_INIT", err);
					set({ settings: previous });
				}
			},

			clearSettings: () => {
				set({ settings: null, isLoading: false, error: null });
			},
		}),
		{ name: "SettingsStore" },
	),
);

export { DEFAULT_SETTINGS };
