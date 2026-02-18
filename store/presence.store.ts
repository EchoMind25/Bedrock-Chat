import { create } from "zustand";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "./auth.store";
import { useSettingsStore } from "./settings.store";
import { toast } from "@/lib/stores/toast-store";
import type { UserStatus } from "./auth.store";

// ── Types ──────────────────────────────────────────────────

export interface UserPresence {
	userId: string;
	username: string;
	displayName: string;
	avatar: string;
	status: UserStatus;
	lastSeen: number;
}

interface PresenceChannel {
	unsubscribe: () => void;
	untrack: () => void;
	track: (payload: Record<string, unknown>) => void;
	send: (payload: Record<string, unknown>) => void;
}

interface PresenceState {
	// State
	onlineUsers: Map<string, UserPresence>;
	typingUsers: Record<string, string[]>; // channelId → usernames
	currentServerId: string | null;
	isConnected: boolean;
	status: UserStatus;

	// Internal (not for component consumption)
	_channel: PresenceChannel | null;
	_reconnectInterval: ReturnType<typeof setInterval> | null;
	_typingDebounceTimers: Record<string, number>; // channelId → timestamp of last broadcast
	_typingTimeouts: Record<string, ReturnType<typeof setTimeout>>; // "channelId:username" → timeout

	// Actions
	joinServer: (serverId: string) => void;
	leaveServer: () => void;
	setStatus: (status: UserStatus) => void;
	broadcastTyping: (channelId: string) => void;
	getOnlineCount: () => number;
	isUserOnline: (userId: string) => boolean;
	destroy: () => void;
}

// ── Stable empty references (prevent re-renders) ──────────

const EMPTY_MAP = new Map<string, UserPresence>();

// ── Helpers ────────────────────────────────────────────────

function parsePresenceState(
	state: Record<string, unknown[]>,
): Map<string, UserPresence> {
	const users = new Map<string, UserPresence>();
	for (const presences of Object.values(state)) {
		for (const p of presences) {
			const presence = p as UserPresence;
			if (presence.userId) {
				users.set(presence.userId, presence);
			}
		}
	}
	return users;
}

function getCurrentUser() {
	const user = useAuthStore.getState().user;
	if (!user) return null;
	return {
		userId: user.id,
		username: user.username,
		displayName: user.displayName,
		avatar: user.avatar,
	};
}

// ── Store ──────────────────────────────────────────────────

