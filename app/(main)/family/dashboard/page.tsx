"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFamilyStore } from "@/store/family.store";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from "@/components/ui/card/card";
import { Button } from "@/components/ui/button/button";
import { Avatar } from "@/components/ui/avatar/avatar";
import { Badge } from "@/components/ui/badge/badge";
import { MONITORING_LEVELS } from "@/lib/types/family";
import type { MonitoringLevel } from "@/lib/types/family";
import { motion, AnimatePresence } from "motion/react";

export default function FamilyDashboardPage() {
	const router = useRouter();
	const {
		teenAccounts,
		selectedTeenId,
		setSelectedTeen,
		getSelectedTeenAccount,
		setMonitoringLevel,
		viewServers,
		viewFriends,
		viewFlags,
	} = useFamilyStore();

	const teenAccount = getSelectedTeenAccount();
	const [showLevelSelector, setShowLevelSelector] = useState(false);

	if (!teenAccount) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-white/60">No teen account selected</p>
			</div>
		);
	}

	const { user, activity, monitoringLevel, contentFlags, pendingServers, pendingFriends } = teenAccount;
	const levelInfo = MONITORING_LEVELS[monitoringLevel];

	// Calculate pending items count
	const pendingCount = pendingServers.filter(s => s.status === "pending").length +
		pendingFriends.filter(f => f.status === "pending").length +
		contentFlags.filter(f => f.status === "pending").length;

	return (
		<div className="h-full overflow-y-auto bg-[oklch(0.12_0.02_250)]">
			<div className="max-w-6xl mx-auto p-6 space-y-6">
				{/* Header with Teen Selector */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Avatar src={user.avatar} alt={user.displayName} size="lg" />
						<div>
							<div className="flex items-center gap-3">
								<h1 className="text-2xl font-bold text-white">
									{user.displayName}
								</h1>
								<Badge variant="secondary" className="text-xs">
									Parent-Managed
								</Badge>
							</div>
							<p className="text-white/60">@{user.username}</p>
						</div>
					</div>

					{/* Teen Selector */}
					{teenAccounts.length > 1 && (
						<div className="relative">
							<select
								value={selectedTeenId || ""}
								onChange={(e) => setSelectedTeen(e.target.value)}
								className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
							>
								{teenAccounts.map((ta) => (
									<option key={ta.id} value={ta.id} className="bg-[oklch(0.15_0.02_250)]">
										{ta.user.displayName}
									</option>
								))}
							</select>
						</div>
					)}
				</div>

				{/* Monitoring Level Badge */}
				<Card tilt={false}>
					<CardContent>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div
									className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
									style={{
										backgroundColor: `${levelInfo.color.replace(")", " / 0.2)")}`,
										color: levelInfo.color,
									}}
								>
									{monitoringLevel === 1 && "🟢"}
									{monitoringLevel === 2 && "🟡"}
									{monitoringLevel === 3 && "🟠"}
									{monitoringLevel === 4 && "🔴"}
								</div>
								<div>
									<h3 className="text-lg font-bold text-white">
										{levelInfo.name} Monitoring
									</h3>
									<p className="text-sm text-white/60">
										{levelInfo.description}
									</p>
								</div>
							</div>
							<Button
								variant="secondary"
								size="sm"
								onClick={() => setShowLevelSelector(!showLevelSelector)}
							>
								Change Level
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Monitoring Level Selector */}
				<AnimatePresence>
					{showLevelSelector && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
						>
							<Card tilt={false}>
								<CardHeader>
									<CardTitle>Select Monitoring Level</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										{([1, 2, 3, 4] as MonitoringLevel[]).map((level) => {
											const info = MONITORING_LEVELS[level];
											const isActive = level === monitoringLevel;

											return (
												<motion.button
													key={level}
													onClick={() => {
														if (!isActive) {
															setMonitoringLevel(teenAccount.id, level);
															setShowLevelSelector(false);
														}
													}}
													className={`
														w-full p-4 rounded-lg border-2 text-left
														transition-all
														${
															isActive
																? "border-white/30 bg-white/10"
																: "border-white/10 hover:border-white/20 hover:bg-white/5"
														}
													`}
													whileHover={{ scale: 1.02 }}
													whileTap={{ scale: 0.98 }}
													type="button"
												>
													<div className="flex items-start gap-3">
														<div
															className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
															style={{
																backgroundColor: `${info.color.replace(")", " / 0.2)")}`,
																color: info.color,
															}}
														>
															{level === 1 && "🟢"}
															{level === 2 && "🟡"}
															{level === 3 && "🟠"}
															{level === 4 && "🔴"}
														</div>
														<div className="flex-1">
															<div className="flex items-center gap-2">
																<h4 className="font-bold text-white">
																	{info.name}
																</h4>
																{isActive && (
																	<Badge variant="primary" className="text-xs">
																		Active
																	</Badge>
																)}
															</div>
															<p className="text-sm text-white/60 mt-1">
																{info.description}
															</p>
															<ul className="mt-2 space-y-1">
																{info.features.map((feature, idx) => (
																	<li
																		key={idx}
																		className="text-xs text-white/50 flex items-center gap-2"
																	>
																		<span>•</span>
																		<span>{feature}</span>
																	</li>
																))}
															</ul>
														</div>
													</div>
												</motion.button>
											);
										})}
									</div>
								</CardContent>
							</Card>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Activity Overview */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<Card hoverable tilt={false}>
						<CardContent>
							<div className="text-center">
								<div className="text-4xl font-bold text-primary">
									{activity.messagesSent7Days}
								</div>
								<div className="text-sm text-white/60 mt-1">
									Messages (7 days)
								</div>
							</div>
						</CardContent>
					</Card>

					<Card hoverable tilt={false}>
						<CardContent>
							<div className="text-center">
								<div className="text-4xl font-bold text-primary">
									{activity.serversJoined}
								</div>
								<div className="text-sm text-white/60 mt-1">
									Servers Joined
								</div>
							</div>
						</CardContent>
					</Card>

					<Card hoverable tilt={false}>
						<CardContent>
							<div className="text-center">
								<div className="text-4xl font-bold text-primary">
									{activity.friendsAdded}
								</div>
								<div className="text-sm text-white/60 mt-1">
									Friends Added
								</div>
							</div>
						</CardContent>
					</Card>

					<Card hoverable tilt={false}>
						<CardContent>
							<div className="text-center">
								<div className="text-4xl font-bold text-primary">
									{activity.timeSpent7Days.toFixed(1)}h
								</div>
								<div className="text-sm text-white/60 mt-1">
									Time Spent (7 days)
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Activity Chart */}
				<Card tilt={false}>
					<CardHeader>
						<CardTitle>Activity Trend (Last 7 Days)</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{activity.dailyActivity.map((day, idx) => {
								const maxMessages = Math.max(
									...activity.dailyActivity.map((d) => d.messages),
								);
								const percentage = (day.messages / maxMessages) * 100;

								return (
									<div key={day.date}>
										<div className="flex items-center justify-between text-sm mb-1">
											<span className="text-white/60">
												{new Date(day.date).toLocaleDateString("en-US", {
													weekday: "short",
													month: "short",
													day: "numeric",
												})}
											</span>
											<span className="text-white">
												{day.messages} messages • {day.timeSpent.toFixed(1)}h
											</span>
										</div>
										<motion.div
											className="h-8 bg-primary/20 rounded-lg overflow-hidden"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{ delay: idx * 0.05 }}
										>
											<motion.div
												className="h-full bg-primary rounded-lg"
												initial={{ width: 0 }}
												animate={{ width: `${percentage}%` }}
												transition={{
													delay: idx * 0.05,
													duration: 0.5,
													type: "spring",
													stiffness: 260,
													damping: 20,
												}}
											/>
										</motion.div>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>

				{/* Quick Actions */}
				<Card tilt={false}>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Quick Actions</CardTitle>
							{pendingCount > 0 && (
								<Badge variant="danger">{pendingCount} pending</Badge>
							)}
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<Button
								variant="secondary"
								onClick={() => {
									router.push("/family/messages");
								}}
								className="justify-start"
							>
								<span className="text-xl mr-3">💬</span>
								<div className="text-left">
									<div className="font-medium">View Messages</div>
									<div className="text-xs text-white/60">
										Read teen's messages
									</div>
								</div>
							</Button>

							<Button
								variant="secondary"
								onClick={() => {
									viewServers(teenAccount.id);
									router.push("/family/servers");
								}}
								className="justify-start"
							>
								<span className="text-xl mr-3">🏰</span>
								<div className="text-left">
									<div className="font-medium">Server List</div>
									<div className="text-xs text-white/60">
										{pendingServers.filter(s => s.status === "pending").length} pending approvals
									</div>
								</div>
							</Button>

							<Button
								variant="secondary"
								onClick={() => {
									viewFriends(teenAccount.id);
									router.push("/family/friends");
								}}
								className="justify-start"
							>
								<span className="text-xl mr-3">👥</span>
								<div className="text-left">
									<div className="font-medium">Friends List</div>
									<div className="text-xs text-white/60">
										{pendingFriends.filter(f => f.status === "pending").length} pending requests
									</div>
								</div>
							</Button>

							<Button
								variant="secondary"
								onClick={() => {
									viewFlags(teenAccount.id);
									router.push("/family/flags");
								}}
								className="justify-start"
							>
								<span className="text-xl mr-3">🚩</span>
								<div className="text-left">
									<div className="font-medium">Content Flags</div>
									<div className="text-xs text-white/60">
										{contentFlags.filter(f => f.status === "pending").length} pending flags
									</div>
								</div>
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Privacy Notice */}
				<div className="text-center text-sm text-white/40 space-y-1">
					<p>🔒 All dashboard views are logged in the transparency log</p>
					<p>Your teen can see when and what you access</p>
				</div>
			</div>
		</div>
	);
}
