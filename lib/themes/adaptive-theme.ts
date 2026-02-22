/**
 * Time-of-day adaptive theme adjustments.
 * Shifts accent color warmth/coolness based on current time.
 */

export type TimePeriod = "morning" | "afternoon" | "evening" | "night";

export interface AdaptiveAdjustment {
	hueShift: number;    // Added to OKLCH hue
	chromaShift: number; // Added to OKLCH chroma
	lightnessShift: number; // Added to OKLCH lightness
}

const ADJUSTMENTS: Record<TimePeriod, AdaptiveAdjustment> = {
	morning: { hueShift: 10, chromaShift: 0, lightnessShift: 0.02 },
	afternoon: { hueShift: 0, chromaShift: 0, lightnessShift: 0 },
	evening: { hueShift: -5, chromaShift: 0, lightnessShift: -0.05 },
	night: { hueShift: -15, chromaShift: -0.05, lightnessShift: -0.03 },
};

export function getTimePeriod(hour?: number): TimePeriod {
	const h = hour ?? new Date().getHours();
	if (h >= 6 && h < 12) return "morning";
	if (h >= 12 && h < 18) return "afternoon";
	if (h >= 18 && h < 22) return "evening";
	return "night";
}

export function getAdaptiveAdjustment(period?: TimePeriod): AdaptiveAdjustment {
	return ADJUSTMENTS[period ?? getTimePeriod()];
}

/**
 * Apply adaptive adjustments to an OKLCH color string.
 * Input: "oklch(0.65 0.25 265)" → adjusted version.
 */
export function applyAdaptiveShift(oklchColor: string, adjustment: AdaptiveAdjustment): string {
	const match = oklchColor.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
	if (!match) return oklchColor;

	const l = Math.max(0, Math.min(1, parseFloat(match[1]) + adjustment.lightnessShift));
	const c = Math.max(0, parseFloat(match[2]) + adjustment.chromaShift);
	const h = (parseFloat(match[3]) + adjustment.hueShift + 360) % 360;

	return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
}

export function getTimePeriodLabel(period: TimePeriod): string {
	const labels: Record<TimePeriod, string> = {
		morning: "Morning",
		afternoon: "Afternoon",
		evening: "Evening",
		night: "Night",
	};
	return labels[period];
}
