/**
 * Unified performance monitoring system.
 * Collects Web Vitals, custom metrics, and resource data.
 * Privacy-first: opt-in only, no user identification, self-hosted.
 *
 * Metrics collected:
 * - Core Web Vitals (LCP, FID/INP, CLS)
 * - Custom: message latency, WebSocket stability, idle/active time
 * - Resource: memory, CPU, bundle sizes
 */

import {
	ResourceTracker,
	IDLE_BUDGET,
	ACTIVE_BUDGET,
	type ResourceSnapshot,
	type BudgetViolation,
} from "./resource-tracking";
import { analyzeResources, type BudgetReport } from "./bundle-analyzer";

// ── Types ──────────────────────────────────────────────────

export interface WebVitals {
	lcp: number | null; // Largest Contentful Paint (ms)
	fid: number | null; // First Input Delay (ms)
	cls: number | null; // Cumulative Layout Shift
	inp: number | null; // Interaction to Next Paint (ms)
	ttfb: number | null; // Time to First Byte (ms)
	fcp: number | null; // First Contentful Paint (ms)
}

export interface CustomMetrics {
	messageSendLatency: number[]; // Recent send latencies (ms)
	wsConnectionUptime: number; // 0-100 percentage
	wsReconnects: number; // Count of reconnections
	idleTimeMs: number; // Total idle time this session
	activeTimeMs: number; // Total active time this session
	routeChangeLatency: number[]; // Recent navigation times (ms)
}

export interface PerformanceAlert {
	id: string;
	type: "memory" | "cpu" | "vitals" | "budget" | "stability";
	message: string;
	severity: "info" | "warning" | "critical";
	timestamp: number;
	value: number;
	threshold: number;
}

export interface MonitoringState {
	vitals: WebVitals;
	custom: CustomMetrics;
	latestSnapshot: ResourceSnapshot | null;
	budgetReport: BudgetReport | null;
	alerts: PerformanceAlert[];
	isCollecting: boolean;
	telemetryOptIn: boolean;
}

// ── Alert Thresholds ───────────────────────────────────────

const THRESHOLDS = {
	lcp: { warning: 2500, critical: 4000 },
	fid: { warning: 100, critical: 300 },
	cls: { warning: 0.1, critical: 0.25 },
	inp: { warning: 200, critical: 500 },
	memoryIdleMB: { warning: 50, critical: 75 },
	memoryActiveMB: { warning: 150, critical: 200 },
	cpuIdlePercent: { warning: 2, critical: 5 },
	cpuActivePercent: { warning: 10, critical: 20 },
};

// ── Performance Monitor ────────────────────────────────────

let monitorInstance: PerformanceMonitor | null = null;

export class PerformanceMonitor {
	private tracker: ResourceTracker;
	private vitals: WebVitals = {
		lcp: null,
		fid: null,
		cls: null,
		inp: null,
		ttfb: null,
		fcp: null,
	};
	private custom: CustomMetrics = {
		messageSendLatency: [],
		wsConnectionUptime: 100,
		wsReconnects: 0,
		idleTimeMs: 0,
		activeTimeMs: 0,
		routeChangeLatency: [],
	};
	private alerts: PerformanceAlert[] = [];
	private observers: PerformanceObserver[] = [];
	private listeners: Set<(state: MonitoringState) => void> = new Set();
	private idleStartTime: number | null = null;
	private activeStartTime: number = Date.now();
	private isIdle = false;
	private alertIdCounter = 0;
	private readonly maxAlerts = 50;
	private readonly maxLatencySamples = 100;

	static getInstance(): PerformanceMonitor {
		if (!monitorInstance) {
			monitorInstance = new PerformanceMonitor();
		}
		return monitorInstance;
	}

	private constructor() {
		this.tracker = ResourceTracker.getInstance();
	}

	/**
	 * Start all monitoring. Call once on app mount.
	 */
	start(): () => void {
		if (typeof window === "undefined") return () => {};

		// Start resource tracking
		this.tracker.start(5000);

		// Set up Web Vitals observers
		this.initWebVitals();

		// Listen for resource snapshots to check thresholds
		const unsubSnapshot = this.tracker.onSnapshot((snapshot) => {
			this.checkSnapshotThresholds(snapshot);
			this.notifyListeners();
		});

		// Navigation timing for TTFB
		this.collectNavigationTiming();

		return () => {
			this.tracker.stop();
			for (const obs of this.observers) {
				obs.disconnect();
			}
			this.observers = [];
			unsubSnapshot();
		};
	}

