"use client";

import { useEffect, useState } from "react";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
	Legend,
} from "recharts";
import { useDateRange } from "./DateRangeSelector";
import { cn } from "@/lib/utils/cn";

interface PerfMetric {
	date: string;
	metric_name: string;
	page_path: string | null;
	p50_ms: number;
	p75_ms: number;
	p95_ms: number;
	p99_ms: number;
	sample_count: number;
	error_count: number;
}

// Web Vitals thresholds (ms)
const THRESHOLDS: Record<string, { good: number; needs_improvement: number }> = {
	lcp: { good: 2500, needs_improvement: 4000 },
	fcp: { good: 1800, needs_improvement: 3000 },
	ttfb: { good: 800, needs_improvement: 1800 },
	inp: { good: 200, needs_improvement: 500 },
	cls: { good: 100, needs_improvement: 250 }, // × 1000 from score
};

function vitalStatus(metric: string, p75: number): "good" | "needs_improvement" | "poor" {
	const t = THRESHOLDS[metric];
	if (!t) return "good";
	if (p75 <= t.good) return "good";
	if (p75 <= t.needs_improvement) return "needs_improvement";
	return "poor";
}

const STATUS_COLORS = {
	good: "text-green-400",
	needs_improvement: "text-yellow-400",
	poor: "text-red-400",
};

const STATUS_BG = {
	good: "bg-green-400/10 border-green-400/20",
	needs_improvement: "bg-yellow-400/10 border-yellow-400/20",
	poor: "bg-red-400/10 border-red-400/20",
};

const WEB_VITALS = ["lcp", "fcp", "ttfb", "inp", "cls"];

