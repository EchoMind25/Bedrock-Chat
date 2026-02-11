import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { generateMockMessages } from '@/lib/mocks/messages';
import type { Message } from '@/lib/types/message';
import { useAuthStore } from './auth.store';
import { faker } from '@faker-js/faker';

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
				// Check if already loaded
				if (get().messages[channelId]) return;

				set({ isLoading: true });

				// Simulate network delay
				await new Promise(r => setTimeout(r, 300 + Math.random() * 500));

				const messages = generateMockMessages(100);

				set((state) => ({
					messages: { ...state.messages, [channelId]: messages },
					isLoading: false,
				}));
			},

			sendMessage: (channelId, content) => {
				const user = useAuthStore.getState().user;
				if (!user || !content.trim()) return;

				const newMessage: Message = {
					id: faker.string.uuid(),
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

					// Auto-remove after 3 seconds
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
