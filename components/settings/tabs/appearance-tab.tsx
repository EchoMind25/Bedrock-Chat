"use client";

import { useState, useMemo, useRef } from "react";
import { useThemeStore } from "@/store/theme.store";
import { useSettingsStore } from "@/store/settings.store";
import { Toggle } from "@/components/ui/toggle/toggle";
import { OklchColorPicker } from "@/components/ui/color-picker/oklch-color-picker";
import { Slider } from "@/components/ui/slider/slider";
import { Select } from "@/components/ui/select/select";
import { SettingsSection } from "../settings-section";
import { SettingsRow } from "../settings-row";
import { LivePreview } from "../appearance/live-preview";
import { ThemePresets } from "../appearance/theme-presets";
import { ThemeShare } from "../appearance/theme-share";
import { StyleSwap } from "../appearance/style-swap";
import { generatePalette, extractHCL } from "@/lib/themes/color-generator";
import { getTimePeriod, getTimePeriodLabel, getAdaptiveAdjustment, applyAdaptiveShift } from "@/lib/themes/adaptive-theme";
import type { ThemeOverrideMode } from "@/lib/themes/types";
import type { SettingsUpdate, UserSettings } from "@/store/settings.store";
import { Eye, EyeOff, Sun, Moon, Sunrise, Sunset } from "lucide-react";
import { usePointsStore } from "@/store/points.store";

// ── Constants ────────────────────────────────────────────────

const THEME_OPTIONS: Array<{ value: ThemeOverrideMode; label: string; desc: string }> = [
	{ value: "use_server", label: "Use Server Theme", desc: "Respect each server's custom theme" },
	{ value: "force_personal", label: "Force Personal Theme", desc: "Apply your preferred theme everywhere" },
	{ value: "simple_mode", label: "Simple Mode", desc: "Minimal effects for better performance" },
];

const FONT_OPTIONS: Array<{ value: UserSettings["font_family"]; label: string }> = [
	{ value: "system", label: "System Default" },
	{ value: "inter", label: "Inter" },
	{ value: "sf-pro", label: "SF Pro" },
	{ value: "jetbrains-mono", label: "JetBrains Mono" },
	{ value: "merriweather", label: "Merriweather" },
	{ value: "opendyslexic", label: "OpenDyslexic" },
];

const TIMESTAMP_OPTIONS: Array<{ value: UserSettings["timestamp_format"]; label: string }> = [
	{ value: "relative", label: "Relative (just now)" },
	{ value: "12h", label: "12-hour (2:30 PM)" },
	{ value: "24h", label: "24-hour (14:30)" },
	{ value: "full", label: "Full (Today at 2:30 PM)" },
];

const COLOR_BLIND_OPTIONS: Array<{ value: UserSettings["color_blind_mode"]; label: string; description: string }> = [
	{ value: "none", label: "None", description: "Default color rendering" },
	{ value: "protanopia", label: "Protanopia", description: "Reduced red sensitivity" },
	{ value: "deuteranopia", label: "Deuteranopia", description: "Reduced green sensitivity" },
	{ value: "tritanopia", label: "Tritanopia", description: "Reduced blue sensitivity" },
];

const FOCUS_OPTIONS: Array<{ value: UserSettings["focus_indicator"]; label: string }> = [
	{ value: "default", label: "Default" },
	{ value: "high-visibility", label: "High Visibility" },
	{ value: "outline-only", label: "Outline Only" },
];

