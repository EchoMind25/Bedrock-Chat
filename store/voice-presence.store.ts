import { create } from "zustand";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "./auth.store";
import type { VoiceUser } from "@/lib/types/server";

// ── Types ──────────────────────────────────────────────────

interface VoicePresencePayload {
	userId: string;
	username: string;
	avatar: string;
	channelId: string;
	isMuted: boolean;
	isDeafened: boolean;
	isSpeaking: boolean;
}

interface VoicePresenceChannel {
	unsubscribe: () => void;
	untrack: () => void;
	track: (payload: Record<string, unknown>) => void;
}

interface VoicePresenceState {
	// channelId → list of connected voice users (for sidebar display)
	voiceUsers: Record<string, VoiceUser[]>;
	currentServerId: string | null;

	// Internal
	_channel: VoicePresenceChannel | null;

	// Actions
	joinServer: (serverId: string) => void;
	leaveServer: () => void;
	trackVoice: (channelId: string) => void;
	untrackVoice: () => void;
	updateTrack: (updates: Partial<Pick<VoicePresencePayload, "isMuted" | "isDeafened" | "isSpeaking">>) => void;
	getChannelUsers: (channelId: string) => VoiceUser[];
	destroy: () => void;
}

// ── Helpers ────────────────────────────────────────────────

function parseVoicePresenceState(
	state: Record<string, unknown[]>,
): Record<string, VoiceUser[]> {
	const byChannel: Record<string, VoiceUser[]> = {};

	for (const presences of Object.values(state)) {
		for (const p of presences) {
			const presence = p as VoicePresencePayload;
			if (!presence.userId || !presence.channelId) continue;

			if (!byChannel[presence.channelId]) {
				byChannel[presence.channelId] = [];
			}

			byChannel[presence.channelId].push({
				id: presence.userId,
				username: presence.username,
				avatar: presence.avatar || "",
				isMuted: presence.isMuted ?? false,
				isDeafened: presence.isDeafened ?? false,
				isSpeaking: presence.isSpeaking ?? false,
			});
		}
	}

	return byChannel;
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

// Track the channelId we're currently broadcasting for
let trackedChannelId: string | null = null;

// ── Store ──────────────────────────────────────────────────

export const useVoicePresenceStore = create<VoicePresenceState>()(
	conditionalDevtools(
		(set, get) => ({
			voiceUsers: {},
			currentServerId: null,
			_channel: null,

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

				const supabase = createClient();
				const channel = supabase.channel(`voice:server:${serverId}`, {
					config: { presence: { key: user.userId } },
				});

				// Presence sync — rebuild voiceUsers from full state
				channel.on("presence", { event: "sync" }, () => {
					const presenceState = channel.presenceState();
					const voiceUsers = parseVoicePresenceState(
						presenceState as Record<string, unknown[]>,
					);
					set({ voiceUsers });
				});

				channel.subscribe();

				set({
					currentServerId: serverId,
					_channel: channel as unknown as VoicePresenceChannel,
					voiceUsers: {},
				});
			},

			leaveServer: () => {
				const { _channel } = get();

				if (_channel) {
					try {
						_channel.unsubscribe();
					} catch {
						// Channel may already be closed
					}
				}

				trackedChannelId = null;

				set({
					currentServerId: null,
					_channel: null,
					voiceUsers: {},
				});
			},

			trackVoice: (channelId) => {
				const { _channel } = get();
				const user = getCurrentUser();
				if (!_channel || !user) return;

				trackedChannelId = channelId;

				_channel.track({
					userId: user.userId,
					username: user.username,
					avatar: user.avatar,
					channelId,
					isMuted: false,
					isDeafened: false,
					isSpeaking: false,
				});
			},

			untrackVoice: () => {
				const { _channel } = get();
				if (!_channel) return;

				trackedChannelId = null;

				_channel.untrack();
			},

			updateTrack: (updates) => {
				const { _channel } = get();
				const user = getCurrentUser();
				if (!_channel || !user || !trackedChannelId) return;

				_channel.track({
					userId: user.userId,
					username: user.username,
					avatar: user.avatar,
					channelId: trackedChannelId,
					isMuted: updates.isMuted ?? false,
					isDeafened: updates.isDeafened ?? false,
					isSpeaking: updates.isSpeaking ?? false,
				});
			},

			getChannelUsers: (channelId) => {
				return get().voiceUsers[channelId] || [];
			},

			destroy: () => {
				const { _channel } = get();

				if (_channel) {
					try {
						_channel.unsubscribe();
					} catch {
						// Already closed
					}
				}

				trackedChannelId = null;

				set({
					voiceUsers: {},
					currentServerId: null,
					_channel: null,
				});
			},
		}),
		{ name: "VoicePresenceStore" },
	),
);
