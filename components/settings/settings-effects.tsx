"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settings.store";

const ACCENT_COLOR_MAP: Record<string, string> = {
	purple: "oklch(0.65 0.25 265)",
	blue: "oklch(0.65 0.25 240)",
	green: "oklch(0.65 0.20 155)",
	pink: "oklch(0.65 0.25 340)",
	orange: "oklch(0.70 0.20 55)",
};

/**
 * Renders nothing — applies global CSS effects based on user settings.
 * Mount once in the app shell (inside auth provider).
 */
export function SettingsEffects() {
	const settings = useSettingsStore((s) => s.settings);

	// Font size → CSS custom property
	useEffect(() => {
		const size = settings?.font_size ?? "medium";
		const map: Record<string, string> = {
			small: "0.875rem",
			medium: "1rem",
			large: "1.125rem",
		};
		document.documentElement.style.setProperty(
			"--message-font-size",
			map[size],
		);
	}, [settings?.font_size]);

	// Larger text → additional font size boost
	useEffect(() => {
		document.documentElement.classList.toggle(
			"larger-text",
			settings?.larger_text ?? false,
		);
	}, [settings?.larger_text]);

	// Reduced motion / animations disabled → single CSS class
	useEffect(() => {
		const shouldReduce =
			(settings?.reduced_motion ?? false) ||
			settings?.animations_enabled === false;
		document.documentElement.classList.toggle("reduce-motion", shouldReduce);
	}, [settings?.reduced_motion, settings?.animations_enabled]);

	// High contrast → CSS class
	useEffect(() => {
		document.documentElement.classList.toggle(
			"high-contrast",
			settings?.high_contrast ?? false,
		);
	}, [settings?.high_contrast]);

	// Screen reader mode → CSS class
	useEffect(() => {
		document.documentElement.classList.toggle(
			"screen-reader",
			settings?.screen_reader_mode ?? false,
		);
	}, [settings?.screen_reader_mode]);

	// Compact mode → CSS class
	useEffect(() => {
		document.documentElement.classList.toggle(
			"compact-mode",
			settings?.compact_mode ?? false,
		);
	}, [settings?.compact_mode]);

	// Message density → CSS classes (compact-mode already handled above, add spacious)
	useEffect(() => {
		const density = settings?.message_density ?? "default";
		document.documentElement.classList.toggle(
			"spacious-mode",
			density === "spacious",
		);
	}, [settings?.message_density]);

	// Accent color → CSS custom property
	useEffect(() => {
		const accent = settings?.accent_color ?? "purple";
		const color = ACCENT_COLOR_MAP[accent] ?? ACCENT_COLOR_MAP.purple;
		document.documentElement.style.setProperty("--color-primary", color);
	}, [settings?.accent_color]);

	return null;
}
