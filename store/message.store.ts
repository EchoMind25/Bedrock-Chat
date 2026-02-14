import { create } from 'zustand';
import { conditionalDevtools } from '@/lib/utils/devtools-config';
import type { Message } from '@/lib/types/message';
import { useAuthStore } from './auth.store';
import { createClient } from '@/lib/supabase/client';

interface MessageState {
  messages: Record<string, Message[]>; // channelId -> messages
  loadingChannels: Record<string, boolean>; // channelId -> loading state (per-channel, not global)
  typingUsers: Record<string, string[]>; // channelId -> usernames
  subscriptions: Record<string, () => void>; // channelId -> cleanup function

  // Actions
  loadMessages: (channelId: string) => Promise<void>;
  subscribeToChannel: (channelId: string) => void;
  unsubscribeFromChannel: (channelId: string) => void;
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
      loadingChannels: {},
      typingUsers: {},
      subscriptions: {},

      subscribeToChannel: (channelId) => {
        // Don't subscribe twice
        if (get().subscriptions[channelId]) {
          console.log('[MessageStore] Already subscribed to channel:', channelId);
          return;
        }

        console.log('[MessageStore] Subscribing to channel:', channelId);
        const supabase = createClient();
        const channel = supabase
          .channel(`messages:${channelId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `channel_id=eq.${channelId}`,
            },
            async (payload) => {
              // Fetch full message data with user profile
              const { data: messageData } = await supabase
                .from('messages')
                .select(`
                  *,
                  user:profiles(id, username, display_name, avatar_url)
                `)
                .eq('id', payload.new.id)
                .single();

              if (!messageData) return;

              const newMessage: Message = {
                id: messageData.id as string,
                content: messageData.content as string,
                author: {
                  id: (messageData.user as Record<string, unknown>)?.id as string || messageData.user_id as string,
                  username: (messageData.user as Record<string, unknown>)?.username as string || 'Unknown',
                  displayName: (messageData.user as Record<string, unknown>)?.display_name as string || 'Unknown',
                  avatar: (messageData.user as Record<string, unknown>)?.avatar_url as string || '',
                  isBot: false,
                },
                timestamp: new Date(messageData.created_at as string),
                reactions: [],
                attachments: [],
                embeds: [],
                isPinned: messageData.is_pinned as boolean,
                type: (messageData.type as Message['type']) || 'default',
              };

              // Only add if it's not from current user (optimistic update already added it)
              const currentUserId = useAuthStore.getState().user?.id;
              if (messageData.user_id !== currentUserId) {
                set((state) => ({
                  messages: {
                    ...state.messages,
                    [channelId]: [...(state.messages[channelId] || []), newMessage],
                  },
                }));
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'messages',
              filter: `channel_id=eq.${channelId}`,
            },
            (payload) => {
              set((state) => ({
                messages: {
                  ...state.messages,
                  [channelId]: state.messages[channelId]?.map((msg) =>
                    msg.id === payload.new.id
                      ? {
                          ...msg,
                          content: payload.new.content as string,
                          editedAt: payload.new.edited_at ? new Date(payload.new.edited_at as string) : undefined,
                        }
                      : msg
                  ) || [],
                },
              }));
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'messages',
              filter: `channel_id=eq.${channelId}`,
            },
            (payload) => {
              set((state) => ({
                messages: {
                  ...state.messages,
                  [channelId]: state.messages[channelId]?.filter((msg) => msg.id !== payload.old.id) || [],
                },
              }));
            }
          )
          .subscribe();

        // Store cleanup function
        set((state) => ({
          subscriptions: {
            ...state.subscriptions,
            [channelId]: () => {
              channel.unsubscribe();
            },
          },
        }));
      },

      unsubscribeFromChannel: (channelId) => {
        const cleanup = get().subscriptions[channelId];
        if (cleanup) {
          cleanup();
          set((state) => {
            const { [channelId]: _, ...rest } = state.subscriptions;
            return { subscriptions: rest };
          });
        }
      },

      loadMessages: async (channelId) => {
        // Check if already loading or already loaded
        const state = get();
        if (state.messages[channelId] !== undefined) {
          console.log('[MessageStore] Messages already loaded for channel:', channelId);
          return;
        }
        if (state.loadingChannels[channelId]) {
          console.log('[MessageStore] Already loading messages for channel:', channelId);
          return;
        }

        console.log('[MessageStore] Loading messages for channel:', channelId);

        // Mark this channel as loading (per-channel, not global)
        set((prev) => ({
          loadingChannels: { ...prev.loadingChannels, [channelId]: true },
        }));

        try {
          const supabase = createClient();
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Message load timed out')), 10000)
          );
          const { data, error } = await Promise.race([
            supabase
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
              .limit(50),
            timeout,
          ]);

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

          set((prev) => ({
            messages: { ...prev.messages, [channelId]: messages },
            loadingChannels: { ...prev.loadingChannels, [channelId]: false },
          }));
        } catch (err) {
          console.error('Error loading messages:', err);
          set((prev) => ({
            messages: { ...prev.messages, [channelId]: [] },
            loadingChannels: { ...prev.loadingChannels, [channelId]: false },
          }));
        }
      },

      sendMessage: async (channelId, content) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          console.error('[MessageStore] No user found');
          return;
        }
        if (!content.trim()) {
          console.warn('[MessageStore] Empty message content');
          return;
        }

        console.log('[MessageStore] Sending message:', { channelId, content: content.trim(), userId: user.id });

        try {
          const supabase = createClient();
          const { data, error } = await supabase.from('messages').insert({
            channel_id: channelId,
            user_id: user.id,
            content: content.trim(),
          }).select().single();

          if (error) {
            console.error('[MessageStore] Supabase error:', error);
            throw error;
          }

          console.log('[MessageStore] Message inserted into DB:', data);

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

          console.log('[MessageStore] Adding message optimistically to state');
          set((state) => ({
            messages: {
              ...state.messages,
              [channelId]: [...(state.messages[channelId] || []), newMessage],
            },
          }));
          console.log('[MessageStore] Message added to state successfully');
        } catch (err) {
          console.error('[MessageStore] Error sending message:', err);
        }
      },

      addReaction: async (channelId, messageId, emoji) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        try {
          const supabase = createClient();
          await supabase.from('message_reactions').insert({
            message_id: messageId, user_id: user.id, emoji,
          });
        } catch { /* ignore duplicate */ }

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

      removeReaction: async (channelId, messageId, emoji) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        try {
          const supabase = createClient();
          await supabase.from('message_reactions').delete()
            .eq('message_id', messageId).eq('user_id', user.id).eq('emoji', emoji);
        } catch { /* ignore */ }

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

      editMessage: async (channelId, messageId, content) => {
        try {
          const supabase = createClient();
          await supabase.from('messages')
            .update({ content, edited_at: new Date().toISOString() })
            .eq('id', messageId);
        } catch (err) {
          console.error('Error editing message:', err);
          return;
        }

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

      deleteMessage: async (channelId, messageId) => {
        try {
          const supabase = createClient();
          await supabase.from('messages')
            .update({ is_deleted: true })
            .eq('id', messageId);
        } catch (err) {
          console.error('Error deleting message:', err);
          return;
        }

        set((state) => ({
          messages: {
            ...state.messages,
            [channelId]: state.messages[channelId]?.filter(msg => msg.id !== messageId) || [],
          },
        }));
      },

      setTyping: (channelId, username) => {
        const current = get().typingUsers[channelId] || [];
        if (current.includes(username)) return;

        set((state) => ({
          typingUsers: {
            ...state.typingUsers,
            [channelId]: [...(state.typingUsers[channelId] || []), username],
          },
        }));

        setTimeout(() => {
          set((s) => ({
            typingUsers: {
              ...s.typingUsers,
              [channelId]: (s.typingUsers[channelId] || []).filter(u => u !== username),
            },
          }));
        }, 3000);
      },
    }),
    { name: 'MessageStore' }
  )
);
