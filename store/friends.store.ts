import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type { Friend, FriendRequest } from "@/lib/types/friend";
import { generateInitialFriends } from "@/lib/mocks/friends";
import { faker } from "@faker-js/faker";

export type FriendTab = "all" | "online" | "pending" | "blocked";

interface FriendsState {
	// Data
	friends: Friend[];
	friendRequests: {
		incoming: FriendRequest[];
		outgoing: FriendRequest[];
	};
	blockedUsers: Friend[];

	// UI state
	currentTab: FriendTab;
	searchQuery: string;
	isAddFriendModalOpen: boolean;

	// Initialization
	isInitialized: boolean;

	// Actions
	init: () => void;
	setCurrentTab: (tab: FriendTab) => void;
	setSearchQuery: (query: string) => void;

	// Friend request actions
	sendFriendRequest: (username: string, message?: string) => Promise<boolean>;
	acceptFriendRequest: (requestId: string) => void;
	declineFriendRequest: (requestId: string) => void;
	cancelFriendRequest: (requestId: string) => void;

	// Friend actions
	removeFriend: (friendId: string) => void;
	blockUser: (userId: string) => void;
	unblockUser: (userId: string) => void;

	// Modal
	openAddFriendModal: () => void;
	closeAddFriendModal: () => void;

	// Getters
	getOnlineFriends: () => Friend[];
	getPendingCount: () => number;
}

export const useFriendsStore = create<FriendsState>()(
	conditionalDevtools(
		persist(
			(set, get) => ({
				// Initial state
				friends: [],
				friendRequests: { incoming: [], outgoing: [] },
				blockedUsers: [],
				currentTab: "all",
				searchQuery: "",
				isAddFriendModalOpen: false,
				isInitialized: false,

				// Initialize friends
				init: () => {
					if (get().isInitialized) return;

					const { friends, requests, blocked } = generateInitialFriends();

					set({
						friends,
						friendRequests: requests,
						blockedUsers: blocked,
						isInitialized: true,
					});
				},

				// Actions
				setCurrentTab: (tab) => set({ currentTab: tab }),
				setSearchQuery: (query) => set({ searchQuery: query }),

				// Friend request actions
				sendFriendRequest: async (username, message) => {
					// Simulate network delay
					await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));

					// Simulate 80% success rate
					if (Math.random() < 0.8) {
						const newRequest: FriendRequest = {
							id: faker.string.uuid(),
							fromUserId: "current-user-id",
							fromUsername: "You",
							fromDisplayName: "You",
							fromAvatar: "",
							toUserId: faker.string.uuid(),
							message,
							createdAt: new Date(),
							direction: "outgoing",
						};

						set((state) => ({
							friendRequests: {
								...state.friendRequests,
								outgoing: [...state.friendRequests.outgoing, newRequest],
							},
						}));

						return true;
					}

					return false; // User not found or request failed
				},

				acceptFriendRequest: (requestId) => {
					const request = get().friendRequests.incoming.find((r) => r.id === requestId);
					if (!request) return;

					// Add to friends list
					const newFriend: Friend = {
						id: faker.string.uuid(),
						userId: request.fromUserId,
						username: request.fromUsername,
						displayName: request.fromDisplayName,
						avatar: request.fromAvatar,
						status: faker.helpers.arrayElement(["online", "idle", "dnd", "offline"]),
						friendshipStatus: "accepted",
						createdAt: new Date(),
					};

					set((state) => ({
						friends: [...state.friends, newFriend],
						friendRequests: {
							...state.friendRequests,
							incoming: state.friendRequests.incoming.filter((r) => r.id !== requestId),
						},
					}));
				},

				declineFriendRequest: (requestId) => {
					set((state) => ({
						friendRequests: {
							...state.friendRequests,
							incoming: state.friendRequests.incoming.filter((r) => r.id !== requestId),
						},
					}));
				},

				cancelFriendRequest: (requestId) => {
					set((state) => ({
						friendRequests: {
							...state.friendRequests,
							outgoing: state.friendRequests.outgoing.filter((r) => r.id !== requestId),
						},
					}));
				},

				removeFriend: (friendId) => {
					set((state) => ({
						friends: state.friends.filter((f) => f.id !== friendId),
					}));
				},

				blockUser: (userId) => {
					const friend = get().friends.find((f) => f.userId === userId);
					if (!friend) return;

					const blockedFriend: Friend = {
						...friend,
						friendshipStatus: "blocked",
						status: "offline",
					};

					set((state) => ({
						friends: state.friends.filter((f) => f.userId !== userId),
						blockedUsers: [...state.blockedUsers, blockedFriend],
					}));
				},

				unblockUser: (userId) => {
					const blocked = get().blockedUsers.find((u) => u.userId === userId);
					if (!blocked) return;

					set((state) => ({
						blockedUsers: state.blockedUsers.filter((u) => u.userId !== userId),
						// Optionally re-add to friends or leave removed
					}));
				},

				// Modal
				openAddFriendModal: () => set({ isAddFriendModalOpen: true }),
				closeAddFriendModal: () => set({ isAddFriendModalOpen: false }),

				// Getters
				getOnlineFriends: () => {
					return get().friends.filter((f) => f.status === "online");
				},

				getPendingCount: () => {
					const { incoming, outgoing } = get().friendRequests;
					return incoming.length + outgoing.length;
				},
			}),
			{
				name: "bedrock-friends",
				partialize: (state) => ({
					currentTab: state.currentTab,
					// Don't persist friends, requests, or blocked users - regenerate on init
				}),
			}
		),
		{ name: "FriendsStore" }
	)
);