export const usePresenceStore = create<PresenceState>()(
	conditionalDevtools(
		(set, get) => ({
			onlineUsers: EMPTY_MAP,
			typingUsers: {},
			currentServerId: null,
			isConnected: false,
			status: "online",
			_channel: null,
			_reconnectInterval: null,
			_typingDebounceTimers: {},
			_typingTimeouts: {},

			joinServer: (serverId) => {
				const state = get();

				// Already in this server
				if (state.currentServerId === serverId && state._channel) return;

				// Leave previous server first
				if (state._channel) {
					get().leaveServer();
				}

				const user = getCurrentUser();
				if (!user) return;

				const currentStatus = get().status;

				// Don't join if invisible
				const supabase = createClient();
				const channel = supabase.channel(`presence:server:${serverId}`, {
					config: { presence: { key: user.userId } },
				});

				// Presence sync — full state reconciliation
				channel.on("presence", { event: "sync" }, () => {
					const presenceState = channel.presenceState();
					const users = parsePresenceState(
						presenceState as Record<string, unknown[]>,
					);
					// Remove self from online users display
					users.delete(user.userId);
					set({ onlineUsers: users, isConnected: true });
				});

				// Typing broadcast handler
				channel.on("broadcast", { event: "typing" }, (payload) => {
					const { channelId, username } = payload.payload as {
						channelId: string;
						username: string;
					};

					// Ignore own typing events
					if (username === user.username) return;

					const timeoutKey = `${channelId}:${username}`;

					// Cancel existing timeout for this user/channel
					const existingTimeout = get()._typingTimeouts[timeoutKey];
					if (existingTimeout) {
						clearTimeout(existingTimeout);
					}

					// Add user to typing list
					set((s) => {
						const current = s.typingUsers[channelId] || [];
						if (current.includes(username)) return s;
						return {
							typingUsers: {
								...s.typingUsers,
								[channelId]: [...current, username],
							},
						};
					});

					// Set new timeout and track it
					const newTimeout = setTimeout(() => {
						set((s) => {
							const updatedTyping = {
								...s.typingUsers,
								[channelId]: (s.typingUsers[channelId] || []).filter(
									(u) => u !== username,
								),
							};
							const { [timeoutKey]: _, ...remainingTimeouts } = s._typingTimeouts;
							return {
								typingUsers: updatedTyping,
								_typingTimeouts: remainingTimeouts,
							};
						});
					}, 3000);

					// Store timeout reference
					set((s) => ({
						_typingTimeouts: {
							...s._typingTimeouts,
							[timeoutKey]: newTimeout,
						},
					}));
				});

				channel.subscribe(async (status) => {
					if (status === "SUBSCRIBED") {
						// Only track if not invisible AND user has show_online_status enabled
						// TODO: Move to server-side enforcement via RLS policy or database trigger before public launch
						const showOnline = useSettingsStore.getState().settings?.show_online_status ?? true;
						if (currentStatus !== "invisible" && showOnline) {
							await channel.track({
								userId: user.userId,
								username: user.username,
								displayName: user.displayName,
								avatar: user.avatar,
								status: currentStatus,
								lastSeen: Date.now(),
							});
						}
						set({ isConnected: true });
					} else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
						set({ isConnected: false });
						toast.warning("Reconnecting to presence...");
					}
				});

				// Auto-retry on disconnection with exponential backoff
				let reconnectAttempts = 0;
				const reconnectInterval = setInterval(() => {
					const { isConnected, _channel, currentServerId: sid } = get();
					if (isConnected) {
						reconnectAttempts = 0;
						return;
					}
					if (!_channel || !sid) return;

					reconnectAttempts++;
					if (reconnectAttempts > 5) {
						clearInterval(reconnectInterval);
						return;
					}

					try { supabase.removeChannel(channel); } catch {}
					set({ _channel: null, _reconnectInterval: null });
					clearInterval(reconnectInterval);

					// Re-join after exponential backoff
					setTimeout(
						() => get().joinServer(sid),
						Math.min(1000 * Math.pow(2, reconnectAttempts), 30000),
					);
				}, 5000);

				set({
					currentServerId: serverId,
					_channel: channel as unknown as PresenceChannel,
					_reconnectInterval: reconnectInterval,
					onlineUsers: new Map(),
				});
			},

			leaveServer: () => {
				const { _channel, _reconnectInterval, _typingTimeouts } = get();

				// Clear all typing timeouts
				for (const timeout of Object.values(_typingTimeouts)) {
					clearTimeout(timeout);
				}

				if (_channel) {
					try {
						_channel.unsubscribe();
					} catch {
						// Channel may already be closed
					}
				}
				if (_reconnectInterval) {
					clearInterval(_reconnectInterval);
				}
				set({
					currentServerId: null,
					_channel: null,
					_reconnectInterval: null,
					_typingTimeouts: {},
					onlineUsers: new Map(),
					typingUsers: {},
					isConnected: false,
				});
			},

			setStatus: (status) => {
				const { _channel } = get();
				const user = getCurrentUser();

				set({ status });

				if (!_channel || !user) return;

				// TODO: Move to server-side enforcement via RLS policy or database trigger before public launch
				const showOnline = useSettingsStore.getState().settings?.show_online_status ?? true;

				if (status === "invisible" || !showOnline) {
					// CRITICAL: Remove from presence channel entirely — zero packets
					_channel.untrack();
					set({ isConnected: false });
					return;
				}

				// For all other statuses, broadcast normally
				_channel.track({
					userId: user.userId,
					username: user.username,
					displayName: user.displayName,
					avatar: user.avatar,
					status,
					lastSeen: Date.now(),
				});
				set({ isConnected: true });
			},

			broadcastTyping: (channelId) => {
				const { _channel, _typingDebounceTimers } = get();
				if (!_channel) return;

				// TODO: Move to server-side enforcement via RLS policy or database trigger before public launch
				const typingEnabled = useSettingsStore.getState().settings?.typing_indicators ?? true;
				if (!typingEnabled) return;

				const user = getCurrentUser();
				if (!user) return;

				// Debounce: max 1 typing broadcast per 2 seconds per channel
				const now = Date.now();
				const lastBroadcast = _typingDebounceTimers[channelId] || 0;
				if (now - lastBroadcast < 2000) return;

				_channel.send({
					type: "broadcast",
					event: "typing",
					payload: {
						channelId,
						username: user.username,
					},
				});

				set({
					_typingDebounceTimers: {
						...get()._typingDebounceTimers,
						[channelId]: now,
					},
				});
			},

			getOnlineCount: () => {
				return get().onlineUsers.size;
			},

			isUserOnline: (userId) => {
				return get().onlineUsers.has(userId);
			},

			destroy: () => {
				const { _channel, _reconnectInterval, _typingTimeouts } = get();

				// Clear all typing timeouts
				for (const timeout of Object.values(_typingTimeouts)) {
					clearTimeout(timeout);
				}

				if (_reconnectInterval) clearInterval(_reconnectInterval);
				if (_channel) {
					try {
						_channel.unsubscribe();
					} catch {
						// Already closed
					}
				}
				set({
					onlineUsers: new Map(),
					typingUsers: {},
					isConnected: false,
					_channel: null,
					_reconnectInterval: null,
					_typingTimeouts: {},
					currentServerId: null,
				});
			},
		}),
		{ name: "PresenceStore" },
	),
);
