import { create } from "zustand";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import { createClient } from "@/lib/supabase/client";
import { logError } from "@/lib/utils/error-logger";

// ── Types ──────────────────────────────────────────────────

export interface UserSettings {
	id: string;
	user_id: string;
	theme: "dark" | "light" | "auto";
	accent_color: string;
	font_size: "small" | "medium" | "large";
	compact_mode: boolean;
	animations_enabled: boolean;
	show_online_status: boolean;
	allow_dms: boolean;
	read_receipts: boolean;
	typing_indicators: boolean;
	desktop_notifications: boolean;
	sound_enabled: boolean;
	notification_sound: string;
	mention_notifications: boolean;
	dm_notifications: boolean;
	high_contrast: boolean;
	reduced_motion: boolean;
	screen_reader_mode: boolean;
	input_device: string | null;
	output_device: string | null;
	input_volume: number;
	output_volume: number;
	noise_suppression: boolean;
	echo_cancellation: boolean;
	developer_mode: boolean;
	larger_text: boolean;
	show_avatars: boolean;
	show_timestamps: boolean;
	message_density: "compact" | "default" | "spacious";
}

export type SettingsUpdate = Partial<Omit<UserSettings, "id" | "user_id">>;

const DEFAULT_SETTINGS: Omit<UserSettings, "id" | "user_id"> = {
	theme: "dark",
	accent_color: "purple",
	font_size: "medium",
	compact_mode: false,
	animations_enabled: true,
	show_online_status: true,
	allow_dms: true,
	read_receipts: true,
	typing_indicators: true,
	desktop_notifications: true,
	sound_enabled: true,
	notification_sound: "default",
	mention_notifications: true,
	dm_notifications: true,
	high_contrast: false,
	reduced_motion: false,
	screen_reader_mode: false,
	input_device: null,
	output_device: null,
	input_volume: 100,
	output_volume: 100,
	noise_suppression: true,
	echo_cancellation: true,
	developer_mode: false,
	larger_text: false,
	show_avatars: true,
	show_timestamps: true,
	message_density: "default",
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

					let { data, error } = await supabase
						.from("user_settings")
						.select("*")
						.eq("user_id", user.id)
						.single();

					// First login — create default settings row
					if (error && error.code === "PGRST116") {
						const { data: newRow, error: insertError } = await supabase
							.from("user_settings")
							.insert({ user_id: user.id, ...DEFAULT_SETTINGS })
							.select()
							.single();

						if (insertError) {
							logError("STORE_INIT", insertError);
							set({ isLoading: false, error: insertError.message });
							return;
						}
						data = newRow;
					} else if (error) {
						logError("STORE_INIT", error);
						set({ isLoading: false, error: error.message });
						return;
					}

					set({ settings: data, isLoading: false });
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
						.eq("id", settings.id);

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
