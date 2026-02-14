"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePerformanceStore } from "@/store/performance.store";
import { PerformanceMonitor } from "@/lib/performance/monitoring";

/**
 * Dev-mode performance HUD overlay.
 * Shows real-time FPS, memory, CPU, and Web Vitals.
 * Toggle with Ctrl+Shift+P or via store.
 *
 * Only renders in development or when explicitly enabled.
 */
export function PerformanceOverlay() {
	const isVisible = usePerformanceStore((s) => s.isOverlayVisible);
	const toggleOverlay = usePerformanceStore((s) => s.toggleOverlay);
	const latestSnapshot = usePerformanceStore((s) => s.latestSnapshot);
	const vitals = usePerformanceStore((s) => s.vitals);
	const alerts = usePerformanceStore((s) => s.alerts);

	// Keyboard shortcut: Ctrl+Shift+P
	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.shiftKey && e.key === "P") {
				e.preventDefault();
				toggleOverlay();
			}
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [toggleOverlay]);

	if (!isVisible) return null;

	const criticalAlerts = alerts.filter((a) => a.severity === "critical");

	return (
		<AnimatePresence>
			<motion.div
				className="fixed top-3 right-3 z-100 w-64 font-mono text-[11px] pointer-events-auto"
				initial={{ opacity: 0, x: 20 }}
				animate={{ opacity: 1, x: 0 }}
				exit={{ opacity: 0, x: 20 }}
				style={{
					backdropFilter: "blur(16px)",
					background: "oklch(0.08 0.02 265 / 0.9)",
					border: "1px solid oklch(0.25 0.03 265 / 0.5)",
					borderRadius: "12px",
					boxShadow: "0 8px 32px oklch(0 0 0 / 0.5)",
				}}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
					<span className="text-blue-400 font-semibold text-xs">
						PERF MONITOR
					</span>
					<div className="flex items-center gap-2">
						{criticalAlerts.length > 0 && (
							<span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
						)}
						<button
							onClick={toggleOverlay}
							className="text-white/40 hover:text-white/80 transition-colors"
							aria-label="Close performance overlay"
						>
							x
						</button>
					</div>
				</div>

				{/* Metrics Grid */}
				<div className="px-3 py-2 space-y-2">
					{/* Runtime */}
					<Section title="Runtime">
						<MetricRow
							label="FPS"
							value={latestSnapshot?.fps ?? 60}
							unit=""
							status={getStatus(latestSnapshot?.fps ?? 60, 55, 45, true)}
						/>
						<MetricRow
							label="CPU"
							value={latestSnapshot?.cpuEstimate ?? 0}
							unit="%"
							status={getStatus(latestSnapshot?.cpuEstimate ?? 0, 2, 10)}
						/>
						<MetricRow
							label="RAM"
							value={latestSnapshot?.memoryMB ?? 0}
							unit="MB"
							status={
								latestSnapshot?.memoryMB
									? getStatus(latestSnapshot.memoryMB, 50, 150)
									: "unknown"
							}
						/>
						<MetricRow
							label="DOM"
							value={latestSnapshot?.domNodes ?? 0}
							unit=""
							status={getStatus(latestSnapshot?.domNodes ?? 0, 1500, 3000)}
						/>
						<MetricRow
							label="Anims"
							value={latestSnapshot?.activeAnimations ?? 0}
							unit=""
							status={getStatus(
								latestSnapshot?.activeAnimations ?? 0,
								20,
								60,
							)}
						/>
					</Section>

					{/* Web Vitals */}
					<Section title="Web Vitals">
						<MetricRow
							label="LCP"
							value={vitals.lcp ?? "-"}
							unit={vitals.lcp !== null ? "ms" : ""}
							status={
								vitals.lcp !== null
									? getStatus(vitals.lcp, 2500, 4000)
									: "unknown"
							}
						/>
						<MetricRow
							label="FID"
							value={vitals.fid ?? "-"}
							unit={vitals.fid !== null ? "ms" : ""}
							status={
								vitals.fid !== null
									? getStatus(vitals.fid, 100, 300)
									: "unknown"
							}
						/>
						<MetricRow
							label="CLS"
							value={vitals.cls ?? "-"}
							unit=""
							status={
								vitals.cls !== null
									? getStatus(vitals.cls, 0.1, 0.25)
									: "unknown"
							}
						/>
						<MetricRow
							label="INP"
							value={vitals.inp ?? "-"}
							unit={vitals.inp !== null ? "ms" : ""}
							status={
								vitals.inp !== null
									? getStatus(vitals.inp, 200, 500)
									: "unknown"
							}
						/>
						<MetricRow
							label="TTFB"
							value={vitals.ttfb ?? "-"}
							unit={vitals.ttfb !== null ? "ms" : ""}
							status={
								vitals.ttfb !== null
									? getStatus(vitals.ttfb, 200, 600)
									: "unknown"
							}
						/>
					</Section>

					{/* Alerts */}
					{criticalAlerts.length > 0 && (
						<Section title="Alerts">
							{criticalAlerts.slice(0, 3).map((alert) => (
								<div
									key={alert.id}
									className="text-red-400/80 text-[10px] truncate"
								>
									{alert.message}
								</div>
							))}
						</Section>
					)}
				</div>

				{/* Footer */}
				<div className="px-3 py-1.5 border-t border-white/5 text-white/20 text-[9px]">
					Ctrl+Shift+P to toggle
				</div>
			</motion.div>
		</AnimatePresence>
	);
}

// ── Sub-components ─────────────────────────────────────────

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<div className="text-white/30 text-[9px] uppercase tracking-wider mb-1">
				{title}
			</div>
			<div className="space-y-0.5">{children}</div>
		</div>
	);
}

function MetricRow({
	label,
	value,
	unit,
	status,
}: {
	label: string;
	value: number | string;
	unit: string;
	status: "good" | "warning" | "critical" | "unknown";
}) {
	const colors = {
		good: "text-green-400/80",
		warning: "text-yellow-400/80",
		critical: "text-red-400/80",
		unknown: "text-white/30",
	};

	return (
		<div className="flex justify-between items-center">
			<span className="text-white/50">{label}</span>
			<span className={colors[status]}>
				{typeof value === "number" ? value.toLocaleString() : value}
				{unit && <span className="text-white/20 ml-0.5">{unit}</span>}
			</span>
		</div>
	);
}

function getStatus(
	value: number,
	warningThreshold: number,
	criticalThreshold: number,
	inverted = false,
): "good" | "warning" | "critical" {
	if (inverted) {
		// Lower is worse (e.g., FPS)
		if (value < criticalThreshold) return "critical";
		if (value < warningThreshold) return "warning";
		return "good";
	}
	// Higher is worse (e.g., CPU, memory)
	if (value > criticalThreshold) return "critical";
	if (value > warningThreshold) return "warning";
	return "good";
}
