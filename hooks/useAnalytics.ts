"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAnalyticsCollector } from "@/providers/AnalyticsProvider";
import type { ErrorType, FeatureEventKey } from "@/lib/analytics/events";

/**
 * React hook that provides analytics tracking helpers.
 *
 * - Page views are tracked automatically on route changes.
 * - Feature, performance, and error tracking is done manually via returned functions.
 * - All functions are stable references (useCallback with empty deps).
 *
 * Usage:
 *   const { trackFeature } = useAnalytics();
 *   trackFeature('VOICE_CHANNEL_JOIN');
 */
export function useAnalytics() {
	const collector = useAnalyticsCollector();
	const pathname = usePathname();
	const prevPathRef = useRef<string | null>(null);

	// Auto-track page views on route changes
	useEffect(() => {
		if (!collector) return;
		const prev = prevPathRef.current;
		collector.trackPageView(pathname, prev ?? undefined);
		prevPathRef.current = pathname;
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname]);

	const trackFeature = useCallback(
		(key: FeatureEventKey, extraData?: Record<string, string | number | boolean>) => {
			collector?.trackFeature(key, extraData);
		},
		// collector ref is stable within a session
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	const trackPerformance = useCallback(
		(name: string, durationMs: number, isError = false) => {
			collector?.trackPerformance(name, durationMs, isError);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	const trackError = useCallback(
		(type: ErrorType, message: string, stack?: string) => {
			collector?.trackError(type, message, stack);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	return { trackFeature, trackPerformance, trackError };
}
