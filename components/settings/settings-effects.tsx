"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settings.store";
import { loadFont } from "@/lib/fonts/font-loader";

const ACCENT_COLOR_MAP: Record<string, string> = {
	purple: "oklch(0.65 0.25 265)",
	blue: "oklch(0.65 0.25 240)",
	green: "oklch(0.65 0.20 155)",
	pink: "oklch(0.65 0.25 340)",
	orange: "oklch(0.70 0.20 55)",
};

const FONT_FAMILY_MAP: Record<string, string> = {
	system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
	inter: '"Inter", sans-serif',
	"sf-pro": '"SF Pro Display", -apple-system, sans-serif',
	"jetbrains-mono": '"JetBrains Mono", monospace',
	merriweather: '"Merriweather", serif',
	opendyslexic: '"OpenDyslexic", sans-serif',
};

const SIZE_MAP: Record<string, string> = {
	small: "0.875rem",
	medium: "1rem",
	large: "1.125rem",
};

const LINE_HEIGHT_MAP: Record<string, string> = {
	tight: "1.3",
	normal: "1.5",
	relaxed: "1.8",
};

/**
 * Renders nothing — applies global CSS effects based on user settings.
 * Mount once in the app shell (inside auth provider).
 */
export function SettingsEffects() {
	const settings = useSettingsStore((s) => s.settings);

	// ── Message font size ────────────────────────────────────
	useEffect(() => {
		document.documentElement.style.setProperty(
			"--message-font-size",
			SIZE_MAP[settings?.message_font_size ?? "medium"],
		);
	}, [settings?.message_font_size]);

	// ── UI font size ─────────────────────────────────────────
	useEffect(() => {
		document.documentElement.style.setProperty(
			"--ui-font-size",
			SIZE_MAP[settings?.ui_font_size ?? "medium"],
		);
	}, [settings?.ui_font_size]);

	// ── Font family ──────────────────────────────────────────
	useEffect(() => {
		const family = settings?.dyslexia_font
			? "opendyslexic"
			: (settings?.font_family ?? "system");

		loadFont(family);

		document.documentElement.style.setProperty(
			"--app-font-family",
			FONT_FAMILY_MAP[family] ?? FONT_FAMILY_MAP.system,
		);
	}, [settings?.font_family, settings?.dyslexia_font]);

	// ── Line height ──────────────────────────────────────────
	useEffect(() => {
		document.documentElement.style.setProperty(
			"--message-line-height",
			LINE_HEIGHT_MAP[settings?.line_height ?? "normal"],
		);
	}, [settings?.line_height]);

	// ── Larger text ──────────────────────────────────────────
	useEffect(() => {
		document.documentElement.classList.toggle(
			"larger-text",
			settings?.larger_text ?? false,
		);
	}, [settings?.larger_text]);

	// ── Reduced motion / animations ──────────────────────────
	useEffect(() => {
		const speed = settings?.animation_speed ?? 1.0;
		const shouldReduce =
			(settings?.reduced_motion ?? false) ||
			settings?.animations_enabled === false ||
			speed === 0;
		document.documentElement.classList.toggle("reduce-motion", shouldReduce);
		document.documentElement.style.setProperty("--animation-speed", String(speed));
	}, [settings?.reduced_motion, settings?.animations_enabled, settings?.animation_speed]);

	// ── High contrast ────────────────────────────────────────
	useEffect(() => {
		document.documentElement.classList.toggle(
			"high-contrast",
			settings?.high_contrast ?? false,
		);
	}, [settings?.high_contrast]);

	// ── Screen reader mode ───────────────────────────────────
	useEffect(() => {
		document.documentElement.classList.toggle(
			"screen-reader",
			settings?.screen_reader_mode ?? false,
		);
	}, [settings?.screen_reader_mode]);

	// ── Compact mode ─────────────────────────────────────────
	useEffect(() => {
		document.documentElement.classList.toggle(
			"compact-mode",
			settings?.compact_mode ?? false,
		);
	}, [settings?.compact_mode]);

	// ── Message density (spacious) ───────────────────────────
	useEffect(() => {
		const density = settings?.message_density ?? "default";
		document.documentElement.classList.toggle(
			"spacious-mode",
			density === "spacious",
		);
	}, [settings?.message_density]);

	// ── Accent color ─────────────────────────────────────────
	useEffect(() => {
		const accent = settings?.accent_color ?? "oklch(0.65 0.25 265)";
		// Support legacy keyword values via fallback map
		const color = ACCENT_COLOR_MAP[accent] ?? accent;
		document.documentElement.style.setProperty("--color-primary", color);
	}, [settings?.accent_color]);

	// ── Message style ────────────────────────────────────────
	useEffect(() => {
		document.documentElement.dataset.messageStyle = settings?.message_style ?? "flat";
	}, [settings?.message_style]);

	// ── Chat background ──────────────────────────────────────
	useEffect(() => {
		document.documentElement.style.setProperty(
			"--chat-background",
			settings?.chat_background || "none",
		);
	}, [settings?.chat_background]);

	// ── Color blind mode ─────────────────────────────────────
	useEffect(() => {
		document.documentElement.dataset.colorBlindMode = settings?.color_blind_mode ?? "none";
	}, [settings?.color_blind_mode]);

	// ── Focus indicator ──────────────────────────────────────
	useEffect(() => {
		document.documentElement.dataset.focusIndicator = settings?.focus_indicator ?? "default";
	}, [settings?.focus_indicator]);

	// ── Timestamp format (consumed by JS formatters) ─────────
	useEffect(() => {
		document.documentElement.dataset.timestampFormat = settings?.timestamp_format ?? "relative";
	}, [settings?.timestamp_format]);

	return null;
}
