/**
 * Dev Mode Helpers
 * Utilities for development mode that bypass production constraints
 */

import { createClient } from './supabase/client';

/**
 * Ensures the current user is a member of all servers (dev mode only)
 * This bypasses the normal invitation flow for easier testing
 */
export async function ensureUserInAllServers(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.warn('[DevMode] ensureUserInAllServers called in production - skipping');
    return;
  }

  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('[DevMode] No authenticated user');
      return;
    }

    // Get all servers
    const { data: servers, error: serversError } = await supabase
      .from('servers')
      .select('id');

    if (serversError) {
      console.error('[DevMode] Error fetching servers:', serversError);
      return;
    }

    if (!servers || servers.length === 0) {
      console.log('[DevMode] No servers found');
      return;
    }

    // Check which servers the user is already a member of
    const { data: existingMemberships } = await supabase
      .from('server_members')
      .select('server_id')
      .eq('user_id', user.id);

    const existingServerIds = new Set(
      existingMemberships?.map(m => m.server_id) || []
    );

    // Add user to any servers they're not already in
    const newMemberships = servers
      .filter(server => !existingServerIds.has(server.id))
      .map(server => ({
        server_id: server.id,
        user_id: user.id,
        role: 'member' as const,
        joined_at: new Date().toISOString(),
      }));

    if (newMemberships.length > 0) {
      const { error: insertError } = await supabase
        .from('server_members')
        .insert(newMemberships);

      if (insertError) {
        console.error('[DevMode] Error adding user to servers:', insertError);
      } else {
        console.log(`[DevMode] Added user to ${newMemberships.length} servers`);
      }
    } else {
      console.log('[DevMode] User already member of all servers');
    }
  } catch (err) {
    console.error('[DevMode] ensureUserInAllServers failed:', err);
  }
}
