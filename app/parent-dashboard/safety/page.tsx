"use client";

import { useState } from "react";
import { useFamilyStore } from "@/store/family.store";
import type { TimeLimitConfig } from "@/lib/types/family";
import {
	Search,
	Shield,
	Clock,
	BarChart3,
	Plus,
	Trash2,
	AlertTriangle,
	X,
	Check,
} from "lucide-react";
import dynamic from "next/dynamic";

const StatsChart = dynamic(
	() => import("@/components/parent-dashboard/stats-chart").then((mod) => mod.StatsChart),
	{ ssr: false },
);

type Tab = "keywords" | "categories" | "timelimits" | "screentime";

const DEFAULT_CATEGORIES = [
	{ id: "cat-violence", name: "Violence & Graphic Content", description: "Violent imagery or descriptions", icon: "violence", isActive: false },
	{ id: "cat-adult", name: "Adult & Sexual Content", description: "Sexually explicit material", icon: "adult", isActive: false },
	{ id: "cat-gambling", name: "Gambling", description: "Gambling-related content", icon: "gambling", isActive: false },
	{ id: "cat-drugs", name: "Drug & Substance References", description: "Drug use or promotion", icon: "drugs", isActive: false },
	{ id: "cat-selfharm", name: "Self-Harm & Dangerous Activities", description: "Content promoting self-harm", icon: "selfharm", isActive: false },
	{ id: "cat-hate", name: "Hate Speech & Discrimination", description: "Discriminatory language or content", icon: "hate", isActive: false },
];

