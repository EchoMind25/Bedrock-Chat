"use client";

import { useEffect, useState, useMemo } from "react";
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
	LineChart,
	Line,
	Legend,
} from "recharts";
import { useDateRange } from "./DateRangeSelector";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FunnelRow {
	date: string;
	switch_page_views: number;
	import_started: number;
	import_completed: number;
	invite_links_generated: number;
	invite_links_clicked: number;
	invite_signups: number;
	invite_joins: number;
	source_direct: number;
	source_search: number;
	source_discord_link: number;
	source_qr_code: number;
	source_other: number;
}

// ---------------------------------------------------------------------------
// Colors (OKLCH)
// ---------------------------------------------------------------------------

const FUNNEL_COLORS = [
	"oklch(0.65 0.25 265)", // primary blue
	"oklch(0.70 0.20 200)", // teal
	"oklch(0.70 0.20 145)", // green
	"oklch(0.75 0.18 85)",  // yellow
	"oklch(0.65 0.22 25)",  // orange
	"oklch(0.65 0.22 340)", // pink
	"oklch(0.70 0.15 285)", // purple
];

const SOURCE_COLORS: Record<string, string> = {
	direct: "oklch(0.65 0.25 265)",
	search: "oklch(0.70 0.20 145)",
	discord: "oklch(0.65 0.22 280)",
	qr_code: "oklch(0.75 0.18 85)",
	other: "oklch(0.55 0.05 285)",
};

// ---------------------------------------------------------------------------
// Tooltip style (matches FeatureUsageTab)
// ---------------------------------------------------------------------------

