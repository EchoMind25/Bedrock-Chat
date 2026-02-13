import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type {
	TeenAccount,
	MonitoringLevel,
	ContentFlag,
	ServerApproval,
	FriendApproval,
	TransparencyLogEntry,
	KeywordAlert,
	TimeLimitConfig,
	ParentDashboardSettings,
} from "@/lib/types/family";
import type { User } from "@/store/auth.store";
import { createClient } from "@/lib/supabase/client";

interface FamilyState {
	// Account type flags
	isParent: boolean;
	isTeen: boolean;

	// Parent state
	teenAccounts: TeenAccount[];
	selectedTeenId: string | null;

	// Teen state
	myParent: User | null;
	myMonitoringLevel: MonitoringLevel | null;
	myTransparencyLog: TransparencyLogEntry[];

	// Initialization
	isInitialized: boolean;

	// Actions - Initialization
	init: (userId: string, accountType: "standard" | "parent" | "teen") => void;

	// Actions - Parent
	setSelectedTeen: (teenId: string) => void;
	getSelectedTeenAccount: () => TeenAccount | undefined;
	setMonitoringLevel: (teenId: string, level: MonitoringLevel) => void;
	viewMessages: (
		teenId: string,
		channelId: string,
		channelName: string,
		serverId: string,
		serverName: string,
	) => void;
	viewFriends: (teenId: string) => void;
	viewServers: (teenId: string) => void;
	viewFlags: (teenId: string) => void;
	approveServer: (teenId: string, approvalId: string) => void;
	denyServer: (teenId: string, approvalId: string) => void;
	approveFriend: (teenId: string, approvalId: string) => void;
	denyFriend: (teenId: string, approvalId: string) => void;
	dismissFlag: (teenId: string, flagId: string) => void;
	addressFlag: (teenId: string, flagId: string) => void;

	// Actions - Parent (keyword alerts)
	addKeywordAlert: (teenId: string, keyword: string, severity: "low" | "medium" | "high") => void;
	removeKeywordAlert: (teenId: string, alertId: string) => void;
	toggleKeywordAlert: (teenId: string, alertId: string) => void;
	dismissKeywordMatch: (teenId: string, matchId: string) => void;

	// Actions - Parent (time limits)
	setTimeLimit: (teenId: string, config: TimeLimitConfig) => void;
	removeTimeLimit: (teenId: string) => void;

	// Actions - Parent (categories)
	toggleBlockedCategory: (teenId: string, categoryId: string) => void;

	// Actions - Parent (server restrictions)
	restrictServer: (teenId: string, serverId: string, serverName: string) => void;
	unrestrictServer: (teenId: string, serverId: string, serverName: string) => void;

	// Actions - Parent (logging)
	viewVoiceMetadata: (teenId: string) => void;
	logExportActivity: (teenId: string) => void;

	// Actions - Teen
	getMyTransparencyLog: () => TransparencyLogEntry[];

	// Utility
	reset: () => void;
}

const initialState = {
	isParent: false,
	isTeen: false,
	teenAccounts: [],
	selectedTeenId: null,
	myParent: null,
	myMonitoringLevel: null,
	myTransparencyLog: [],
	isInitialized: false,
};

