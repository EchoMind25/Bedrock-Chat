import { create } from "zustand";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import {
	PerformanceMonitor,
	type MonitoringState,
	type WebVitals,
	type CustomMetrics,
	type PerformanceAlert,
} from "@/lib/performance/monitoring";
import type { ResourceSnapshot } from "@/lib/performance/resource-tracking";
import type { BudgetReport } from "@/lib/performance/bundle-analyzer";

// ── State Interface ────────────────────────────────────────

interface PerformanceState {
	// Monitoring data
	vitals: WebVitals;
	custom: CustomMetrics;
	latestSnapshot: ResourceSnapshot | null;
	budgetReport: BudgetReport | null;
	alerts: PerformanceAlert[];

	// UI state
	isCollecting: boolean;
	isOverlayVisible: boolean;
	isDashboardOpen: boolean;

	// Privacy
	telemetryOptIn: boolean;

	// History for charts (last 30 min, sampled every 5s = 360 entries)
	snapshotHistory: ResourceSnapshot[];

	// Actions
	updateFromMonitor: (state: MonitoringState) => void;
	pushSnapshot: (snapshot: ResourceSnapshot) => void;
	toggleOverlay: () => void;
	toggleDashboard: () => void;
	setTelemetryOptIn: (optIn: boolean) => void;
	clearAlerts: () => void;
}

// ── Store ──────────────────────────────────────────────────

export const usePerformanceStore = create<PerformanceState>()(
	conditionalDevtools(
		(set) => ({
			vitals: {
				lcp: null,
				fid: null,
				cls: null,
				inp: null,
				ttfb: null,
				fcp: null,
			},
			custom: {
				messageSendLatency: [],
				wsConnectionUptime: 100,
				wsReconnects: 0,
				idleTimeMs: 0,
				activeTimeMs: 0,
				routeChangeLatency: [],
			},
			latestSnapshot: null,
			budgetReport: null,
			alerts: [],
			isCollecting: false,
			isOverlayVisible: false,
			isDashboardOpen: false,
			telemetryOptIn: false,
			snapshotHistory: [],

			updateFromMonitor: (state) =>
				set({
					vitals: state.vitals,
					custom: state.custom,
					latestSnapshot: state.latestSnapshot,
					budgetReport: state.budgetReport,
					alerts: state.alerts,
					isCollecting: state.isCollecting,
				}),

			pushSnapshot: (snapshot) =>
				set((s) => ({
					snapshotHistory: [...s.snapshotHistory, snapshot].slice(-360),
					latestSnapshot: snapshot,
				})),

			toggleOverlay: () =>
				set((s) => ({ isOverlayVisible: !s.isOverlayVisible })),

			toggleDashboard: () =>
				set((s) => ({ isDashboardOpen: !s.isDashboardOpen })),

			setTelemetryOptIn: (optIn) => set({ telemetryOptIn: optIn }),

			clearAlerts: () => set({ alerts: [] }),
		}),
		{ name: "PerformanceStore" },
	),
);

// ── Initialization Helper ──────────────────────────────────

/**
 * Initialize the performance monitoring pipeline.
 * Connects PerformanceMonitor → PerformanceStore.
 * Call once on app mount. Returns cleanup function.
 */
export function initPerformanceMonitoring(): () => void {
	if (typeof window === "undefined") return () => {};

	const monitor = PerformanceMonitor.getInstance();
	const cleanupMonitor = monitor.start();

	// Pipe monitor state updates to the store
	const unsubscribe = monitor.onStateChange((state) => {
		usePerformanceStore.getState().updateFromMonitor(state);
		if (state.latestSnapshot) {
			usePerformanceStore.getState().pushSnapshot(state.latestSnapshot);
		}
	});

	// Mark as collecting
	usePerformanceStore.setState({ isCollecting: true });

	return () => {
		cleanupMonitor();
		unsubscribe();
		usePerformanceStore.setState({ isCollecting: false });
	};
}
