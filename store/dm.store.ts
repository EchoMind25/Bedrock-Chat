import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type { DirectMessage } from "@/lib/types/dm";
import { generateInitialDMs, generateMockDM } from "@/lib/mocks/dms";
import { useFriendsStore } from "./friends.store";
import { faker } from "@faker-js/faker";

interface DMState {
	// Data
	dms: DirectMessage[];
	currentDmId: string | null;

	// Initialization
	isInitialized: boolean;

	// Actions
	init: () => void;
	setCurrentDm: (dmId: string) => void;
	createDm: (userId: string) => DirectMessage | null;
	markDmRead: (dmId: string) => void;
	closeDm: (dmId: string) => void;

	// Getters
	getCurrentDm: () => DirectMessage | undefined;
	getDmByUserId: (userId: string) => DirectMessage | undefined;
	getTotalUnreadCount: () => number;
}

export const useDMStore = create<DMState>()(
	conditionalDevtools(
		persist(
			(set, get) => ({
				// Initial state
				dms: [],
				currentDmId: null,
				isInitialized: false,

				// Initialize DMs
				init: () => {
					if (get().isInitialized) return;

					// Get friends from friends store
					const friends = useFriendsStore.getState().friends;
					const dms = generateInitialDMs(friends);

					set({
						dms,
						isInitialized: true,
					});
				},

				// Actions
				setCurrentDm: (dmId) => {
					set({ currentDmId: dmId });
					// Mark as read when selected
					get().markDmRead(dmId);
				},

				createDm: (userId) => {
					// Check if DM already exists
					const existingDm = get().getDmByUserId(userId);
					if (existingDm) return existingDm;

					// Get friend info
					const friend = useFriendsStore.getState().friends.find((f) => f.userId === userId);
					if (!friend) return null;

					// Create new DM
					const newDm = generateMockDM(friend, false);

					set((state) => ({
						dms: [newDm, ...state.dms],
					}));

					return newDm;
				},

				markDmRead: (dmId) => {
					set((state) => ({
						dms: state.dms.map((dm) =>
							dm.id === dmId ? { ...dm, unreadCount: 0 } : dm
						),
					}));
				},

				closeDm: (dmId) => {
					set((state) => ({
						dms: state.dms.filter((dm) => dm.id !== dmId),
						currentDmId: state.currentDmId === dmId ? null : state.currentDmId,
					}));
				},

				// Getters
				getCurrentDm: () => {
					const { currentDmId, dms } = get();
					return dms.find((dm) => dm.id === currentDmId);
				},

				getDmByUserId: (userId) => {
					return get().dms.find((dm) =>
						dm.participants.some((p) => p.userId === userId)
					);
				},

				getTotalUnreadCount: () => {
					return get().dms.reduce((sum, dm) => sum + dm.unreadCount, 0);
				},
			}),
			{
				name: "bedrock-dm",
				partialize: (state) => ({
					currentDmId: state.currentDmId,
					// Don't persist DMs - regenerate on init
				}),
			}
		),
		{ name: "DMStore" }
	)
);