export const useFamilyStore = create<FamilyState>()(
	conditionalDevtools(
		persist(
			(set, get) => ({
				...initialState,

				// Initialize based on account type - loads from Supabase
				init: (userId, accountType) => {
					if (get().isInitialized) return;

					if (accountType === "parent") {
						const loadParentData = async () => {
							try {
								const supabase = createClient();
								const { data: families } = await supabase
									.from("family_members")
									.select(`family_id, family:family_accounts(id, name, monitoring_level)`)
									.eq("user_id", userId)
									.eq("role", "parent");

								const teenAccounts: TeenAccount[] = [];
								for (const fam of families || []) {
									const family = fam.family as unknown as Record<string, unknown>;
									const { data: teens } = await supabase
										.from("family_members")
										.select(`user_id, user:profiles(id, username, display_name, avatar_url, account_type)`)
										.eq("family_id", fam.family_id)
										.eq("role", "child");

									const { data: logs } = await supabase
										.from("family_activity_log")
										.select("*")
										.eq("family_id", fam.family_id)
										.order("occurred_at", { ascending: false })
										.limit(50);

									for (const teen of teens || []) {
										const u = teen.user as unknown as Record<string, unknown>;
										teenAccounts.push({
											id: `teen-account-${u.id}`,
											user: {
												id: u.id as string, email: "",
												username: u.username as string,
												displayName: (u.display_name as string) || (u.username as string),
												avatar: (u.avatar_url as string) || "",
												status: (u.status as "online" | "idle" | "dnd" | "offline") || "offline",
												accountType: "teen", createdAt: new Date(),
												settings: { theme: "dark", notifications: true, reducedMotion: false },
											},
											parentId: userId,
											monitoringLevel: ((family.monitoring_level as number) || 1) as MonitoringLevel,
											activity: { messagesSent7Days: 0, serversJoined: 0, friendsAdded: 0, timeSpent7Days: 0, dailyActivity: [] },
											contentFlags: [], pendingServers: [], pendingFriends: [],
											transparencyLog: (logs || []).map(log => ({
												id: log.id, action: log.activity_type,
												details: JSON.stringify(log.details),
												timestamp: new Date(log.occurred_at),
												metadata: log.details as Record<string, unknown>,
											})),
											restrictions: {}, createdAt: new Date(), lastActivityAt: new Date(),
										});
									}
								}

								set({
									isParent: true, isTeen: false, teenAccounts,
									selectedTeenId: teenAccounts[0]?.id || null, isInitialized: true,
								});
							} catch (err) {
								console.error("Error loading parent data:", err);
								set({ isParent: true, isTeen: false, teenAccounts: [], isInitialized: true });
							}
						};
						loadParentData();
					} else if (accountType === "teen") {
						const loadTeenData = async () => {
							try {
								const supabase = createClient();
								const { data: membership } = await supabase
									.from("family_members")
									.select(`family_id, family:family_accounts(id, monitoring_level, created_by)`)
									.eq("user_id", userId)
									.eq("role", "child")
									.single();

								if (membership) {
									const family = membership.family as unknown as Record<string, unknown>;
									const { data: parentProfile } = await supabase
										.from("profiles").select("*")
										.eq("id", family.created_by).single();

									const { data: logs } = await supabase
										.from("family_activity_log").select("*")
										.eq("family_id", membership.family_id)
										.order("occurred_at", { ascending: false }).limit(50);

									set({
										isParent: false, isTeen: true,
										myParent: parentProfile ? {
											id: parentProfile.id, email: "",
											username: parentProfile.username,
											displayName: parentProfile.display_name || parentProfile.username,
											avatar: parentProfile.avatar_url || "",
											status: (parentProfile.status as "online" | "idle" | "dnd" | "offline") || "offline",
											accountType: "parent", createdAt: new Date(parentProfile.created_at),
											settings: { theme: "dark", notifications: true, reducedMotion: false },
										} : null,
										myMonitoringLevel: ((family.monitoring_level as number) || 1) as MonitoringLevel,
										myTransparencyLog: (logs || []).map(log => ({
											id: log.id, action: log.activity_type,
											details: JSON.stringify(log.details),
											timestamp: new Date(log.occurred_at),
											metadata: log.details as Record<string, unknown>,
										})),
										isInitialized: true,
									});
								} else {
									set({ isParent: false, isTeen: true, isInitialized: true });
								}
							} catch (err) {
								console.error("Error loading teen data:", err);
								set({ isParent: false, isTeen: true, isInitialized: true });
							}
						};
						loadTeenData();
					} else {
						set({ isParent: false, isTeen: false, isInitialized: true });
					}
				},

				// Parent: Select which teen to view
				setSelectedTeen: (teenId) => {
					set({ selectedTeenId: teenId });
				},

				// Parent: Get currently selected teen account
				getSelectedTeenAccount: () => {
					const { selectedTeenId, teenAccounts } = get();
					return teenAccounts.find((ta) => ta.id === selectedTeenId);
				},

				// Parent: Change monitoring level
				setMonitoringLevel: (teenId, level) => {
					const teenAccount = get().teenAccounts.find(
						(ta) => ta.id === teenId,
					);
					if (!teenAccount) return;

					const oldLevel = teenAccount.monitoringLevel;

					// Create transparency log entry
					const logEntry: TransparencyLogEntry = {
						id: `log-${Date.now()}`,
						action: "changed_monitoring_level",
						details: `Monitoring level changed from ${oldLevel} to ${level}`,
						timestamp: new Date(),
						metadata: {
							oldLevel,
							newLevel: level,
						},
					};

					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? {
										...ta,
										monitoringLevel: level,
										transparencyLog: [logEntry, ...ta.transparencyLog],
									}
								: ta,
						),
					}));
				},

				// Parent: View messages (logs access)
				viewMessages: (teenId, channelId, channelName, serverId, serverName) => {
					const logEntry: TransparencyLogEntry = {
						id: `log-${Date.now()}`,
						action: "viewed_messages",
						details: `Parent viewed messages in #${channelName}`,
						timestamp: new Date(),
						metadata: {
							channelId,
							channelName,
							serverId,
							serverName,
						},
					};

					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? {
										...ta,
										transparencyLog: [logEntry, ...ta.transparencyLog],
									}
								: ta,
						),
					}));
				},

				// Parent: View friends list (logs access)
				viewFriends: (teenId) => {
					const logEntry: TransparencyLogEntry = {
						id: `log-${Date.now()}`,
						action: "viewed_friends",
						details: "Parent viewed friends list",
						timestamp: new Date(),
					};

					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? {
										...ta,
										transparencyLog: [logEntry, ...ta.transparencyLog],
									}
								: ta,
						),
					}));
				},

				// Parent: View servers list (logs access)
				viewServers: (teenId) => {
					const logEntry: TransparencyLogEntry = {
						id: `log-${Date.now()}`,
						action: "viewed_servers",
						details: "Parent viewed servers list",
						timestamp: new Date(),
					};

					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? {
										...ta,
										transparencyLog: [logEntry, ...ta.transparencyLog],
									}
								: ta,
						),
					}));
				},

				// Parent: View content flags (logs access)
				viewFlags: (teenId) => {
					const logEntry: TransparencyLogEntry = {
						id: `log-${Date.now()}`,
						action: "viewed_flags",
						details: "Parent viewed content flags",
						timestamp: new Date(),
					};

					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? {
										...ta,
										transparencyLog: [logEntry, ...ta.transparencyLog],
									}
								: ta,
						),
					}));
				},

				// Parent: Approve server request
				approveServer: (teenId, approvalId) => {
					const teenAccount = get().teenAccounts.find(
						(ta) => ta.id === teenId,
					);
					if (!teenAccount) return;

					const approval = teenAccount.pendingServers.find(
						(s) => s.id === approvalId,
					);
					if (!approval) return;

					const logEntry: TransparencyLogEntry = {
						id: `log-${Date.now()}`,
						action: "approved_server",
						details: `Parent approved server ${approval.server.name}`,
						timestamp: new Date(),
						metadata: {
							serverId: approval.server.id,
							serverName: approval.server.name,
						},
					};

					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? {
										...ta,
										pendingServers: ta.pendingServers.map((s) =>
											s.id === approvalId
												? { ...s, status: "approved", resolvedAt: new Date() }
												: s,
										),
										transparencyLog: [logEntry, ...ta.transparencyLog],
									}
								: ta,
						),
					}));
				},

				// Parent: Deny server request
				denyServer: (teenId, approvalId) => {
					const teenAccount = get().teenAccounts.find(
						(ta) => ta.id === teenId,
					);
					if (!teenAccount) return;

					const approval = teenAccount.pendingServers.find(
						(s) => s.id === approvalId,
					);
					if (!approval) return;

					const logEntry: TransparencyLogEntry = {
						id: `log-${Date.now()}`,
						action: "denied_server",
						details: `Parent denied server ${approval.server.name}`,
						timestamp: new Date(),
						metadata: {
							serverId: approval.server.id,
							serverName: approval.server.name,
						},
					};

					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? {
										...ta,
										pendingServers: ta.pendingServers.map((s) =>
											s.id === approvalId
												? { ...s, status: "denied", resolvedAt: new Date() }
												: s,
										),
										transparencyLog: [logEntry, ...ta.transparencyLog],
									}
								: ta,
						),
					}));
				},

				// Parent: Approve friend request
				approveFriend: (teenId, approvalId) => {
					const teenAccount = get().teenAccounts.find(
						(ta) => ta.id === teenId,
					);
					if (!teenAccount) return;

					const approval = teenAccount.pendingFriends.find(
						(f) => f.id === approvalId,
					);
					if (!approval) return;

					const logEntry: TransparencyLogEntry = {
						id: `log-${Date.now()}`,
						action: "approved_friend",
						details: `Parent approved friend ${approval.friend.username}`,
						timestamp: new Date(),
						metadata: {
							friendId: approval.friend.id,
							friendName: approval.friend.username,
						},
					};

					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? {
										...ta,
										pendingFriends: ta.pendingFriends.map((f) =>
											f.id === approvalId
												? { ...f, status: "approved", resolvedAt: new Date() }
												: f,
										),
										transparencyLog: [logEntry, ...ta.transparencyLog],
									}
								: ta,
						),
					}));
				},

				// Parent: Deny friend request
				denyFriend: (teenId, approvalId) => {
					const teenAccount = get().teenAccounts.find(
						(ta) => ta.id === teenId,
					);
					if (!teenAccount) return;

					const approval = teenAccount.pendingFriends.find(
						(f) => f.id === approvalId,
					);
					if (!approval) return;

					const logEntry: TransparencyLogEntry = {
						id: `log-${Date.now()}`,
						action: "denied_friend",
						details: `Parent denied friend ${approval.friend.username}`,
						timestamp: new Date(),
						metadata: {
							friendId: approval.friend.id,
							friendName: approval.friend.username,
						},
					};

					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? {
										...ta,
										pendingFriends: ta.pendingFriends.map((f) =>
											f.id === approvalId
												? { ...f, status: "denied", resolvedAt: new Date() }
												: f,
										),
										transparencyLog: [logEntry, ...ta.transparencyLog],
									}
								: ta,
						),
					}));
				},

				// Parent: Dismiss content flag
				dismissFlag: (teenId, flagId) => {
					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? {
										...ta,
										contentFlags: ta.contentFlags.map((f) =>
											f.id === flagId ? { ...f, status: "dismissed" } : f,
										),
									}
								: ta,
						),
					}));
				},

				// Parent: Address content flag
				addressFlag: (teenId, flagId) => {
					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? {
										...ta,
										contentFlags: ta.contentFlags.map((f) =>
											f.id === flagId ? { ...f, status: "addressed" } : f,
										),
									}
								: ta,
						),
					}));
				},

				// Parent: Add keyword alert
				addKeywordAlert: (teenId, keyword, severity) => {
					const newAlert: KeywordAlert = {
						id: `alert-${Date.now()}`,
						keyword,
						isRegex: false,
						isActive: true,
						severity,
						createdAt: new Date(),
						matchCount: 0,
					};
					const logEntry: TransparencyLogEntry = {
						id: `log-${Date.now()}`,
						action: "added_keyword_alert",
						details: "Parent added keyword alert",
						timestamp: new Date(),
					};
					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? {
										...ta,
										restrictions: {
											...ta.restrictions,
											keywordAlerts: [...(ta.restrictions.keywordAlerts || []), newAlert],
										},
										transparencyLog: [logEntry, ...ta.transparencyLog],
									}
								: ta,
						),
					}));
				},

				// Parent: Remove keyword alert
				removeKeywordAlert: (teenId, alertId) => {
					const logEntry: TransparencyLogEntry = {
						id: `log-${Date.now()}`,
						action: "removed_keyword_alert",
						details: "Parent removed keyword alert",
						timestamp: new Date(),
					};
					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? {
										...ta,
										restrictions: {
											...ta.restrictions,
											keywordAlerts: (ta.restrictions.keywordAlerts || []).filter((a) => a.id !== alertId),
										},
										transparencyLog: [logEntry, ...ta.transparencyLog],
									}
								: ta,
						),
					}));
				},

				// Parent: Toggle keyword alert
				toggleKeywordAlert: (teenId, alertId) => {
					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? {
										...ta,
										restrictions: {
											...ta.restrictions,
											keywordAlerts: (ta.restrictions.keywordAlerts || []).map((a) =>
												a.id === alertId ? { ...a, isActive: !a.isActive } : a,
											),
										},
									}
								: ta,
						),
					}));
				},

				// Parent: Dismiss keyword match
				dismissKeywordMatch: (teenId, matchId) => {
					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? {
										...ta,
										restrictions: {
											...ta.restrictions,
											keywordAlertMatches: (ta.restrictions.keywordAlertMatches || []).map((m) =>
												m.id === matchId ? { ...m, dismissed: true } : m,
											),
										},
									}
								: ta,
						),
					}));
				},

				// Parent: Set time limit
				setTimeLimit: (teenId, config) => {
					const logEntry: TransparencyLogEntry = {
						id: `log-${Date.now()}`,
						action: "changed_time_limit",
						details: `Parent updated time limits (${config.dailyLimitMinutes} min/day)`,
						timestamp: new Date(),
					};
					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? {
										...ta,
										restrictions: { ...ta.restrictions, timeLimitConfig: config },
										transparencyLog: [logEntry, ...ta.transparencyLog],
									}
								: ta,
						),
					}));
				},

				// Parent: Remove time limit
				removeTimeLimit: (teenId) => {
					const logEntry: TransparencyLogEntry = {
						id: `log-${Date.now()}`,
						action: "changed_time_limit",
						details: "Parent removed time limits",
						timestamp: new Date(),
					};
					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? {
										...ta,
										restrictions: { ...ta.restrictions, timeLimitConfig: undefined },
										transparencyLog: [logEntry, ...ta.transparencyLog],
									}
								: ta,
						),
					}));
				},

				// Parent: Toggle blocked category
				toggleBlockedCategory: (teenId, categoryId) => {
					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) => {
							if (ta.id !== teenId) return ta;
							const categories = ta.restrictions.blockedCategories || [];
							const cat = categories.find((c) => c.id === categoryId);
							if (!cat) return ta;
							const action = cat.isActive ? "unblocked_category" : "blocked_category";
							const logEntry: TransparencyLogEntry = {
								id: `log-${Date.now()}`,
								action,
								details: `Parent ${cat.isActive ? "unblocked" : "blocked"} category: ${cat.name}`,
								timestamp: new Date(),
							};
							return {
								...ta,
								restrictions: {
									...ta.restrictions,
									blockedCategories: categories.map((c) =>
										c.id === categoryId ? { ...c, isActive: !c.isActive } : c,
									),
								},
								transparencyLog: [logEntry, ...ta.transparencyLog],
							};
						}),
					}));
				},

				// Parent: Restrict server
				restrictServer: (teenId, serverId, serverName) => {
					const logEntry: TransparencyLogEntry = {
						id: `log-${Date.now()}`,
						action: "restricted_server",
						details: `Parent restricted server: ${serverName}`,
						timestamp: new Date(),
						metadata: { serverId, serverName },
					};
					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? {
										...ta,
										restrictions: {
											...ta.restrictions,
											restrictedServers: [...(ta.restrictions.restrictedServers || []), serverId],
										},
										transparencyLog: [logEntry, ...ta.transparencyLog],
									}
								: ta,
						),
					}));
				},

				// Parent: Unrestrict server
				unrestrictServer: (teenId, serverId, serverName) => {
					const logEntry: TransparencyLogEntry = {
						id: `log-${Date.now()}`,
						action: "unrestricted_server",
						details: `Parent unrestricted server: ${serverName}`,
						timestamp: new Date(),
						metadata: { serverId, serverName },
					};
					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? {
										...ta,
										restrictions: {
											...ta.restrictions,
											restrictedServers: (ta.restrictions.restrictedServers || []).filter((id) => id !== serverId),
										},
										transparencyLog: [logEntry, ...ta.transparencyLog],
									}
								: ta,
						),
					}));
				},

				// Parent: Log voice metadata access
				viewVoiceMetadata: (teenId) => {
					const logEntry: TransparencyLogEntry = {
						id: `log-${Date.now()}`,
						action: "viewed_voice_metadata",
						details: "Parent viewed voice call metadata",
						timestamp: new Date(),
					};
					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? { ...ta, transparencyLog: [logEntry, ...ta.transparencyLog] }
								: ta,
						),
					}));
				},

				// Parent: Log export
				logExportActivity: (teenId) => {
					const logEntry: TransparencyLogEntry = {
						id: `log-${Date.now()}`,
						action: "exported_activity_log",
						details: "Parent exported activity log",
						timestamp: new Date(),
					};
					set((state) => ({
						teenAccounts: state.teenAccounts.map((ta) =>
							ta.id === teenId
								? { ...ta, transparencyLog: [logEntry, ...ta.transparencyLog] }
								: ta,
						),
					}));
				},

				// Teen: Get my transparency log
				getMyTransparencyLog: () => {
					return get().myTransparencyLog;
				},

				// Reset store
				reset: () => {
					set(initialState);
				},
			}),
			{
				name: "bedrock-family",
				partialize: (state) => ({
					isParent: state.isParent,
					isTeen: state.isTeen,
					selectedTeenId: state.selectedTeenId,
					// Don't persist teen accounts - reload on each session
				}),
			},
		),
		{ name: "FamilyStore" },
	),
);