const CHAT_BACKGROUNDS: Array<{ label: string; value: string | null }> = [
	{ label: "None", value: null },
	{
		label: "Deep Space",
		value: "radial-gradient(ellipse at 15% 60%, oklch(0.22 0.15 275 / 0.8) 0%, transparent 50%), radial-gradient(ellipse at 85% 25%, oklch(0.20 0.18 250 / 0.6) 0%, transparent 40%), radial-gradient(ellipse at 50% 10%, oklch(0.28 0.16 270) 0%, oklch(0.04 0.03 280) 100%)",
	},
	{
		label: "Aurora",
		value: "radial-gradient(ellipse at 70% 0%, oklch(0.32 0.20 165 / 0.8) 0%, transparent 45%), radial-gradient(ellipse at 20% 40%, oklch(0.25 0.18 290 / 0.6) 0%, transparent 50%), linear-gradient(180deg, oklch(0.18 0.14 170) 0%, oklch(0.08 0.10 265) 50%, oklch(0.14 0.12 310) 100%)",
	},
	{
		label: "Sunset",
		value: "radial-gradient(ellipse at 50% 0%, oklch(0.40 0.22 55 / 0.7) 0%, transparent 45%), radial-gradient(ellipse at 80% 30%, oklch(0.30 0.20 30 / 0.5) 0%, transparent 40%), linear-gradient(180deg, oklch(0.35 0.20 55) 0%, oklch(0.20 0.18 30) 40%, oklch(0.08 0.12 340) 100%)",
	},
	{
		label: "Forest",
		value: "radial-gradient(ellipse at 40% 0%, oklch(0.28 0.16 150 / 0.5) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, oklch(0.20 0.14 135 / 0.6) 0%, transparent 45%), linear-gradient(170deg, oklch(0.18 0.14 155) 0%, oklch(0.10 0.12 140) 50%, oklch(0.05 0.08 115) 100%)",
	},
	{
		label: "Ocean",
		value: "radial-gradient(ellipse at 50% 0%, oklch(0.28 0.12 210 / 0.5) 0%, transparent 50%), radial-gradient(ellipse at 20% 70%, oklch(0.24 0.16 220 / 0.6) 0%, transparent 45%), radial-gradient(ellipse at 80% 50%, oklch(0.20 0.18 240 / 0.5) 0%, transparent 40%), oklch(0.05 0.08 235)",
	},
	{
		label: "Ember",
		value: "radial-gradient(ellipse at 50% 85%, oklch(0.38 0.22 40 / 0.8) 0%, transparent 50%), radial-gradient(ellipse at 30% 65%, oklch(0.28 0.20 30 / 0.5) 0%, transparent 40%), radial-gradient(ellipse at 70% 75%, oklch(0.25 0.18 55 / 0.4) 0%, transparent 35%), oklch(0.04 0.04 15)",
	},
	{
		label: "Nebula",
		value: "radial-gradient(ellipse at 25% 25%, oklch(0.28 0.22 320 / 0.7) 0%, transparent 40%), radial-gradient(ellipse at 75% 65%, oklch(0.24 0.20 265 / 0.6) 0%, transparent 45%), radial-gradient(ellipse at 50% 45%, oklch(0.20 0.18 290 / 0.5) 0%, transparent 50%), oklch(0.04 0.05 285)",
	},
	{
		label: "Arctic",
		value: "radial-gradient(ellipse at 50% 0%, oklch(0.35 0.10 210 / 0.6) 0%, transparent 45%), radial-gradient(ellipse at 25% 60%, oklch(0.28 0.12 215 / 0.5) 0%, transparent 40%), linear-gradient(180deg, oklch(0.25 0.10 215) 0%, oklch(0.14 0.06 210) 50%, oklch(0.06 0.04 205) 100%)",
	},
	{
		label: "Lava",
		value: "radial-gradient(ellipse at 50% 65%, oklch(0.40 0.25 35 / 0.7) 0%, transparent 40%), radial-gradient(ellipse at 25% 45%, oklch(0.32 0.22 50 / 0.5) 0%, transparent 35%), radial-gradient(ellipse at 75% 40%, oklch(0.28 0.20 20 / 0.4) 0%, transparent 30%), oklch(0.04 0.05 10)",
	},
	{
		label: "Grid",
		value: "repeating-linear-gradient(0deg, oklch(0.35 0.12 265 / 0.3) 0px, transparent 1px, transparent 30px), repeating-linear-gradient(90deg, oklch(0.35 0.12 265 / 0.3) 0px, transparent 1px, transparent 30px), radial-gradient(ellipse at 50% 50%, oklch(0.14 0.08 265) 0%, oklch(0.04 0.03 265) 100%)",
	},
	{
		label: "Dots",
		value: "radial-gradient(circle, oklch(0.45 0.10 265 / 0.4) 1.5px, transparent 1.5px) 0 0 / 22px 22px, radial-gradient(ellipse at 50% 50%, oklch(0.13 0.06 265) 0%, oklch(0.05 0.03 265) 100%)",
	},
	{
		label: "Spotlight",
		value: "radial-gradient(circle at 50% 20%, oklch(0.40 0.14 265 / 0.6) 0%, transparent 40%), radial-gradient(circle at 50% 20%, oklch(0.28 0.10 265 / 0.3) 0%, transparent 60%), oklch(0.04 0.02 265)",
	},
];

// ── Component ────────────────────────────────────────────────

