"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button/button";
import { Badge } from "@/components/ui/badge/badge";
import type { PlatformAuditEntry } from "@/lib/types/platform-role";

interface AuditEntryWithProfiles extends PlatformAuditEntry {
	actor?: { username: string; display_name: string; avatar_url: string | null };
	target?: { username: string; display_name: string; avatar_url: string | null };
}

const ACTION_LABELS: Record<string, string> = {
	role_granted: "Role Granted",
	role_revoked: "Role Revoked",
	bot_registered: "Bot Registered",
	bot_approved: "Bot Approved",
	bot_rejected: "Bot Rejected",
	bot_suspended: "Bot Suspended",
	pii_accessed: "PII Accessed",
	report_reviewed: "Report Reviewed",
	user_banned: "User Banned",
	admin_login: "Admin Login",
};

export function AuditLogTab() {
	const [entries, setEntries] = useState<AuditEntryWithProfiles[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [actionFilter, setActionFilter] = useState<string>("");

	const fetchEntries = async () => {
		setIsLoading(true);
		try {
			const params = new URLSearchParams({ page: String(page), limit: "20" });
			if (actionFilter) params.set("action", actionFilter);

			const res = await fetch(`/api/platform/audit-log?${params}`);
			if (!res.ok) return;
			const data = await res.json();
			setEntries(data.entries ?? []);
			setTotalPages(data.totalPages ?? 1);
		} catch {
			// Silently fail
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchEntries();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, actionFilter]);

	const handleExportCSV = () => {
		const headers = ["Timestamp", "Actor", "Action", "Target", "Minor", "IP"];
		const rows = entries.map((e) => [
			new Date(e.created_at).toISOString(),
			e.actor?.username ?? e.actor_id,
			e.action,
			e.target?.username ?? e.target_user_id ?? "-",
			e.target_is_minor ? "YES" : "no",
			e.ip_address ?? "-",
		]);

		const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-4">
			{/* Toolbar */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Filter className="w-4 h-4 text-slate-400" />
					<select
						value={actionFilter}
						onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
						className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
					>
						<option value="">All Actions</option>
						{Object.entries(ACTION_LABELS).map(([key, label]) => (
							<option key={key} value={key}>{label}</option>
						))}
					</select>
				</div>

				<Button variant="secondary" size="sm" onClick={handleExportCSV} disabled={entries.length === 0}>
					<Download className="w-4 h-4 mr-1" />
					Export CSV
				</Button>
			</div>

			{/* Table */}
			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
				</div>
			) : entries.length === 0 ? (
				<div className="text-center py-12 text-slate-400 text-sm">
					No audit log entries found
				</div>
			) : (
				<div className="border border-white/10 rounded-xl overflow-hidden">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-white/5 text-left">
								<th className="px-4 py-3 text-slate-400 font-medium">Time</th>
								<th className="px-4 py-3 text-slate-400 font-medium">Actor</th>
								<th className="px-4 py-3 text-slate-400 font-medium">Action</th>
								<th className="px-4 py-3 text-slate-400 font-medium">Target</th>
								<th className="px-4 py-3 text-slate-400 font-medium">Flags</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-white/5">
							{entries.map((entry) => (
								<tr
									key={entry.id}
									className={entry.target_is_minor ? "bg-yellow-500/5" : ""}
								>
									<td className="px-4 py-3 text-slate-300 whitespace-nowrap">
										{new Date(entry.created_at).toLocaleString()}
									</td>
									<td className="px-4 py-3 text-white">
										{entry.actor?.username ?? "Unknown"}
									</td>
									<td className="px-4 py-3">
										<Badge variant="default">
											{ACTION_LABELS[entry.action] ?? entry.action}
										</Badge>
									</td>
									<td className="px-4 py-3 text-slate-300">
										{entry.target?.username ?? entry.target_user_id ?? "-"}
									</td>
									<td className="px-4 py-3">
										{entry.target_is_minor && (
											<span className="flex items-center gap-1 text-yellow-400 text-xs">
												<AlertTriangle className="w-3.5 h-3.5" />
												Minor
											</span>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						disabled={page <= 1}
						onClick={() => setPage((p) => p - 1)}
					>
						<ChevronLeft className="w-4 h-4" />
					</Button>
					<span className="text-sm text-slate-400">
						Page {page} of {totalPages}
					</span>
					<Button
						variant="ghost"
						size="sm"
						disabled={page >= totalPages}
						onClick={() => setPage((p) => p + 1)}
					>
						<ChevronRight className="w-4 h-4" />
					</Button>
				</div>
			)}
		</div>
	);
}
