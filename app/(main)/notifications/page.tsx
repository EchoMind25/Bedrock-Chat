"use client";

import { Bell, Check, Shield, UserPlus, Server, MessageSquare, Info } from "lucide-react";
import { motion } from "motion/react";
import { useNotificationStore } from "@/store/notification.store";
import type { AppNotification } from "@/store/notification.store";

function getIcon(type: AppNotification["type"]) {
	switch (type) {
		case "server_approval_request":
		case "server_approval_resolved":
		case "server_invite":
			return Server;
		case "friend_approval_request":
		case "friend_approval_resolved":
		case "friend_request":
			return UserPlus;
		case "monitoring_level_changed":
		case "family_alert":
			return Shield;
		case "mention":
			return MessageSquare;
		default:
			return Info;
	}
}

function formatRelative(dateStr: string) {
	const date = new Date(dateStr);
	const diff = Date.now() - date.getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "Just now";
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ago`;
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupByDate(notifications: AppNotification[]) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	const groups: { label: string; items: AppNotification[] }[] = [
		{ label: "Today", items: [] },
		{ label: "Yesterday", items: [] },
		{ label: "Older", items: [] },
	];

	for (const n of notifications) {
		const d = new Date(n.createdAt);
		d.setHours(0, 0, 0, 0);
		if (d.getTime() === today.getTime()) {
			groups[0].items.push(n);
		} else if (d.getTime() === yesterday.getTime()) {
			groups[1].items.push(n);
		} else {
			groups[2].items.push(n);
		}
	}

	return groups.filter((g) => g.items.length > 0);
}

export default function NotificationsPage() {
	const notifications = useNotificationStore((s) => s.notifications);
	const unreadCount = useNotificationStore((s) => s.unreadCount);
	const isLoading = useNotificationStore((s) => s.isLoading);
	const markRead = useNotificationStore((s) => s.markRead);
	const markAllRead = useNotificationStore((s) => s.markAllRead);

	const groups = groupByDate(notifications);

	return (
		<main className="flex-1 flex flex-col bg-[oklch(0.14_0.02_250)] overflow-hidden">
			{/* Header */}
			<header className="h-12 px-4 flex items-center justify-between gap-3 border-b border-white/10 bg-[oklch(0.15_0.02_250)] shrink-0">
				<div className="flex items-center gap-3">
					<Bell className="w-5 h-5 text-white/60" aria-hidden="true" />
					<h1 className="font-semibold text-white">Notifications</h1>
					{unreadCount > 0 && (
						<span className="text-xs bg-primary text-white rounded-full px-2 py-0.5 font-medium">
							{unreadCount}
						</span>
					)}
				</div>
				{unreadCount > 0 && (
					<button
						type="button"
						onClick={() => markAllRead()}
						className="text-xs text-white/50 hover:text-white/80 transition-colors flex items-center gap-1"
					>
						<Check size={12} />
						Mark all read
					</button>
				)}
			</header>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				{isLoading ? (
					/* Loading skeleton */
					<div className="p-4 space-y-3">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="flex items-start gap-3 p-3 rounded-xl animate-pulse">
								<div className="w-9 h-9 rounded-full bg-white/10 shrink-0" />
								<div className="flex-1 space-y-2">
									<div className="h-3 w-32 bg-white/10 rounded" />
									<div className="h-2.5 w-48 bg-white/10 rounded" />
								</div>
							</div>
						))}
					</div>
				) : notifications.length === 0 ? (
					/* Empty state */
					<div className="flex-1 flex items-center justify-center p-8">
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ type: "spring", stiffness: 260, damping: 20 }}
							className="flex flex-col items-center text-center max-w-sm"
						>
							<div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
								<Bell className="w-10 h-10 text-white/20" aria-hidden="true" />
							</div>
							<p className="text-white/60 font-medium">No notifications yet</p>
							<p className="text-sm text-white/40 mt-1">
								Mentions, friend requests, and server activity will appear here.
							</p>
						</motion.div>
					</div>
				) : (
					/* Notification groups */
					<div className="divide-y divide-white/5">
						{groups.map((group) => (
							<div key={group.label}>
								<p className="px-4 py-2 text-xs font-semibold text-white/40 sticky top-0 bg-[oklch(0.14_0.02_250)]">
									{group.label}
								</p>
								<div>
									{group.items.map((notification) => {
										const Icon = getIcon(notification.type);
										const isUnread = !notification.readAt;
										return (
											<button
												key={notification.id}
												type="button"
												onClick={() => {
													if (isUnread) markRead(notification.id);
													const href = notification.data?.href as string | undefined;
													if (href) window.location.href = href;
												}}
												className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
												style={{
													background: isUnread ? "oklch(0.18 0.04 265 / 0.3)" : undefined,
												}}
											>
												<div
													className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
													style={{
														background: isUnread ? "oklch(0.65 0.25 265 / 0.2)" : "oklch(0.2 0.02 250)",
													}}
												>
													<Icon
														size={16}
														style={{ color: isUnread ? "oklch(0.65 0.25 265)" : "oklch(0.5 0.02 250)" }}
														aria-hidden="true"
													/>
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-start justify-between gap-2">
														<p
															className="text-sm font-medium leading-snug"
															style={{ color: isUnread ? "white" : "oklch(0.7 0.02 250)" }}
														>
															{notification.title}
														</p>
														<span className="text-[10px] text-white/30 shrink-0 mt-0.5">
															{formatRelative(notification.createdAt)}
														</span>
													</div>
													<p className="text-xs mt-0.5 leading-relaxed" style={{ color: "oklch(0.55 0.02 250)" }}>
														{notification.body}
													</p>
												</div>
												{isUnread && (
													<span
														className="w-2 h-2 rounded-full shrink-0 mt-2"
														style={{ background: "oklch(0.65 0.25 265)" }}
														aria-label="Unread"
													/>
												)}
											</button>
										);
									})}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</main>
	);
}
