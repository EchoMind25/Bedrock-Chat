"use client";

import { useThemeStore } from "@/store/theme.store";
import { Toggle } from "@/components/ui/toggle/toggle";
import { SettingsSection } from "../settings-section";
import { SettingsRow } from "../settings-row";
import type { ThemeOverrideMode } from "@/lib/themes/types";

const themeOptions: Array<{ value: ThemeOverrideMode; label: string; desc: string }> = [
	{ value: "use_server", label: "Use Server Theme", desc: "Respect each server's custom theme" },
	{ value: "force_personal", label: "Force Personal Theme", desc: "Apply your preferred theme everywhere" },
	{ value: "simple_mode", label: "Simple Mode", desc: "Minimal effects for better performance" },
];

export function AppearanceTab() {
	const preferences = useThemeStore((s) => s.preferences);
	const setMessageDensity = useThemeStore((s) => s.setMessageDensity);
	const setFontSize = useThemeStore((s) => s.setFontSize);
	const setHighContrast = useThemeStore((s) => s.setHighContrast);
	const setReducedMotion = useThemeStore((s) => s.setReducedMotion);
	const setLargerText = useThemeStore((s) => s.setLargerText);
	const setShowAvatars = useThemeStore((s) => s.setShowAvatars);
	const setShowTimestamps = useThemeStore((s) => s.setShowTimestamps);
	const setOverrideMode = useThemeStore((s) => s.setOverrideMode);

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
								preferences.overrideMode === option.value
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

			<SettingsSection title="Message Density">
				<div className="flex gap-2">
					{(["compact", "cozy", "spacious"] as const).map((density) => (
						<button
							key={density}
							type="button"
							onClick={() => setMessageDensity(density)}
							className={`flex-1 p-3 rounded-lg border-2 transition-all text-center text-sm capitalize ${
								preferences.messageDensity === density
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
							onClick={() => setFontSize(size)}
							className={`flex-1 p-3 rounded-lg border-2 transition-all text-center text-sm capitalize ${
								preferences.fontSize === size
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
						checked={preferences.highContrast}
						onChange={(e) => setHighContrast(e.target.checked)}
					/>
				</SettingsRow>
				<SettingsRow label="Reduced Motion" description="Minimize animations and transitions">
					<Toggle
						checked={preferences.reducedMotion}
						onChange={(e) => setReducedMotion(e.target.checked)}
					/>
				</SettingsRow>
				<SettingsRow label="Larger Text" description="Increase base text size across the app">
					<Toggle
						checked={preferences.largerText}
						onChange={(e) => setLargerText(e.target.checked)}
					/>
				</SettingsRow>
			</SettingsSection>

			<SettingsSection title="Display">
				<SettingsRow label="Show Avatars" description="Display user avatars in messages">
					<Toggle
						checked={preferences.showAvatars}
						onChange={(e) => setShowAvatars(e.target.checked)}
					/>
				</SettingsRow>
				<SettingsRow label="Show Timestamps" description="Display timestamps on messages">
					<Toggle
						checked={preferences.showTimestamps}
						onChange={(e) => setShowTimestamps(e.target.checked)}
					/>
				</SettingsRow>
			</SettingsSection>
		</div>
	);
}