export default function SafetyPage() {
	const {
		getSelectedTeenAccount,
		addKeywordAlert,
		removeKeywordAlert,
		toggleKeywordAlert,
		dismissKeywordMatch,
		setTimeLimit,
		removeTimeLimit,
		toggleBlockedCategory,
	} = useFamilyStore();

	const teenAccount = getSelectedTeenAccount();
	const [activeTab, setActiveTab] = useState<Tab>("keywords");
	const [newKeyword, setNewKeyword] = useState("");
	const [newSeverity, setNewSeverity] = useState<"low" | "medium" | "high">("medium");

	if (!teenAccount) {
		return (
			<div className="flex items-center justify-center h-full">
				<p style={{ color: "var(--pd-text-muted)" }}>No teen account selected</p>
			</div>
		);
	}

	const alerts = teenAccount.restrictions.keywordAlerts || [];
	const matches = (teenAccount.restrictions.keywordAlertMatches || []).filter((m) => !m.dismissed);
	const categories = teenAccount.restrictions.blockedCategories?.length
		? teenAccount.restrictions.blockedCategories
		: DEFAULT_CATEGORIES;
	const timeLimitConfig = teenAccount.restrictions.timeLimitConfig;
	const screenTimeData = teenAccount.restrictions.screenTimeHistory || [];

	const handleAddKeyword = () => {
		if (!newKeyword.trim()) return;
		addKeywordAlert(teenAccount.id, newKeyword.trim(), newSeverity);
		setNewKeyword("");
	};

	const handleSaveTimeLimit = (config: TimeLimitConfig) => {
		setTimeLimit(teenAccount.id, config);
	};

	const tabs = [
		{ id: "keywords" as Tab, label: "Keywords", icon: Search },
		{ id: "categories" as Tab, label: "Categories", icon: Shield },
		{ id: "timelimits" as Tab, label: "Time Limits", icon: Clock },
		{ id: "screentime" as Tab, label: "Screen Time", icon: BarChart3 },
	];

	return (
		<div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-semibold" style={{ color: "var(--pd-text)" }}>
					Safety Tools
				</h1>
				<p className="text-sm mt-1" style={{ color: "var(--pd-text-muted)" }}>
					Configure safety settings for {teenAccount.user.displayName}
				</p>
			</div>

			{/* Tabs */}
			<div className="flex gap-1 p-1 rounded-lg overflow-x-auto" style={{ background: "var(--pd-bg-secondary)" }}>
				{tabs.map((tab) => (
					<button
						key={tab.id}
						type="button"
						onClick={() => setActiveTab(tab.id)}
						className="flex-1 min-w-[100px] px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
						style={{
							background: activeTab === tab.id ? "var(--pd-surface)" : "transparent",
							color: activeTab === tab.id ? "var(--pd-text)" : "var(--pd-text-muted)",
							boxShadow: activeTab === tab.id ? "0 1px 3px oklch(0 0 0 / 0.06)" : "none",
						}}
					>
						<tab.icon size={16} />
						{tab.label}
					</button>
				))}
			</div>

			{/* Keywords tab */}
			{activeTab === "keywords" && (
				<div className="space-y-4">
					{/* Add keyword */}
					<div className="pd-card p-5">
						<h3 className="text-sm font-semibold mb-3" style={{ color: "var(--pd-text)" }}>
							Add Keyword Alert
						</h3>
						<div className="flex flex-col sm:flex-row gap-2">
							<input
								type="text"
								value={newKeyword}
								onChange={(e) => setNewKeyword(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
								placeholder="Enter keyword or phrase..."
								className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2"
								style={{
									background: "var(--pd-bg-secondary)",
									color: "var(--pd-text)",
									border: "1px solid var(--pd-border)",
								}}
							/>
							<select
								value={newSeverity}
								onChange={(e) => setNewSeverity(e.target.value as "low" | "medium" | "high")}
								className="px-3 py-2 rounded-lg text-sm"
								style={{
									background: "var(--pd-bg-secondary)",
									color: "var(--pd-text)",
									border: "1px solid var(--pd-border)",
								}}
							>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
							</select>
							<button
								type="button"
								onClick={handleAddKeyword}
								className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 text-white shrink-0"
								style={{ background: "var(--pd-primary)" }}
							>
								<Plus size={16} />
								Add
							</button>
						</div>
					</div>

					{/* Alert list */}
					<div className="pd-card p-5">
						<h3 className="text-sm font-semibold mb-3" style={{ color: "var(--pd-text)" }}>
							Active Alerts ({alerts.length})
						</h3>
						{alerts.length > 0 ? (
							<div className="space-y-2">
								{alerts.map((alert) => (
									<div
										key={alert.id}
										className="flex items-center justify-between p-3 rounded-lg"
										style={{ background: "var(--pd-bg-secondary)" }}
									>
										<div className="flex items-center gap-3">
											<button
												type="button"
												onClick={() => toggleKeywordAlert(teenAccount.id, alert.id)}
												className="w-8 h-5 rounded-full transition-colors relative shrink-0"
												style={{
													background: alert.isActive ? "var(--pd-primary)" : "var(--pd-border)",
												}}
											>
												<span
													className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
													style={{
														left: alert.isActive ? "14px" : "2px",
													}}
												/>
											</button>
											<div>
												<span className="text-sm font-medium" style={{ color: "var(--pd-text)" }}>
													{alert.keyword}
												</span>
												<span
													className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
													style={{
														background: alert.severity === "high" ? "var(--pd-danger-light)" : alert.severity === "medium" ? "var(--pd-warning-light)" : "var(--pd-bg-secondary)",
														color: alert.severity === "high" ? "var(--pd-danger)" : alert.severity === "medium" ? "var(--pd-warning)" : "var(--pd-text-muted)",
													}}
												>
													{alert.severity}
												</span>
											</div>
										</div>
										<div className="flex items-center gap-3">
											{alert.matchCount > 0 && (
												<span className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
													{alert.matchCount} matches
												</span>
											)}
											<button
												type="button"
												onClick={() => removeKeywordAlert(teenAccount.id, alert.id)}
												className="p-1.5 rounded-lg transition-colors"
												style={{ color: "var(--pd-danger)" }}
											>
												<Trash2 size={14} />
											</button>
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="text-sm text-center py-4" style={{ color: "var(--pd-text-muted)" }}>
								No keyword alerts configured
							</p>
						)}
					</div>

					{/* Recent matches */}
					{matches.length > 0 && (
						<div className="pd-card p-5">
							<h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--pd-text)" }}>
								<AlertTriangle size={16} style={{ color: "var(--pd-warning)" }} />
								Recent Matches ({matches.length})
							</h3>
							<div className="space-y-2">
								{matches.map((match) => (
									<div
										key={match.id}
										className="p-3 rounded-lg"
										style={{ background: "var(--pd-warning-light)" }}
									>
										<div className="flex items-start justify-between gap-2">
											<div>
												<p className="text-xs font-medium" style={{ color: "var(--pd-warning)" }}>
													Keyword: &quot;{match.keyword}&quot; in #{match.channelName}
												</p>
												<p className="text-sm mt-1" style={{ color: "var(--pd-text)" }}>
													{match.snippet}
												</p>
												<p className="text-xs mt-1" style={{ color: "var(--pd-text-muted)" }}>
													{new Date(match.timestamp).toLocaleString()}
												</p>
											</div>
											<button
												type="button"
												onClick={() => dismissKeywordMatch(teenAccount.id, match.id)}
												className="p-1 shrink-0"
												style={{ color: "var(--pd-text-muted)" }}
											>
												<X size={14} />
											</button>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Categories tab */}
			{activeTab === "categories" && (
				<div className="pd-card p-5">
					<h3 className="text-sm font-semibold mb-4" style={{ color: "var(--pd-text)" }}>
						Blocked Content Categories
					</h3>
					<p className="text-xs mb-4" style={{ color: "var(--pd-text-muted)" }}>
						Toggle categories to block specific types of content.
					</p>
					<div className="space-y-2">
						{categories.map((cat) => (
							<div
								key={cat.id}
								className="flex items-center justify-between p-4 rounded-lg"
								style={{ background: "var(--pd-bg-secondary)" }}
							>
								<div className="flex items-center gap-3">
									<Shield size={18} style={{ color: cat.isActive ? "var(--pd-danger)" : "var(--pd-text-muted)" }} />
									<div>
										<p className="text-sm font-medium" style={{ color: "var(--pd-text)" }}>
											{cat.name}
										</p>
										<p className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
											{cat.description}
										</p>
									</div>
								</div>
								<button
									type="button"
									onClick={() => toggleBlockedCategory(teenAccount.id, cat.id)}
									className="w-10 h-6 rounded-full transition-colors relative shrink-0"
									style={{
										background: cat.isActive ? "var(--pd-danger)" : "var(--pd-border)",
									}}
								>
									<span
										className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
										style={{
											left: cat.isActive ? "18px" : "2px",
										}}
									/>
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Time limits tab */}
			{activeTab === "timelimits" && (
				<div className="pd-card p-5 space-y-5">
					<h3 className="text-sm font-semibold" style={{ color: "var(--pd-text)" }}>
						Time Limit Configuration
					</h3>

					<TimeLimitForm
						config={timeLimitConfig}
						onSave={handleSaveTimeLimit}
						onRemove={() => removeTimeLimit(teenAccount.id)}
					/>
				</div>
			)}

			{/* Screen time tab */}
			{activeTab === "screentime" && (
				<div className="space-y-4">
					<div className="pd-card p-5">
						<h3 className="text-sm font-semibold mb-4" style={{ color: "var(--pd-text)" }}>
							Screen Time (Last 30 Days)
						</h3>
						{screenTimeData.length > 0 ? (
							<StatsChart
								data={screenTimeData.map((d) => ({
									date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
									Active: Math.round(d.activeMinutes / 60 * 10) / 10,
									Idle: Math.round(d.idleMinutes / 60 * 10) / 10,
									Voice: Math.round(d.voiceTotalMinutes / 60 * 10) / 10,
								}))}
								type="bar"
								xKey="date"
								yKeys={[
									{ key: "Active", color: "#6366f1", label: "Active (hours)" },
									{ key: "Idle", color: "#a5b4fc", label: "Idle (hours)" },
									{ key: "Voice", color: "#10b981", label: "Voice (hours)" },
								]}
								height={280}
								showGrid
								showTooltip
							/>
						) : (
							<p className="text-center py-8 text-sm" style={{ color: "var(--pd-text-muted)" }}>
								No screen time data available yet
							</p>
						)}
					</div>

					{screenTimeData.length > 0 && (
						<div className="pd-card p-5">
							<h3 className="text-sm font-semibold mb-3" style={{ color: "var(--pd-text)" }}>
								Daily Breakdown
							</h3>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr style={{ borderBottom: "1px solid var(--pd-border)" }}>
											<th className="text-left py-2 font-medium" style={{ color: "var(--pd-text-secondary)" }}>Date</th>
											<th className="text-right py-2 font-medium" style={{ color: "var(--pd-text-secondary)" }}>Total</th>
											<th className="text-right py-2 font-medium" style={{ color: "var(--pd-text-secondary)" }}>Active</th>
											<th className="text-right py-2 font-medium" style={{ color: "var(--pd-text-secondary)" }}>Voice</th>
										</tr>
									</thead>
									<tbody>
										{screenTimeData.slice(0, 7).map((d) => (
											<tr key={d.date} style={{ borderBottom: "1px solid var(--pd-border)" }}>
												<td className="py-2" style={{ color: "var(--pd-text)" }}>
													{new Date(d.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
												</td>
												<td className="text-right py-2" style={{ color: "var(--pd-text)" }}>
													{(d.totalMinutes / 60).toFixed(1)}h
												</td>
												<td className="text-right py-2" style={{ color: "var(--pd-text-muted)" }}>
													{(d.activeMinutes / 60).toFixed(1)}h
												</td>
												<td className="text-right py-2" style={{ color: "var(--pd-text-muted)" }}>
													{(d.voiceTotalMinutes / 60).toFixed(1)}h
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// Time limit form sub-component
function TimeLimitForm({
	config,
	onSave,
	onRemove,
}: {
	config: TimeLimitConfig | undefined;
	onSave: (config: TimeLimitConfig) => void;
	onRemove: () => void;
}) {
	const [dailyMinutes, setDailyMinutes] = useState(config?.dailyLimitMinutes || 480);
	const [isActive, setIsActive] = useState(config?.isActive ?? false);
	const [weekdayStart, setWeekdayStart] = useState(config?.weekdaySchedule?.start || "");
	const [weekdayEnd, setWeekdayEnd] = useState(config?.weekdaySchedule?.end || "");
	const [weekendStart, setWeekendStart] = useState(config?.weekendSchedule?.start || "");
	const [weekendEnd, setWeekendEnd] = useState(config?.weekendSchedule?.end || "");

	const handleSave = () => {
		onSave({
			dailyLimitMinutes: dailyMinutes,
			isActive,
			weekdaySchedule: weekdayStart && weekdayEnd ? { start: weekdayStart, end: weekdayEnd } : null,
			weekendSchedule: weekendStart && weekendEnd ? { start: weekendStart, end: weekendEnd } : null,
		});
	};

	return (
		<div className="space-y-5">
			{/* Active toggle */}
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm font-medium" style={{ color: "var(--pd-text)" }}>
						Enable Time Limits
					</p>
					<p className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
						Restrict daily usage time
					</p>
				</div>
				<button
					type="button"
					onClick={() => setIsActive(!isActive)}
					className="w-10 h-6 rounded-full transition-colors relative"
					style={{ background: isActive ? "var(--pd-primary)" : "var(--pd-border)" }}
				>
					<span
						className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
						style={{ left: isActive ? "18px" : "2px" }}
					/>
				</button>
			</div>

			{/* Daily limit slider */}
			<div>
				<div className="flex items-center justify-between mb-2">
					<label className="text-sm font-medium" style={{ color: "var(--pd-text)" }}>
						Daily Limit
					</label>
					<span className="text-sm font-semibold" style={{ color: "var(--pd-primary)" }}>
						{Math.floor(dailyMinutes / 60)}h {dailyMinutes % 60}m
					</span>
				</div>
				<input
					type="range"
					min={30}
					max={1440}
					step={30}
					value={dailyMinutes}
					onChange={(e) => setDailyMinutes(Number(e.target.value))}
					className="w-full accent-[oklch(0.55_0.15_240)]"
				/>
				<div className="flex justify-between text-xs mt-1" style={{ color: "var(--pd-text-muted)" }}>
					<span>30m</span>
					<span>24h</span>
				</div>
			</div>

			{/* Weekday schedule */}
			<div>
				<p className="text-sm font-medium mb-2" style={{ color: "var(--pd-text)" }}>
					Weekday Schedule (optional)
				</p>
				<div className="flex items-center gap-2">
					<input
						type="time"
						value={weekdayStart}
						onChange={(e) => setWeekdayStart(e.target.value)}
						className="px-3 py-2 rounded-lg text-sm"
						style={{
							background: "var(--pd-bg-secondary)",
							color: "var(--pd-text)",
							border: "1px solid var(--pd-border)",
						}}
					/>
					<span style={{ color: "var(--pd-text-muted)" }}>to</span>
					<input
						type="time"
						value={weekdayEnd}
						onChange={(e) => setWeekdayEnd(e.target.value)}
						className="px-3 py-2 rounded-lg text-sm"
						style={{
							background: "var(--pd-bg-secondary)",
							color: "var(--pd-text)",
							border: "1px solid var(--pd-border)",
						}}
					/>
				</div>
			</div>

			{/* Weekend schedule */}
			<div>
				<p className="text-sm font-medium mb-2" style={{ color: "var(--pd-text)" }}>
					Weekend Schedule (optional)
				</p>
				<div className="flex items-center gap-2">
					<input
						type="time"
						value={weekendStart}
						onChange={(e) => setWeekendStart(e.target.value)}
						className="px-3 py-2 rounded-lg text-sm"
						style={{
							background: "var(--pd-bg-secondary)",
							color: "var(--pd-text)",
							border: "1px solid var(--pd-border)",
						}}
					/>
					<span style={{ color: "var(--pd-text-muted)" }}>to</span>
					<input
						type="time"
						value={weekendEnd}
						onChange={(e) => setWeekendEnd(e.target.value)}
						className="px-3 py-2 rounded-lg text-sm"
						style={{
							background: "var(--pd-bg-secondary)",
							color: "var(--pd-text)",
							border: "1px solid var(--pd-border)",
						}}
					/>
				</div>
			</div>

			{/* Actions */}
			<div className="flex gap-3 pt-2">
				<button
					type="button"
					onClick={handleSave}
					className="px-5 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-1.5"
					style={{ background: "var(--pd-primary)" }}
				>
					<Check size={16} />
					Save
				</button>
				{config && (
					<button
						type="button"
						onClick={onRemove}
						className="px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
						style={{ color: "var(--pd-danger)", background: "var(--pd-danger-light)" }}
					>
						<Trash2 size={16} />
						Remove
					</button>
				)}
			</div>
		</div>
	);
}
