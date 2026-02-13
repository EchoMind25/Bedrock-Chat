/**
 * Resource tracking for RAM and CPU estimation.
 * Uses frame-time analysis for CPU load estimation
 * and performance.memory for heap tracking (Chrome).
 *
 * Targets: <50MB RAM idle, <2% CPU idle
 */

// ── Types ──────────────────────────────────────────────────

export interface ResourceSnapshot {
	timestamp: number;
	memoryMB: number; // JS heap used (0 if unavailable)
	cpuEstimate: number; // 0-100 percentage estimate
	fps: number; // Frames per second
	domNodes: number;
	activeAnimations: number;
	listenerCount: number; // Estimated event listeners
}

export interface ResourceBudget {
	maxMemoryMB: number; // 50 idle, 150 active
	maxCPUPercent: number; // 2 idle, 10 active
	maxDOMNodes: number; // 1500
	maxAnimations: number; // 20 idle, 60 active
}

export interface BudgetViolation {
	metric: keyof ResourceBudget;
	current: number;
	limit: number;
	severity: "warning" | "critical";
}

// ── Constants ──────────────────────────────────────────────

export const IDLE_BUDGET: ResourceBudget = {
	maxMemoryMB: 50,
	maxCPUPercent: 2,
	maxDOMNodes: 1500,
	maxAnimations: 20,
};

export const ACTIVE_BUDGET: ResourceBudget = {
	maxMemoryMB: 150,
	maxCPUPercent: 10,
	maxDOMNodes: 3000,
	maxAnimations: 60,
};

// ── CPU Estimation via Frame Time ──────────────────────────

/**
 * CPU load estimator based on requestAnimationFrame timing.
 * Measures how much of each 16.67ms frame budget is consumed.
 *
 * Method: Compare actual frame deltas to ideal 60fps frame time.
 * Longer frames = higher CPU usage.
 */
class CPUEstimator {
	private frameTimes: number[] = [];
	private lastFrameTime = 0;
	private rafId = 0;
	private running = false;
	private readonly maxSamples = 60; // 1 second of data at 60fps

	start(): void {
		if (this.running || typeof window === "undefined") return;
		this.running = true;
		this.lastFrameTime = performance.now();
		this.tick();
	}

	stop(): void {
		this.running = false;
		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = 0;
		}
	}

	private tick = (): void => {
		if (!this.running) return;

		const now = performance.now();
		const delta = now - this.lastFrameTime;
		this.lastFrameTime = now;

		// Only record reasonable deltas (skip tab-backgrounded frames)
		if (delta > 0 && delta < 200) {
			this.frameTimes.push(delta);
			if (this.frameTimes.length > this.maxSamples) {
				this.frameTimes.shift();
			}
		}

		this.rafId = requestAnimationFrame(this.tick);
	};

	/**
	 * Estimate CPU percentage from frame times.
	 * Ideal: 16.67ms frames (60fps) = low CPU.
	 * Degraded: >16.67ms = proportionally higher CPU.
	 */
	getEstimate(): { cpuPercent: number; fps: number } {
		if (this.frameTimes.length < 5) {
			return { cpuPercent: 0, fps: 60 };
		}

		const avgFrameTime =
			this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;

		// FPS calculation
		const fps = Math.min(60, Math.round(1000 / avgFrameTime));

		// CPU estimate: ratio of frame time to idle frame time
		// At true idle, frames should be very close to 16.67ms
		// We subtract the baseline (requestAnimationFrame overhead ~0.5ms)
		const IDEAL_FRAME = 16.67;
		const BASELINE_OVERHEAD = 0.5;
		const workTime = Math.max(0, avgFrameTime - IDEAL_FRAME + BASELINE_OVERHEAD);

		// Scale: 0ms work = 0% CPU, 16.67ms work = 100% CPU
		const cpuPercent = Math.min(100, (workTime / IDEAL_FRAME) * 100);

		return {
			cpuPercent: Math.round(cpuPercent * 10) / 10,
			fps,
		};
	}

	getFrameTimes(): readonly number[] {
		return this.frameTimes;
	}
}

// ── Memory Tracking ────────────────────────────────────────

interface PerformanceMemory {
	usedJSHeapSize: number;
	totalJSHeapSize: number;
	jsHeapSizeLimit: number;
}

function getMemoryMB(): number {
	const perf = performance as Performance & { memory?: PerformanceMemory };
	if (perf.memory) {
		return Math.round((perf.memory.usedJSHeapSize / 1024 / 1024) * 10) / 10;
	}
	return 0;
}

// ── DOM Metrics ────────────────────────────────────────────

