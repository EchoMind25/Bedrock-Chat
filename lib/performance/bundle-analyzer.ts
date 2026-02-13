/**
 * Client-side performance budget enforcement.
 * Tracks resource loading and reports budget violations.
 *
 * Budgets:
 * - JS bundle: <100KB gzipped (per route)
 * - CSS: <30KB gzipped
 * - Total page weight: <500KB
 * - Images: lazy loaded, WebP preferred
 */

// ── Types ──────────────────────────────────────────────────

export interface PerformanceBudget {
	maxJSBytes: number; // 100KB = 102400
	maxCSSBytes: number; // 30KB = 30720
	maxTotalBytes: number; // 500KB = 512000
	maxFontBytes: number; // 50KB = 51200
	maxImageBytes: number; // 200KB = 204800
}

export interface ResourceEntry {
	name: string;
	type: "script" | "stylesheet" | "font" | "image" | "other";
	transferSize: number; // Compressed size (gzipped)
	decodedSize: number; // Uncompressed size
	duration: number; // Load time in ms
}

export interface BudgetReport {
	timestamp: number;
	resources: ResourceEntry[];
	totals: Record<ResourceEntry["type"], number>;
	violations: string[];
	score: number; // 0-100
}

// ── Default Budget ─────────────────────────────────────────

export const DEFAULT_BUDGET: PerformanceBudget = {
	maxJSBytes: 102_400, // 100KB
	maxCSSBytes: 30_720, // 30KB
	maxTotalBytes: 512_000, // 500KB
	maxFontBytes: 51_200, // 50KB
	maxImageBytes: 204_800, // 200KB
};

// ── Resource Analysis ──────────────────────────────────────

function getResourceType(
	entry: PerformanceResourceTiming,
): ResourceEntry["type"] {
	const name = entry.name.toLowerCase();
	const initiator = entry.initiatorType;

	if (initiator === "script" || name.endsWith(".js") || name.endsWith(".mjs")) {
		return "script";
	}
	if (initiator === "css" || name.endsWith(".css")) {
		return "stylesheet";
	}
	if (
		initiator === "font" ||
		name.endsWith(".woff2") ||
		name.endsWith(".woff") ||
		name.endsWith(".ttf")
	) {
		return "font";
	}
	if (
		initiator === "img" ||
		name.endsWith(".png") ||
		name.endsWith(".jpg") ||
		name.endsWith(".jpeg") ||
		name.endsWith(".webp") ||
		name.endsWith(".svg") ||
		name.endsWith(".gif") ||
		name.endsWith(".avif")
	) {
		return "image";
	}
	return "other";
}

/**
 * Analyze current page resources against a performance budget.
 * Uses the Resource Timing API to measure transfer sizes.
 */
export function analyzeResources(
	budget: PerformanceBudget = DEFAULT_BUDGET,
): BudgetReport {
	if (typeof window === "undefined" || !performance.getEntriesByType) {
		return {
			timestamp: Date.now(),
			resources: [],
			totals: { script: 0, stylesheet: 0, font: 0, image: 0, other: 0 },
			violations: [],
			score: 100,
		};
	}

	const entries = performance.getEntriesByType(
		"resource",
	) as PerformanceResourceTiming[];

	const resources: ResourceEntry[] = entries.map((entry) => ({
		name: entry.name.split("/").pop() || entry.name,
		type: getResourceType(entry),
		transferSize: entry.transferSize,
		decodedSize: entry.decodedBodySize,
		duration: Math.round(entry.duration),
	}));

	// Sum by type
	const totals: Record<ResourceEntry["type"], number> = {
		script: 0,
		stylesheet: 0,
		font: 0,
		image: 0,
		other: 0,
	};

	for (const r of resources) {
		totals[r.type] += r.transferSize;
	}

	// Check violations
	const violations: string[] = [];

	if (totals.script > budget.maxJSBytes) {
		violations.push(
			`JS bundle ${formatBytes(totals.script)} exceeds ${formatBytes(budget.maxJSBytes)} budget`,
		);
	}

	if (totals.stylesheet > budget.maxCSSBytes) {
		violations.push(
			`CSS ${formatBytes(totals.stylesheet)} exceeds ${formatBytes(budget.maxCSSBytes)} budget`,
		);
	}

	if (totals.font > budget.maxFontBytes) {
		violations.push(
			`Fonts ${formatBytes(totals.font)} exceeds ${formatBytes(budget.maxFontBytes)} budget`,
		);
	}

	if (totals.image > budget.maxImageBytes) {
		violations.push(
			`Images ${formatBytes(totals.image)} exceeds ${formatBytes(budget.maxImageBytes)} budget`,
		);
	}

	const totalTransfer = Object.values(totals).reduce((a, b) => a + b, 0);
	if (totalTransfer > budget.maxTotalBytes) {
		violations.push(
			`Total ${formatBytes(totalTransfer)} exceeds ${formatBytes(budget.maxTotalBytes)} budget`,
		);
	}

	// Score: 100 - penalties for violations
	const penaltyPerViolation = 15;
	const score = Math.max(0, 100 - violations.length * penaltyPerViolation);

	return {
		timestamp: Date.now(),
		resources,
		totals,
		violations,
		score,
	};
}

/**
 * Get the largest resources by transfer size.
 * Useful for identifying optimization targets.
 */
export function getLargestResources(limit = 10): ResourceEntry[] {
	const report = analyzeResources();
	return report.resources
		.sort((a, b) => b.transferSize - a.transferSize)
		.slice(0, limit);
}

// ── Formatting ─────────────────────────────────────────────

export function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
