"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Legend,
} from "recharts";
import { useDateRange } from "./DateRangeSelector";

interface FeatureUsage {
	date: string;
	feature_name: string;
	feature_category: string;
	usage_count: number;
	unique_sessions: number;
	device_category: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
	communication: "oklch(0.65 0.25 265)",
	server_mgmt: "oklch(0.70 0.20 145)",
	user_action: "oklch(0.75 0.18 85)",
	family: "oklch(0.65 0.22 25)",
	navigation: "oklch(0.70 0.15 285)",
	uncategorized: "oklch(0.55 0.05 285)",
};

const DEVICE_COLORS: Record<string, string> = {
	desktop: "oklch(0.65 0.25 265)",
	tablet: "oklch(0.70 0.20 145)",
	mobile: "oklch(0.75 0.18 85)",
};

export function FeatureUsageTab() {
	const { startDate, endDate } = useDateRange();
	const [usage, setUsage] = useState<FeatureUsage[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const supabase = createClient();
		setIsLoading(true);

		supabase
			.schema("analytics")
			.from("daily_feature_usage")
			.select("date, feature_name, feature_category, usage_count, unique_sessions, device_category")
			.gte("date", startDate.toISOString().split("T")[0])
			.lte("date", endDate.toISOString().split("T")[0])
			.then(({ data, error }) => {
				if (!error) setUsage(data ?? []);
				setIsLoading(false);
			});
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [startDate.toISOString(), endDate.toISOString()]);

	// Aggregate by feature name (sum across dates and devices)
	const byFeature = Object.values(
		usage.reduce<Record<string, { feature_name: string; feature_category: string; usage_count: number; unique_sessions: number }>>(
			(acc, row) => {
				const key = row.feature_name;
				if (!acc[key]) {
					acc[key] = { feature_name: row.feature_name, feature_category: row.feature_category, usage_count: 0, unique_sessions: 0 };
				}
				acc[key].usage_count += row.usage_count;
				acc[key].unique_sessions += row.unique_sessions;
				return acc;
			},
			{},
		),
	).sort((a, b) => b.usage_count - a.usage_count);

	// Category breakdown
	const byCategory = Object.values(
		usage.reduce<Record<string, { name: string; value: number }>>(
			(acc, row) => {
				const cat = row.feature_category;
				if (!acc[cat]) acc[cat] = { name: cat, value: 0 };
				acc[cat].value += row.usage_count;
				return acc;
			},
			{},
		),
	);

	// Device breakdown per feature
	const deviceData = ["desktop", "tablet", "mobile"].map((device) => ({
		device,
		...Object.fromEntries(
			byFeature.slice(0, 8).map((f) => [
				f.feature_name,
				usage
					.filter((u) => u.feature_name === f.feature_name && u.device_category === device)
					.reduce((sum, u) => sum + u.usage_count, 0),
			]),
		),
	}));

	if (isLoading) {
		return (
			<div className="p-6">
				<h2 className="text-xl font-bold text-white mb-6">Feature Usage</h2>
				<div className="flex items-center justify-center h-64">
					<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	if (usage.length === 0) {
		return (
			<div className="p-6">
				<h2 className="text-xl font-bold text-white mb-6">Feature Usage</h2>
				<p className="text-slate-500 text-sm text-center py-20">No feature usage data for this period</p>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-8">
			<h2 className="text-xl font-bold text-white">Feature Usage</h2>

			<div className="grid grid-cols-2 gap-6">
				{/* Top features by usage count */}
				<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5">
					<h3 className="text-sm font-semibold text-slate-300 mb-4">Top Features by Usage</h3>
					<ResponsiveContainer width="100%" height={240}>
						<BarChart data={byFeature.slice(0, 10)} layout="vertical" margin={{ left: 80, right: 20 }}>
							<XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
							<YAxis
								type="category"
								dataKey="feature_name"
								tick={{ fill: "#94a3b8", fontSize: 10 }}
								width={80}
							/>
							<Tooltip
								contentStyle={{ background: "oklch(0.15 0.02 285)", border: "1px solid oklch(0.25 0.02 285)", borderRadius: "8px", color: "white", fontSize: "12px" }}
								formatter={(value: number | undefined) => [value?.toLocaleString() ?? "0", "Uses"]}
							/>
							<Bar dataKey="usage_count" fill="oklch(0.65 0.25 265)" radius={[0, 4, 4, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>

				{/* Top features by unique sessions */}
				<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5">
					<h3 className="text-sm font-semibold text-slate-300 mb-4">Top Features by Unique Sessions</h3>
					<ResponsiveContainer width="100%" height={240}>
						<BarChart data={byFeature.slice(0, 10)} layout="vertical" margin={{ left: 80, right: 20 }}>
							<XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
							<YAxis
								type="category"
								dataKey="feature_name"
								tick={{ fill: "#94a3b8", fontSize: 10 }}
								width={80}
							/>
							<Tooltip
								contentStyle={{ background: "oklch(0.15 0.02 285)", border: "1px solid oklch(0.25 0.02 285)", borderRadius: "8px", color: "white", fontSize: "12px" }}
								formatter={(value: number | undefined) => [value?.toLocaleString() ?? "0", "Sessions"]}
							/>
							<Bar dataKey="unique_sessions" fill="oklch(0.70 0.20 145)" radius={[0, 4, 4, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-6">
				{/* Category breakdown */}
				<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5">
					<h3 className="text-sm font-semibold text-slate-300 mb-4">Usage by Category</h3>
					<ResponsiveContainer width="100%" height={220}>
						<PieChart>
							<Pie
								data={byCategory}
								dataKey="value"
								nameKey="name"
								cx="50%"
								cy="50%"
								outerRadius={80}
								label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
								labelLine={false}
							>
								{byCategory.map((entry, index) => (
									<Cell
										key={index}
										fill={CATEGORY_COLORS[entry.name] ?? "oklch(0.55 0.05 285)"}
									/>
								))}
							</Pie>
							<Tooltip
								contentStyle={{ background: "oklch(0.15 0.02 285)", border: "1px solid oklch(0.25 0.02 285)", borderRadius: "8px", color: "white", fontSize: "12px" }}
								formatter={(value: number | undefined) => [value?.toLocaleString() ?? "0", "Uses"]}
							/>
						</PieChart>
					</ResponsiveContainer>
				</div>

				{/* Device split */}
				<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5">
					<h3 className="text-sm font-semibold text-slate-300 mb-4">Usage by Device</h3>
					<ResponsiveContainer width="100%" height={220}>
						<BarChart data={deviceData}>
							<XAxis dataKey="device" tick={{ fill: "#94a3b8", fontSize: 11 }} />
							<YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
							<Tooltip
								contentStyle={{ background: "oklch(0.15 0.02 285)", border: "1px solid oklch(0.25 0.02 285)", borderRadius: "8px", color: "white", fontSize: "12px" }}
							/>
							<Legend wrapperStyle={{ fontSize: "10px", color: "#94a3b8" }} />
							{byFeature.slice(0, 3).map((f) => (
								<Bar
									key={f.feature_name}
									dataKey={f.feature_name}
									stackId="device"
									fill={DEVICE_COLORS[f.feature_name] ?? "oklch(0.65 0.25 265)"}
								/>
							))}
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
}
