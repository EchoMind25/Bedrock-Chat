/**
 * Web Vitals and custom performance metric collection.
 * Uses PerformanceObserver API — no third-party libraries.
 * All collection is deferred via requestIdleCallback to avoid blocking the main thread.
 */

type TrackFn = (name: string, durationMs: number, isError?: boolean) => void;

/**
 * Initialize performance observers for Web Vitals and navigation timing.
 * @returns cleanup function to disconnect all observers
 */
export function initPerformanceObserver(track: TrackFn): () => void {
	if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") {
		return () => {};
	}

	const observers: PerformanceObserver[] = [];
	const defer =
		typeof requestIdleCallback !== "undefined"
			? (fn: () => void) => requestIdleCallback(fn, { timeout: 2000 })
			: (fn: () => void) => setTimeout(fn, 0);

	// LCP — Largest Contentful Paint
	try {
		const lcpObserver = new PerformanceObserver((list) => {
			const entries = list.getEntries();
			const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
			if (last) {
				defer(() => track("lcp", Math.round(last.startTime)));
			}
		});
		lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
		observers.push(lcpObserver);
	} catch {
		// Browser doesn't support this entry type
	}

	// FCP — First Contentful Paint
	try {
		const fcpObserver = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				if (entry.name === "first-contentful-paint") {
					defer(() => track("fcp", Math.round(entry.startTime)));
					break;
				}
			}
		});
		fcpObserver.observe({ type: "paint", buffered: true });
		observers.push(fcpObserver);
	} catch {
		// Not supported
	}

	// CLS — Cumulative Layout Shift
	try {
		let clsValue = 0;
		const clsObserver = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
				if (!shift.hadRecentInput) {
					clsValue += shift.value;
				}
			}
		});
		clsObserver.observe({ type: "layout-shift", buffered: true });
		observers.push(clsObserver);

		// Report CLS on page hide
		const reportCls = () => {
			if (clsValue > 0) {
				// CLS is a score (not ms) — multiply by 1000 for storage consistency
				track("cls", Math.round(clsValue * 1000));
			}
		};
		window.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "hidden") reportCls();
		});
	} catch {
		// Not supported
	}

	// INP — Interaction to Next Paint (if available)
	try {
		const inpObserver = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				const interaction = entry as PerformanceEntry & { duration: number };
				defer(() => track("inp", Math.round(interaction.duration)));
			}
		});
		inpObserver.observe({ type: "event", durationThreshold: 40, buffered: true });
		observers.push(inpObserver);
	} catch {
		// Not supported in all browsers
	}

	// Navigation timing — TTFB and page_load
	defer(() => {
		try {
			const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
			if (nav) {
				const ttfb = Math.round(nav.responseStart - nav.requestStart);
				const pageLoad = Math.round(nav.loadEventEnd - nav.startTime);
				if (ttfb > 0) track("ttfb", ttfb);
				if (pageLoad > 0) track("page_load", pageLoad);
			}
		} catch {
			// Not supported
		}
	});

	return () => {
		for (const obs of observers) {
			try {
				obs.disconnect();
			} catch {
				// Ignore disconnect errors
			}
		}
	};
}
