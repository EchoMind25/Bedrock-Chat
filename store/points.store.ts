import { create } from "zustand";
import { persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import {
	POINT_VALUES,
	ACHIEVEMENTS,
	SHOP_ITEMS,
	getToday,
	isYesterday,
	calculateStreakPoints,
	isDailyCapped,
} from "@/lib/points-system";
import { EASTER_EGGS } from "@/lib/easter-eggs";
import {
	shouldRewardMessage,
	applyDailyCap,
	calculateVoicePoints,
	isSpamMessage,
} from "@/lib/anti-gaming";
import type {
	PointTransaction,
	Achievement,
	EasterEgg,
	ActivityEntry,
	ShopItem,
	LoginStreak,
	DailyCaps,
	PresenceTrailConfig,
} from "@/lib/types/engagement";

// ── Pending reward for animation system ─────────────────────

export interface PendingReward {
	id: string;
	points: number;
	label: string;
	type: "points" | "achievement" | "easter_egg" | "milestone";
}

// ── State Interface ─────────────────────────────────────────

interface PointsState {
	// Core
	totalPoints: number;
	transactions: PointTransaction[];
	achievements: Achievement[];
	easterEggs: EasterEgg[];
	shopItems: ShopItem[];
	activity: ActivityEntry[];

	// Streak
	streak: LoginStreak;

	// Daily tracking
	dailyCaps: DailyCaps;

	// Presence trail
	presenceTrail: PresenceTrailConfig;

	// Points system enabled (parent can disable for teen accounts)
	isEnabled: boolean;

	// Animation queue
	pendingRewards: PendingReward[];

	// Privacy
	showOnLeaderboard: boolean;
	showActivityToFriends: boolean;

	// Milestones reached
	milestonesReached: number[];

	// ── Actions ──

	// Points
	awardMessagePoints: (content: string) => void;
	awardVoicePoints: (durationMinutes: number) => void;
	awardServerCreated: () => void;
	awardFriendInvited: () => void;
	awardServerJoined: (serverId: string) => void;
	awardServerBrowsed: () => void;
	awardProfileCompleted: () => void;
	collectDailyLogin: () => void;

	// Easter eggs
	discoverEasterEgg: (eggId: string) => void;

	// Shop
	purchaseItem: (itemId: string) => boolean;

	// Achievements
	updateAchievementProgress: (achievementId: string, progress: number) => void;

	// Presence trail
	setPresenceTrail: (config: Partial<PresenceTrailConfig>) => void;

	// Animation queue
	dismissReward: (id: string) => void;

	// Privacy
	setShowOnLeaderboard: (show: boolean) => void;
	setShowActivityToFriends: (show: boolean) => void;

	// Parent control
	setEnabled: (enabled: boolean) => void;

	// Helpers
	getPointsToday: () => number;
	canEarnMore: () => boolean;
}

// ── Helper: Create unique ID ────────────────────────────────

function uid(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Helper: Ensure daily caps are for today ─────────────────

function ensureTodayCaps(caps: DailyCaps): DailyCaps {
	const today = getToday();
	if (caps.date !== today) {
		return {
			date: today,
			pointsEarned: 0,
			messagesRewarded: 0,
			browsingRewarded: false,
		};
	}
	return caps;
}

// ── Store ───────────────────────────────────────────────────

export const usePointsStore = create<PointsState>()(
	conditionalDevtools(
		persist(
			(set, get) => ({
				totalPoints: 0,
				transactions: [],
				achievements: ACHIEVEMENTS.map((a) => ({ ...a })),
				easterEggs: EASTER_EGGS.map((e) => ({ ...e })),
				shopItems: SHOP_ITEMS.map((i) => ({ ...i })),
				activity: [],
				streak: {
					currentStreak: 0,
					longestStreak: 0,
					lastLoginDate: "",
					todayCollected: false,
				},
				dailyCaps: {
					date: getToday(),
					pointsEarned: 0,
					messagesRewarded: 0,
					browsingRewarded: false,
				},
				presenceTrail: {
					enabled: false,
					color: "#6B5CE7",
					intensity: 0.5,
					idleTimeout: 30,
				},
				isEnabled: true,
				pendingRewards: [],
				showOnLeaderboard: false,
				showActivityToFriends: false,
				milestonesReached: [],

				// ── Award Points (internal helper via set) ──

				awardMessagePoints: (content) => {
					const state = get();
					if (!state.isEnabled) return;

					// Anti-gaming checks
					if (isSpamMessage(content)) return;

					const caps = ensureTodayCaps(state.dailyCaps);
					if (isDailyCapped(caps.pointsEarned)) return;
					if (!shouldRewardMessage(caps.messagesRewarded)) return;

					const rawPoints = POINT_VALUES.message_sent;
					const points = applyDailyCap(rawPoints, caps.pointsEarned);
					if (points <= 0) return;

					const tx: PointTransaction = {
						id: uid(),
						action: "message_sent",
						points,
						timestamp: new Date(),
					};

					const newTotal = state.totalPoints + points;
					const newCaps = {
						...caps,
						pointsEarned: caps.pointsEarned + points,
						messagesRewarded: caps.messagesRewarded + 1,
					};

					set({
						totalPoints: newTotal,
						transactions: [tx, ...state.transactions].slice(0, 200),
						dailyCaps: newCaps,
					});

					checkMilestones(newTotal, set, get);
				},

				awardVoicePoints: (durationMinutes) => {
					const state = get();
					if (!state.isEnabled) return;

					const caps = ensureTodayCaps(state.dailyCaps);
					if (isDailyCapped(caps.pointsEarned)) return;

					const rawPoints = calculateVoicePoints(durationMinutes);
					if (rawPoints <= 0) return;

					const points = applyDailyCap(rawPoints, caps.pointsEarned);
					if (points <= 0) return;

					const tx: PointTransaction = {
						id: uid(),
						action: "voice_call",
						points,
						timestamp: new Date(),
						metadata: { duration: String(durationMinutes) },
					};

					const newTotal = state.totalPoints + points;

					set({
						totalPoints: newTotal,
						transactions: [tx, ...state.transactions].slice(0, 200),
						dailyCaps: {
							...caps,
							pointsEarned: caps.pointsEarned + points,
						},
						pendingRewards: [
							...state.pendingRewards,
							{
								id: uid(),
								points,
								label: `Voice call (${durationMinutes}m)`,
								type: "points",
							},
						],
					});

					checkMilestones(newTotal, set, get);
				},

				awardServerCreated: () => {
					const state = get();
					if (!state.isEnabled) return;

					const caps = ensureTodayCaps(state.dailyCaps);
					const points = applyDailyCap(
						POINT_VALUES.server_created,
						caps.pointsEarned,
					);
					if (points <= 0) return;

					const tx: PointTransaction = {
						id: uid(),
						action: "server_created",
						points,
						timestamp: new Date(),
					};

					const newTotal = state.totalPoints + points;
					const entry: ActivityEntry = {
						id: uid(),
						type: "points_earned",
						title: "Server Created",
						description: `Earned ${points} points for creating a server`,
						points,
						timestamp: new Date(),
						icon: "plus-circle",
					};

					set({
						totalPoints: newTotal,
						transactions: [tx, ...state.transactions].slice(0, 200),
						dailyCaps: {
							...caps,
							pointsEarned: caps.pointsEarned + points,
						},
						activity: [entry, ...state.activity].slice(0, 100),
						pendingRewards: [
							...state.pendingRewards,
							{
								id: uid(),
								points,
								label: "Server Created",
								type: "points",
							},
						],
					});

					checkMilestones(newTotal, set, get);
				},

				awardFriendInvited: () => {
					const state = get();
					if (!state.isEnabled) return;

					const caps = ensureTodayCaps(state.dailyCaps);
					const points = applyDailyCap(
						POINT_VALUES.friend_invited,
						caps.pointsEarned,
					);
					if (points <= 0) return;

					const tx: PointTransaction = {
						id: uid(),
						action: "friend_invited",
						points,
						timestamp: new Date(),
					};

					const newTotal = state.totalPoints + points;

					set({
						totalPoints: newTotal,
						transactions: [tx, ...state.transactions].slice(0, 200),
						dailyCaps: {
							...caps,
							pointsEarned: caps.pointsEarned + points,
						},
						pendingRewards: [
							...state.pendingRewards,
							{
								id: uid(),
								points,
								label: "Friend Invited",
								type: "points",
							},
						],
					});

					checkMilestones(newTotal, set, get);
				},

				awardServerJoined: (serverId) => {
					const state = get();
					if (!state.isEnabled) return;

					const caps = ensureTodayCaps(state.dailyCaps);
					const points = applyDailyCap(
						POINT_VALUES.server_joined,
						caps.pointsEarned,
					);
					if (points <= 0) return;

					const tx: PointTransaction = {
						id: uid(),
						action: "server_joined",
						points,
						timestamp: new Date(),
						metadata: { serverId },
					};

					const newTotal = state.totalPoints + points;
					const entry: ActivityEntry = {
						id: uid(),
						type: "server_joined",
						title: "Joined Server",
						description: `Earned ${points} points for joining a server`,
						points,
						timestamp: new Date(),
						icon: "log-in",
					};

					set({
						totalPoints: newTotal,
						transactions: [tx, ...state.transactions].slice(0, 200),
						dailyCaps: {
							...caps,
							pointsEarned: caps.pointsEarned + points,
						},
						activity: [entry, ...state.activity].slice(0, 100),
						pendingRewards: [
							...state.pendingRewards,
							{
								id: uid(),
								points,
								label: "Server Joined",
								type: "points",
							},
						],
					});

					checkMilestones(newTotal, set, get);
				},

				awardServerBrowsed: () => {
					const state = get();
					if (!state.isEnabled) return;

					const caps = ensureTodayCaps(state.dailyCaps);
					if (caps.browsingRewarded) return; // Max 1/day
					if (isDailyCapped(caps.pointsEarned)) return;

					const points = applyDailyCap(
						POINT_VALUES.server_browsed,
						caps.pointsEarned,
					);
					if (points <= 0) return;

					const tx: PointTransaction = {
						id: uid(),
						action: "server_browsed",
						points,
						timestamp: new Date(),
					};

					const newTotal = state.totalPoints + points;

					set({
						totalPoints: newTotal,
						transactions: [tx, ...state.transactions].slice(0, 200),
						dailyCaps: {
							...caps,
							pointsEarned: caps.pointsEarned + points,
							browsingRewarded: true,
						},
					});

					checkMilestones(newTotal, set, get);
				},

				awardProfileCompleted: () => {
					const state = get();
					if (!state.isEnabled) return;

					// One-time only: check if already awarded
					const alreadyAwarded = state.transactions.some(
						(tx) => tx.action === "profile_completed",
					);
					if (alreadyAwarded) return;

					const points = POINT_VALUES.profile_completed;
					const tx: PointTransaction = {
						id: uid(),
						action: "profile_completed",
						points,
						timestamp: new Date(),
					};

					const newTotal = state.totalPoints + points;
					const entry: ActivityEntry = {
						id: uid(),
						type: "points_earned",
						title: "Profile Complete",
						description: `Earned ${points} points for completing your profile`,
						points,
						timestamp: new Date(),
						icon: "user-check",
					};

					set({
						totalPoints: newTotal,
						transactions: [tx, ...state.transactions].slice(0, 200),
						activity: [entry, ...state.activity].slice(0, 100),
						pendingRewards: [
							...state.pendingRewards,
							{
								id: uid(),
								points,
								label: "Profile Complete!",
								type: "points",
							},
						],
					});

					checkMilestones(newTotal, set, get);
				},

				collectDailyLogin: () => {
					const state = get();
					if (!state.isEnabled) return;

					const today = getToday();
					const { streak } = state;

					// Already collected today
					if (streak.todayCollected && streak.lastLoginDate === today) return;

					// Calculate streak
					let newStreak = 1;
					if (isYesterday(streak.lastLoginDate)) {
						newStreak = streak.currentStreak + 1;
					}

					const points = calculateStreakPoints(newStreak);
					const caps = ensureTodayCaps(state.dailyCaps);

					const tx: PointTransaction = {
						id: uid(),
						action: "daily_login",
						points,
						timestamp: new Date(),
						metadata: { streak: String(newStreak) },
					};

					const isStreakBonus = newStreak % 7 === 0;
					const newTotal = state.totalPoints + points;

					const entries: ActivityEntry[] = [
						{
							id: uid(),
							type: "streak_extended",
							title: `Day ${newStreak} Streak`,
							description: `Earned ${POINT_VALUES.daily_login} points for logging in`,
							points: POINT_VALUES.daily_login,
							timestamp: new Date(),
							icon: "flame",
						},
					];

					if (isStreakBonus) {
						entries.unshift({
							id: uid(),
							type: "milestone_reached",
							title: "7-Day Streak Bonus!",
							description: `Earned ${50} bonus points for a 7-day streak`,
							points: 50,
							timestamp: new Date(),
							icon: "zap",
						});
					}

					const rewards: PendingReward[] = [
						{
							id: uid(),
							points,
							label: isStreakBonus
								? `Day ${newStreak} + Streak Bonus!`
								: `Day ${newStreak} Login`,
							type: "points",
						},
					];

					set({
						totalPoints: newTotal,
						transactions: [tx, ...state.transactions].slice(0, 200),
						streak: {
							currentStreak: newStreak,
							longestStreak: Math.max(newStreak, streak.longestStreak),
							lastLoginDate: today,
							todayCollected: true,
						},
						dailyCaps: {
							...caps,
							pointsEarned: caps.pointsEarned + points,
						},
						activity: [...entries, ...state.activity].slice(0, 100),
						pendingRewards: [...state.pendingRewards, ...rewards],
					});

					checkMilestones(newTotal, set, get);
				},

				discoverEasterEgg: (eggId) => {
					const state = get();
					if (!state.isEnabled) return;

					const eggIndex = state.easterEggs.findIndex(
						(e) => e.id === eggId,
					);
					if (eggIndex === -1) return;

					const egg = state.easterEggs[eggIndex];
					if (egg.discoveredAt) return; // Already discovered
					if (!egg.isActive) return;

					const updatedEggs = [...state.easterEggs];
					updatedEggs[eggIndex] = {
						...egg,
						discoveredAt: new Date(),
					};

					const tx: PointTransaction = {
						id: uid(),
						action: "easter_egg",
						points: egg.points,
						timestamp: new Date(),
						metadata: { eggId },
					};

					const newTotal = state.totalPoints + egg.points;

					const entry: ActivityEntry = {
						id: uid(),
						type: "easter_egg_found",
						title: egg.name,
						description: egg.description,
						points: egg.points,
						timestamp: new Date(),
						icon: "egg",
					};

					set({
						totalPoints: newTotal,
						transactions: [tx, ...state.transactions].slice(0, 200),
						easterEggs: updatedEggs,
						activity: [entry, ...state.activity].slice(0, 100),
						pendingRewards: [
							...state.pendingRewards,
							{
								id: uid(),
								points: egg.points,
								label: `Easter Egg: ${egg.name}`,
								type: "easter_egg",
							},
						],
					});

					checkMilestones(newTotal, set, get);
				},

				purchaseItem: (itemId) => {
					const state = get();
					const itemIndex = state.shopItems.findIndex(
						(i) => i.id === itemId,
					);
					if (itemIndex === -1) return false;

					const item = state.shopItems[itemIndex];
					if (!item.isAvailable) return false;
					if (item.isOneTime && item.isPurchased) return false;
					if (state.totalPoints < item.cost) return false;

					const updatedItems = [...state.shopItems];
					updatedItems[itemIndex] = { ...item, isPurchased: true };

					const tx: PointTransaction = {
						id: uid(),
						action: "points_spent",
						points: -item.cost,
						timestamp: new Date(),
						metadata: { itemId },
					};

					const entry: ActivityEntry = {
						id: uid(),
						type: "item_purchased",
						title: `Purchased: ${item.name}`,
						description: `Spent ${item.cost} points`,
						points: -item.cost,
						timestamp: new Date(),
						icon: "shopping-bag",
					};

					set({
						totalPoints: state.totalPoints - item.cost,
						transactions: [tx, ...state.transactions].slice(0, 200),
						shopItems: updatedItems,
						activity: [entry, ...state.activity].slice(0, 100),
					});

					return true;
				},

				updateAchievementProgress: (achievementId, progress) => {
					const state = get();
					if (!state.isEnabled) return;

					const index = state.achievements.findIndex(
						(a) => a.id === achievementId,
					);
					if (index === -1) return;

					const achievement = state.achievements[index];
					if (achievement.unlockedAt) return; // Already unlocked

					const newProgress = Math.min(progress, achievement.requirement);
					const isUnlocking = newProgress >= achievement.requirement;

					const updatedAchievements = [...state.achievements];
					updatedAchievements[index] = {
						...achievement,
						progress: newProgress,
						unlockedAt: isUnlocking ? new Date() : null,
					};

					if (isUnlocking) {
						const tx: PointTransaction = {
							id: uid(),
							action: "achievement_unlocked",
							points: achievement.points,
							timestamp: new Date(),
							metadata: { achievementId },
						};

						const entry: ActivityEntry = {
							id: uid(),
							type: "achievement_unlocked",
							title: achievement.name,
							description: achievement.description,
							points: achievement.points,
							timestamp: new Date(),
							icon: achievement.icon,
						};

						const newTotal = state.totalPoints + achievement.points;

						set({
							totalPoints: newTotal,
							transactions: [tx, ...state.transactions].slice(0, 200),
							achievements: updatedAchievements,
							activity: [entry, ...state.activity].slice(0, 100),
							pendingRewards: [
								...state.pendingRewards,
								{
									id: uid(),
									points: achievement.points,
									label: achievement.name,
									type: "achievement",
								},
							],
						});

						checkMilestones(newTotal, set, get);
					} else {
						set({ achievements: updatedAchievements });
					}
				},

				setPresenceTrail: (config) => {
					set((state) => ({
						presenceTrail: { ...state.presenceTrail, ...config },
					}));
				},

				dismissReward: (id) => {
					set((state) => ({
						pendingRewards: state.pendingRewards.filter(
							(r) => r.id !== id,
						),
					}));
				},

				setShowOnLeaderboard: (show) => set({ showOnLeaderboard: show }),
				setShowActivityToFriends: (show) =>
					set({ showActivityToFriends: show }),

				setEnabled: (enabled) => set({ isEnabled: enabled }),

				getPointsToday: () => {
					const caps = ensureTodayCaps(get().dailyCaps);
					return caps.pointsEarned;
				},

				canEarnMore: () => {
					const caps = ensureTodayCaps(get().dailyCaps);
					return !isDailyCapped(caps.pointsEarned);
				},
			}),
			{
				name: "bedrock-points",
				partialize: (state) => ({
					totalPoints: state.totalPoints,
					transactions: state.transactions.slice(0, 50), // Keep last 50
					achievements: state.achievements,
					easterEggs: state.easterEggs,
					shopItems: state.shopItems,
					activity: state.activity.slice(0, 30), // Keep last 30
					streak: state.streak,
					dailyCaps: state.dailyCaps,
					presenceTrail: state.presenceTrail,
					isEnabled: state.isEnabled,
					showOnLeaderboard: state.showOnLeaderboard,
					showActivityToFriends: state.showActivityToFriends,
					milestonesReached: state.milestonesReached,
				}),
			},
		),
		{ name: "PointsStore" },
	),
);

// ── Helpers (hoisted above store usage) ─────────────────────

function checkMilestones(
	newTotal: number,
	set: (
		partial:
			| Partial<PointsState>
			| ((state: PointsState) => Partial<PointsState>),
	) => void,
	get: () => PointsState,
): void {
	const milestones = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000];
	const state = get();

	for (const milestone of milestones) {
		if (
			newTotal >= milestone &&
			!state.milestonesReached.includes(milestone)
		) {
			const entry: ActivityEntry = {
				id: uid(),
				type: "milestone_reached",
				title: `${milestone.toLocaleString()} Points!`,
				description: `You've reached ${milestone.toLocaleString()} total points`,
				points: milestone,
				timestamp: new Date(),
				icon: "trophy",
			};

			set((s) => ({
				milestonesReached: [...s.milestonesReached, milestone],
				activity: [entry, ...s.activity].slice(0, 100),
				pendingRewards: [
					...s.pendingRewards,
					{
						id: `milestone-${milestone}`,
						points: milestone,
						label: `${milestone.toLocaleString()} Points Milestone!`,
						type: "milestone" as const,
					},
				],
			}));
			break; // Only one milestone per award event
		}
	}
}