const tooltipStyle = {
	background: "oklch(0.15 0.02 285)",
	border: "1px solid oklch(0.25 0.02 285)",
	borderRadius: "8px",
	color: "white",
	fontSize: "12px",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MigrationTab() {
	const { startDate, endDate } = useDateRange();
	const [rows, setRows] = useState<FunnelRow[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		setIsLoading(true);
		const start = startDate.toISOString().split("T")[0];
		const end = endDate.toISOString().split("T")[0];
		fetch(`/api/analytics/migration-funnel?start=${start}&end=${end}`)
			.then((r) => r.json())
			.then(({ data }: { data?: FunnelRow[] }) => {
				setRows(data ?? []);
				setIsLoading(false);
			})
			.catch(() => setIsLoading(false));
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [startDate.toISOString(), endDate.toISOString()]);

	// -- Aggregated totals --
	const totals = useMemo(() => {
		const t = {
			switch_page_views: 0,
			import_started: 0,
			import_completed: 0,
			invite_links_generated: 0,
			invite_links_clicked: 0,
			invite_signups: 0,
			invite_joins: 0,
		};
		for (const row of rows) {
			t.switch_page_views += row.switch_page_views;
			t.import_started += row.import_started;
			t.import_completed += row.import_completed;
			t.invite_links_generated += row.invite_links_generated;
			t.invite_links_clicked += row.invite_links_clicked;
			t.invite_signups += row.invite_signups;
			t.invite_joins += row.invite_joins;
		}
		return t;
	}, [rows]);

	// -- Funnel bar data --
	const funnelData = useMemo(() => [
		{ stage: "Page Views", value: totals.switch_page_views },
		{ stage: "Import Started", value: totals.import_started },
		{ stage: "Import Done", value: totals.import_completed },
		{ stage: "Invites Created", value: totals.invite_links_generated },
		{ stage: "Invites Clicked", value: totals.invite_links_clicked },
		{ stage: "Signups", value: totals.invite_signups },
		{ stage: "Joins", value: totals.invite_joins },
	], [totals]);

	// -- Source pie data --
	const sourceData = useMemo(() => {
		const s = { direct: 0, search: 0, discord: 0, qr_code: 0, other: 0 };
		for (const row of rows) {
			s.direct += row.source_direct;
			s.search += row.source_search;
			s.discord += row.source_discord_link;
			s.qr_code += row.source_qr_code;
			s.other += row.source_other;
		}
		return Object.entries(s)
			.filter(([, v]) => v > 0)
			.map(([name, value]) => ({ name, value }));
	}, [rows]);

	// -- 7-day moving average for line chart --
	const dailyTrends = useMemo(() => {
		if (rows.length === 0) return [];
		return rows.map((row, i) => {
			// 7-day moving average for imports
			const window = rows.slice(Math.max(0, i - 6), i + 1);
			const avgImports = window.reduce((sum, r) => sum + r.import_completed, 0) / window.length;
			const avgJoins = window.reduce((sum, r) => sum + r.invite_joins, 0) / window.length;

			return {
				date: row.date,
				imports: row.import_completed,
				joins: row.invite_joins,
				imports_avg: Math.round(avgImports * 10) / 10,
				joins_avg: Math.round(avgJoins * 10) / 10,
			};
		});
	}, [rows]);

	// -- Conversion rates --
	const conversionRates = useMemo(() => {
		const rate = (a: number, b: number) => b > 0 ? ((a / b) * 100).toFixed(1) : "0.0";
		return {
			viewToImport: rate(totals.import_started, totals.switch_page_views),
			importCompletion: rate(totals.import_completed, totals.import_started),
			inviteToJoin: rate(totals.invite_joins, totals.invite_links_clicked),
			overallConversion: rate(totals.invite_joins, totals.switch_page_views),
		};
	}, [totals]);

	// -- Loading state --
	if (isLoading) {
		return (
			<div className="p-6">
				<h2 className="text-xl font-bold text-white mb-6">Migration Funnel</h2>
				<div className="flex items-center justify-center h-64">
					<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	// -- Empty state --
	if (rows.length === 0) {
		return (
			<div className="p-6">
				<h2 className="text-xl font-bold text-white mb-6">Migration Funnel</h2>
				<p className="text-slate-500 text-sm text-center py-20">No migration data for this period</p>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-8">
			<h2 className="text-xl font-bold text-white">Migration Funnel</h2>

			{/* Key Metrics Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<MetricCard
					label="Servers Migrated"
					value={totals.import_completed}
				/>
				<MetricCard
					label="Members Joined"
					value={totals.invite_joins}
				/>
				<MetricCard
					label="Invite Conversion"
					value={`${conversionRates.inviteToJoin}%`}
					subtitle="Click → Join"
				/>
				<MetricCard
					label="Overall Conversion"
					value={`${conversionRates.overallConversion}%`}
					subtitle="Page View → Join"
				/>
			</div>

			<div className="grid grid-cols-2 gap-6">
				{/* Funnel Visualization */}
				<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5">
					<h3 className="text-sm font-semibold text-slate-300 mb-4">Funnel Stages</h3>
					<ResponsiveContainer width="100%" height={280}>
						<BarChart data={funnelData} margin={{ left: 20, right: 20 }}>
							<XAxis
								dataKey="stage"
								tick={{ fill: "#94a3b8", fontSize: 10 }}
								interval={0}
								angle={-30}
								textAnchor="end"
								height={60}
							/>
							<YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
							<Tooltip
								contentStyle={tooltipStyle}
								formatter={(value: number | undefined) => [value?.toLocaleString() ?? "0", "Count"]}
							/>
							<Bar dataKey="value" radius={[4, 4, 0, 0]}>
								{funnelData.map((_, index) => (
									<Cell key={index} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>

					{/* Conversion rates between stages */}
					<div className="mt-4 flex items-center justify-between text-xs text-slate-500 px-2">
						<span>View→Import: {conversionRates.viewToImport}%</span>
						<span>Import completion: {conversionRates.importCompletion}%</span>
						<span>Click→Join: {conversionRates.inviteToJoin}%</span>
					</div>
				</div>

				{/* Source Breakdown */}
				<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5">
					<h3 className="text-sm font-semibold text-slate-300 mb-4">Traffic Sources</h3>
					{sourceData.length === 0 ? (
						<p className="text-slate-500 text-sm text-center py-16">No source data yet</p>
					) : (
						<ResponsiveContainer width="100%" height={280}>
							<PieChart>
								<Pie
									data={sourceData}
									dataKey="value"
									nameKey="name"
									cx="50%"
									cy="50%"
									outerRadius={100}
									label={({ name = "", percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
									labelLine={false}
								>
									{sourceData.map((entry, index) => (
										<Cell
											key={index}
											fill={SOURCE_COLORS[entry.name] ?? "oklch(0.55 0.05 285)"}
										/>
									))}
								</Pie>
								<Tooltip
									contentStyle={tooltipStyle}
									formatter={(value: number | undefined) => [value?.toLocaleString() ?? "0", "Visits"]}
								/>
							</PieChart>
						</ResponsiveContainer>
					)}
				</div>
			</div>

			{/* Daily Trends */}
			<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5">
				<h3 className="text-sm font-semibold text-slate-300 mb-4">Daily Trends (with 7-day moving average)</h3>
				<ResponsiveContainer width="100%" height={260}>
					<LineChart data={dailyTrends} margin={{ left: 10, right: 20 }}>
						<XAxis
							dataKey="date"
							tick={{ fill: "#64748b", fontSize: 10 }}
							tickFormatter={(d: string) => d.slice(5)} // MM-DD
						/>
						<YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
						<Tooltip
							contentStyle={tooltipStyle}
							labelFormatter={(label) => `Date: ${label}`}
						/>
						<Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
						<Line
							type="monotone"
							dataKey="imports"
							stroke="oklch(0.70 0.20 145)"
							strokeWidth={1}
							dot={false}
							name="Daily Imports"
							opacity={0.4}
						/>
						<Line
							type="monotone"
							dataKey="imports_avg"
							stroke="oklch(0.70 0.20 145)"
							strokeWidth={2}
							dot={false}
							name="Imports (7d avg)"
						/>
						<Line
							type="monotone"
							dataKey="joins"
							stroke="oklch(0.65 0.25 265)"
							strokeWidth={1}
							dot={false}
							name="Daily Joins"
							opacity={0.4}
						/>
						<Line
							type="monotone"
							dataKey="joins_avg"
							stroke="oklch(0.65 0.25 265)"
							strokeWidth={2}
							dot={false}
							name="Joins (7d avg)"
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------

function MetricCard({
	label,
	value,
	subtitle,
}: {
	label: string;
	value: number | string;
	subtitle?: string;
}) {
	return (
		<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
			<p className="text-xs text-slate-400 mb-1">{label}</p>
			<p className="text-2xl font-bold text-white">
				{typeof value === "number" ? value.toLocaleString() : value}
			</p>
			{subtitle && (
				<p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
			)}
		</div>
	);
}
