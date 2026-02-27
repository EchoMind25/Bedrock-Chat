"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sankey, Tooltip, ResponsiveContainer } from "recharts";
import { useDateRange } from "./DateRangeSelector";

interface PageFlow {
	from_path: string | null;
	to_path: string;
	transition_count: number;
	unique_sessions: number;
	avg_time_on_from_seconds: number | null;
}

interface SankeyNode {
	name: string;
}

interface SankeyLink {
	source: number;
	target: number;
	value: number;
}

function buildSankeyData(flows: PageFlow[]): { nodes: SankeyNode[]; links: SankeyLink[] } {
	const nodeMap = new Map<string, number>();
	const getNodeIdx = (name: string) => {
		if (!nodeMap.has(name)) {
			nodeMap.set(name, nodeMap.size);
		}
		return nodeMap.get(name)!;
	};

	const links: SankeyLink[] = [];
	for (const flow of flows) {
		const src = flow.from_path ?? "(entry)";
		const tgt = flow.to_path;
		const srcIdx = getNodeIdx(src);
		const tgtIdx = getNodeIdx(tgt);
		links.push({ source: srcIdx, target: tgtIdx, value: flow.transition_count });
	}

	const nodes: SankeyNode[] = Array.from(nodeMap.entries())
		.sort((a, b) => a[1] - b[1])
		.map(([name]) => ({ name }));

	return { nodes, links };
}

function SkeletonRow() {
	return (
		<div className="flex items-center gap-4 px-4 py-3 border-b border-slate-800/30">
			<div className="h-3 w-40 bg-slate-800 rounded animate-pulse" />
			<div className="h-3 w-24 bg-slate-800 rounded animate-pulse" />
			<div className="h-3 w-16 bg-slate-800 rounded animate-pulse ml-auto" />
		</div>
	);
}

export function NavigationTab() {
	const { startDate, endDate } = useDateRange();
	const [flows, setFlows] = useState<PageFlow[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const supabase = createClient();
		setIsLoading(true);

		supabase
			.schema("analytics")
			.from("daily_page_flows")
			.select("from_path, to_path, transition_count, unique_sessions, avg_time_on_from_seconds")
			.gte("date", startDate.toISOString().split("T")[0])
			.lte("date", endDate.toISOString().split("T")[0])
			.order("transition_count", { ascending: false })
			.limit(50)
			.then(({ data, error }) => {
				if (!error) setFlows(data ?? []);
				setIsLoading(false);
			});
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [startDate.toISOString(), endDate.toISOString()]);

	const sankeyData = buildSankeyData(flows.slice(0, 20));

	// Top entry pages (from_path is null = entry)
	const entryPages = flows
		.filter((f) => f.from_path === null)
		.sort((a, b) => b.transition_count - a.transition_count)
		.slice(0, 10);

	// Top exit pages (pages that appear only as destinations, or high avg time)
	const topByVolume = flows
		.slice(0, 10)
		.map((f) => ({ path: f.to_path, count: f.transition_count }));

	return (
		<div className="p-6 space-y-8">
			<h2 className="text-xl font-bold text-white">Navigation & Funnels</h2>

			{/* Sankey / Page Flow */}
			<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5">
				<h3 className="text-sm font-semibold text-slate-300 mb-4">Page Flow</h3>
				{isLoading ? (
					<div className="h-64 flex items-center justify-center">
						<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
				) : flows.length === 0 ? (
					<div className="h-64 flex items-center justify-center text-slate-500 text-sm">
						No navigation data for this period
					</div>
				) : sankeyData.nodes.length > 1 ? (
					<ResponsiveContainer width="100%" height={280}>
						<Sankey
							data={sankeyData}
							nodeWidth={12}
							nodePadding={16}
							link={{ stroke: "oklch(0.65 0.25 265 / 0.3)" }}
						>
							<Tooltip
								formatter={(value: number | undefined) => [`${value ?? 0} transitions`, "Count"]}
								contentStyle={{
									background: "oklch(0.15 0.02 285)",
									border: "1px solid oklch(0.25 0.02 285)",
									borderRadius: "8px",
									color: "white",
									fontSize: "12px",
								}}
							/>
						</Sankey>
					</ResponsiveContainer>
				) : (
					<div className="h-64 flex items-center justify-center text-slate-500 text-sm">
						Not enough flow data to render chart
					</div>
				)}
			</div>

			<div className="grid grid-cols-2 gap-6">
				{/* Top Entry Pages */}
				<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl overflow-hidden">
					<div className="px-4 py-3 border-b border-slate-800/30">
						<h3 className="text-sm font-semibold text-slate-300">Top Entry Pages</h3>
					</div>
					{isLoading ? (
						<>
							{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
						</>
					) : entryPages.length === 0 ? (
						<p className="px-4 py-8 text-center text-slate-500 text-sm">No data</p>
					) : (
						<table className="w-full text-sm">
							<tbody>
								{entryPages.map((p, i) => (
									<tr key={i} className="border-b border-slate-800/30 last:border-0">
										<td className="px-4 py-3 text-slate-300 font-mono text-xs truncate max-w-[200px]">
											{p.to_path}
										</td>
										<td className="px-4 py-3 text-slate-400 text-right text-xs">
											{p.transition_count.toLocaleString()}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>

				{/* Top Pages by Volume */}
				<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl overflow-hidden">
					<div className="px-4 py-3 border-b border-slate-800/30">
						<h3 className="text-sm font-semibold text-slate-300">Top Pages by Transitions</h3>
					</div>
					{isLoading ? (
						<>
							{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
						</>
					) : topByVolume.length === 0 ? (
						<p className="px-4 py-8 text-center text-slate-500 text-sm">No data</p>
					) : (
						<table className="w-full text-sm">
							<tbody>
								{topByVolume.map((p, i) => (
									<tr key={i} className="border-b border-slate-800/30 last:border-0">
										<td className="px-4 py-3 text-slate-300 font-mono text-xs truncate max-w-[200px]">
											{p.path}
										</td>
										<td className="px-4 py-3 text-slate-400 text-right text-xs">
											{p.count.toLocaleString()}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</div>

			{/* Avg time on page */}
			<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl overflow-hidden">
				<div className="px-4 py-3 border-b border-slate-800/30">
					<h3 className="text-sm font-semibold text-slate-300">Average Time on Page (seconds)</h3>
				</div>
				{isLoading ? (
					<>{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</>
				) : (
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-slate-900/50 text-xs text-slate-500 uppercase tracking-wider">
								<th className="px-4 py-2 text-left">Page</th>
								<th className="px-4 py-2 text-left">To</th>
								<th className="px-4 py-2 text-right">Avg seconds</th>
								<th className="px-4 py-2 text-right">Sessions</th>
							</tr>
						</thead>
						<tbody>
							{flows
								.filter((f) => f.avg_time_on_from_seconds !== null)
								.sort((a, b) => (b.avg_time_on_from_seconds ?? 0) - (a.avg_time_on_from_seconds ?? 0))
								.slice(0, 10)
								.map((f, i) => (
									<tr key={i} className="border-t border-slate-800/30">
										<td className="px-4 py-3 text-slate-300 font-mono text-xs">{f.from_path ?? "(entry)"}</td>
										<td className="px-4 py-3 text-slate-400 font-mono text-xs">{f.to_path}</td>
										<td className="px-4 py-3 text-right text-slate-300 text-xs">
											{f.avg_time_on_from_seconds?.toFixed(1) ?? "-"}s
										</td>
										<td className="px-4 py-3 text-right text-slate-500 text-xs">
											{f.unique_sessions.toLocaleString()}
										</td>
									</tr>
								))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
