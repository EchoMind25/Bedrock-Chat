"use client";

import { useState, useMemo } from "react";
import { Flame, Gift, Trophy, Star, ShoppingBag, Zap, Check, Lock } from "lucide-react";
import { usePointsStore } from "@/store/points.store";
import { getNextMilestone, getCategoryColor } from "@/lib/points-system";
import { SettingsSection } from "../settings-section";
import type { ShopCategory } from "@/lib/types/engagement";

// ── Helpers ─────────────────────────────────────────────────

function formatPoints(pts: number): string {
	if (pts >= 10000) return `${(pts / 1000).toFixed(1)}k`;
	if (pts >= 1000) return `${(pts / 1000).toFixed(1)}k`;
	return String(pts);
}

function relativeTime(date: Date): string {
	const now = Date.now();
	const diff = now - new Date(date).getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

// ── Icon Map ────────────────────────────────────────────────

const ICON_MAP: Record<string, typeof Trophy> = {
	"message-circle": Star,
	"messages-square": Star,
	users: Star,
	mic: Star,
	compass: Star,
	globe: Star,
	search: Star,
	"plus-circle": Star,
	building: Star,
	flame: Flame,
	zap: Zap,
	trophy: Trophy,
	egg: Gift,
	gem: Gift,
	sparkles: Star,
	palette: Star,
	wind: Star,
	"layout-grid": Star,
	shield: Star,
	"bar-chart-3": Star,
	brain: Star,
	rocket: Star,
	headphones: Star,
	"shopping-bag": ShoppingBag,
	"log-in": Star,
	"user-check": Star,
};

function getIcon(iconName: string) {
	return ICON_MAP[iconName] ?? Star;
}

// ── Sub-tab types ───────────────────────────────────────────

type SubTab = "shop" | "achievements" | "activity";
type ShopFilter = "all" | ShopCategory;
type AchievementFilter = "all" | "social" | "explorer" | "creator" | "streak" | "easter_egg";

// ── Component ───────────────────────────────────────────────

export function RewardsTab() {
	const [subTab, setSubTab] = useState<SubTab>("shop");
	const [shopFilter, setShopFilter] = useState<ShopFilter>("all");
	const [achievementFilter, setAchievementFilter] = useState<AchievementFilter>("all");

	// Points store
	const totalPoints = usePointsStore((s) => s.totalPoints);
	const streak = usePointsStore((s) => s.streak);
	const shopItems = usePointsStore((s) => s.shopItems);
	const achievements = usePointsStore((s) => s.achievements);
	const activity = usePointsStore((s) => s.activity);
	const collectDailyLogin = usePointsStore((s) => s.collectDailyLogin);
	const purchaseItem = usePointsStore((s) => s.purchaseItem);
	const getPointsToday = usePointsStore((s) => s.getPointsToday);

	// Derived
	const nextMilestone = getNextMilestone(totalPoints);
	const milestoneProgress = nextMilestone ? (totalPoints / nextMilestone) * 100 : 100;
	const pointsToday = getPointsToday();

	const filteredShopItems = useMemo(() => {
		if (shopFilter === "all") return shopItems;
		return shopItems.filter((i) => i.category === shopFilter);
	}, [shopItems, shopFilter]);

	const filteredAchievements = useMemo(() => {
		if (achievementFilter === "all") return achievements;
		return achievements.filter((a) => a.category === achievementFilter);
	}, [achievements, achievementFilter]);

	const subTabs: { id: SubTab; label: string }[] = [
		{ id: "shop", label: "Shop" },
		{ id: "achievements", label: "Achievements" },
		{ id: "activity", label: "Activity" },
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-white">Rewards</h1>
				<p className="text-slate-400 text-sm mt-1">
					Earn points, unlock rewards, track achievements
				</p>
			</div>

			{/* ── Points Dashboard ────────────────────────────── */}
			<div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
				<div className="flex items-start justify-between">
					{/* Points total */}
					<div>
						<p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Points</p>
						<p className="text-4xl font-bold text-white mt-1">
							{totalPoints.toLocaleString()}
						</p>
					</div>

					{/* Streak */}
					<div className="text-right">
						<div className="flex items-center gap-1.5 justify-end">
							<Flame className="w-4 h-4 text-orange-400" />
							<span className="text-lg font-bold text-orange-400">
								{streak.currentStreak}
							</span>
						</div>
						<p className="text-[10px] text-slate-500 mt-0.5">day streak</p>
					</div>
				</div>

				{/* Milestone progress */}
				{nextMilestone && (
					<div className="mt-4">
						<div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
							<span>Next milestone</span>
							<span>
								{formatPoints(totalPoints)} / {formatPoints(nextMilestone)}
							</span>
						</div>
						<div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
							<div
								className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
								style={{ width: `${Math.min(milestoneProgress, 100)}%` }}
							/>
						</div>
					</div>
				)}

				{/* Daily stats + collect button */}
				<div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
					<div className="text-xs text-slate-400">
						Today: <span className="text-slate-200 font-medium">{pointsToday}</span> / 500
					</div>
					{!streak.todayCollected ? (
						<button
							type="button"
							onClick={() => collectDailyLogin()}
							className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-medium hover:bg-yellow-500/30 transition-colors"
						>
							<Gift className="w-3.5 h-3.5" />
							Collect Daily Login
						</button>
					) : (
						<div className="flex items-center gap-1.5 text-green-400 text-xs">
							<Check className="w-3.5 h-3.5" />
							Collected today
						</div>
					)}
				</div>
			</div>

			{/* ── Sub-tab Navigation ─────────────────────────── */}
			<div className="flex gap-1 p-1 rounded-lg bg-white/5">
				{subTabs.map((tab) => (
					<button
						key={tab.id}
						type="button"
						onClick={() => setSubTab(tab.id)}
						className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
							subTab === tab.id
								? "bg-white/10 text-white"
								: "text-slate-400 hover:text-slate-200"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* ── Shop ───────────────────────────────────────── */}
			{subTab === "shop" && (
				<div className="space-y-4">
					{/* Category filter */}
					<div className="flex gap-2">
						{(["all", "profile", "server", "future"] as ShopFilter[]).map((filter) => (
							<button
								key={filter}
								type="button"
								onClick={() => setShopFilter(filter)}
								className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
									shopFilter === filter
										? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
										: "text-slate-400 hover:text-slate-200 border border-transparent"
								}`}
							>
								{filter === "all" ? "All" : filter}
							</button>
						))}
					</div>

					{/* Items grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{filteredShopItems.map((item) => {
							const Icon = getIcon(item.icon);
							const canAfford = totalPoints >= item.cost;
							const isLocked = !item.isAvailable;

							return (
								<div
									key={item.id}
									className={`rounded-xl border p-4 transition-all ${
										item.isPurchased
											? "border-green-500/20 bg-green-500/5"
											: isLocked
												? "border-white/5 bg-white/[0.01] opacity-50"
												: "border-white/10 bg-white/[0.02] hover:border-white/20"
									}`}
								>
									<div className="flex items-start gap-3">
										<div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
											<Icon className="w-5 h-5 text-slate-300" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<p className="text-sm font-semibold text-slate-200 truncate">
													{item.name}
												</p>
												{item.isPurchased && (
													<Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
												)}
											</div>
											<p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
												{item.description}
											</p>
										</div>
									</div>

									<div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
										<div className="flex items-center gap-1">
											<Star className="w-3 h-3 text-yellow-400" />
											<span className="text-xs font-medium text-yellow-400">
												{item.cost > 0 ? formatPoints(item.cost) : "Free"}
											</span>
										</div>

										{item.isPurchased ? (
											<span className="text-[10px] text-green-400 font-medium">
												Purchased
											</span>
										) : isLocked ? (
											<span className="text-[10px] text-slate-500 font-medium">
												Coming Soon
											</span>
										) : (
											<button
												type="button"
												onClick={() => purchaseItem(item.id)}
												disabled={!canAfford}
												className={`px-3 py-1 rounded-md text-[10px] font-medium transition-colors ${
													canAfford
														? "bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30"
														: "bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed"
												}`}
											>
												{canAfford ? "Purchase" : "Not enough"}
											</button>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* ── Achievements ────────────────────────────────── */}
			{subTab === "achievements" && (
				<div className="space-y-4">
					{/* Category filter */}
					<div className="flex gap-2 flex-wrap">
						{(["all", "social", "explorer", "creator", "streak", "easter_egg"] as AchievementFilter[]).map((filter) => (
							<button
								key={filter}
								type="button"
								onClick={() => setAchievementFilter(filter)}
								className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
									achievementFilter === filter
										? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
										: "text-slate-400 hover:text-slate-200 border border-transparent"
								}`}
							>
								{filter === "all" ? "All" : filter.replace("_", " ")}
							</button>
						))}
					</div>

					{/* Achievements grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{filteredAchievements.map((achievement) => {
							const Icon = getIcon(achievement.icon);
							const isUnlocked = achievement.unlockedAt !== null;
							const progressPct = (achievement.progress / achievement.requirement) * 100;
							const categoryColor = getCategoryColor(achievement.category);

							return (
								<div
									key={achievement.id}
									className={`rounded-xl border p-4 transition-all ${
										isUnlocked
											? "border-yellow-500/20 bg-yellow-500/5"
											: "border-white/10 bg-white/[0.02]"
									}`}
								>
									<div className="flex items-start gap-3">
										<div
											className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
												isUnlocked ? "" : "grayscale opacity-50"
											}`}
											style={{ backgroundColor: `${categoryColor}20` }}
										>
											<Icon
												className="w-5 h-5"
												style={{ color: isUnlocked ? categoryColor : undefined }}
											/>
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<p className={`text-sm font-semibold truncate ${
													isUnlocked ? "text-yellow-300" : "text-slate-200"
												}`}>
													{achievement.name}
												</p>
												{isUnlocked && (
													<Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
												)}
											</div>
											<p className="text-xs text-slate-400 mt-0.5">
												{achievement.description}
											</p>
										</div>
									</div>

									{/* Progress bar */}
									<div className="mt-3">
										<div className="flex items-center justify-between text-[10px] mb-1">
											<span className="text-slate-500">
												{achievement.progress} / {achievement.requirement}
											</span>
											<span className="text-yellow-400 font-medium">
												+{achievement.points} pts
											</span>
										</div>
										<div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
											<div
												className={`h-full rounded-full transition-all ${
													isUnlocked
														? "bg-gradient-to-r from-yellow-500 to-orange-500"
														: "bg-blue-500/50"
												}`}
												style={{ width: `${Math.min(progressPct, 100)}%` }}
											/>
										</div>
									</div>

									{isUnlocked && achievement.unlockedAt && (
										<p className="text-[10px] text-slate-500 mt-2">
											Unlocked {relativeTime(achievement.unlockedAt)}
										</p>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* ── Activity Feed ───────────────────────────────── */}
			{subTab === "activity" && (
				<div className="space-y-2">
					{activity.length === 0 ? (
						<div className="text-center py-12">
							<Star className="w-8 h-8 text-slate-600 mx-auto mb-3" />
							<p className="text-sm text-slate-400">No activity yet</p>
							<p className="text-xs text-slate-500 mt-1">
								Start chatting, joining servers, and completing achievements
							</p>
						</div>
					) : (
						activity.map((entry) => {
							const Icon = getIcon(entry.icon ?? "star");
							const isPositive = (entry.points ?? 0) >= 0;

							return (
								<div
									key={entry.id}
									className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
								>
									<div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
										<Icon className="w-4 h-4 text-slate-400" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm text-slate-200 truncate">
											{entry.title}
										</p>
										<p className="text-[10px] text-slate-500 truncate">
											{entry.description}
										</p>
									</div>
									<div className="text-right shrink-0">
										{entry.points !== undefined && (
											<p className={`text-xs font-medium ${
												isPositive ? "text-green-400" : "text-red-400"
											}`}>
												{isPositive ? "+" : ""}{entry.points}
											</p>
										)}
										<p className="text-[10px] text-slate-500">
											{relativeTime(entry.timestamp)}
										</p>
									</div>
								</div>
							);
						})
					)}
				</div>
			)}
		</div>
	);
}