	private initWebVitals(): void {
		const supported = PerformanceObserver.supportedEntryTypes;

		// LCP
		if (supported.includes("largest-contentful-paint")) {
			const obs = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				const last = entries[entries.length - 1];
				if (last) {
					this.vitals.lcp = Math.round(last.startTime);
					this.checkVitalThreshold("lcp", this.vitals.lcp);
				}
			});
			obs.observe({ type: "largest-contentful-paint", buffered: true });
			this.observers.push(obs);
		}

		// FID
		if (supported.includes("first-input")) {
			const obs = new PerformanceObserver((list) => {
				const entry = list.getEntries()[0] as PerformanceEntry & {
					processingStart: number;
				};
				if (entry) {
					this.vitals.fid = Math.round(
						entry.processingStart - entry.startTime,
					);
					this.checkVitalThreshold("fid", this.vitals.fid);
				}
			});
			obs.observe({ type: "first-input", buffered: true });
			this.observers.push(obs);
		}

		// CLS
		if (supported.includes("layout-shift")) {
			let clsValue = 0;
			const obs = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					const shift = entry as PerformanceEntry & {
						hadRecentInput: boolean;
						value: number;
					};
					if (!shift.hadRecentInput) {
						clsValue += shift.value;
						this.vitals.cls =
							Math.round(clsValue * 1000) / 1000;
					}
				}
				this.checkVitalThreshold("cls", this.vitals.cls!);
			});
			obs.observe({ type: "layout-shift", buffered: true });
			this.observers.push(obs);
		}

		// INP (Interaction to Next Paint)
		if (supported.includes("event")) {
			let maxINP = 0;
			const obs = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					const evt = entry as PerformanceEntry & {
						processingStart: number;
						processingEnd: number;
					};
					const duration = entry.duration;
					if (duration > maxINP) {
						maxINP = duration;
						this.vitals.inp = Math.round(duration);
						this.checkVitalThreshold("inp", this.vitals.inp);
					}
				}
			});
			obs.observe({ type: "event", buffered: true });
			this.observers.push(obs);
		}

		// FCP
		if (supported.includes("paint")) {
			const obs = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (entry.name === "first-contentful-paint") {
						this.vitals.fcp = Math.round(entry.startTime);
					}
				}
			});
			obs.observe({ type: "paint", buffered: true });
			this.observers.push(obs);
		}
	}

	private collectNavigationTiming(): void {
		// Use requestIdleCallback to avoid blocking
		const callback = () => {
			const nav = performance.getEntriesByType(
				"navigation",
			)[0] as PerformanceNavigationTiming | undefined;
			if (nav) {
				this.vitals.ttfb = Math.round(
					nav.responseStart - nav.requestStart,
				);
			}
		};

		if ("requestIdleCallback" in window) {
			requestIdleCallback(callback);
		} else {
			setTimeout(callback, 0);
		}
	}

	private checkVitalThreshold(
		vital: "lcp" | "fid" | "cls" | "inp",
		value: number,
	): void {
		const threshold = THRESHOLDS[vital];
		if (value > threshold.critical) {
			this.addAlert({
				type: "vitals",
				message: `${vital.toUpperCase()} is ${value}${vital === "cls" ? "" : "ms"} (critical threshold: ${threshold.critical})`,
				severity: "critical",
				value,
				threshold: threshold.critical,
			});
		} else if (value > threshold.warning) {
			this.addAlert({
				type: "vitals",
				message: `${vital.toUpperCase()} is ${value}${vital === "cls" ? "" : "ms"} (warning threshold: ${threshold.warning})`,
				severity: "warning",
				value,
				threshold: threshold.warning,
			});
		}
	}

	private checkSnapshotThresholds(snapshot: ResourceSnapshot): void {
		const isIdle = this.isIdle;
		const memThreshold = isIdle
			? THRESHOLDS.memoryIdleMB
			: THRESHOLDS.memoryActiveMB;
		const cpuThreshold = isIdle
			? THRESHOLDS.cpuIdlePercent
			: THRESHOLDS.cpuActivePercent;

		if (snapshot.memoryMB > 0 && snapshot.memoryMB > memThreshold.critical) {
			this.addAlert({
				type: "memory",
				message: `Memory ${snapshot.memoryMB}MB exceeds ${isIdle ? "idle" : "active"} limit (${memThreshold.critical}MB)`,
				severity: "critical",
				value: snapshot.memoryMB,
				threshold: memThreshold.critical,
			});
		}

		if (snapshot.cpuEstimate > cpuThreshold.warning) {
			this.addAlert({
				type: "cpu",
				message: `CPU ${snapshot.cpuEstimate}% exceeds ${isIdle ? "idle" : "active"} limit (${cpuThreshold.warning}%)`,
				severity:
					snapshot.cpuEstimate > cpuThreshold.critical
						? "critical"
						: "warning",
				value: snapshot.cpuEstimate,
				threshold: cpuThreshold.warning,
			});
		}
	}

	private addAlert(
		alert: Omit<PerformanceAlert, "id" | "timestamp">,
	): void {
		const newAlert: PerformanceAlert = {
			...alert,
			id: `alert-${++this.alertIdCounter}`,
			timestamp: Date.now(),
		};

		this.alerts.push(newAlert);
		if (this.alerts.length > this.maxAlerts) {
			this.alerts.shift();
		}

		if (
			process.env.NODE_ENV === "development" &&
			alert.severity === "critical"
		) {
			console.warn(`[perf-alert] ${alert.message}`);
		}
	}

	// ── Public API: Record Custom Metrics ──────────────────

	recordMessageLatency(latencyMs: number): void {
		this.custom.messageSendLatency.push(latencyMs);
		if (this.custom.messageSendLatency.length > this.maxLatencySamples) {
			this.custom.messageSendLatency.shift();
		}
	}

	recordRouteChange(latencyMs: number): void {
		this.custom.routeChangeLatency.push(latencyMs);
		if (this.custom.routeChangeLatency.length > this.maxLatencySamples) {
			this.custom.routeChangeLatency.shift();
		}
	}

	recordWSReconnect(): void {
		this.custom.wsReconnects++;
	}

	setWSUptime(percent: number): void {
		this.custom.wsConnectionUptime = Math.round(percent * 10) / 10;
	}

	setIdleState(idle: boolean): void {
		const now = Date.now();
		if (idle && !this.isIdle) {
			// Transitioning to idle
			this.idleStartTime = now;
			if (this.activeStartTime) {
				this.custom.activeTimeMs += now - this.activeStartTime;
			}
		} else if (!idle && this.isIdle) {
			// Transitioning to active
			this.activeStartTime = now;
			if (this.idleStartTime) {
				this.custom.idleTimeMs += now - this.idleStartTime;
			}
		}
		this.isIdle = idle;
	}

	// ── Public API: Read State ─────────────────────────────

	getState(): MonitoringState {
		return {
			vitals: { ...this.vitals },
			custom: {
				...this.custom,
				messageSendLatency: [...this.custom.messageSendLatency],
				routeChangeLatency: [...this.custom.routeChangeLatency],
			},
			latestSnapshot: this.tracker.takeSnapshot(),
			budgetReport: analyzeResources(),
			alerts: [...this.alerts],
			isCollecting: true,
			telemetryOptIn: false,
		};
	}

	getVitals(): WebVitals {
		return { ...this.vitals };
	}

	getAlerts(): PerformanceAlert[] {
		return [...this.alerts];
	}

	clearAlerts(): void {
		this.alerts = [];
	}

	/**
	 * Get percentile values for a metric array.
	 */
	getPercentiles(values: number[]): {
		p50: number;
		p95: number;
		p99: number;
	} {
		if (values.length === 0) return { p50: 0, p95: 0, p99: 0 };
		const sorted = [...values].sort((a, b) => a - b);
		return {
			p50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
			p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
			p99: sorted[Math.floor(sorted.length * 0.99)] ?? 0,
		};
	}

	/**
	 * Get budget violations for current idle/active state.
	 */
	getBudgetViolations(): BudgetViolation[] {
		const budget = this.isIdle ? IDLE_BUDGET : ACTIVE_BUDGET;
		return this.tracker.checkBudget(budget);
	}

	/**
	 * Generate a summary suitable for privacy-first telemetry.
	 * Contains only aggregate metrics, no user identification.
	 */
	getTelemetrySummary(): Record<string, number | null> {
		const snapshot = this.tracker.takeSnapshot();
		const latencyPercentiles = this.getPercentiles(
			this.custom.messageSendLatency,
		);

		return {
			lcp: this.vitals.lcp,
			fid: this.vitals.fid,
			cls: this.vitals.cls,
			inp: this.vitals.inp,
			ttfb: this.vitals.ttfb,
			fcp: this.vitals.fcp,
			memoryMB: snapshot.memoryMB || null,
			cpuPercent: snapshot.cpuEstimate,
			fps: snapshot.fps,
			domNodes: snapshot.domNodes,
			activeAnimations: snapshot.activeAnimations,
			msgLatencyP50: latencyPercentiles.p50,
			msgLatencyP95: latencyPercentiles.p95,
			wsUptime: this.custom.wsConnectionUptime,
			wsReconnects: this.custom.wsReconnects,
		};
	}

	onStateChange(listener: (state: MonitoringState) => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notifyListeners(): void {
		const state = this.getState();
		for (const listener of this.listeners) {
			listener(state);
		}
	}
}
