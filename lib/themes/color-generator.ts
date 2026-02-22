/**
 * Linear-style 3-variable palette generation.
 * Given a base hue, chroma, and lightness (OKLCH), generates
 * a complete derived color palette for the UI.
 */

export interface GeneratedPalette {
	primary: string;
	primaryHover: string;
	surface: string;
	surfaceHover: string;
	border: string;
	textMuted: string;
	atmosphere: string;
}

/**
 * Generate a full appearance palette from 3 OKLCH variables.
 *
 * @param hue      0–360 (color angle)
 * @param chroma   0–0.35 (color intensity)
 * @param lightness 0.3–0.9 (perceived brightness)
 */
export function generatePalette(
	hue: number,
	chroma: number,
	lightness: number,
): GeneratedPalette {
	const clampL = Math.max(0.1, Math.min(0.95, lightness));
	const clampC = Math.max(0, Math.min(0.35, chroma));

	return {
		primary: `oklch(${clampL.toFixed(2)} ${clampC.toFixed(2)} ${Math.round(hue)})`,
		primaryHover: `oklch(${Math.max(0.2, clampL - 0.06).toFixed(2)} ${clampC.toFixed(2)} ${Math.round(hue)})`,
		surface: `oklch(0.15 ${Math.min(0.04, clampC * 0.15).toFixed(3)} ${Math.round(hue)} / 0.7)`,
		surfaceHover: `oklch(0.20 ${Math.min(0.05, clampC * 0.2).toFixed(3)} ${Math.round(hue)} / 0.7)`,
		border: `oklch(0.30 ${Math.min(0.06, clampC * 0.25).toFixed(3)} ${Math.round(hue)} / 0.4)`,
		textMuted: `oklch(0.60 ${Math.min(0.03, clampC * 0.1).toFixed(3)} ${Math.round(hue)})`,
		atmosphere: `oklch(0.40 ${Math.min(0.15, clampC * 0.5).toFixed(3)} ${Math.round(hue)} / 0.06)`,
	};
}

/**
 * Extract hue/chroma/lightness from an OKLCH color string
 * for use with the palette generator.
 */
export function extractHCL(oklch: string): { h: number; c: number; l: number } | null {
	const match = oklch.match(
		/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/,
	);
	if (!match) return null;
	return {
		l: parseFloat(match[1]),
		c: parseFloat(match[2]),
		h: parseFloat(match[3]),
	};
}
