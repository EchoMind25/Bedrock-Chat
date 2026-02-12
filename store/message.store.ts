import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { conditionalDevtools } from '@/lib/utils/devtools-config';
import type { Message } from '@/lib/types/message';
import { useAuthStore } from './auth.store';
import { createClient } from '@/lib/supabase/client';

interface MessageState {
	messages: Record<string, Message[]>; // channelId -> messages
	isLoading: boolean;
	typingUsers: Record<string, string[]>; // channelId -> usernames

	// Actions
	loadMessages: (channelId: string) => Promise<void>;
	sendMessage: (channelId: string, content: string) => void;
	addReaction: (channelId: string, messageId: string, emoji: string) => void;
	removeReaction: (channelId: string, messageId: string, emoji: string) => void;
	editMessage: (channelId: string, messageId: string, content: string) => void;
	deleteMessage: (channelId: string, messageId: string) => void;
	setTyping: (channelId: string, username: string) => void;
}

export const useMessageStore = create<MessageState>()(
	conditionalDevtools(
		(set, get) => ({
			messages: {},
			isLoading: false,
			typingUsers: {},

			loadMessages: async (channelId) => {
				if (get().messages[channelId]) return;

				set({ isLoading: true });

				try {
					const supabase = createClient();
					const { data, error } = await supabase
						.from('messages')
						.select(`
							*,
							user:profiles(id, username, display_name, avatar_url),
							attachments:message_attachments(*),
							reactions:message_reactions(*)
						`)
						.eq('channel_id', channelId)
						.eq('is_deleted', false)
						.order('created_at', { ascending: false })
						.limit(50);

					if (error) throw error;

					const messages: Message[] = (data || []).reverse().map((msg: Record<string, unknown>) => ({
						id: msg.id as string,
						content: msg.content as string,
						author: {
							id: (msg.user as Record<string, unknown>)?.id as string || msg.user_id as string,
							username: (msg.user as Record<string, unknown>)?.username as string || 'Unknown',
							displayName: (msg.user as Record<string, unknown>)?.display_name as string || 'Unknown',
							avatar: (msg.user as Record<string, unknown>)?.avatar_url as string || '',
							isBot: false,
						},
						timestamp: new Date(msg.created_at as string),
						editedAt: msg.edited_at ? new Date(msg.edited_at as string) : undefined,
						reactions: [],
						attachments: [],
						embeds: [],
						isPinned: msg.is_pinned as boolean,
						type: (msg.type as Message['type']) || 'default',
					}));

					set((state) => ({
						messages: { ...state.messages, [channelId]: messages },
						isLoading: false,
					}));
				} catch (err) {
					console.error('Error loading messages:', err);
					set((state) => ({
						messages: { ...state.messages, [channelId]: [] },
						isLoading: false,
					}));
				}
			},

			sendMessage: async (channelId, content) => {
				const user = useAuthStore.getState().user;
				if (!user || !content.trim()) return;

				try {
					const supabase = createClient();
					const { data, error } = await supabase.from('messages').insert({
						channel_id: channelId,
						user_id: user.id,
						content: content.trim(),
					}).select().single();

					if (error) throw error;

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
						type: 'default',
					};

					set((state) => ({
						messages: {
							...state.messages,
							[channelId]: [...(state.messages[channelId] || []), newMessage],
						},
					}));
				} catch (err) {
					console.error('Error sending message:', err);
				}
			},

			addReaction: (channelId, messageId, emoji) => {
				set((state) => ({
					messages: {
						...state.messages,
						[channelId]: state.messages[channelId]?.map(msg =>
							msg.id === messageId
								? {
										...msg,
										reactions: msg.reactions.some(r => r.emoji === emoji)
											? msg.reactions.map(r =>
													r.emoji === emoji
														? { ...r, count: r.count + 1, hasReacted: true }
														: r
												)
											: [...msg.reactions, { emoji, count: 1, hasReacted: true }],
									}
								: msg
						) || [],
					},
				}));
			},

			removeReaction: (channelId, messageId, emoji) => {
				set((state) => ({
					messages: {
						...state.messages,
						[channelId]: state.messages[channelId]?.map(msg =>
							msg.id === messageId
								? {
										...msg,
										reactions: msg.reactions
											.map(r =>
												r.emoji === emoji
													? { ...r, count: r.count - 1, hasReacted: false }
													: r
											)
											.filter(r => r.count > 0),
									}
								: msg
						) || [],
					},
				}));
			},

			editMessage: (channelId, messageId, content) => {
				set((state) => ({
					messages: {
						...state.messages,
						[channelId]: state.messages[channelId]?.map(msg =>
							msg.id === messageId
								? { ...msg, content, editedAt: new Date() }
								: msg
						) || [],
					},
				}));
			},

			deleteMessage: (channelId, messageId) => {
				set((state) => ({
					messages: {
						...state.messages,
						[channelId]: state.messages[channelId]?.filter(msg => msg.id !== messageId) || [],
					},
				}));
			},

			setTyping: (channelId, username) => {
				set((state) => {
					const current = state.typingUsers[channelId] || [];
					if (current.includes(username)) return state;

					setTimeout(() => {
						set((s) => ({
							typingUsers: {
								...s.typingUsers,
								[channelId]: (s.typingUsers[channelId] || []).filter(u => u !== username),
							},
						}));
					}, 3000);

					return {
						typingUsers: {
							...state.typingUsers,
							[channelId]: [...current, username],
						},
					};
				});
			},
		}),
		{ name: 'MessageStore' }
	)
);