function getDOMNodeCount(): number {
	return document.getElementsByTagName("*").length;
}

function getActiveAnimationCount(): number {
	return document.getAnimations().length;
}

// ── Resource Tracker ───────────────────────────────────────

let trackerInstance: ResourceTracker | null = null;

export class ResourceTracker {
	private cpuEstimator = new CPUEstimator();
	private history: ResourceSnapshot[] = [];
	private intervalId: ReturnType<typeof setInterval> | null = null;
	private listeners: Set<(snapshot: ResourceSnapshot) => void> = new Set();
	private readonly maxHistory = 360; // 30 min at 5s intervals

	static getInstance(): ResourceTracker {
		if (!trackerInstance) {
			trackerInstance = new ResourceTracker();
		}
		return trackerInstance;
	}

	start(intervalMs = 5000): void {
		if (typeof window === "undefined") return;

		this.cpuEstimator.start();

		// Take snapshots at interval
		this.intervalId = setInterval(() => {
			const snapshot = this.takeSnapshot();
			this.history.push(snapshot);
			if (this.history.length > this.maxHistory) {
				this.history.shift();
			}
			for (const listener of this.listeners) {
				listener(snapshot);
			}
		}, intervalMs);
	}

	stop(): void {
		this.cpuEstimator.stop();
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	takeSnapshot(): ResourceSnapshot {
		const { cpuPercent, fps } = this.cpuEstimator.getEstimate();

		return {
			timestamp: Date.now(),
			memoryMB: getMemoryMB(),
			cpuEstimate: cpuPercent,
			fps,
			domNodes: getDOMNodeCount(),
			activeAnimations: getActiveAnimationCount(),
			listenerCount: 0, // Not reliably measurable
		};
	}

	/**
	 * Check current resources against a budget.
	 * Returns violations sorted by severity.
	 */
	checkBudget(budget: ResourceBudget): BudgetViolation[] {
		const snapshot = this.takeSnapshot();
		const violations: BudgetViolation[] = [];

		if (snapshot.memoryMB > 0 && snapshot.memoryMB > budget.maxMemoryMB) {
			violations.push({
				metric: "maxMemoryMB",
				current: snapshot.memoryMB,
				limit: budget.maxMemoryMB,
				severity: snapshot.memoryMB > budget.maxMemoryMB * 1.5 ? "critical" : "warning",
			});
		}

		if (snapshot.cpuEstimate > budget.maxCPUPercent) {
			violations.push({
				metric: "maxCPUPercent",
				current: snapshot.cpuEstimate,
				limit: budget.maxCPUPercent,
				severity: snapshot.cpuEstimate > budget.maxCPUPercent * 2 ? "critical" : "warning",
			});
		}

		if (snapshot.domNodes > budget.maxDOMNodes) {
			violations.push({
				metric: "maxDOMNodes",
				current: snapshot.domNodes,
				limit: budget.maxDOMNodes,
				severity: snapshot.domNodes > budget.maxDOMNodes * 1.5 ? "critical" : "warning",
			});
		}

		if (snapshot.activeAnimations > budget.maxAnimations) {
			violations.push({
				metric: "maxAnimations",
				current: snapshot.activeAnimations,
				limit: budget.maxAnimations,
				severity:
					snapshot.activeAnimations > budget.maxAnimations * 2
						? "critical"
						: "warning",
			});
		}

		return violations.sort((a, b) =>
			a.severity === "critical" && b.severity !== "critical" ? -1 : 0,
		);
	}

	onSnapshot(listener: (snapshot: ResourceSnapshot) => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	getHistory(): readonly ResourceSnapshot[] {
		return this.history;
	}

	getAverages(windowMs = 60_000): {
		avgMemoryMB: number;
		avgCPU: number;
		avgFPS: number;
	} {
		const cutoff = Date.now() - windowMs;
		const recent = this.history.filter((s) => s.timestamp > cutoff);

		if (recent.length === 0) {
			return { avgMemoryMB: 0, avgCPU: 0, avgFPS: 60 };
		}

		const sum = recent.reduce(
			(acc, s) => ({
				mem: acc.mem + s.memoryMB,
				cpu: acc.cpu + s.cpuEstimate,
				fps: acc.fps + s.fps,
			}),
			{ mem: 0, cpu: 0, fps: 0 },
		);

		return {
			avgMemoryMB: Math.round((sum.mem / recent.length) * 10) / 10,
			avgCPU: Math.round((sum.cpu / recent.length) * 10) / 10,
			avgFPS: Math.round(sum.fps / recent.length),
		};
	}
}
