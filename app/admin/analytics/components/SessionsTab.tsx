"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
	PieChart,
	Pie,
	Cell,
	Legend,
} from "recharts";
import { useDateRange } from "./DateRangeSelector";

interface DailySession {
	date: string;
	total_sessions: number;
	avg_duration_seconds: number;
	median_duration_seconds: number;
	avg_pages_per_session: number;
	bounce_rate: number;
	device_category: string | null;
}

interface HourlySession {
	date: string;
	hour_utc: number;
	active_sessions: number;
}

const DEVICE_COLORS = {
	desktop: "oklch(0.65 0.25 265)",
	tablet: "oklch(0.70 0.20 145)",
	mobile: "oklch(0.75 0.18 85)",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SessionsTab() {
	const { startDate, endDate } = useDateRange();
	const [sessions, setSessions] = useState<DailySession[]>([]);
	const [hourly, setHourly] = useState<HourlySession[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const supabase = createClient();
		setIsLoading(true);

		const startStr = startDate.toISOString().split("T")[0];
		const endStr = endDate.toISOString().split("T")[0];

		Promise.all([
			supabase
				.schema("analytics")
				.from("daily_sessions")
				.select("date, total_sessions, avg_duration_seconds, median_duration_seconds, avg_pages_per_session, bounce_rate, device_category")
				.gte("date", startStr)
				.lte("date", endStr)
				.order("date", { ascending: true }),
			supabase
				.schema("analytics")
				.from("hourly_active_sessions")
				.select("date, hour_utc, active_sessions")
				.gte("date", startStr)
				.lte("date", endStr),
		]).then(([sessRes, hourRes]) => {
			if (!sessRes.error) setSessions(sessRes.data ?? []);
			if (!hourRes.error) setHourly(hourRes.data ?? []);
			setIsLoading(false);
		});
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [startDate.toISOString(), endDate.toISOString()]);

	// All-devices daily trend (where device_category is null)
	const dailyTrend = sessions
		.filter((s) => s.device_category === null)
		.sort((a, b) => a.date.localeCompare(b.date));

	// Device distribution (latest period totals)
	const deviceDist = ["desktop", "tablet", "mobile"].map((d) => ({
		name: d,
		value: sessions
			.filter((s) => s.device_category === d)
			.reduce((sum, s) => sum + s.total_sessions, 0),
	})).filter((d) => d.value > 0);

	// Hourly heatmap — average active sessions per day-of-week × hour
	const heatmapData: Record<number, Record<number, number[]>> = {};
	for (const row of hourly) {
		const dow = new Date(row.date).getDay();
		if (!heatmapData[dow]) heatmapData[dow] = {};
		if (!heatmapData[dow][row.hour_utc]) heatmapData[dow][row.hour_utc] = [];
		heatmapData[dow][row.hour_utc].push(row.active_sessions);
	}

	// Find max for color scale
	let heatmapMax = 1;
	for (const dow of Object.values(heatmapData)) {
		for (const vals of Object.values(dow)) {
			const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
			if (avg > heatmapMax) heatmapMax = avg;
		}
	}

	if (isLoading) {
		return (
			<div className="p-6">
				<h2 className="text-xl font-bold text-white mb-6">Sessions & Engagement</h2>
				<div className="flex items-center justify-center h-64">
					<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-8">
			<h2 className="text-xl font-bold text-white">Sessions & Engagement</h2>

			{/* Summary cards */}
			{dailyTrend.length > 0 && (() => {
				const latest = dailyTrend[dailyTrend.length - 1];
				return (
					<div className="grid grid-cols-4 gap-4">
						{[
							{ label: "Avg Sessions/Day", value: Math.round(dailyTrend.reduce((sum, d) => sum + d.total_sessions, 0) / dailyTrend.length).toLocaleString() },
							{ label: "Avg Duration", value: `${Math.round(latest.avg_duration_seconds ?? 0)}s` },
							{ label: "Pages/Session", value: (latest.avg_pages_per_session ?? 0).toFixed(1) },
							{ label: "Bounce Rate", value: `${((latest.bounce_rate ?? 0) * 100).toFixed(1)}%` },
						].map((card) => (
							<div key={card.label} className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
								<p className="text-xs text-slate-400 font-medium">{card.label}</p>
								<p className="text-2xl font-bold text-white mt-1">{card.value}</p>
							</div>
						))}
					</div>
				);
			})()}

			{/* Daily active sessions trend */}
			<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5">
				<h3 className="text-sm font-semibold text-slate-300 mb-4">Daily Active Sessions</h3>
				{dailyTrend.length === 0 ? (
					<p className="text-slate-500 text-sm text-center py-10">No data for this period</p>
				) : (
					<ResponsiveContainer width="100%" height={200}>
						<LineChart data={dailyTrend}>
							<CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 285)" />
							<XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} />
							<YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
							<Tooltip
								contentStyle={{ background: "oklch(0.15 0.02 285)", border: "1px solid oklch(0.25 0.02 285)", borderRadius: "8px", color: "white", fontSize: "12px" }}
							/>
							<Line type="monotone" dataKey="total_sessions" name="Sessions" stroke="oklch(0.65 0.25 265)" dot={false} strokeWidth={2} />
						</LineChart>
					</ResponsiveContainer>
				)}
			</div>

			<div className="grid grid-cols-2 gap-6">
				{/* Session duration trend */}
				<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5">
					<h3 className="text-sm font-semibold text-slate-300 mb-4">Session Duration (seconds)</h3>
					{dailyTrend.length === 0 ? (
						<p className="text-slate-500 text-sm text-center py-10">No data</p>
					) : (
						<ResponsiveContainer width="100%" height={180}>
							<LineChart data={dailyTrend}>
								<CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 285)" />
								<XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} />
								<YAxis tick={{ fill: "#64748b", fontSize: 10 }} unit="s" />
								<Tooltip
									contentStyle={{ background: "oklch(0.15 0.02 285)", border: "1px solid oklch(0.25 0.02 285)", borderRadius: "8px", color: "white", fontSize: "12px" }}
								/>
								<Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
								<Line type="monotone" dataKey="avg_duration_seconds" name="Avg" stroke="oklch(0.65 0.25 265)" dot={false} />
								<Line type="monotone" dataKey="median_duration_seconds" name="Median" stroke="oklch(0.70 0.20 145)" dot={false} strokeDasharray="4 2" />
							</LineChart>
						</ResponsiveContainer>
					)}
				</div>

				{/* Device distribution */}
				<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5">
					<h3 className="text-sm font-semibold text-slate-300 mb-4">Device Distribution</h3>
					{deviceDist.length === 0 ? (
						<p className="text-slate-500 text-sm text-center py-10">No data</p>
					) : (
						<ResponsiveContainer width="100%" height={180}>
							<PieChart>
								<Pie data={deviceDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
									{deviceDist.map((entry, i) => (
										<Cell key={i} fill={DEVICE_COLORS[entry.name as keyof typeof DEVICE_COLORS] ?? "oklch(0.55 0.05 285)"} />
									))}
								</Pie>
								<Tooltip
									contentStyle={{ background: "oklch(0.15 0.02 285)", border: "1px solid oklch(0.25 0.02 285)", borderRadius: "8px", color: "white", fontSize: "12px" }}
									formatter={(value: number) => [value.toLocaleString(), "Sessions"]}
								/>
								<Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
							</PieChart>
						</ResponsiveContainer>
					)}
				</div>
			</div>

			{/* Hourly heatmap */}
			<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5">
				<h3 className="text-sm font-semibold text-slate-300 mb-4">Peak Usage Hours (UTC)</h3>
				{hourly.length === 0 ? (
					<p className="text-slate-500 text-sm text-center py-10">No hourly data for this period</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-xs">
							<thead>
								<tr>
									<th className="pr-3 text-left text-slate-500 font-normal">Day</th>
									{Array.from({ length: 24 }, (_, h) => (
										<th key={h} className="text-center text-slate-600 font-normal w-6">{h}</th>
									))}
								</tr>
							</thead>
							<tbody>
								{DAYS.map((day, dow) => (
									<tr key={dow}>
										<td className="pr-3 py-0.5 text-slate-400 font-medium">{day}</td>
										{Array.from({ length: 24 }, (_, h) => {
											const vals = heatmapData[dow]?.[h] ?? [];
											const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
											const intensity = heatmapMax > 0 ? avg / heatmapMax : 0;
											return (
												<td key={h} className="py-0.5">
													<div
														className="w-5 h-4 rounded-xs mx-auto"
														title={`${day} ${h}:00 UTC — ~${Math.round(avg)} sessions`}
														style={{
															backgroundColor: `oklch(0.65 0.25 265 / ${intensity.toFixed(2)})`,
															opacity: intensity < 0.05 ? 0.1 : 1,
														}}
													/>
												</td>
											);
										})}
									</tr>
								))}
							</tbody>
						</table>
						<p className="text-xs text-slate-500 mt-3">Color intensity = relative active session count</p>
					</div>
				)}
			</div>
		</div>
	);
}
