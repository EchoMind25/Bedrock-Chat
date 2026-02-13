"use client";

import { useEffect, useState } from "react";
import {
	initPerformanceObservers,
	getPerformanceMetrics,
	startHealthMonitoring,
	type PerformanceMetrics,
} from "@/lib/performance";

/**
 * Hook to monitor performance metrics.
 * Initializes observers on mount and provides current metrics.
 * Health checks are logged every 10s in dev mode only.
 */
export function usePerformanceMonitor(): PerformanceMetrics {
	const [metrics, setMetrics] = useState<PerformanceMetrics>({
		longTasks: 0,
		layoutShifts: 0,
	});

	useEffect(() => {
		const cleanupObservers = initPerformanceObservers();
		const cleanupHealth = startHealthMonitoring(10_000);

		const interval = setInterval(() => {
			setMetrics(getPerformanceMetrics());
		}, 5_000);

		return () => {
			cleanupObservers();
			cleanupHealth();
			clearInterval(interval);
		};
	}, []);

	return metrics;
}
