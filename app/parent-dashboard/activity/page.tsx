"use client";

import { useState, useMemo } from "react";
import { useFamilyStore } from "@/store/family.store";
import { useParentDashboardStore } from "@/store/parent-dashboard.store";
import type { TransparencyLogEntry, VoiceCallMetadata } from "@/lib/types/family";
import {
	Eye,
	Users,
	Server,
	Flag,
	Settings,
	CheckCircle,
	XCircle,
	Download,
	Phone,
	Clock,
	Calendar,
	ChevronDown,
	ChevronUp,
	Shield,
	Search,
	Filter,
} from "lucide-react";

const ACTION_ICONS: Record<string, typeof Eye> = {
	viewed_messages: Eye,
	viewed_friends: Users,
	viewed_servers: Server,
	viewed_flags: Flag,
	changed_monitoring_level: Settings,
	approved_server: CheckCircle,
	denied_server: XCircle,
	approved_friend: CheckCircle,
	denied_friend: XCircle,
	added_keyword_alert: Shield,
	removed_keyword_alert: Shield,
	changed_time_limit: Clock,
	viewed_voice_metadata: Phone,
	exported_activity_log: Download,
	restricted_server: XCircle,
	unrestricted_server: CheckCircle,
	blocked_category: Shield,
	unblocked_category: Shield,
	changed_data_retention: Settings,
};

function groupByDate(entries: TransparencyLogEntry[]) {
	const groups: Record<string, TransparencyLogEntry[]> = {};
	const today = new Date().toDateString();
	const yesterday = new Date(Date.now() - 86400000).toDateString();

	for (const entry of entries) {
		const dateStr = new Date(entry.timestamp).toDateString();
		let label: string;
		if (dateStr === today) label = "Today";
		else if (dateStr === yesterday) label = "Yesterday";
		else label = new Date(entry.timestamp).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

		if (!groups[label]) groups[label] = [];
		groups[label].push(entry);
	}
	return groups;
}

function formatDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	if (h > 0) return `${h}h ${m}m`;
	return `${m}m`;
}

