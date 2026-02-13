/**
 * Theme accessibility validation.
 * Checks WCAG 2.1 AA contrast requirements (4.5:1 for text).
 * All input colors expected in OKLCH format.
 */

import type { ThemeColors } from "./types";

// ── Contrast Ratio Calculation ─────────────────────────────

/**
 * Parse an OKLCH string into { l, c, h, a } values.
 * Handles: "oklch(0.65 0.25 265)" and "oklch(0.65 0.25 265 / 0.5)"
 */
export function parseOKLCH(oklch: string): {
	l: number;
	c: number;
	h: number;
	a: number;
} | null {
	const match = oklch.match(
		/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/,
	);
	if (!match) return null;
	return {
		l: parseFloat(match[1]),
		c: parseFloat(match[2]),
		h: parseFloat(match[3]),
		a: match[4] !== undefined ? parseFloat(match[4]) : 1,
	};
}

/**
 * Approximate relative luminance from OKLCH lightness.
 * OKLCH lightness is perceptually uniform, so L maps roughly
 * to sRGB relative luminance via L^3 (simplified).
 *
 * For precise contrast, use full OKLCH → sRGB → luminance pipeline.
 * This approximation is sufficient for real-time validation.
 */
function approximateLuminance(oklchL: number): number {
	// OKLCH L=0 → black (luminance 0), L=1 → white (luminance 1)
	// Approximate mapping: luminance ≈ L^3
	return Math.pow(Math.max(0, Math.min(1, oklchL)), 3);
}

/**
 * Calculate WCAG contrast ratio between two OKLCH colors.
 * Returns ratio as a number (e.g., 4.5 for 4.5:1).
 */
export function getContrastRatio(color1: string, color2: string): number {
	const c1 = parseOKLCH(color1);
	const c2 = parseOKLCH(color2);

	if (!c1 || !c2) return 0;

	const l1 = approximateLuminance(c1.l);
	const l2 = approximateLuminance(c2.l);

	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);

	return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a foreground/background pair meets WCAG AA.
 */
export function meetsWCAGAA(
	foreground: string,
	background: string,
	isLargeText = false,
): boolean {
	const ratio = getContrastRatio(foreground, background);
	return ratio >= (isLargeText ? 3 : 4.5);
}

// ── Theme Validation ───────────────────────────────────────

export interface ContrastCheck {
	pair: string; // e.g. "text / background"
	foreground: string;
	background: string;
	ratio: number;
	passes: boolean;
	requirement: number; // 4.5 or 3
}

export interface ThemeValidationResult {
	isValid: boolean;
	score: number; // 0-100 (100 = all pass)
	checks: ContrastCheck[];
	suggestions: string[];
}

/**
 * Validate a complete theme for WCAG AA accessibility.
 * Checks all critical text/background combinations.
 */
export function validateTheme(colors: ThemeColors): ThemeValidationResult {
	const checks: ContrastCheck[] = [];

	// Critical checks: text on backgrounds
	const pairs: [string, string, string, number][] = [
		["text / background", colors.text, colors.background, 4.5],
		["text / surface", colors.text, colors.surface, 4.5],
		["textMuted / background", colors.textMuted, colors.background, 4.5],
		["textMuted / surface", colors.textMuted, colors.surface, 4.5],
		["accent / background", colors.accent, colors.background, 4.5],
		["accent / surface", colors.accent, colors.surface, 4.5],
		["primary / background", colors.primary, colors.background, 3], // Large text OK
	];

	for (const [name, fg, bg, requirement] of pairs) {
		const ratio = getContrastRatio(fg, bg);
		checks.push({
			pair: name,
			foreground: fg,
			background: bg,
			ratio: Math.round(ratio * 10) / 10,
			passes: ratio >= requirement,
			requirement,
		});
	}

	const passing = checks.filter((c) => c.passes).length;
	const total = checks.length;
	const score = Math.round((passing / total) * 100);
	const isValid = checks.every((c) => c.passes);

	// Generate suggestions for failing checks
	const suggestions: string[] = [];
	for (const check of checks) {
		if (!check.passes) {
			const needsMore = check.ratio < check.requirement;
			if (needsMore) {
				suggestions.push(
					`${check.pair}: Contrast is ${check.ratio}:1, needs ${check.requirement}:1. ` +
						`Try making the text lighter or the background darker.`,
				);
			}
		}
	}

	return { isValid, score, checks, suggestions };
}

// ── Color Suggestion ───────────────────────────────────────

/**
 * Suggest an adjusted OKLCH lightness to meet a target contrast ratio.
 * Returns the adjusted color string.
 */
export function suggestContrastFix(
	foreground: string,
	background: string,
	targetRatio = 4.5,
): string | null {
	const fg = parseOKLCH(foreground);
	const bg = parseOKLCH(background);
	if (!fg || !bg) return null;

	const bgLuminance = approximateLuminance(bg.l);

	// Binary search for the right lightness
	let lo = 0;
	let hi = 1;

	for (let i = 0; i < 20; i++) {
		const mid = (lo + hi) / 2;
		const midLuminance = approximateLuminance(mid);

		const lighter = Math.max(midLuminance, bgLuminance);
		const darker = Math.min(midLuminance, bgLuminance);
		const ratio = (lighter + 0.05) / (darker + 0.05);

		if (ratio < targetRatio) {
			// Need more contrast: if fg is lighter, go lighter; if darker, go darker
			if (fg.l > bg.l) {
				lo = mid;
			} else {
				hi = mid;
			}
		} else {
			// Enough contrast: move toward original
			if (fg.l > bg.l) {
				hi = mid;
			} else {
				lo = mid;
			}
		}
	}

	const suggestedL =
		fg.l > bg.l
			? Math.round(lo * 100) / 100
			: Math.round(hi * 100) / 100;

	return `oklch(${suggestedL} ${fg.c} ${fg.h})`;
}

// ── Performance Warning ────────────────────────────────────

/**
 * Check if a theme's effects might cause performance issues.
 */
export function getPerformanceWarning(effects: {
	parallax: boolean;
	particles: boolean;
	glassBlur: boolean;
	glow: boolean;
}): string | null {
	const enabledCount = Object.values(effects).filter(Boolean).length;
	if (enabledCount === 4) {
		return "All effects enabled may impact performance on lower-end devices. Consider disabling particles or parallax.";
	}
	if (effects.particles && effects.parallax) {
		return "Particles + parallax together may affect frame rates on mid-range devices.";
	}
	return null;
}
