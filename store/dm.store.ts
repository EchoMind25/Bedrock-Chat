import { create } from "zustand";
import { persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type { DirectMessage } from "@/lib/types/dm";
import type { Message } from "@/lib/types/message";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import { isAbortError } from "@/lib/utils/is-abort-error";
import { toast } from "@/lib/stores/toast-store";

interface DMState {
	dms: DirectMessage[];
	currentDmId: string | null;
	isInitialized: boolean;

	// Per-conversation messages (keyed by otherUserId)
	dmMessages: Record<string, Message[]>;
	dmLoadingUsers: Record<string, boolean>;
	dmLoadErrors: Record<string, boolean>;
	dmSubscription: (() => void) | null;

	// Conversation actions
	init: () => void;
	setCurrentDm: (dmId: string) => void;
	createDm: (userId: string) => DirectMessage | null;
	markDmRead: (dmId: string) => void;
	closeDm: (dmId: string) => void;
	getCurrentDm: () => DirectMessage | undefined;
	getDmByUserId: (userId: string) => DirectMessage | undefined;
	getTotalUnreadCount: () => number;

	// Message actions
	loadDmMessages: (otherUserId: string) => Promise<void>;
	sendDmMessage: (receiverId: string, content: string) => Promise<void>;
	subscribeToDms: () => void;
	unsubscribeFromDms: () => void;
}

function mapDmToMessage(
	msg: Record<string, unknown>,
	senderProfile: Record<string, unknown> | null,
	senderId: string,
): Message {
	return {
		id: msg.id as string,
		content: msg.content as string,
		author: {
			id: senderProfile?.id as string || senderId,
			username: senderProfile?.username as string || "Unknown",
			displayName: (senderProfile?.display_name as string) || (senderProfile?.username as string) || "Unknown",
			avatar: (senderProfile?.avatar_url as string) || "",
			isBot: false,
		},
		timestamp: new Date(msg.created_at as string),
		editedAt: msg.edited_at ? new Date(msg.edited_at as string) : undefined,
		reactions: [],
		attachments: [],
		embeds: [],
		isPinned: false,
		type: "default",
	};
}

export const useDMStore = create<DMState>()(
	conditionalDevtools(
		persist(
			(set, get) => ({
				dms: [],
				currentDmId: null,
				isInitialized: false,
				dmMessages: {},
				dmLoadingUsers: {},
				dmLoadErrors: {},
				dmSubscription: null,

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
					// Always clear local unread badge
					set((state) => ({
						dms: state.dms.map((dm) => dm.id === dmId ? { ...dm, unreadCount: 0 } : dm),
					}));

					// TODO: Move to server-side enforcement via RLS policy or database trigger before public launch
					// Only write read_at to DB if user has read_receipts enabled
					// (When read receipt DB writes are implemented, guard them here)
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

				loadDmMessages: async (otherUserId) => {
					const state = get();
					if (state.dmMessages[otherUserId] !== undefined && !state.dmLoadErrors[otherUserId]) {
						return;
					}
					if (state.dmLoadingUsers[otherUserId]) {
						return;
					}

					set((prev) => ({
						dmLoadingUsers: { ...prev.dmLoadingUsers, [otherUserId]: true },
						dmLoadErrors: { ...prev.dmLoadErrors, [otherUserId]: false },
					}));

					try {
						const currentUserId = useAuthStore.getState().user?.id;
						if (!currentUserId) {
							set((prev) => ({
								dmMessages: { ...prev.dmMessages, [otherUserId]: [] },
								dmLoadingUsers: { ...prev.dmLoadingUsers, [otherUserId]: false },
							}));
							return;
						}

						const supabase = createClient();

						// Fetch messages in both directions for this conversation
						const { data: sent, error: sentErr } = await supabase
							.from("direct_messages")
							.select(`
								*,
								sender:profiles!direct_messages_sender_id_fkey(id, username, display_name, avatar_url)
							`)
							.eq("sender_id", currentUserId)
							.eq("receiver_id", otherUserId)
							.eq("is_deleted", false)
							.order("created_at", { ascending: false })
							.limit(50);

						const { data: received, error: recvErr } = await supabase
							.from("direct_messages")
							.select(`
								*,
								sender:profiles!direct_messages_sender_id_fkey(id, username, display_name, avatar_url)
							`)
							.eq("sender_id", otherUserId)
							.eq("receiver_id", currentUserId)
							.eq("is_deleted", false)
							.order("created_at", { ascending: false })
							.limit(50);

						if (sentErr) throw sentErr;
						if (recvErr) throw recvErr;

						const allMessages = [...(sent || []), ...(received || [])]
							.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
							.map((msg) => mapDmToMessage(
								msg,
								msg.sender as Record<string, unknown> | null,
								msg.sender_id as string,
							));

						set((prev) => ({
							dmMessages: { ...prev.dmMessages, [otherUserId]: allMessages },
							dmLoadingUsers: { ...prev.dmLoadingUsers, [otherUserId]: false },
							dmLoadErrors: { ...prev.dmLoadErrors, [otherUserId]: false },
						}));
					} catch (err) {
						if (!isAbortError(err)) {
							console.error("[DM] Load failed:", err);
						}
						set((prev) => ({
							dmMessages: { ...prev.dmMessages, [otherUserId]: prev.dmMessages[otherUserId] ?? [] },
							dmLoadingUsers: { ...prev.dmLoadingUsers, [otherUserId]: false },
							dmLoadErrors: { ...prev.dmLoadErrors, [otherUserId]: true },
						}));
					}
				},

				sendDmMessage: async (receiverId, content) => {
					const user = useAuthStore.getState().user;
					if (!user || !content.trim()) return;

					// TODO: Move to server-side enforcement via RLS policy or database trigger before public launch
					// Check if receiver has DMs enabled
					try {
						const supabase = createClient();
						const { data: receiverSettings } = await supabase
							.from("user_settings")
							.select("allow_dms")
							.eq("user_id", receiverId)
							.single();

						if (receiverSettings && !receiverSettings.allow_dms) {
							toast.error("Cannot send message", "This user has disabled direct messages.");
							return;
						}
					} catch {
						// If we can't check settings, allow the message (fail open)
					}

					try {
						const supabase = createClient();
						const { data, error } = await supabase
							.from("direct_messages")
							.insert({
								sender_id: user.id,
								receiver_id: receiverId,
								content: content.trim(),
							})
							.select()
							.single();

						if (error) {
							console.error("[DM] Send error:", error.message);
							return;
						}

						// Optimistic update — add to local messages immediately
						const newMessage: Message = {
							id: data.id,
							content: content.trim(),
							author: {
								id: user.id,
								username: user.username,
								displayName: user.displayName,
								avatar: user.avatar,
								isBot: false,
							},
							timestamp: new Date(),
							reactions: [],
							attachments: [],
							embeds: [],
							isPinned: false,
							type: "default",
						};

						set((state) => ({
							dmMessages: {
								...state.dmMessages,
								[receiverId]: [...(state.dmMessages[receiverId] || []), newMessage],
							},
							// Update last message in conversation list
							dms: state.dms.map((dm) =>
								dm.id === `dm-${receiverId}`
									? { ...dm, lastMessage: { content: content.trim(), timestamp: new Date(), authorId: user.id } }
									: dm
							),
						}));
					} catch (err) {
						console.error("[DM] Send failed:", err);
					}
				},

				subscribeToDms: () => {
					// Don't subscribe twice
					if (get().dmSubscription) return;

					const currentUserId = useAuthStore.getState().user?.id;
					if (!currentUserId) return;

					const supabase = createClient();

					// Subscribe to all DMs where current user is receiver (incoming messages)
					const channel = supabase
						.channel(`dm:${currentUserId}`)
						.on(
							"postgres_changes",
							{
								event: "INSERT",
								schema: "public",
								table: "direct_messages",
								filter: `receiver_id=eq.${currentUserId}`,
							},
							async (payload) => {
								try {
									const senderId = payload.new.sender_id as string;

									// Fetch sender profile
									const { data: senderProfile } = await supabase
										.from("profiles")
										.select("id, username, display_name, avatar_url")
										.eq("id", senderId)
										.single();

									const newMessage = mapDmToMessage(
										payload.new,
										senderProfile,
										senderId,
									);

									// Add to conversation messages if that conversation is loaded
									set((state) => ({
										dmMessages: {
											...state.dmMessages,
											[senderId]: [...(state.dmMessages[senderId] || []), newMessage],
										},
										// Update last message and unread count in sidebar
										dms: state.dms.map((dm) =>
											dm.id === `dm-${senderId}`
												? {
														...dm,
														lastMessage: { content: payload.new.content as string, timestamp: new Date(), authorId: senderId },
														unreadCount: state.currentDmId === `dm-${senderId}` ? dm.unreadCount : dm.unreadCount + 1,
													}
												: dm
										),
									}));
								} catch (err) {
									console.error("[DM Realtime] INSERT handler error:", err);
								}
							}
						)
						.on(
							"postgres_changes",
							{
								event: "UPDATE",
								schema: "public",
								table: "direct_messages",
								filter: `receiver_id=eq.${currentUserId}`,
							},
							(payload) => {
								const senderId = payload.new.sender_id as string;
								if (payload.new.is_deleted) {
									// Soft delete — remove from UI
									set((state) => ({
										dmMessages: {
											...state.dmMessages,
											[senderId]: (state.dmMessages[senderId] || []).filter(
												(msg) => msg.id !== payload.new.id
											),
										},
									}));
								} else {
									// Edit
									set((state) => ({
										dmMessages: {
											...state.dmMessages,
											[senderId]: (state.dmMessages[senderId] || []).map((msg) =>
												msg.id === payload.new.id
													? { ...msg, content: payload.new.content as string }
													: msg
											),
										},
									}));
								}
							}
						)
						.subscribe((status, err) => {
							if (status === "SUBSCRIBED") {
								if (process.env.NODE_ENV === "development") {
									console.log("[DM Realtime] SUBSCRIBED");
								}
							} else if (status === "CHANNEL_ERROR") {
								console.error("[DM Realtime] CHANNEL_ERROR:", err);
							} else if (status === "TIMED_OUT") {
								console.warn("[DM Realtime] TIMED_OUT");
							}
						});

					set({
						dmSubscription: () => {
							supabase.removeChannel(channel);
						},
					});
				},

				unsubscribeFromDms: () => {
					const cleanup = get().dmSubscription;
					if (cleanup) {
						cleanup();
						set({ dmSubscription: null });
					}
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
