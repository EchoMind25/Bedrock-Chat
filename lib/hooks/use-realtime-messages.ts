'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { loadChannelMessages } from '@/lib/supabase/queries';
import type { Message } from '@/lib/types/message';

interface DbMessage {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  type: string;
  reply_to: string | null;
  is_pinned: boolean;
  is_deleted: boolean;
  edited_at: string | null;
  created_at: string;
  user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  attachments?: Array<{
    id: string;
    filename: string;
    file_url: string;
    file_size: number;
    mime_type: string;
    width?: number;
    height?: number;
  }>;
  reactions?: Array<{
    id: string;
    user_id: string;
    emoji: string;
  }>;
}

function dbMessageToMessage(msg: DbMessage): Message {
  return {
    id: msg.id,
    content: msg.content,
    author: {
      id: msg.user?.id || msg.user_id,
      username: msg.user?.username || 'Unknown',
      displayName: msg.user?.display_name || 'Unknown',
      avatar: msg.user?.avatar_url || '',
      isBot: false,
    },
    timestamp: new Date(msg.created_at),
    editedAt: msg.edited_at ? new Date(msg.edited_at) : undefined,
    reactions: aggregateReactions(msg.reactions || []),
    attachments: (msg.attachments || []).map(a => ({
      id: a.id,
      filename: a.filename,
      url: a.file_url,
      contentType: a.mime_type,
      size: a.file_size,
      width: a.width,
      height: a.height,
    })),
    embeds: [],
    isPinned: msg.is_pinned,
    type: msg.type as Message['type'],
  };
}

function aggregateReactions(reactions: Array<{ user_id: string; emoji: string }>) {
  const emojiMap = new Map<string, { count: number; userIds: Set<string> }>();
  for (const r of reactions) {
    const existing = emojiMap.get(r.emoji);
    if (existing) {
      existing.count++;
      existing.userIds.add(r.user_id);
    } else {
      emojiMap.set(r.emoji, { count: 1, userIds: new Set([r.user_id]) });
    }
  }
  return Array.from(emojiMap.entries()).map(([emoji, data]) => ({
    emoji,
    count: data.count,
    hasReacted: false, // Will be updated based on current user
  }));
}

export function useRealtimeMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const fetchMessages = async () => {
      try {
        const data = await loadChannelMessages(channelId);
        if (mounted) {
          setMessages(data.map((msg: DbMessage) => dbMessageToMessage(msg)));
        }
      } catch (err) {
        console.error('Error loading messages:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
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
        (payload) => {
          setMessages((prev) => [...prev, dbMessageToMessage(payload.new as DbMessage)]);
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
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? dbMessageToMessage(payload.new as DbMessage) : msg
            )
          );
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
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  const sendMessage = async (content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('messages').insert({
      channel_id: channelId,
      user_id: user.id,
      content,
    });

    if (error) {
      console.error('Error sending message:', error);
    }
  };

  return { messages, loading, sendMessage };
}