export default function ActivityPage() {
	const getSelectedTeenAccount = useFamilyStore((s) => s.getSelectedTeenAccount);
	const logExportActivity = useFamilyStore((s) => s.logExportActivity);
	const viewVoiceMetadata = useFamilyStore((s) => s.viewVoiceMetadata);
	const selectedDateRange = useParentDashboardStore((s) => s.selectedDateRange);
	const setDateRange = useParentDashboardStore((s) => s.setDateRange);
	const teenAccount = getSelectedTeenAccount();

	const [expandedVoiceCall, setExpandedVoiceCall] = useState<string | null>(null);
	const [actionFilter, setActionFilter] = useState<string>("all");
	const [showFilters, setShowFilters] = useState(false);

	const filteredEntries = useMemo(() => {
		if (!teenAccount) return [];
		let entries = [...teenAccount.transparencyLog];

		// Date filter
		const now = Date.now();
		const rangeMap = { "7d": 7, "14d": 14, "30d": 30, "90d": 90, custom: 90 };
		const days = rangeMap[selectedDateRange] || 7;
		const cutoff = now - days * 86400000;
		entries = entries.filter((e) => new Date(e.timestamp).getTime() > cutoff);

		// Action filter
		if (actionFilter !== "all") {
			entries = entries.filter((e) => e.action === actionFilter);
		}

		return entries;
	}, [teenAccount, selectedDateRange, actionFilter]);

	const groupedEntries = useMemo(() => groupByDate(filteredEntries), [filteredEntries]);
	const voiceCalls: VoiceCallMetadata[] = teenAccount?.restrictions.voiceCallHistory || [];

	if (!teenAccount) {
		return (
			<div className="flex items-center justify-center h-full">
				<p style={{ color: "var(--pd-text-muted)" }}>No teen account selected</p>
			</div>
		);
	}

	const handleExport = () => {
		logExportActivity(teenAccount.id);
		window.print();
	};

	return (
		<div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold" style={{ color: "var(--pd-text)" }}>
						Activity Logs
					</h1>
					<p className="text-sm mt-1" style={{ color: "var(--pd-text-muted)" }}>
						Transparency log for {teenAccount.user.displayName}
					</p>
				</div>
				<button
					type="button"
					onClick={handleExport}
					className="pd-card px-4 py-2 text-sm font-medium flex items-center gap-2 pd-no-print"
					style={{ color: "var(--pd-primary)" }}
				>
					<Download size={16} />
					Export PDF
				</button>
			</div>

			{/* Filters */}
			<div className="pd-card p-4 pd-no-print">
				<div className="flex flex-wrap items-center gap-2">
					{/* Date range buttons */}
					{(["7d", "14d", "30d", "90d"] as const).map((range) => (
						<button
							key={range}
							type="button"
							onClick={() => setDateRange(range)}
							className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
							style={{
								background: selectedDateRange === range ? "var(--pd-primary)" : "var(--pd-bg-secondary)",
								color: selectedDateRange === range ? "white" : "var(--pd-text-secondary)",
							}}
						>
							{range}
						</button>
					))}

					<button
						type="button"
						onClick={() => setShowFilters(!showFilters)}
						className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ml-auto"
						style={{ background: "var(--pd-bg-secondary)", color: "var(--pd-text-secondary)" }}
					>
						<Filter size={14} />
						Filters
					</button>
				</div>

				{showFilters && (
					<div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--pd-border)" }}>
						<label className="text-xs font-medium" style={{ color: "var(--pd-text-muted)" }}>
							Action Type
						</label>
						<select
							value={actionFilter}
							onChange={(e) => setActionFilter(e.target.value)}
							className="mt-1 w-full sm:w-64 px-3 py-2 rounded-lg text-sm"
							style={{
								background: "var(--pd-bg-secondary)",
								color: "var(--pd-text)",
								border: "1px solid var(--pd-border)",
							}}
						>
							<option value="all">All Actions</option>
							<option value="viewed_messages">Viewed Messages</option>
							<option value="viewed_friends">Viewed Friends</option>
							<option value="viewed_servers">Viewed Servers</option>
							<option value="viewed_flags">Viewed Flags</option>
							<option value="changed_monitoring_level">Changed Level</option>
							<option value="approved_server">Approved Server</option>
							<option value="denied_server">Denied Server</option>
							<option value="approved_friend">Approved Friend</option>
							<option value="denied_friend">Denied Friend</option>
						</select>
					</div>
				)}
			</div>

			{/* Timeline */}
			<div className="space-y-6">
				{Object.keys(groupedEntries).length > 0 ? (
					Object.entries(groupedEntries).map(([dateLabel, entries]) => (
						<div key={dateLabel}>
							<h3 className="text-sm font-semibold mb-3 sticky top-0 py-1" style={{ color: "var(--pd-text-secondary)", background: "var(--pd-bg)" }}>
								{dateLabel}
							</h3>
							<div className="space-y-2">
								{entries.map((entry) => {
									const Icon = ACTION_ICONS[entry.action] || Eye;
									return (
										<div
											key={entry.id}
											className="pd-card p-4 flex items-start gap-3"
										>
											<div
												className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
												style={{ background: "var(--pd-primary-light)" }}
											>
												<Icon size={16} style={{ color: "var(--pd-primary)" }} />
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-sm" style={{ color: "var(--pd-text)" }}>
													{entry.details}
												</p>
												{entry.metadata && (
													<div className="mt-1 space-y-0.5">
														{entry.metadata.channelName && (
															<p className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
																Channel: #{entry.metadata.channelName} in {entry.metadata.serverName}
															</p>
														)}
														{entry.metadata.friendName && (
															<p className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
																Friend: @{entry.metadata.friendName}
															</p>
														)}
														{entry.metadata.oldLevel !== undefined && (
															<p className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
																Level {entry.metadata.oldLevel} &rarr; Level {entry.metadata.newLevel}
															</p>
														)}
													</div>
												)}
											</div>
											<span className="text-xs shrink-0" style={{ color: "var(--pd-text-muted)" }}>
												{new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
											</span>
										</div>
									);
								})}
							</div>
						</div>
					))
				) : (
					<div className="pd-card p-8 text-center">
						<Search size={32} className="mx-auto mb-3" style={{ color: "var(--pd-text-muted)" }} />
						<p style={{ color: "var(--pd-text-muted)" }}>No activity logs found for this period</p>
					</div>
				)}
			</div>

			{/* Voice Call History */}
			{voiceCalls.length > 0 && (
				<div>
					<h2 className="text-lg font-semibold mb-3" style={{ color: "var(--pd-text)" }}>
						Voice Call History
					</h2>
					<div
						className="pd-card p-3 mb-4 flex items-center gap-2 text-xs"
						style={{ background: "var(--pd-primary-light)", color: "var(--pd-primary)" }}
					>
						<Shield size={14} />
						Metadata only. No audio is recorded or stored.
					</div>
					<div className="space-y-3">
						{voiceCalls.map((call) => {
							const isExpanded = expandedVoiceCall === call.id;
							return (
								<div key={call.id} className="pd-card">
									<button
										type="button"
										onClick={() => {
											setExpandedVoiceCall(isExpanded ? null : call.id);
											if (!isExpanded) viewVoiceMetadata(teenAccount.id);
										}}
										className="w-full p-4 flex items-center gap-4 text-left"
									>
										<div
											className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
											style={{ background: "var(--pd-accent)", color: "white" }}
										>
											<Phone size={18} />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium" style={{ color: "var(--pd-text)" }}>
												{call.serverName} &bull; #{call.channelName}
											</p>
											<p className="text-xs mt-0.5" style={{ color: "var(--pd-text-muted)" }}>
												{new Date(call.startTime).toLocaleString()} &bull; {formatDuration(call.duration)} &bull; {call.participants.length} participants
											</p>
										</div>
										{isExpanded ? (
											<ChevronUp size={16} style={{ color: "var(--pd-text-muted)" }} />
										) : (
											<ChevronDown size={16} style={{ color: "var(--pd-text-muted)" }} />
										)}
									</button>
									{isExpanded && (
										<div className="px-4 pb-4 pt-0">
											<div className="rounded-lg p-3" style={{ background: "var(--pd-bg-secondary)" }}>
												<p className="text-xs font-medium mb-2" style={{ color: "var(--pd-text-secondary)" }}>
													Participants
												</p>
												<div className="space-y-2">
													{call.participants.map((p) => (
														<div key={p.userId} className="flex items-center justify-between text-xs">
															<span style={{ color: "var(--pd-text)" }}>
																{p.displayName} (@{p.username})
															</span>
															<span style={{ color: "var(--pd-text-muted)" }}>
																{new Date(p.joinedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
																{" - "}
																{new Date(p.leftAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
															</span>
														</div>
													))}
												</div>
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
