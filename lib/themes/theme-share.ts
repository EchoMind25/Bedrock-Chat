import type { SettingsUpdate } from "@/store/settings.store";

export interface ExportedTheme {
	version: 1;
	name: string;
	createdAt: string;
	settings: SettingsUpdate;
}

const SHAREABLE_KEYS: (keyof SettingsUpdate)[] = [
	"accent_color",
	"font_family",
	"message_font_size",
	"ui_font_size",
	"line_height",
	"message_style",
	"message_density",
	"chat_background",
	"timestamp_format",
	"high_contrast",
	"color_blind_mode",
	"compact_mode",
];

export function exportTheme(settings: SettingsUpdate, name: string): string {
	const shareable: SettingsUpdate = {};
	for (const key of SHAREABLE_KEYS) {
		if (settings[key] !== undefined) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(shareable as any)[key] = settings[key];
		}
	}

	const exported: ExportedTheme = {
		version: 1,
		name,
		createdAt: new Date().toISOString(),
		settings: shareable,
	};

	return btoa(JSON.stringify(exported));
}

export function importTheme(code: string): ExportedTheme | null {
	try {
		const decoded = JSON.parse(atob(code));
		if (decoded.version !== 1 || !decoded.settings) return null;

		// Only keep known safe keys
		const safe: SettingsUpdate = {};
		for (const key of SHAREABLE_KEYS) {
			if (decoded.settings[key] !== undefined) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(safe as any)[key] = decoded.settings[key];
			}
		}

		return {
			...decoded,
			settings: safe,
		} as ExportedTheme;
	} catch {
		return null;
	}
}
