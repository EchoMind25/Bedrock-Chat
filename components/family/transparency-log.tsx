import type { TransparencyLogEntry } from "@/lib/types/family";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from "@/components/ui/card/card";
import { Badge } from "@/components/ui/badge/badge";
import { motion } from "motion/react";

interface TransparencyLogProps {
	/**
	 * Log entries to display
	 */
	entries: TransparencyLogEntry[];

	/**
	 * Maximum number of entries to show
	 */
	maxEntries?: number;

	/**
	 * Show as compact list
	 */
	compact?: boolean;
}

const actionIcons: Record<string, string> = {
	viewed_messages: "👁️",
	viewed_friends: "👥",
	viewed_servers: "🏰",
	viewed_flags: "🚩",
	changed_monitoring_level: "⚙️",
	approved_server: "✅",
	denied_server: "❌",
	approved_friend: "✅",
	denied_friend: "❌",
	added_keyword_alert: "🔍",
	removed_keyword_alert: "🔍",
	changed_time_limit: "⏰",
	blocked_category: "🚫",
	unblocked_category: "🚫",
	viewed_voice_metadata: "🎙️",
	exported_activity_log: "📤",
	changed_data_retention: "🗄️",
	restricted_server: "🔒",
	unrestricted_server: "🔓",
};

const actionColors: Record<string, string> = {
	viewed_messages: "text-blue-400",
	viewed_friends: "text-green-400",
	viewed_servers: "text-purple-400",
	viewed_flags: "text-orange-400",
	changed_monitoring_level: "text-yellow-400",
	approved_server: "text-green-400",
	denied_server: "text-red-400",
	approved_friend: "text-green-400",
	denied_friend: "text-red-400",
	added_keyword_alert: "text-cyan-400",
	removed_keyword_alert: "text-cyan-400",
	changed_time_limit: "text-amber-400",
	blocked_category: "text-red-400",
	unblocked_category: "text-green-400",
	viewed_voice_metadata: "text-indigo-400",
	exported_activity_log: "text-blue-400",
	changed_data_retention: "text-gray-400",
	restricted_server: "text-red-400",
	unrestricted_server: "text-green-400",
};

/**
 * Transparency log component for teens to see parent access
 * CRITICAL: This shows ALL parent actions - cannot be hidden or deleted
 */
export function TransparencyLog({
	entries,
	maxEntries,
	compact = false,
}: TransparencyLogProps) {
	const displayEntries = maxEntries ? entries.slice(0, maxEntries) : entries;

	if (compact) {
		return (
			<div className="space-y-2">
				{displayEntries.map((entry) => (
					<motion.div
						key={entry.id}
						className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
					>
						<span className="text-xl shrink-0">
							{actionIcons[entry.action]}
						</span>
						<div className="flex-1 min-w-0">
							<p className="text-sm text-white">{entry.details}</p>
							<p className="text-xs text-white/50 mt-1">
								{new Date(entry.timestamp).toLocaleString()}
							</p>
						</div>
					</motion.div>
				))}
			</div>
		);
	}

	return (
		<Card tilt={false}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Transparency Log</CardTitle>
					<Badge variant="secondary" className="text-xs">
						{entries.length} entries
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				{/* Info Banner */}
				<div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
					<p className="text-sm text-blue-200 flex items-center gap-2">
						<span>ℹ️</span>
						<span>
							This log shows all parent access to your account. It cannot be
							deleted or hidden.
						</span>
					</p>
				</div>

				{/* Log Entries */}
				{displayEntries.length > 0 ? (
					<div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
						{displayEntries.map((entry, idx) => (
							<motion.div
								key={entry.id}
								className="p-4 bg-white/5 rounded-lg border border-white/10"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: idx * 0.05 }}
							>
								<div className="flex items-start gap-4">
									<div className="text-3xl shrink-0">
										{actionIcons[entry.action]}
									</div>
									<div className="flex-1">
										<div className="flex items-start justify-between gap-2">
											<p className="text-white font-medium">{entry.details}</p>
											<span className="text-xs text-white/50 shrink-0">
												{new Date(entry.timestamp).toLocaleString()}
											</span>
										</div>

										{/* Metadata Details */}
										{entry.metadata && (
											<div className="mt-2 space-y-1">
												{entry.metadata.channelName && (
													<p className="text-xs text-white/60">
														Channel: #{entry.metadata.channelName} in{" "}
														{entry.metadata.serverName}
													</p>
												)}
												{entry.metadata.friendName && (
													<p className="text-xs text-white/60">
														Friend: @{entry.metadata.friendName}
													</p>
												)}
												{entry.metadata.serverName &&
													!entry.metadata.channelName && (
														<p className="text-xs text-white/60">
															Server: {entry.metadata.serverName}
														</p>
													)}
												{entry.metadata.oldLevel !== undefined &&
													entry.metadata.newLevel !== undefined && (
														<p className="text-xs text-white/60">
															Changed from Level {entry.metadata.oldLevel} to
															Level {entry.metadata.newLevel}
														</p>
													)}
											</div>
										)}
									</div>
								</div>
							</motion.div>
						))}
					</div>
				) : (
					<div className="text-center py-8 text-white/60">
						<p>No transparency log entries yet</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
