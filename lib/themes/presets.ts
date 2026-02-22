import type { SettingsUpdate } from "@/store/settings.store";

export interface AppearancePreset {
	id: string;
	name: string;
	description: string;
	preview: string;
	settings: SettingsUpdate;
}

export const APPEARANCE_PRESETS: AppearancePreset[] = [
	{
		id: "classic-dark",
		name: "Classic Dark",
		description: "Clean and familiar",
		preview: "linear-gradient(135deg, oklch(0.12 0.02 265), oklch(0.18 0.03 265))",
		settings: {
			accent_color: "oklch(0.65 0.25 265)",
			message_style: "flat",
			font_family: "system",
			message_density: "default",
			chat_background: null,
			line_height: "normal",
		},
	},
	{
		id: "neon-cyberpunk",
		name: "Neon Cyberpunk",
		description: "Vibrant and electric",
		preview: "linear-gradient(135deg, oklch(0.10 0.04 310), oklch(0.15 0.05 195))",
		settings: {
			accent_color: "oklch(0.65 0.25 310)",
			message_style: "bubble",
			font_family: "jetbrains-mono",
			message_density: "default",
			chat_background: "linear-gradient(180deg, oklch(0.08 0.04 310), oklch(0.12 0.02 250))",
			line_height: "normal",
		},
	},
	{
		id: "ocean-breeze",
		name: "Ocean Breeze",
		description: "Calm blues and teals",
		preview: "linear-gradient(135deg, oklch(0.14 0.03 220), oklch(0.20 0.05 195))",
		settings: {
			accent_color: "oklch(0.70 0.18 195)",
			message_style: "flat",
			font_family: "inter",
			message_density: "spacious",
			chat_background: "linear-gradient(180deg, oklch(0.10 0.03 220), oklch(0.14 0.04 195))",
			line_height: "relaxed",
		},
	},
	{
		id: "forest-calm",
		name: "Forest Calm",
		description: "Earthy greens and browns",
		preview: "linear-gradient(135deg, oklch(0.12 0.03 155), oklch(0.18 0.04 130))",
		settings: {
			accent_color: "oklch(0.65 0.20 155)",
			message_style: "minimal",
			font_family: "merriweather",
			message_density: "spacious",
			chat_background: "linear-gradient(180deg, oklch(0.09 0.02 140), oklch(0.13 0.03 155))",
			line_height: "relaxed",
		},
	},
	{
		id: "sunset-warm",
		name: "Sunset Warm",
		description: "Golden oranges and reds",
		preview: "linear-gradient(135deg, oklch(0.15 0.04 40), oklch(0.20 0.06 25))",
		settings: {
			accent_color: "oklch(0.70 0.20 55)",
			message_style: "bubble",
			font_family: "system",
			message_density: "default",
			chat_background: "linear-gradient(180deg, oklch(0.10 0.03 40), oklch(0.14 0.04 55))",
			line_height: "normal",
		},
	},
	{
		id: "midnight-minimal",
		name: "Midnight Minimal",
		description: "Ultra-dark and clean",
		preview: "linear-gradient(135deg, oklch(0.06 0.01 265), oklch(0.10 0.02 265))",
		settings: {
			accent_color: "oklch(0.65 0.25 240)",
			message_style: "minimal",
			font_family: "inter",
			message_density: "compact",
			chat_background: null,
			line_height: "tight",
		},
	},
	{
		id: "sakura-bloom",
		name: "Sakura Bloom",
		description: "Soft pinks and lavender",
		preview: "linear-gradient(135deg, oklch(0.14 0.04 340), oklch(0.18 0.05 310))",
		settings: {
			accent_color: "oklch(0.65 0.25 340)",
			message_style: "bubble",
			font_family: "system",
			message_density: "default",
			chat_background: "linear-gradient(180deg, oklch(0.10 0.03 330), oklch(0.14 0.04 340))",
			line_height: "normal",
		},
	},
	{
		id: "high-contrast-pro",
		name: "High Contrast Pro",
		description: "Maximum readability",
		preview: "linear-gradient(135deg, oklch(0.05 0 0), oklch(0.10 0 0))",
		settings: {
			accent_color: "oklch(0.80 0.18 90)",
			message_style: "flat",
			font_family: "system",
			message_density: "spacious",
			chat_background: null,
			line_height: "relaxed",
			high_contrast: true,
			larger_text: true,
		},
	},
];
