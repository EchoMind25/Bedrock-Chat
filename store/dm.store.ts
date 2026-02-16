import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type { DirectMessage } from "@/lib/types/dm";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import { isAbortError } from "@/lib/utils/is-abort-error";

interface DMState {
	dms: DirectMessage[];
	currentDmId: string | null;
	isInitialized: boolean;

	init: () => void;
	setCurrentDm: (dmId: string) => void;
	createDm: (userId: string) => DirectMessage | null;
	markDmRead: (dmId: string) => void;
	closeDm: (dmId: string) => void;
	getCurrentDm: () => DirectMessage | undefined;
	getDmByUserId: (userId: string) => DirectMessage | undefined;
	getTotalUnreadCount: () => number;
}

export const useDMStore = create<DMState>()(
	conditionalDevtools(
		persist(
			(set, get) => ({
				dms: [],
				currentDmId: null,
				isInitialized: false,

				init: () => {
					if (get().isInitialized) return;

					const loadDMs = async () => {
						try {
							// Use cached auth state instead of making a network round-trip
							const userId = useAuthStore.getState().user?.id;
							if (!userId) {
								set({ isInitialized: true });
								return;
							}

							const supabase = createClient();

							const { data: sentDMs } = await supabase
								.from("direct_messages")
								.select(`id, content, created_at, read_at, receiver:profiles!direct_messages_receiver_id_fkey(id, username, display_name, avatar_url, status)`)
								.eq("sender_id", userId).eq("is_deleted", false)
								.order("created_at", { ascending: false }).limit(50);

							const { data: receivedDMs } = await supabase
								.from("direct_messages")
								.select(`id, content, created_at, read_at, sender:profiles!direct_messages_sender_id_fkey(id, username, display_name, avatar_url, status)`)
								.eq("receiver_id", userId).eq("is_deleted", false)
								.order("created_at", { ascending: false }).limit(50);

							const conversationMap = new Map<string, DirectMessage>();

							for (const msg of sentDMs || []) {
								const other = msg.receiver as unknown as Record<string, unknown>;
								const otherId = other.id as string;
								if (!conversationMap.has(otherId)) {
									conversationMap.set(otherId, {
										id: `dm-${otherId}`,
										participants: [
											{ id: `p-${otherId}`, userId: otherId, username: other.username as string, displayName: (other.display_name as string) || (other.username as string), avatar: (other.avatar_url as string) || "", status: (other.status as "online" | "idle" | "dnd" | "offline") || "offline" },
											{ id: `p-${userId}`, userId, username: "You", displayName: "You", avatar: "", status: "online" },
										],
										lastMessage: { content: msg.content, timestamp: new Date(msg.created_at), authorId: userId },
										unreadCount: 0, isEncrypted: true, createdAt: new Date(msg.created_at),
									});
								}
							}

							for (const msg of receivedDMs || []) {
								const other = msg.sender as unknown as Record<string, unknown>;
								const otherId = other.id as string;
								const existing = conversationMap.get(otherId);
								const isUnread = !msg.read_at;

								if (!existing) {
									conversationMap.set(otherId, {
										id: `dm-${otherId}`,
										participants: [
											{ id: `p-${otherId}`, userId: otherId, username: other.username as string, displayName: (other.display_name as string) || (other.username as string), avatar: (other.avatar_url as string) || "", status: (other.status as "online" | "idle" | "dnd" | "offline") || "offline" },
											{ id: `p-${userId}`, userId, username: "You", displayName: "You", avatar: "", status: "online" },
										],
										lastMessage: { content: msg.content, timestamp: new Date(msg.created_at), authorId: otherId },
										unreadCount: isUnread ? 1 : 0, isEncrypted: true, createdAt: new Date(msg.created_at),
									});
								} else if (isUnread) {
									existing.unreadCount++;
								}
							}

							const dms = Array.from(conversationMap.values()).sort((a, b) => {
								const aTime = a.lastMessage?.timestamp?.getTime() ?? 0;
								const bTime = b.lastMessage?.timestamp?.getTime() ?? 0;
								return bTime - aTime;
							});

							set({ dms, isInitialized: true });
						} catch (err) {
							if (!isAbortError(err)) {
								console.error("Error loading DMs:", err);
							}
							set({ isInitialized: true });
						}
					};

					loadDMs();
				},

				setCurrentDm: (dmId) => {
					set({ currentDmId: dmId });
					get().markDmRead(dmId);
				},

				createDm: (userId) => {
					const existingDm = get().getDmByUserId(userId);
					if (existingDm) return existingDm;

					const newDm: DirectMessage = {
						id: `dm-${userId}`,
						participants: [{ id: `p-${userId}`, userId, username: "User", displayName: "User", avatar: "", status: "offline" }],
						unreadCount: 0, isEncrypted: true, createdAt: new Date(),
					};

					set((state) => ({ dms: [newDm, ...state.dms] }));
					return newDm;
				},

				markDmRead: (dmId) => {
					set((state) => ({
						dms: state.dms.map((dm) => dm.id === dmId ? { ...dm, unreadCount: 0 } : dm),
					}));
				},

				closeDm: (dmId) => {
					set((state) => ({
						dms: state.dms.filter((dm) => dm.id !== dmId),
						currentDmId: state.currentDmId === dmId ? null : state.currentDmId,
					}));
				},

				getCurrentDm: () => {
					const { currentDmId, dms } = get();
					return dms.find((dm) => dm.id === currentDmId);
				},

				getDmByUserId: (userId) => {
					return get().dms.find((dm) => dm.participants.some((p) => p.userId === userId));
				},

				getTotalUnreadCount: () => {
					return get().dms.reduce((sum, dm) => sum + dm.unreadCount, 0);
				},
			}),
			{
				name: "bedrock-dm",
				partialize: (state) => ({ currentDmId: state.currentDmId }),
			}
		),
		{ name: "DMStore" }
	)
);
