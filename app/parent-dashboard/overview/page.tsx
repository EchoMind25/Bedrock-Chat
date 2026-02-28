"use client";

import { useMemo, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFamilyStore } from "@/store/family.store";
import { MONITORING_LEVELS } from "@/lib/types/family";
import { Avatar } from "@/components/ui/avatar/avatar";
import { usePresenceStore } from "@/store/presence.store";
import {
	MessageSquare,
	Clock,
	AlertTriangle,
	Flag,
	Eye,
	Server,
	Shield,
	UserPlus,
	ArrowRight,
	X,
	Check,
	Loader2,
} from "lucide-react";
import dynamic from "next/dynamic";

const StatsChart = dynamic(
	() => import("@/components/parent-dashboard/stats-chart").then((mod) => mod.StatsChart),
	{ ssr: false },
);

// ── Add Teen Form ────────────────────────────────────────────────────────────

function AddTeenForm({ onSuccess, onCancel }: { onSuccess: (username: string) => void; onCancel?: () => void }) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (username.length < 3) { setError("Username must be at least 3 characters"); return; }
		if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
		if (password !== confirm) { setError("Passwords do not match"); return; }

		setIsCreating(true);
		try {
			const res = await fetch("/api/parent/create-teen", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
			});
			const data = await res.json();

			if (!res.ok) {
				setError(data.error ?? "Something went wrong");
				return;
			}

			setSuccess(true);
			setTimeout(() => onSuccess(username), 1200);
		} catch {
			setError("Network error — please try again");
		} finally {
			setIsCreating(false);
		}
	};

	if (success) {
		return (
			<div className="flex flex-col items-center gap-3 py-6">
				<div
					className="w-12 h-12 rounded-full flex items-center justify-center"
					style={{ background: "var(--pd-success-light)" }}
				>
					<Check size={22} style={{ color: "var(--pd-success)" }} />
				</div>
				<p className="font-semibold" style={{ color: "var(--pd-success)" }}>
					@{username} account created!
				</p>
				<p className="text-sm text-center" style={{ color: "var(--pd-text-muted)" }}>
					Refreshing dashboard…
				</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label
					htmlFor="teen-username"
					className="block text-sm font-medium mb-1.5"
					style={{ color: "var(--pd-text)" }}
				>
					Username
				</label>
				<input
					id="teen-username"
					type="text"
					value={username}
					onChange={(e) => setUsername(e.target.value.trim())}
					placeholder="coolteen123"
					autoComplete="off"
					minLength={3}
					required
					className="w-full px-3 py-2.5 rounded-lg text-sm outline-none focus:ring-2"
					style={{
						background: "var(--pd-bg-secondary)",
						color: "var(--pd-text)",
						border: "1px solid var(--pd-border)",
					}}
				/>
				<p className="text-xs mt-1" style={{ color: "var(--pd-text-muted)" }}>
					No email needed — teen logs in with username + password only
				</p>
			</div>

			<div>
				<label
					htmlFor="teen-password"
					className="block text-sm font-medium mb-1.5"
					style={{ color: "var(--pd-text)" }}
				>
					Password
				</label>
				<input
					id="teen-password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="••••••••"
					autoComplete="new-password"
					minLength={8}
					required
					className="w-full px-3 py-2.5 rounded-lg text-sm outline-none focus:ring-2"
					style={{
						background: "var(--pd-bg-secondary)",
						color: "var(--pd-text)",
						border: "1px solid var(--pd-border)",
					}}
				/>
			</div>

			<div>
				<label
					htmlFor="teen-confirm"
					className="block text-sm font-medium mb-1.5"
					style={{ color: "var(--pd-text)" }}
				>
					Confirm Password
				</label>
				<input
					id="teen-confirm"
					type="password"
					value={confirm}
					onChange={(e) => setConfirm(e.target.value)}
					placeholder="••••••••"
					autoComplete="new-password"
					required
					className="w-full px-3 py-2.5 rounded-lg text-sm outline-none focus:ring-2"
					style={{
						background: "var(--pd-bg-secondary)",
						color: "var(--pd-text)",
						border: "1px solid var(--pd-border)",
					}}
				/>
			</div>

			{error && (
				<p className="text-sm px-3 py-2 rounded-lg" style={{ background: "var(--pd-danger-light)", color: "var(--pd-danger)" }}>
					{error}
				</p>
			)}

			<div className="flex gap-3 pt-1">
				<button
					type="submit"
					disabled={isCreating}
					className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60 transition-opacity"
					style={{ background: "var(--pd-primary)" }}
				>
					{isCreating ? (
						<><Loader2 size={15} className="animate-spin" /> Creating…</>
					) : (
						<><UserPlus size={15} /> Create Account</>
					)}
				</button>
				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						className="px-4 py-2.5 rounded-lg text-sm font-medium"
						style={{ background: "var(--pd-bg-secondary)", color: "var(--pd-text-muted)" }}
					>
						Cancel
					</button>
				)}
			</div>
		</form>
	);
}

