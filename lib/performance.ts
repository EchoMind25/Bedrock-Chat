/**
 * Performance Monitoring Utilities
 * Tracks long tasks, memory usage, layout shifts, FCP, LCP
 * Provides health checks and CSS containment helpers
 *
 * Targets: <50MB RAM, <2% CPU idle (gamer-safe)
 */

export interface PerformanceMetrics {
	longTasks: number;
	layoutShifts: number;
	memory?: {
		usedJSHeapSize: number;
		totalJSHeapSize: number;
		jsHeapSizeLimit: number;
	};
}

export interface HealthCheck {
	timestamp: number;
	memoryMB: number;
	domNodeCount: number;
	activeAnimations: number;
	longTaskCount: number;
}

let longTaskCount = 0;
let layoutShiftScore = 0;

/**
 * Initialize performance observers.
 * Call once on app mount. Returns cleanup function.
 */
export function initPerformanceObservers(): () => void {
	if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
		return () => {};
	}

	const observers: PerformanceObserver[] = [];
	const supported = PerformanceObserver.supportedEntryTypes;

	if (supported.includes("longtask")) {
		const obs = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				longTaskCount++;
				if (process.env.NODE_ENV === "development") {
					console.warn(`[perf] Long task: ${entry.duration.toFixed(1)}ms`);
				}
			}
		});
		obs.observe({ entryTypes: ["longtask"] });
		observers.push(obs);
	}

	if (supported.includes("layout-shift")) {
		const obs = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				if (!(entry as PerformanceEntry & { hadRecentInput: boolean }).hadRecentInput) {
					layoutShiftScore += (entry as PerformanceEntry & { value: number }).value;
				}
			}
		});
		obs.observe({ entryTypes: ["layout-shift"] });
		observers.push(obs);
	}

	if (supported.includes("paint")) {
		const obs = new PerformanceObserver((list) => {
			if (process.env.NODE_ENV === "development") {
				for (const entry of list.getEntries()) {
					console.log(`[perf] ${entry.name}: ${entry.startTime.toFixed(1)}ms`);
				}
			}
		});
		obs.observe({ entryTypes: ["paint"] });
		observers.push(obs);
	}

	if (supported.includes("largest-contentful-paint")) {
		const obs = new PerformanceObserver((list) => {
			if (process.env.NODE_ENV === "development") {
				for (const entry of list.getEntries()) {
					console.log(`[perf] LCP: ${entry.startTime.toFixed(1)}ms`);
				}
			}
		});
		obs.observe({ entryTypes: ["largest-contentful-paint"] });
		observers.push(obs);
	}

	return () => {
		for (const obs of observers) {
			obs.disconnect();
		}
	};
}

/**
 * Get current memory usage in MB (Chrome only).
 */
export function getMemoryUsage(): PerformanceMetrics["memory"] | undefined {
	const perf = performance as Performance & {
		memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
	};
	if (perf.memory) {
		return {
			usedJSHeapSize: perf.memory.usedJSHeapSize / 1024 / 1024,
			totalJSHeapSize: perf.memory.totalJSHeapSize / 1024 / 1024,
			jsHeapSizeLimit: perf.memory.jsHeapSizeLimit / 1024 / 1024,
		};
	}
	return undefined;
}

/**
 * Get aggregate performance metrics.
 */
export function getPerformanceMetrics(): PerformanceMetrics {
	return {
		longTasks: longTaskCount,
		layoutShifts: layoutShiftScore,
		memory: getMemoryUsage(),
	};
}

/**
 * Run a health check. Logs to console in dev mode.
 */
export function performHealthCheck(): HealthCheck {
	const memory = getMemoryUsage();
	const check: HealthCheck = {
		timestamp: Date.now(),
		memoryMB: memory?.usedJSHeapSize ?? 0,
		domNodeCount: document.getElementsByTagName("*").length,
		activeAnimations: document.getAnimations().length,
		longTaskCount,
	};

	if (process.env.NODE_ENV === "development") {
		console.table(check);
	}

	return check;
}

/**
 * Start periodic health checks (dev only).
 * Returns cleanup function.
 */
export function startHealthMonitoring(intervalMs = 10000): () => void {
	if (process.env.NODE_ENV !== "development") {
		return () => {};
	}

	const interval = setInterval(performHealthCheck, intervalMs);
	return () => clearInterval(interval);
}
