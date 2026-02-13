"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFamilyStore } from "@/store/family.store";
import { MONITORING_LEVELS } from "@/lib/types/family";
import { Avatar } from "@/components/ui/avatar/avatar";
import {
	MessageSquare,
	Clock,
	AlertTriangle,
	Flag,
	Eye,
	Server,
	Shield,
	Users,
	TrendingUp,
	TrendingDown,
	ArrowRight,
} from "lucide-react";
import dynamic from "next/dynamic";

const StatsChart = dynamic(
	() => import("@/components/parent-dashboard/stats-chart").then((mod) => mod.StatsChart),
	{ ssr: false },
);

export default function OverviewPage() {
	const router = useRouter();
	const getSelectedTeenAccount = useFamilyStore((s) => s.getSelectedTeenAccount);
	const teenAccount = getSelectedTeenAccount();

	const stats = useMemo(() => {
		if (!teenAccount) return null;
		const { activity, contentFlags, pendingServers, pendingFriends } = teenAccount;
		const pendingAlerts =
			contentFlags.filter((f) => f.status === "pending").length +
			pendingServers.filter((s) => s.status === "pending").length +
			pendingFriends.filter((f) => f.status === "pending").length;
		const activeFlags = contentFlags.filter((f) => f.status === "pending").length;
		return {
			messages: activity.messagesSent7Days,
			screenTime: activity.timeSpent7Days,
			pendingAlerts,
			activeFlags,
			dailyActivity: activity.dailyActivity,
		};
	}, [teenAccount]);

	if (!teenAccount || !stats) {
		return (
			<div className="flex items-center justify-center h-full">
				<p style={{ color: "var(--pd-text-muted)" }}>No teen account selected</p>
			</div>
		);
	}

	const levelInfo = MONITORING_LEVELS[teenAccount.monitoringLevel];
	const chartData = stats.dailyActivity.map((d) => ({
		date: new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }),
		Messages: d.messages,
		Hours: Number(d.timeSpent.toFixed(1)),
	}));

	const quickActions = [
		{ label: "Monitoring Settings", icon: Eye, href: "/parent-dashboard/monitoring", description: "Adjust oversight level" },
		{ label: "Activity Logs", icon: Clock, href: "/parent-dashboard/activity", description: "View detailed activity" },
		{ label: "Server Management", icon: Server, href: "/parent-dashboard/servers", description: "Review joined servers" },
		{ label: "Safety Tools", icon: Shield, href: "/parent-dashboard/safety", description: "Keywords, limits, categories" },
	];

	return (
		<div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6">
			{/* Welcome header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold" style={{ color: "var(--pd-text)" }}>
						Welcome back
					</h1>
					<p className="text-sm mt-1" style={{ color: "var(--pd-text-muted)" }}>
						Here&apos;s an overview of {teenAccount.user.displayName}&apos;s activity
					</p>
				</div>
			</div>

			{/* Teen summary card */}
			<div className="pd-card p-5">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex items-center gap-4">
						<Avatar
							src={teenAccount.user.avatar}
							alt={teenAccount.user.displayName}
							size="lg"
						/>
						<div>
							<h2 className="text-lg font-semibold" style={{ color: "var(--pd-text)" }}>
								{teenAccount.user.displayName}
							</h2>
							<p className="text-sm" style={{ color: "var(--pd-text-muted)" }}>
								@{teenAccount.user.username}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<span
							className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
							style={{
								backgroundColor: `${levelInfo.color.replace(")", " / 0.15)")}`,
								color: levelInfo.color,
							}}
						>
							{levelInfo.name} Monitoring
						</span>
						<span
							className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
							style={{
								background: teenAccount.user.status === "online" ? "var(--pd-success-light)" : "var(--pd-bg-secondary)",
								color: teenAccount.user.status === "online" ? "var(--pd-success)" : "var(--pd-text-muted)",
							}}
						>
							{teenAccount.user.status === "online" ? "Online" : "Offline"}
						</span>
					</div>
				</div>
			</div>

			{/* Quick stats grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{[
					{ icon: MessageSquare, label: "Messages (7 days)", value: stats.messages, color: "var(--pd-primary)", bgColor: "var(--pd-primary-light)" },
					{ icon: Clock, label: "Screen Time (7 days)", value: `${stats.screenTime.toFixed(1)}h`, color: "var(--pd-accent)", bgColor: "oklch(0.92 0.03 170)" },
					{ icon: AlertTriangle, label: "Pending Alerts", value: stats.pendingAlerts, color: "var(--pd-warning)", bgColor: "var(--pd-warning-light)" },
					{ icon: Flag, label: "Active Flags", value: stats.activeFlags, color: "var(--pd-danger)", bgColor: "var(--pd-danger-light)" },
				].map((stat) => (
					<div key={stat.label} className="pd-card p-5">
						<div className="flex items-start gap-3">
							<div
								className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
								style={{ backgroundColor: stat.bgColor }}
							>
								<stat.icon size={20} style={{ color: stat.color }} />
							</div>
							<div>
								<p className="text-2xl font-bold" style={{ color: "var(--pd-text)" }}>
									{stat.value}
								</p>
								<p className="text-xs mt-0.5" style={{ color: "var(--pd-text-muted)" }}>
									{stat.label}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Activity chart */}
			{chartData.length > 0 && (
				<div className="pd-card p-5">
					<h3 className="text-base font-semibold mb-4" style={{ color: "var(--pd-text)" }}>
						Activity Trend (Last 7 Days)
					</h3>
					<StatsChart
						data={chartData}
						type="bar"
						xKey="date"
						yKeys={[
							{ key: "Messages", color: "#6366f1", label: "Messages" },
						]}
						height={240}
						showGrid
						showTooltip
					/>
				</div>
			)}

			{/* Recent transparency log */}
			{teenAccount.transparencyLog.length > 0 && (
				<div className="pd-card p-5">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-base font-semibold" style={{ color: "var(--pd-text)" }}>
							Recent Activity Log
						</h3>
						<button
							type="button"
							onClick={() => router.push("/parent-dashboard/activity")}
							className="text-sm font-medium flex items-center gap-1"
							style={{ color: "var(--pd-primary)" }}
						>
							View All <ArrowRight size={14} />
						</button>
					</div>
					<div className="space-y-3">
						{teenAccount.transparencyLog.slice(0, 5).map((entry) => (
							<div
								key={entry.id}
								className="flex items-start gap-3 p-3 rounded-lg"
								style={{ background: "var(--pd-bg-secondary)" }}
							>
								<div
									className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
									style={{ background: "var(--pd-primary-light)" }}
								>
									<Eye size={14} style={{ color: "var(--pd-primary)" }} />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm" style={{ color: "var(--pd-text)" }}>
										{entry.details}
									</p>
									<p className="text-xs mt-0.5" style={{ color: "var(--pd-text-muted)" }}>
										{new Date(entry.timestamp).toLocaleString()}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Quick actions */}
			<div className="pd-card p-5">
				<h3 className="text-base font-semibold mb-4" style={{ color: "var(--pd-text)" }}>
					Quick Actions
				</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{quickActions.map((action) => (
						<button
							key={action.href}
							type="button"
							onClick={() => router.push(action.href)}
							className="pd-card pd-card-hover p-4 flex items-center gap-3 text-left transition-all"
						>
							<div
								className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
								style={{ background: "var(--pd-primary-light)" }}
							>
								<action.icon size={20} style={{ color: "var(--pd-primary)" }} />
							</div>
							<div>
								<p className="text-sm font-medium" style={{ color: "var(--pd-text)" }}>
									{action.label}
								</p>
								<p className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
									{action.description}
								</p>
							</div>
						</button>
					))}
				</div>
			</div>

			{/* Privacy notice */}
			<div
				className="text-center text-sm p-4 rounded-lg"
				style={{ background: "var(--pd-primary-light)", color: "var(--pd-primary)" }}
			>
				<p className="flex items-center justify-center gap-2">
					<Shield size={16} />
					All dashboard views are logged. Your teen can see when and what you access.
				</p>
			</div>
		</div>
	);
}
