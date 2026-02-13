"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/theme.store";
import { THEME_CSS_VARS } from "@/lib/themes/types";
import type { ThemeColors } from "@/lib/themes/types";

/**
 * Injects the active server theme as CSS custom properties on :root.
 * Handles theme transitions with a 300ms cross-fade.
 * Respects user accessibility overrides (high contrast, reduced motion).
 *
 * Mount once in the app layout. No visible UI.
 */
export function ThemeProvider() {
	const activeTheme = useThemeStore((s) => s.activeTheme);
	const preferences = useThemeStore((s) => s.preferences);

	// Inject CSS variables whenever the active theme changes
	useEffect(() => {
		const root = document.documentElement;
		const colors = resolveColors(activeTheme.colors, preferences.highContrast);

		// Apply CSS custom properties
		const entries = Object.entries(THEME_CSS_VARS) as [
			keyof ThemeColors,
			string,
		][];

		for (const [colorKey, cssVar] of entries) {
			root.style.setProperty(cssVar, colors[colorKey]);
		}

		// Layout class
		root.dataset.themeLayout = activeTheme.layout;

		// Effects data attributes (for CSS selectors)
		root.dataset.themeGlow = String(activeTheme.effects.glow);
		root.dataset.themeParticles = String(activeTheme.effects.particles);

		// Accessibility overrides
		if (preferences.reducedMotion) {
			root.classList.add("reduce-motion");
		} else {
			root.classList.remove("reduce-motion");
		}

		if (preferences.largerText) {
			root.classList.add("larger-text");
		} else {
			root.classList.remove("larger-text");
		}

		// Font size
		root.dataset.fontSize = preferences.fontSize;

		// Message density
		root.dataset.messageDensity = preferences.messageDensity;
	}, [activeTheme, preferences]);

	return null;
}

/**
 * Resolve theme colors with accessibility adjustments.
 */
function resolveColors(
	colors: ThemeColors,
	highContrast: boolean,
): ThemeColors {
	if (!highContrast) return colors;

	// High contrast: boost text lightness, darken backgrounds
	return {
		...colors,
		text: "oklch(0.97 0.005 0)", // Near-white
		textMuted: "oklch(0.8 0.01 0)", // Bright gray
		background: "oklch(0.05 0.01 0)", // Near-black
		surface: "oklch(0.08 0.01 0 / 0.9)", // Very dark
		border: "oklch(0.5 0.01 0 / 0.6)", // Visible borders
	};
}