export function PerformanceTab() {
	const { startDate, endDate } = useDateRange();
	const [metrics, setMetrics] = useState<PerfMetric[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		setIsLoading(true);
		const start = startDate.toISOString().split("T")[0];
		const end = endDate.toISOString().split("T")[0];
		fetch(`/api/analytics/performance?start=${start}&end=${end}`)
			.then((r) => r.json())
			.then(({ data }: { data?: PerfMetric[] }) => {
				setMetrics(data ?? []);
				setIsLoading(false);
			})
			.catch(() => setIsLoading(false));
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [startDate.toISOString(), endDate.toISOString()]);

	// Latest global averages per vital
	const latestByMetric: Record<string, PerfMetric> = {};
	for (const m of metrics.filter((m) => m.page_path === null)) {
		if (!latestByMetric[m.metric_name] || m.date > latestByMetric[m.metric_name].date) {
			latestByMetric[m.metric_name] = m;
		}
	}

	// Time series data for charts — one row per date
	const dates = [...new Set(metrics.map((m) => m.date))].sort();
	const timeSeriesData = dates.map((date) => {
		const row: Record<string, unknown> = { date };
		for (const vital of WEB_VITALS) {
			const found = metrics.find((m) => m.date === date && m.metric_name === vital && m.page_path === null);
			if (found) {
				row[`${vital}_p50`] = found.p50_ms;
				row[`${vital}_p75`] = found.p75_ms;
				row[`${vital}_p95`] = found.p95_ms;
			}
		}
		return row;
	});

	// Error rates
	const errorData = dates.map((date) => {
		const dayMetrics = metrics.filter((m) => m.date === date && m.page_path === null);
		const totalErrors = dayMetrics.reduce((sum, m) => sum + m.error_count, 0);
		const totalSamples = dayMetrics.reduce((sum, m) => sum + m.sample_count, 0);
		return {
			date,
			error_rate: totalSamples > 0 ? ((totalErrors / totalSamples) * 100).toFixed(2) : 0,
			total_errors: totalErrors,
		};
	});

	if (isLoading) {
		return (
			<div className="p-6">
				<h2 className="text-xl font-bold text-white mb-6">Performance</h2>
				<div className="flex items-center justify-center h-64">
					<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-8">
			<h2 className="text-xl font-bold text-white">Performance</h2>

			{/* Web Vitals summary cards */}
			<div className="grid grid-cols-5 gap-3">
				{WEB_VITALS.map((vital) => {
					const latest = latestByMetric[vital];
					const status = latest ? vitalStatus(vital, latest.p75_ms) : "good";
					return (
						<div
							key={vital}
							className={cn(
								"border rounded-xl p-4",
								latest ? STATUS_BG[status] : "bg-slate-900/50 border-slate-800/50",
							)}
						>
							<p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{vital.toUpperCase()}</p>
							{latest ? (
								<>
									<p className={cn("text-2xl font-bold mt-1", STATUS_COLORS[status])}>
										{Math.round(latest.p75_ms)}ms
									</p>
									<p className="text-xs text-slate-500 mt-1">p75 · {latest.sample_count} samples</p>
								</>
							) : (
								<p className="text-lg font-bold text-slate-600 mt-1">—</p>
							)}
						</div>
					);
				})}
			</div>

			{/* LCP / FCP over time */}
			<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5">
				<h3 className="text-sm font-semibold text-slate-300 mb-4">LCP & FCP Trend (p50 / p95)</h3>
				{timeSeriesData.length === 0 ? (
					<p className="text-slate-500 text-sm text-center py-10">No data</p>
				) : (
					<ResponsiveContainer width="100%" height={220}>
						<LineChart data={timeSeriesData}>
							<CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 285)" />
							<XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} />
							<YAxis tick={{ fill: "#64748b", fontSize: 10 }} unit="ms" />
							<Tooltip
								contentStyle={{ background: "oklch(0.15 0.02 285)", border: "1px solid oklch(0.25 0.02 285)", borderRadius: "8px", color: "white", fontSize: "12px" }}
							/>
							<Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
							<Line type="monotone" dataKey="lcp_p50" name="LCP p50" stroke="oklch(0.65 0.25 265)" dot={false} />
							<Line type="monotone" dataKey="lcp_p95" name="LCP p95" stroke="oklch(0.65 0.25 265)" strokeDasharray="4 2" dot={false} />
							<Line type="monotone" dataKey="fcp_p50" name="FCP p50" stroke="oklch(0.70 0.20 145)" dot={false} />
							<Line type="monotone" dataKey="fcp_p95" name="FCP p95" stroke="oklch(0.70 0.20 145)" strokeDasharray="4 2" dot={false} />
						</LineChart>
					</ResponsiveContainer>
				)}
			</div>

			{/* TTFB + INP over time */}
			<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5">
				<h3 className="text-sm font-semibold text-slate-300 mb-4">TTFB & INP Trend (p50 / p95)</h3>
				{timeSeriesData.length === 0 ? (
					<p className="text-slate-500 text-sm text-center py-10">No data</p>
				) : (
					<ResponsiveContainer width="100%" height={220}>
						<LineChart data={timeSeriesData}>
							<CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 285)" />
							<XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} />
							<YAxis tick={{ fill: "#64748b", fontSize: 10 }} unit="ms" />
							<Tooltip
								contentStyle={{ background: "oklch(0.15 0.02 285)", border: "1px solid oklch(0.25 0.02 285)", borderRadius: "8px", color: "white", fontSize: "12px" }}
							/>
							<Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
							<Line type="monotone" dataKey="ttfb_p50" name="TTFB p50" stroke="oklch(0.75 0.18 85)" dot={false} />
							<Line type="monotone" dataKey="ttfb_p95" name="TTFB p95" stroke="oklch(0.75 0.18 85)" strokeDasharray="4 2" dot={false} />
							<Line type="monotone" dataKey="inp_p50" name="INP p50" stroke="oklch(0.65 0.22 25)" dot={false} />
							<Line type="monotone" dataKey="inp_p95" name="INP p95" stroke="oklch(0.65 0.22 25)" strokeDasharray="4 2" dot={false} />
						</LineChart>
					</ResponsiveContainer>
				)}
			</div>

			{/* Error rate trend */}
			<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5">
				<h3 className="text-sm font-semibold text-slate-300 mb-4">Error Rate Trend (%)</h3>
				{errorData.length === 0 ? (
					<p className="text-slate-500 text-sm text-center py-10">No data</p>
				) : (
					<ResponsiveContainer width="100%" height={180}>
						<LineChart data={errorData}>
							<CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 285)" />
							<XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} />
							<YAxis tick={{ fill: "#64748b", fontSize: 10 }} unit="%" />
							<Tooltip
								contentStyle={{ background: "oklch(0.15 0.02 285)", border: "1px solid oklch(0.25 0.02 285)", borderRadius: "8px", color: "white", fontSize: "12px" }}
							/>
							<Line type="monotone" dataKey="error_rate" name="Error rate %" stroke="oklch(0.65 0.25 25)" dot={false} />
						</LineChart>
					</ResponsiveContainer>
				)}
			</div>
		</div>
	);
}
