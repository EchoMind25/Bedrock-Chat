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
} from "@/lib/types/family";
import type { User } from "@/store/auth.store";
import { mockTeenAccounts, mockParent } from "@/lib/mocks/family";

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

				// Initialize based on account type
				init: (userId, accountType) => {
					if (get().isInitialized) return;

					if (accountType === "parent") {
						// Initialize parent account with mock teen accounts
						set({
							isParent: true,
							isTeen: false,
							teenAccounts: mockTeenAccounts,
							selectedTeenId: mockTeenAccounts[0]?.id || null,
							isInitialized: true,
						});
					} else if (accountType === "teen") {
						// Initialize teen account with parent info
						// Find the teen account that matches this user
						const teenAccount = mockTeenAccounts.find(
							(ta) => ta.user.id === userId,
						);

						if (teenAccount) {
							set({
								isParent: false,
								isTeen: true,
								myParent: mockParent,
								myMonitoringLevel: teenAccount.monitoringLevel,
								myTransparencyLog: teenAccount.transparencyLog,
								isInitialized: true,
							});
						}
					} else {
						// Standard account - no family features
						set({
							isParent: false,
							isTeen: false,
							isInitialized: true,
						});
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