// ── Overview Page ────────────────────────────────────────────────────────────

export default function OverviewPage() {
	const router = useRouter();
	const getSelectedTeenAccount = useFamilyStore((s) => s.getSelectedTeenAccount);
	const reinit = useFamilyStore((s) => s.reset);
	const teenAccount = getSelectedTeenAccount();
	const [showAddTeen, setShowAddTeen] = useState(false);

	// Real-time teen presence — only available at monitoring level 2+
	const teenUserId = teenAccount?.user.id;
	const teenPresenceStatus = usePresenceStore(
		useCallback((s) => {
			if (!teenUserId) return null;
			const presence = s.onlineUsers.get(teenUserId);
			return presence?.status ?? null;
		}, [teenUserId])
	);

	// Log transparency entry when parent views teen's presence (once per page view)
	const hasLoggedRef = useRef(false);
	useEffect(() => {
		if (!teenAccount || hasLoggedRef.current) return;
		if (teenAccount.monitoringLevel >= 2 && teenPresenceStatus) {
			hasLoggedRef.current = true;
			const logEntry = {
				id: `log-${Date.now()}`,
				action: "viewed_presence" as const,
				details: "Parent viewed your online status",
				timestamp: new Date(),
			};
			useFamilyStore.setState((state) => ({
				teenAccounts: state.teenAccounts.map((ta) =>
					ta.id === teenAccount.id
						? { ...ta, transparencyLog: [logEntry, ...ta.transparencyLog] }
						: ta,
				),
			}));
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [teenPresenceStatus, teenAccount?.monitoringLevel]);

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

	// ── Empty state: no teens yet ─────────────────────────────────────────────
	if (!teenAccount || !stats) {
		return (
			<div className="max-w-lg mx-auto p-4 lg:p-6">
				<div className="pd-card p-6 space-y-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-xl font-semibold" style={{ color: "var(--pd-text)" }}>
								Add a Teen Account
							</h1>
							<p className="text-sm mt-1" style={{ color: "var(--pd-text-muted)" }}>
								No email required — just a username and password
							</p>
						</div>
						<div
							className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
							style={{ background: "var(--pd-primary-light)" }}
						>
							<UserPlus size={22} style={{ color: "var(--pd-primary)" }} />
						</div>
					</div>

					<AddTeenForm
						onSuccess={() => {
							// Reset the family store so it re-fetches the new teen
							reinit();
							router.refresh();
						}}
					/>
				</div>
			</div>
		);
	}

	// ── Normal overview ───────────────────────────────────────────────────────
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
				<button
					type="button"
					onClick={() => setShowAddTeen((v) => !v)}
					className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
					style={{
						background: showAddTeen ? "var(--pd-bg-secondary)" : "var(--pd-primary-light)",
						color: showAddTeen ? "var(--pd-text-muted)" : "var(--pd-primary)",
					}}
				>
					{showAddTeen ? <><X size={15} /> Cancel</> : <><UserPlus size={15} /> Add Teen</>}
				</button>
			</div>

			{/* Add teen inline panel */}
			{showAddTeen && (
				<div className="pd-card p-5">
					<h2 className="text-base font-semibold mb-4" style={{ color: "var(--pd-text)" }}>
						Add Another Teen Account
					</h2>
					<AddTeenForm
						onSuccess={() => {
							setShowAddTeen(false);
							reinit();
							router.refresh();
						}}
						onCancel={() => setShowAddTeen(false)}
					/>
				</div>
			)}

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
						{teenAccount.monitoringLevel >= 2 && (
							<span
								className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
								style={{
									background: (teenPresenceStatus === "online" || teenPresenceStatus === "idle" || teenPresenceStatus === "dnd")
										? "var(--pd-success-light)"
										: "var(--pd-bg-secondary)",
									color: teenPresenceStatus === "online"
										? "var(--pd-success)"
										: teenPresenceStatus === "idle"
											? "var(--pd-warning)"
											: teenPresenceStatus === "dnd"
												? "var(--pd-danger)"
												: "var(--pd-text-muted)",
								}}
							>
								<span
									className="w-2 h-2 rounded-full"
									style={{
										backgroundColor: teenPresenceStatus === "online"
											? "oklch(0.72 0.19 145)"
											: teenPresenceStatus === "idle"
												? "oklch(0.80 0.18 85)"
												: teenPresenceStatus === "dnd"
													? "oklch(0.63 0.21 25)"
													: "oklch(0.50 0.01 250)",
									}}
								/>
								{teenAccount.monitoringLevel >= 3
									? (teenPresenceStatus ?? "Offline")
									: (teenPresenceStatus === "online" || teenPresenceStatus === "idle" || teenPresenceStatus === "dnd") ? "Online" : "Offline"
								}
							</span>
						)}
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