function OptionButtons<T extends string>({
	options,
	value,
	onChange,
}: {
	options: readonly T[];
	value: T;
	onChange: (v: T) => void;
}) {
	return (
		<div className="flex gap-2">
			{options.map((opt) => (
				<button
					key={opt}
					type="button"
					onClick={() => onChange(opt)}
					className={`flex-1 p-3 rounded-lg border-2 transition-all text-center text-sm capitalize ${
						value === opt
							? "border-blue-500 bg-blue-500/10 text-blue-300"
							: "border-white/10 hover:border-white/20 text-slate-300"
					}`}
				>
					{opt}
				</button>
			))}
		</div>
	);
}

export function AppearanceTab() {
	const [showPreview, setShowPreview] = useState(true);
	const themeToggleCount = useRef(0);
	const discoverEasterEgg = usePointsStore((s) => s.discoverEasterEgg);

	// Theme store — localStorage-only preferences
	const overrideMode = useThemeStore((s) => s.preferences.overrideMode);
	const setOverrideMode = useThemeStore((s) => s.setOverrideMode);

	// Settings store — DB-backed preferences
	const settings = useSettingsStore((s) => s.settings);
	const updateSettings = useSettingsStore((s) => s.updateSettings);

	// Derived values
	const accentColor = settings?.accent_color ?? "oklch(0.65 0.25 265)";
	const isAdaptive = settings?.adaptive_theme ?? false;
	const hcl = extractHCL(accentColor);
	const palette = hcl ? generatePalette(hcl.h, hcl.c, hcl.l) : null;

	// Adaptive theme
	const timePeriod = useMemo(() => getTimePeriod(), []);
	const adaptiveAccent = useMemo(() => {
		if (!isAdaptive) return accentColor;
		return applyAdaptiveShift(accentColor, getAdaptiveAdjustment(timePeriod));
	}, [isAdaptive, accentColor, timePeriod]);

	const TIME_ICONS = { morning: Sunrise, afternoon: Sun, evening: Sunset, night: Moon };

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold text-white">Appearance</h1>
					<p className="text-slate-400 text-sm mt-1">
						Customize how Bedrock Chat looks and feels
					</p>
				</div>
				<button
					type="button"
					onClick={() => setShowPreview((p) => !p)}
					className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 transition-colors"
				>
					{showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
					Preview
				</button>
			</div>

			{/* Split layout: controls + preview */}
			<div className="flex gap-6">
				{/* Left: Controls */}
				<div className="flex-1 min-w-0 space-y-6">

					{/* ── Adaptive Theme ─────────────────────────── */}
					<SettingsSection title="Smart Theme" description="Automatically adjusts your accent color based on time of day">
						<SettingsRow label="Adaptive Theme" description="Subtle warmth/coolness shift throughout the day">
							<Toggle
								checked={isAdaptive}
								onChange={(e) => updateSettings({ adaptive_theme: e.target.checked })}
							/>
						</SettingsRow>
						{isAdaptive && (() => {
							const TimeIcon = TIME_ICONS[timePeriod];
							return (
								<div className="flex items-center gap-3 mt-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
									<TimeIcon className="w-4 h-4 text-slate-300 shrink-0" />
									<div className="flex-1 min-w-0">
										<p className="text-xs font-medium text-slate-200">
											{getTimePeriodLabel(timePeriod)}
										</p>
										<p className="text-[10px] text-slate-500">
											Accent shifted to {adaptiveAccent}
										</p>
									</div>
									<div
										className="w-5 h-5 rounded-full border border-white/10 shrink-0"
										style={{ backgroundColor: adaptiveAccent }}
										title={adaptiveAccent}
									/>
								</div>
							);
						})()}
					</SettingsSection>

					{/* ── Theme Mode ──────────────────────────────── */}
					<SettingsSection title="Theme Mode">
						<div className="space-y-2">
							{THEME_OPTIONS.map((option) => (
								<button
									key={option.value}
									type="button"
									onClick={() => {
									setOverrideMode(option.value);
									themeToggleCount.current++;
									if (themeToggleCount.current >= 10) {
										discoverEasterEgg("dark-mode-toggle-10");
									}
								}}
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

					{/* ── Colors ──────────────────────────────────── */}
					<SettingsSection title="Colors">
						<OklchColorPicker
							value={accentColor}
							onChange={(color) => updateSettings({ accent_color: color })}
						/>
						{/* Derived palette preview */}
						{palette && (
							<div className="mt-3 space-y-1.5">
								<label className="text-xs text-slate-400 font-medium">Generated Palette</label>
								<div className="flex gap-1.5">
									{Object.entries(palette).map(([key, color]) => (
										<div
											key={key}
											className="flex-1 h-6 rounded-md border border-white/5"
											style={{ backgroundColor: color }}
											title={`${key}: ${color}`}
										/>
									))}
								</div>
							</div>
						)}
					</SettingsSection>

					{/* ── Typography ──────────────────────────────── */}
					<SettingsSection title="Typography">
						<Select
							label="Font Family"
							options={FONT_OPTIONS}
							value={settings?.font_family ?? "system"}
							onChange={(v) => updateSettings({ font_family: v })}
						/>
						<div className="space-y-3 mt-3">
							<div>
								<label className="text-xs text-slate-400 font-medium mb-1.5 block">Chat Font Size</label>
								<OptionButtons
									options={["small", "medium", "large"] as const}
									value={settings?.message_font_size ?? "medium"}
									onChange={(size) => updateSettings({ message_font_size: size })}
								/>
							</div>
							<div>
								<label className="text-xs text-slate-400 font-medium mb-1.5 block">UI Font Size</label>
								<OptionButtons
									options={["small", "medium", "large"] as const}
									value={settings?.ui_font_size ?? "medium"}
									onChange={(size) => updateSettings({ ui_font_size: size })}
								/>
							</div>
						</div>
						<div className="mt-3">
							<label className="text-xs text-slate-400 font-medium mb-1.5 block">Line Height</label>
							<OptionButtons
								options={["tight", "normal", "relaxed"] as const}
								value={settings?.line_height ?? "normal"}
								onChange={(v) => updateSettings({ line_height: v })}
							/>
						</div>
					</SettingsSection>

					{/* ── Chat Visuals ────────────────────────────── */}
					<SettingsSection title="Chat Visuals">
						<div>
							<label className="text-xs text-slate-400 font-medium mb-1.5 block">Message Style</label>
							<OptionButtons
								options={["flat", "bubble", "minimal"] as const}
								value={settings?.message_style ?? "flat"}
								onChange={(v) => updateSettings({ message_style: v })}
							/>
						</div>

						{/* Bubble color pickers — only visible when bubble style is selected */}
						{(settings?.message_style ?? "flat") === "bubble" && (
							<div className="mt-3 space-y-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
								<label className="text-xs text-slate-400 font-medium block">Bubble Colors</label>
								<div className="flex gap-4">
									<div className="flex-1 space-y-1.5">
										<label className="text-[11px] text-slate-500 block">Sent</label>
										<div className="flex items-center gap-2">
											<div
												className="w-8 h-8 rounded-lg border border-white/10 shrink-0 cursor-pointer"
												style={{ backgroundColor: settings?.bubble_color_sent ?? "oklch(0.55 0.20 265)" }}
												title={settings?.bubble_color_sent ?? "oklch(0.55 0.20 265)"}
											/>
											<OklchColorPicker
												value={settings?.bubble_color_sent ?? "oklch(0.55 0.20 265)"}
												onChange={(color) => updateSettings({ bubble_color_sent: color })}
												className="flex-1"
											/>
										</div>
									</div>
									<div className="flex-1 space-y-1.5">
										<label className="text-[11px] text-slate-500 block">Received</label>
										<div className="flex items-center gap-2">
											<div
												className="w-8 h-8 rounded-lg border border-white/10 shrink-0 cursor-pointer"
												style={{ backgroundColor: settings?.bubble_color_received ?? "oklch(0.30 0.04 250)" }}
												title={settings?.bubble_color_received ?? "oklch(0.30 0.04 250)"}
											/>
											<OklchColorPicker
												value={settings?.bubble_color_received ?? "oklch(0.30 0.04 250)"}
												onChange={(color) => updateSettings({ bubble_color_received: color })}
												className="flex-1"
											/>
										</div>
									</div>
								</div>
							</div>
						)}

						<div className="mt-3">
							<label className="text-xs text-slate-400 font-medium mb-1.5 block">Chat Background</label>
							<div className="flex gap-2 flex-wrap">
								{CHAT_BACKGROUNDS.map((bg) => (
									<button
										key={bg.label}
										type="button"
										onClick={() => updateSettings({ chat_background: bg.value })}
										className={`w-14 h-10 rounded-lg border-2 transition-all text-[8px] text-slate-400 flex items-end justify-center pb-0.5 ${
											(settings?.chat_background ?? null) === bg.value
												? "border-blue-500"
												: "border-white/10 hover:border-white/20"
										}`}
										style={{
											background: bg.value || "oklch(0.14 0.02 250)",
										}}
									>
										{bg.label}
									</button>
								))}
							</div>
						</div>

						<div className="mt-3">
							<label className="text-xs text-slate-400 font-medium mb-1.5 block">Message Density</label>
							<OptionButtons
								options={["compact", "default", "spacious"] as const}
								value={settings?.message_density ?? "default"}
								onChange={(density) =>
									updateSettings({
										message_density: density,
										compact_mode: density === "compact",
									})
								}
							/>
						</div>

						<div className="mt-3">
							<Select
								label="Timestamp Format"
								options={TIMESTAMP_OPTIONS}
								value={settings?.timestamp_format ?? "relative"}
								onChange={(v) => updateSettings({ timestamp_format: v })}
							/>
						</div>
					</SettingsSection>

					{/* ── Accessibility ───────────────────────────── */}
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
						<Slider
							label="Animation Speed"
							min={0}
							max={2}
							step={0.1}
							value={settings?.animation_speed ?? 1.0}
							onChange={(v) => updateSettings({ animation_speed: v })}
							formatValue={(v) => (v === 0 ? "Off" : `${v.toFixed(1)}x`)}
							className="py-2"
						/>
						<Select
							label="Color Blind Mode"
							options={COLOR_BLIND_OPTIONS}
							value={settings?.color_blind_mode ?? "none"}
							onChange={(v) => updateSettings({ color_blind_mode: v })}
							className="py-2"
						/>
						<SettingsRow label="Dyslexia-Friendly Font" description="Use OpenDyslexic font across the app">
							<Toggle
								checked={settings?.dyslexia_font ?? false}
								onChange={(e) => updateSettings({ dyslexia_font: e.target.checked })}
							/>
						</SettingsRow>
						<Select
							label="Focus Indicator"
							options={FOCUS_OPTIONS}
							value={settings?.focus_indicator ?? "default"}
							onChange={(v) => updateSettings({ focus_indicator: v })}
							className="py-2"
						/>
						<SettingsRow label="Screen Reader Mode" description="Enhanced focus indicators and ARIA landmarks">
							<Toggle
								checked={settings?.screen_reader_mode ?? false}
								onChange={(e) => updateSettings({ screen_reader_mode: e.target.checked })}
							/>
						</SettingsRow>
					</SettingsSection>

					{/* ── Display ─────────────────────────────────── */}
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
						<SettingsRow label="Larger Text" description="Increase base text size across the app">
							<Toggle
								checked={settings?.larger_text ?? false}
								onChange={(e) => updateSettings({ larger_text: e.target.checked })}
							/>
						</SettingsRow>
					</SettingsSection>

					{/* ── Theme Presets ───────────────────────────── */}
					<SettingsSection title="Theme Presets" description="Quick-apply curated appearance combinations">
						<ThemePresets
							onApply={(preset) => updateSettings(preset)}
						/>
					</SettingsSection>

					{/* ── Import / Export ─────────────────────────── */}
					<SettingsSection title="Theme Sharing" description="Share your appearance with others">
						<ThemeShare
							currentSettings={settings ?? {}}
							onImport={(imported) => updateSettings(imported)}
						/>
					</SettingsSection>

					{/* ── Style Swap ─────────────────────────────── */}
					<SettingsSection title="Style Swap" description="Try a friend's look before committing">
						<StyleSwap />
					</SettingsSection>
				</div>

				{/* Right: Live Preview (sticky) */}
				{showPreview && (
					<div className="w-[280px] shrink-0 hidden xl:block">
						<div className="sticky top-0">
							<label className="text-xs text-slate-400 font-medium mb-2 block">Live Preview</label>
							<LivePreview
								accentColor={accentColor}
								fontFamily={settings?.font_family ?? "system"}
								messageFontSize={settings?.message_font_size ?? "medium"}
								messageStyle={settings?.message_style ?? "flat"}
								messageDensity={settings?.message_density ?? "default"}
								lineHeight={settings?.line_height ?? "normal"}
								showAvatars={settings?.show_avatars ?? true}
								showTimestamps={settings?.show_timestamps ?? true}
								chatBackground={settings?.chat_background ?? null}
								timestampFormat={settings?.timestamp_format ?? "relative"}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
