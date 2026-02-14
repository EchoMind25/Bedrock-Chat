"use client";

import { motion } from "motion/react";
import { usePointsStore } from "@/store/points.store";
import { Glass } from "@/components/ui/glass/glass";

/**
 * Personal activity feed showing recent point earnings,
 * achievements, and milestones.
 * Privacy-first: opt-in sharing only.
 */
export function ActivityFeed() {
	const activity = usePointsStore((s) => s.activity);
	const isEnabled = usePointsStore((s) => s.isEnabled);

	if (!isEnabled) return null;

	if (activity.length === 0) {
		return (
			<div className="text-center py-12">
				<div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
					<svg
						width="28"
						height="28"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						className="text-blue-400/50"
					>
						<path d="M12 8v4l3 3" />
						<circle cx="12" cy="12" r="10" />
					</svg>
				</div>
				<p className="text-blue-300/40 text-sm">No activity yet</p>
				<p className="text-blue-300/30 text-xs mt-1">
					Start chatting to earn points
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{activity.map((entry, index) => (
				<motion.div
					key={entry.id}
					initial={{ opacity: 0, x: -10 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: index * 0.03 }}
				>
					<Glass
						variant="light"
						border="none"
						className="px-4 py-3 flex items-center gap-3"
					>
						{/* Icon */}
						<div
							className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
							style={{
								background: getIconBg(entry.type),
							}}
						>
							<span className="text-sm">{getIconEmoji(entry.type)}</span>
						</div>

						{/* Content */}
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-blue-300 truncate">
								{entry.title}
							</p>
							<p className="text-xs text-blue-300/40 truncate">
								{entry.description}
							</p>
						</div>

						{/* Points */}
						{entry.points !== undefined && (
							<span
								className={`text-sm font-semibold shrink-0 ${
									entry.points >= 0
										? "text-green-400/80"
										: "text-red-400/80"
								}`}
							>
								{entry.points >= 0 ? "+" : ""}
								{entry.points}
							</span>
						)}

						{/* Time */}
						<span className="text-[10px] text-blue-300/30 shrink-0">
							{formatTime(entry.timestamp)}
						</span>
					</Glass>
				</motion.div>
			))}
		</div>
	);
}

function getIconBg(type: string): string {
	switch (type) {
		case "achievement_unlocked":
			return "oklch(0.55 0.25 265 / 0.2)";
		case "easter_egg_found":
			return "oklch(0.6 0.15 85 / 0.2)";
		case "milestone_reached":
			return "oklch(0.6 0.2 40 / 0.2)";
		case "streak_extended":
			return "oklch(0.6 0.2 25 / 0.2)";
		case "item_purchased":
			return "oklch(0.6 0.15 145 / 0.2)";
		default:
			return "oklch(0.6 0.15 285 / 0.15)";
	}
}

function getIconEmoji(type: string): string {
	switch (type) {
		case "achievement_unlocked":
			return "★";
		case "easter_egg_found":
			return "✦";
		case "milestone_reached":
			return "🏆";
		case "streak_extended":
			return "🔥";
		case "item_purchased":
			return "🛍";
		case "server_joined":
			return "→";
		default:
			return "●";
	}
}

function formatTime(date: Date): string {
	const d = date instanceof Date ? date : new Date(date);
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffMin = Math.floor(diffMs / 60000);

	if (diffMin < 1) return "now";
	if (diffMin < 60) return `${diffMin}m`;
	const diffHours = Math.floor(diffMin / 60);
	if (diffHours < 24) return `${diffHours}h`;
	const diffDays = Math.floor(diffHours / 24);
	return `${diffDays}d`;
}
