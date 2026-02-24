-- ============================================================================
-- Bedrock Chat - Fix Server Creation RLS Policy
-- Created: 2026-02-24
--
-- ISSUE:
-- When creating a private server, the INSERT succeeds but the RETURNING
-- clause (.select() in Supabase client) fails with 403 because the
-- servers_select policy requires the user to be a server_member, but
-- the membership row hasn't been inserted yet. This causes:
--   1. Server creation appears to fail (403 returned to client)
--   2. The server IS created in the DB, leaving an orphaned server
--   3. The server_members row is never inserted
--
-- FIX:
-- Add `auth.uid() = owner_id` to the servers_select policy so that
-- server owners can always see their own servers, even before the
-- server_members row is created.
-- ============================================================================

-- Drop and recreate the servers SELECT policy
DROP POLICY IF EXISTS servers_select ON servers;

CREATE POLICY servers_select ON servers
  FOR SELECT USING (
    -- Owner can always see their own servers
    auth.uid() = owner_id
    -- Public servers visible to everyone
    OR is_public = TRUE
    -- Discoverable servers visible to authenticated users
    OR (allow_discovery = TRUE AND auth.uid() IS NOT NULL)
    -- Members can see their servers
    OR public.is_server_member(id, auth.uid())
  );

COMMENT ON POLICY servers_select ON servers IS
  'Server owners, members, and public/discoverable viewers can see servers';
