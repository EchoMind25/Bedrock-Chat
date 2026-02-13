"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePerformanceStore } from "@/store/performance.store";
import { Glass } from "@/components/ui/glass/glass";
import { formatBytes } from "@/lib/performance/bundle-analyzer";

/**
 * Admin performance monitoring dashboard.
 * Shows real-time metrics, history charts, Web Vitals,
 * budget compliance, and alerts.
 *
 * Privacy-first: all data is local, no external tracking.
 */
export function PerformanceDashboard() {
	const isDashboardOpen = usePerformanceStore((s) => s.isDashboardOpen);
	const toggleDashboard = usePerformanceStore((s) => s.toggleDashboard);
	const vitals = usePerformanceStore((s) => s.vitals);
	const custom = usePerformanceStore((s) => s.custom);
	const latestSnapshot = usePerformanceStore((s) => s.latestSnapshot);
	const budgetReport = usePerformanceStore((s) => s.budgetReport);
	const alerts = usePerformanceStore((s) => s.alerts);
	const snapshotHistory = usePerformanceStore((s) => s.snapshotHistory);
	const clearAlerts = usePerformanceStore((s) => s.clearAlerts);
	const telemetryOptIn = usePerformanceStore((s) => s.telemetryOptIn);
	const setTelemetryOptIn = usePerformanceStore((s) => s.setTelemetryOptIn);

	// Calculate averages from history
	const averages = useMemo(() => {
		if (snapshotHistory.length === 0) {
			return { avgMemory: 0, avgCPU: 0, avgFPS: 60 };
		}
		// Last 60 seconds
		const cutoff = Date.now() - 60_000;
		const recent = snapshotHistory.filter((s) => s.timestamp > cutoff);
		if (recent.length === 0) {
			return { avgMemory: 0, avgCPU: 0, avgFPS: 60 };
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
			avgMemory: Math.round((sum.mem / recent.length) * 10) / 10,
			avgCPU: Math.round((sum.cpu / recent.length) * 10) / 10,
			avgFPS: Math.round(sum.fps / recent.length),
		};
	}, [snapshotHistory]);

	// Message latency percentiles
	const latencyStats = useMemo(() => {
		const vals = custom.messageSendLatency;
		if (vals.length === 0) return { p50: 0, p95: 0, p99: 0 };
		const sorted = [...vals].sort((a, b) => a - b);
		return {
			p50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
			p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
			p99: sorted[Math.floor(sorted.length * 0.99)] ?? 0,
		};
	}, [custom.messageSendLatency]);

	if (!isDashboardOpen) return null;

	const criticalCount = alerts.filter(
		(a) => a.severity === "critical",
	).length;
	const warningCount = alerts.filter(
		(a) => a.severity === "warning",
	).length;

	return (
		<AnimatePresence>
			<motion.div
				className="fixed inset-0 z-[90] flex items-center justify-center p-8"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
			>
				{/* Backdrop */}
				<div
					className="absolute inset-0 bg-black/60 backdrop-blur-sm"
					onClick={toggleDashboard}
				/>

				{/* Dashboard Panel */}
				<motion.div
					className="relative z-10 w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl scrollbar-thin"
					style={{
						background: "oklch(0.12 0.02 265 / 0.95)",
						border: "1px solid oklch(0.25 0.03 265 / 0.5)",
						boxShadow: "0 24px 64px oklch(0 0 0 / 0.6)",
					}}
					initial={{ scale: 0.95, y: 20 }}
					animate={{ scale: 1, y: 0 }}
					exit={{ scale: 0.95, y: 20 }}
					transition={{ type: "spring", stiffness: 300, damping: 25 }}
				>
					{/* Header */}
					<div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
						<div>
							<h2 className="text-lg font-semibold text-blue-300">
								Performance Dashboard
							</h2>
							<p className="text-xs text-blue-300/40 mt-0.5">
								Real-time monitoring - Privacy-first (all data
								local)
							</p>
						</div>
						<div className="flex items-center gap-3">
							{criticalCount > 0 && (
								<span className="text-xs px-2 py-1 rounded-md bg-red-500/20 text-red-400">
									{criticalCount} critical
								</span>
							)}
							{warningCount > 0 && (
								<span className="text-xs px-2 py-1 rounded-md bg-yellow-500/20 text-yellow-400">
									{warningCount} warnings
								</span>
							)}
							<button
								onClick={toggleDashboard}
								className="text-white/40 hover:text-white/80 transition-colors p-1"
								aria-label="Close dashboard"
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="M18 6 6 18M6 6l12 12" />
								</svg>
							</button>
						</div>
					</div>

					<div className="p-6 space-y-6">
						{/* Resource Gauges */}
						<div className="grid grid-cols-4 gap-4">
							<GaugeCard
								label="RAM"
								value={latestSnapshot?.memoryMB ?? 0}
								max={150}
								unit="MB"
								target="<50 idle"
								status={getGaugeStatus(
									latestSnapshot?.memoryMB ?? 0,
									50,
									150,
								)}
							/>
							<GaugeCard
								label="CPU"
								value={latestSnapshot?.cpuEstimate ?? 0}
								max={20}
								unit="%"
								target="<2% idle"
								status={getGaugeStatus(
									latestSnapshot?.cpuEstimate ?? 0,
									2,
									10,
								)}
							/>
							<GaugeCard
								label="FPS"
								value={latestSnapshot?.fps ?? 60}
								max={60}
								unit=""
								target="60fps"
								status={getGaugeStatusInverted(
									latestSnapshot?.fps ?? 60,
									55,
									45,
								)}
							/>
							<GaugeCard
								label="DOM Nodes"
								value={latestSnapshot?.domNodes ?? 0}
								max={3000}
								unit=""
								target="<1500"
								status={getGaugeStatus(
									latestSnapshot?.domNodes ?? 0,
									1500,
									3000,
								)}
							/>
						</div>

						{/* Web Vitals */}
						<section>
							<h3 className="text-sm font-medium text-blue-300/70 mb-3">
								Core Web Vitals
							</h3>
							<div className="grid grid-cols-3 gap-3">
								<VitalCard
									name="LCP"
									value={vitals.lcp}
									unit="ms"
									good={2500}
									poor={4000}
									description="Largest Contentful Paint"
								/>
								<VitalCard
									name="FID"
									value={vitals.fid}
									unit="ms"
									good={100}
									poor={300}
									description="First Input Delay"
								/>
								<VitalCard
									name="CLS"
									value={
										vitals.cls !== null
											? Math.round(vitals.cls * 1000) /
												1000
											: null
									}
									unit=""
									good={0.1}
									poor={0.25}
									description="Cumulative Layout Shift"
								/>
								<VitalCard
									name="INP"
									value={vitals.inp}
									unit="ms"
									good={200}
									poor={500}
									description="Interaction to Next Paint"
								/>
								<VitalCard
									name="TTFB"
									value={vitals.ttfb}
									unit="ms"
									good={200}
									poor={600}
									description="Time to First Byte"
								/>
								<VitalCard
									name="FCP"
									value={vitals.fcp}
									unit="ms"
									good={1800}
									poor={3000}
									description="First Contentful Paint"
								/>
							</div>
						</section>

						{/* Averages + Latency */}
						<div className="grid grid-cols-2 gap-4">
							<section>
								<h3 className="text-sm font-medium text-blue-300/70 mb-3">
									60s Averages
								</h3>
								<Glass
									variant="light"
									border="none"
									className="p-4 space-y-2"
								>
									<StatRow
										label="Avg Memory"
										value={`${averages.avgMemory} MB`}
									/>
									<StatRow
										label="Avg CPU"
										value={`${averages.avgCPU}%`}
									/>
									<StatRow
										label="Avg FPS"
										value={`${averages.avgFPS}`}
									/>
									<StatRow
										label="Active Anims"
										value={`${latestSnapshot?.activeAnimations ?? 0}`}
									/>
								</Glass>
							</section>

							<section>
								<h3 className="text-sm font-medium text-blue-300/70 mb-3">
									Message Latency
								</h3>
								<Glass
									variant="light"
									border="none"
									className="p-4 space-y-2"
								>
									<StatRow
										label="p50"
										value={`${latencyStats.p50}ms`}
									/>
									<StatRow
										label="p95"
										value={`${latencyStats.p95}ms`}
									/>
									<StatRow
										label="p99"
										value={`${latencyStats.p99}ms`}
									/>
									<StatRow
										label="WS Uptime"
										value={`${custom.wsConnectionUptime}%`}
									/>
									<StatRow
										label="WS Reconnects"
										value={`${custom.wsReconnects}`}
									/>
								</Glass>
							</section>
						</div>

						{/* Bundle Budget */}
						{budgetReport && (
							<section>
								<h3 className="text-sm font-medium text-blue-300/70 mb-3">
									Bundle Budget (Score:{" "}
									<span
										className={
											budgetReport.score >= 85
												? "text-green-400"
												: budgetReport.score >= 60
													? "text-yellow-400"
													: "text-red-400"
										}
									>
										{budgetReport.score}/100
									</span>
									)
								</h3>
								<Glass
									variant="light"
									border="none"
									className="p-4"
								>
									<div className="grid grid-cols-5 gap-3 text-xs">
										<BudgetItem
											label="JS"
											bytes={
												budgetReport.totals.script
											}
										/>
										<BudgetItem
											label="CSS"
											bytes={
												budgetReport.totals.stylesheet
											}
										/>
										<BudgetItem
											label="Fonts"
											bytes={budgetReport.totals.font}
										/>
										<BudgetItem
											label="Images"
											bytes={
												budgetReport.totals.image
											}
										/>
										<BudgetItem
											label="Other"
											bytes={
												budgetReport.totals.other
											}
										/>
									</div>
									{budgetReport.violations.length > 0 && (
										<div className="mt-3 space-y-1">
											{budgetReport.violations.map(
												(v, i) => (
													<p
														key={i}
														className="text-[10px] text-red-400/70"
													>
														{v}
													</p>
												),
											)}
										</div>
									)}
								</Glass>
							</section>
						)}

						{/* Alerts */}
						{alerts.length > 0 && (
							<section>
								<div className="flex items-center justify-between mb-3">
									<h3 className="text-sm font-medium text-blue-300/70">
										Alerts ({alerts.length})
									</h3>
									<button
										onClick={clearAlerts}
										className="text-[10px] text-blue-300/40 hover:text-blue-300/60 transition-colors"
									>
										Clear all
									</button>
								</div>
								<div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
									{alerts
										.slice(-20)
										.reverse()
										.map((alert) => (
											<div
												key={alert.id}
												className={`text-[11px] px-3 py-1.5 rounded-lg ${
													alert.severity ===
													"critical"
														? "bg-red-500/10 text-red-400/80"
														: alert.severity ===
															  "warning"
															? "bg-yellow-500/10 text-yellow-400/80"
															: "bg-blue-500/10 text-blue-400/60"
												}`}
											>
												<span className="text-white/30 mr-2">
													{new Date(
														alert.timestamp,
													).toLocaleTimeString()}
												</span>
												{alert.message}
											</div>
										))}
								</div>
							</section>
						)}

						{/* Telemetry Opt-in */}
						<section className="border-t border-white/5 pt-4">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-sm font-medium text-blue-300/70">
										Anonymous Telemetry
									</h3>
									<p className="text-[10px] text-blue-300/30 mt-0.5">
										Help improve Bedrock by sharing
										aggregate performance metrics. No user
										identification. 7-day retention.
									</p>
								</div>
								<button
									onClick={() =>
										setTelemetryOptIn(!telemetryOptIn)
									}
									className={`relative w-10 h-5 rounded-full transition-colors ${
										telemetryOptIn
											? "bg-blue-500/40"
											: "bg-white/10"
									}`}
									role="switch"
									aria-checked={telemetryOptIn}
									aria-label="Toggle anonymous telemetry"
								>
									<motion.div
										className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
										animate={{
											left: telemetryOptIn
												? "calc(100% - 18px)"
												: "2px",
										}}
										transition={{
											type: "spring",
											stiffness: 500,
											damping: 30,
										}}
									/>
								</button>
							</div>
						</section>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}

// ── Sub-components ─────────────────────────────────────────

function GaugeCard({
	label,
	value,
	max,
	unit,
	target,
	status,
}: {
	label: string;
	value: number;
	max: number;
	unit: string;
	target: string;
	status: "good" | "warning" | "critical";
}) {
	const percentage = Math.min((value / max) * 100, 100);
	const barColor = {
		good: "oklch(0.65 0.2 145)",
		warning: "oklch(0.65 0.2 85)",
		critical: "oklch(0.65 0.2 25)",
	}[status];

	return (
		<Glass variant="light" border="none" className="p-3">
			<div className="flex items-center justify-between mb-2">
				<span className="text-xs text-blue-300/60">{label}</span>
				<span className="text-[10px] text-blue-300/30">{target}</span>
			</div>
			<p className="text-xl font-bold text-blue-300 tabular-nums">
				{value.toLocaleString()}
				{unit && (
					<span className="text-xs text-blue-300/40 ml-0.5">
						{unit}
					</span>
				)}
			</p>
			<div className="h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
				<motion.div
					className="h-full rounded-full"
					style={{ background: barColor }}
					initial={{ width: 0 }}
					animate={{ width: `${percentage}%` }}
					transition={{ duration: 0.3 }}
				/>
			</div>
		</Glass>
	);
}

function VitalCard({
	name,
	value,
	unit,
	good,
	poor,
	description,
}: {
	name: string;
	value: number | null;
	unit: string;
	good: number;
	poor: number;
	description: string;
}) {
	const status =
		value === null
			? "unknown"
			: value <= good
				? "good"
				: value <= poor
					? "warning"
					: "critical";

	const colors = {
		good: "text-green-400",
		warning: "text-yellow-400",
		critical: "text-red-400",
		unknown: "text-white/30",
	};

	const badges = {
		good: "Good",
		warning: "Needs work",
		critical: "Poor",
		unknown: "Pending",
	};

	return (
		<Glass variant="light" border="none" className="p-3">
			<div className="flex items-center justify-between mb-1">
				<span className="text-xs font-medium text-blue-300/80">
					{name}
				</span>
				<span
					className={`text-[9px] px-1.5 py-0.5 rounded ${colors[status]} bg-current/10`}
					style={{ color: undefined }}
				>
					<span className={colors[status]}>{badges[status]}</span>
				</span>
			</div>
			<p className={`text-lg font-bold tabular-nums ${colors[status]}`}>
				{value !== null ? value : "-"}
				{value !== null && unit && (
					<span className="text-xs text-blue-300/30 ml-0.5">
						{unit}
					</span>
				)}
			</p>
			<p className="text-[9px] text-blue-300/25 mt-1">{description}</p>
		</Glass>
	);
}

function StatRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex justify-between text-xs">
			<span className="text-blue-300/50">{label}</span>
			<span className="text-blue-300/80 tabular-nums">{value}</span>
		</div>
	);
}

function BudgetItem({ label, bytes }: { label: string; bytes: number }) {
	return (
		<div className="text-center">
			<p className="text-blue-300/40">{label}</p>
			<p className="text-blue-300/70 font-medium">{formatBytes(bytes)}</p>
		</div>
	);
}

function getGaugeStatus(
	value: number,
	warnThreshold: number,
	critThreshold: number,
): "good" | "warning" | "critical" {
	if (value > critThreshold) return "critical";
	if (value > warnThreshold) return "warning";
	return "good";
}

function getGaugeStatusInverted(
	value: number,
	warnThreshold: number,
	critThreshold: number,
): "good" | "warning" | "critical" {
	if (value < critThreshold) return "critical";
	if (value < warnThreshold) return "warning";
	return "good";
}
