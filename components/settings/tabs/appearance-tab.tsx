"use client";

import { useThemeStore } from "@/store/theme.store";
import { useSettingsStore } from "@/store/settings.store";
import { Toggle } from "@/components/ui/toggle/toggle";
import { SettingsSection } from "../settings-section";
import { SettingsRow } from "../settings-row";
import type { ThemeOverrideMode } from "@/lib/themes/types";

const themeOptions: Array<{ value: ThemeOverrideMode; label: string; desc: string }> = [
	{ value: "use_server", label: "Use Server Theme", desc: "Respect each server's custom theme" },
	{ value: "force_personal", label: "Force Personal Theme", desc: "Apply your preferred theme everywhere" },
	{ value: "simple_mode", label: "Simple Mode", desc: "Minimal effects for better performance" },
];

const ACCENT_COLORS = [
	{ value: "purple", label: "Purple", color: "oklch(0.65 0.25 265)" },
	{ value: "blue", label: "Blue", color: "oklch(0.65 0.25 240)" },
	{ value: "green", label: "Green", color: "oklch(0.65 0.20 155)" },
	{ value: "pink", label: "Pink", color: "oklch(0.65 0.25 340)" },
	{ value: "orange", label: "Orange", color: "oklch(0.70 0.20 55)" },
];

export function AppearanceTab() {
	// Theme store — localStorage-only preferences (theme mode override)
	const overrideMode = useThemeStore((s) => s.preferences.overrideMode);
	const setOverrideMode = useThemeStore((s) => s.setOverrideMode);

	// Settings store — DB-backed preferences
	const settings = useSettingsStore((s) => s.settings);
	const updateSettings = useSettingsStore((s) => s.updateSettings);

	const handleFontSizeChange = (size: "small" | "medium" | "large") => {
		updateSettings({ font_size: size });
	};

	const handleMessageDensityChange = (density: "compact" | "default" | "spacious") => {
		updateSettings({
			message_density: density,
			compact_mode: density === "compact",
		});
	};

	const currentDensity = settings?.message_density ?? "default";

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold text-white">Appearance</h1>
				<p className="text-slate-400 text-sm mt-1">Customize how Bedrock Chat looks</p>
			</div>

			<SettingsSection title="Theme Mode">
				<div className="space-y-2">
					{themeOptions.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => setOverrideMode(option.value)}
							className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
								overrideMode === option.value
									? "border-blue-500 bg-blue-500/10"
									: "border-white/10 hover:border-white/20 hover:bg-white/5"
							}`}
						>
							<div className="font-medium text-sm text-slate-100">{option.label}</div>
							<div className="text-xs text-slate-400 mt-0.5">{option.desc}</div>
						</button>
					))}
				</div>
			</SettingsSection>

			<SettingsSection title="Accent Color">
				<div className="flex gap-3">
					{ACCENT_COLORS.map((ac) => (
						<button
							key={ac.value}
							type="button"
							onClick={() => updateSettings({ accent_color: ac.value })}
							className={`w-10 h-10 rounded-full border-2 transition-all ${
								(settings?.accent_color ?? "purple") === ac.value
									? "border-white scale-110"
									: "border-transparent hover:border-white/40"
							}`}
							style={{ backgroundColor: ac.color }}
							title={ac.label}
						/>
					))}
				</div>
			</SettingsSection>

			<SettingsSection title="Message Density">
				<div className="flex gap-2">
					{(["compact", "default", "spacious"] as const).map((density) => (
						<button
							key={density}
							type="button"
							onClick={() => handleMessageDensityChange(density)}
							className={`flex-1 p-3 rounded-lg border-2 transition-all text-center text-sm capitalize ${
								currentDensity === density
									? "border-blue-500 bg-blue-500/10 text-blue-300"
									: "border-white/10 hover:border-white/20 text-slate-300"
							}`}
						>
							{density}
						</button>
					))}
				</div>
			</SettingsSection>

			<SettingsSection title="Font Size">
				<div className="flex gap-2">
					{(["small", "medium", "large"] as const).map((size) => (
						<button
							key={size}
							type="button"
							onClick={() => handleFontSizeChange(size)}
							className={`flex-1 p-3 rounded-lg border-2 transition-all text-center text-sm capitalize ${
								(settings?.font_size ?? "medium") === size
									? "border-blue-500 bg-blue-500/10 text-blue-300"
									: "border-white/10 hover:border-white/20 text-slate-300"
							}`}
						>
							{size}
						</button>
					))}
				</div>
			</SettingsSection>

			<SettingsSection title="Accessibility">
				<SettingsRow label="High Contrast" description="Increase text contrast for better readability">
					<Toggle
						checked={settings?.high_contrast ?? false}
						onChange={(e) => updateSettings({ high_contrast: e.target.checked })}
					/>
				</SettingsRow>
				<SettingsRow label="Reduced Motion" description="Minimize animations and transitions">
					<Toggle
						checked={settings?.reduced_motion ?? false}
						onChange={(e) => updateSettings({ reduced_motion: e.target.checked })}
					/>
				</SettingsRow>
				<SettingsRow label="Larger Text" description="Increase base text size across the app">
					<Toggle
						checked={settings?.larger_text ?? false}
						onChange={(e) => updateSettings({ larger_text: e.target.checked })}
					/>
				</SettingsRow>
				<SettingsRow label="Screen Reader Mode" description="Enhanced focus indicators and ARIA landmarks">
					<Toggle
						checked={settings?.screen_reader_mode ?? false}
						onChange={(e) => updateSettings({ screen_reader_mode: e.target.checked })}
					/>
				</SettingsRow>
			</SettingsSection>

			<SettingsSection title="Display">
				<SettingsRow label="Show Avatars" description="Display user avatars in messages">
					<Toggle
						checked={settings?.show_avatars ?? true}
						onChange={(e) => updateSettings({ show_avatars: e.target.checked })}
					/>
				</SettingsRow>
				<SettingsRow label="Show Timestamps" description="Display timestamps on messages">
					<Toggle
						checked={settings?.show_timestamps ?? true}
						onChange={(e) => updateSettings({ show_timestamps: e.target.checked })}
					/>
				</SettingsRow>
			</SettingsSection>
		</div>
	);
}
