"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface BugReport {
	id: string;
	session_token: string | null;
	user_id: string | null;
	user_display_name: string | null;
	title: string;
	description: string;
	category: string;
	severity: string;
	page_path: string | null;
	device_category: string | null;
	viewport_bucket: string | null;
	browser_family: string | null;
	os_family: string | null;
	recent_errors: unknown[];
	screenshot_paths: string[];
	status: string;
	admin_notes: string | null;
	resolved_at: string | null;
	created_at: string;
}

const STATUS_OPTIONS = ["new", "triaging", "investigating", "resolved", "wont_fix"] as const;
const SEVERITY_OPTIONS = ["all", "low", "medium", "high", "critical"] as const;
const CATEGORY_OPTIONS = ["all", "bug", "ui_issue", "performance", "voice_issue", "other"] as const;

const SEVERITY_BADGE: Record<string, "danger" | "warning" | "primary" | "secondary"> = {
	critical: "danger",
	high: "warning",
	medium: "primary",
	low: "secondary",
};

const STATUS_COLORS: Record<string, string> = {
	new: "text-blue-400",
	triaging: "text-yellow-400",
	investigating: "text-orange-400",
	resolved: "text-green-400",
	wont_fix: "text-slate-500",
};

export function BugReportsTab() {
	const [reports, setReports] = useState<BugReport[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [filterSeverity, setFilterSeverity] = useState("all");
	const [filterCategory, setFilterCategory] = useState("all");
	const [filterStatus, setFilterStatus] = useState("all");
	const [updatingId, setUpdatingId] = useState<string | null>(null);

	const fetchReports = useCallback(async () => {
		setIsLoading(true);
		const supabase = createClient();
		let query = supabase
			.schema("analytics")
			.from("bug_reports")
			.select("*")
			.order("created_at", { ascending: false })
			.limit(100);

		if (filterSeverity !== "all") query = query.eq("severity", filterSeverity);
		if (filterCategory !== "all") query = query.eq("category", filterCategory);
		if (filterStatus !== "all") query = query.eq("status", filterStatus);

		const { data, error } = await query;
		if (!error) setReports((data ?? []) as BugReport[]);
		setIsLoading(false);
	}, [filterSeverity, filterCategory, filterStatus]);

	useEffect(() => {
		fetchReports();
	}, [fetchReports]);

	const updateReport = useCallback(async (id: string, updates: Partial<Pick<BugReport, "status" | "admin_notes">>) => {
		setUpdatingId(id);
		const supabase = createClient();
		await supabase
			.schema("analytics")
			.from("bug_reports")
			.update({
				...updates,
				...(updates.status === "resolved" ? { resolved_at: new Date().toISOString() } : {}),
			})
			.eq("id", id);

		setReports((prev) =>
			prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
		);
		setUpdatingId(null);
	}, []);

	// Summary stats
	const openCount = reports.filter((r) => !["resolved", "wont_fix"].includes(r.status)).length;
	const criticalCount = reports.filter((r) => r.severity === "critical" && !["resolved", "wont_fix"].includes(r.status)).length;
	const newCount = reports.filter((r) => r.status === "new").length;

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-bold text-white">
					Bug Reports
					{newCount > 0 && (
						<span className="ml-2 px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full">{newCount} new</span>
					)}
				</h2>
				<button
					type="button"
					onClick={fetchReports}
					className="px-3 py-1.5 text-sm text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/50 transition-colors"
				>
					Refresh
				</button>
			</div>

			{/* Summary cards */}
			<div className="grid grid-cols-3 gap-4">
				<div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
					<p className="text-xs text-slate-400 font-medium">Open Reports</p>
					<p className="text-2xl font-bold text-white mt-1">{openCount}</p>
				</div>
				<div className="bg-red-400/5 border border-red-400/20 rounded-xl p-4">
					<p className="text-xs text-slate-400 font-medium">Critical Open</p>
					<p className="text-2xl font-bold text-red-400 mt-1">{criticalCount}</p>
				</div>
				<div className="bg-blue-400/5 border border-blue-400/20 rounded-xl p-4">
					<p className="text-xs text-slate-400 font-medium">New (unreviewed)</p>
					<p className="text-2xl font-bold text-blue-400 mt-1">{newCount}</p>
				</div>
			</div>

			{/* Filters */}
			<div className="flex gap-3 flex-wrap">
				{[
					{ label: "Severity", value: filterSeverity, options: SEVERITY_OPTIONS, setter: setFilterSeverity },
					{ label: "Category", value: filterCategory, options: CATEGORY_OPTIONS, setter: setFilterCategory },
					{ label: "Status", value: filterStatus, options: ["all", ...STATUS_OPTIONS], setter: setFilterStatus },
				].map(({ label, value, options, setter }) => (
					<div key={label} className="flex items-center gap-2">
						<span className="text-xs text-slate-500 font-medium">{label}:</span>
						<select
							value={value}
							onChange={(e) => setter(e.target.value)}
							className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
						>
							{options.map((opt) => (
								<option key={opt} value={opt}>
									{opt === "all" ? "All" : opt.replace("_", " ")}
								</option>
							))}
						</select>
					</div>
				))}
			</div>

			{/* Reports table */}
			{isLoading ? (
				<div className="flex justify-center py-20">
					<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			) : reports.length === 0 ? (
				<div className="text-center py-20 text-slate-500 text-sm">
					No reports match the current filters
				</div>
			) : (
				<div className="border border-slate-800/50 rounded-xl overflow-hidden">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-slate-900/50 border-b border-slate-800/50">
								<th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Severity</th>
								<th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Title</th>
								<th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Category</th>
								<th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Reporter</th>
								<th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
								<th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
							</tr>
						</thead>
						<tbody>
							{reports.map((report) => (
								<Fragment key={report.id}>
									<motion.tr
										onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
										className={cn(
											"border-b border-slate-800/30 cursor-pointer transition-colors",
											report.status === "new"
												? "bg-primary/5 hover:bg-primary/10"
												: "hover:bg-slate-800/30",
										)}
										whileHover={{ x: 2 }}
										transition={{ duration: 0.1 }}
									>
										<td className="px-4 py-3">
											<Badge
												variant={SEVERITY_BADGE[report.severity] ?? "secondary"}
												pulse={report.status === "new"}
											>
												{report.severity}
											</Badge>
										</td>
										<td className="px-4 py-3 text-slate-200 max-w-xs">
											{report.status === "new" && (
												<span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mr-2 mb-px" />
											)}
											<span className="truncate block">{report.title}</span>
										</td>
										<td className="px-4 py-3 text-slate-400 capitalize text-xs">
											{report.category.replace("_", " ")}
										</td>
										<td className="px-4 py-3 text-slate-400 text-xs">
											{report.user_display_name ?? "Anonymous"}
										</td>
										<td className={cn("px-4 py-3 font-medium capitalize", STATUS_COLORS[report.status])}>
											{report.status.replace("_", " ")}
										</td>
										<td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
											{new Date(report.created_at).toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</td>
									</motion.tr>

									{/* Expanded detail row */}
									<AnimatePresence>
										{expandedId === report.id && (
											<tr key={`${report.id}-detail`}>
												<td colSpan={6} className="bg-slate-900/80 border-b border-slate-800/30">
													<motion.div
														initial={{ height: 0, opacity: 0 }}
														animate={{ height: "auto", opacity: 1 }}
														exit={{ height: 0, opacity: 0 }}
														transition={{ duration: 0.2 }}
														className="overflow-hidden"
													>
														<div className="p-5 space-y-4">
															<div className="grid grid-cols-2 gap-6">
																{/* Report details */}
																<div className="space-y-3">
																	<div>
																		<p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Description</p>
																		<p className="text-sm text-slate-300 whitespace-pre-wrap">{report.description}</p>
																	</div>
																	<div className="grid grid-cols-2 gap-3 text-xs">
																		<div>
																			<p className="text-slate-500">Page</p>
																			<p className="text-slate-300 font-mono">{report.page_path ?? "-"}</p>
																		</div>
																		<div>
																			<p className="text-slate-500">Device</p>
																			<p className="text-slate-300">{report.device_category ?? "-"}</p>
																		</div>
																		<div>
																			<p className="text-slate-500">Browser</p>
																			<p className="text-slate-300">{report.browser_family ?? "-"}</p>
																		</div>
																		<div>
																			<p className="text-slate-500">OS</p>
																			<p className="text-slate-300">{report.os_family ?? "-"}</p>
																		</div>
																	</div>
																	{report.user_id && (
																		<div className="text-xs">
																			<p className="text-slate-500">Reporter</p>
																			<p className="text-slate-300">
																				{report.user_display_name} — <span className="font-mono">{report.user_id}</span>
																			</p>
																		</div>
																	)}
																	{!report.user_id && (
																		<div className="text-xs">
																			<span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full">Anonymous submission</span>
																		</div>
																	)}
																</div>

																{/* Admin actions */}
																<div className="space-y-3">
																	<div>
																		<p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Status</p>
																		<select
																			value={report.status}
																			onChange={(e) => updateReport(report.id, { status: e.target.value })}
																			disabled={updatingId === report.id}
																			className="bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer disabled:opacity-60"
																		>
																			{STATUS_OPTIONS.map((s) => (
																				<option key={s} value={s}>
																					{s.replace("_", " ")}
																				</option>
																			))}
																		</select>
																	</div>
																	<div>
																		<p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Admin Notes</p>
																		<textarea
																			defaultValue={report.admin_notes ?? ""}
																			onBlur={(e) => updateReport(report.id, { admin_notes: e.target.value })}
																			rows={3}
																			placeholder="Internal notes..."
																			className="w-full bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-primary/50 resize-none"
																		/>
																	</div>
																</div>
															</div>

															{/* Recent errors */}
															{Array.isArray(report.recent_errors) && report.recent_errors.length > 0 && (
																<div>
																	<p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Recent Errors from Session</p>
																	<div className="space-y-1">
																		{(report.recent_errors as Array<{ error_type?: string; error_message?: string; created_at?: string }>).map((err, i) => (
																			<div key={i} className="bg-slate-800/50 rounded-lg px-3 py-2 text-xs text-slate-400 font-mono">
																				<span className="text-red-400">[{err.error_type}]</span> {err.error_message}
																			</div>
																		))}
																	</div>
																</div>
															)}
														</div>
													</motion.div>
												</td>
											</tr>
										)}
									</AnimatePresence>
								</Fragment>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
