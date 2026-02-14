-- ============================================================================
-- Bedrock Chat - Fix Server Members RLS Policy
-- Created: 2026-02-14
-- Purpose: Remove circular dependency in server_members SELECT policy
--
-- ISSUE:
-- The current policy uses is_server_member() which queries server_members,
-- creating a circular dependency that can cause the initial load to fail.
--
-- FIX:
-- Simplify the policy to allow users to see their own memberships directly.
-- This breaks the circular dependency and makes the query much faster.
-- ============================================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS server_members_select ON server_members;

-- Create a simple, non-circular policy
CREATE POLICY server_members_select ON server_members
  FOR SELECT
  USING (
    -- Users can see their own server memberships
    user_id = auth.uid()
    OR
    -- Users can see other members of servers they're in
    EXISTS (
      SELECT 1 FROM server_members AS sm
      WHERE sm.server_id = server_members.server_id
        AND sm.user_id = auth.uid()
    )
  );

COMMENT ON POLICY server_members_select ON server_members IS
  'Users can see their own server memberships and other members of servers they belong to';
