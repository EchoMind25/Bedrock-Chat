import { createClient } from './client';

export async function loadUserServers(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('server_members')
    .select(`
      server:servers(
        id,
        name,
        description,
        icon_url,
        banner_url,
        owner_id,
        member_count,
        is_public,
        invite_code,
        created_at
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return data?.map(item => item.server) || [];
}

export async function loadServerChannels(serverId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('server_id', serverId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function loadServerCategories(serverId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('channel_categories')
    .select('*')
    .eq('server_id', serverId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function loadUserFriends(userId: string) {
  const supabase = createClient();

  // Friends where user is user1
  const { data: friends1, error: err1 } = await supabase
    .from('friendships')
    .select(`
      id,
      created_at,
      friend:profiles!friendships_user2_id_fkey(
        id,
        username,
        display_name,
        avatar_url,
        status
      )
    `)
    .eq('user1_id', userId);

  // Friends where user is user2
  const { data: friends2, error: err2 } = await supabase
    .from('friendships')
    .select(`
      id,
      created_at,
      friend:profiles!friendships_user1_id_fkey(
        id,
        username,
        display_name,
        avatar_url,
        status
      )
    `)
    .eq('user2_id', userId);

  if (err1) throw err1;
  if (err2) throw err2;

  return [
    ...(friends1?.map(item => item.friend) || []),
    ...(friends2?.map(item => item.friend) || []),
  ];
}

export async function loadFriendRequests(userId: string) {
  const supabase = createClient();

  const { data: incoming, error: err1 } = await supabase
    .from('friend_requests')
    .select(`
      id,
      message,
      created_at,
      sender:profiles!friend_requests_sender_id_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('receiver_id', userId)
    .eq('status', 'pending');

  const { data: outgoing, error: err2 } = await supabase
    .from('friend_requests')
    .select(`
      id,
      message,
      created_at,
      receiver:profiles!friend_requests_receiver_id_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('sender_id', userId)
    .eq('status', 'pending');

  if (err1) throw err1;
  if (err2) throw err2;

  return { incoming: incoming || [], outgoing: outgoing || [] };
}

export async function loadDirectMessages(userId: string) {
  const supabase = createClient();

  // Get recent DM conversations
  const { data: sentDMs, error: err1 } = await supabase
    .from('direct_messages')
    .select(`
      id,
      content,
      created_at,
      read_at,
      receiver:profiles!direct_messages_receiver_id_fkey(
        id,
        username,
        display_name,
        avatar_url,
        status
      )
    `)
    .eq('sender_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: receivedDMs, error: err2 } = await supabase
    .from('direct_messages')
    .select(`
      id,
      content,
      created_at,
      read_at,
      sender:profiles!direct_messages_sender_id_fkey(
        id,
        username,
        display_name,
        avatar_url,
        status
      )
    `)
    .eq('receiver_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (err1) throw err1;
  if (err2) throw err2;

  return { sent: sentDMs || [], received: receivedDMs || [] };
}

export async function loadChannelMessages(channelId: string, limit = 50) {
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
    .limit(limit);

  if (error) throw error;
  return (data || []).reverse();
}
