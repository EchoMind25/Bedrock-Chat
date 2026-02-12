-- ============================================================================
-- Bedrock Chat - Server Discovery & Join Requests
-- Created: 2026-02-12
--
-- Adds privacy-first server discovery controls and a join request system
-- for private servers that opt into discoverability.
--
-- PRIVACY NOTES:
-- - Servers are hidden by default (allow_discovery = FALSE)
-- - Server owners control all discoverability settings
-- - Join requests only expose the requesting user's profile
-- - CASCADE deletes maintain GDPR right to deletion
-- ============================================================================

-- ============================================================================
-- ALTER TABLE: servers - add discovery columns
-- ============================================================================

ALTER TABLE servers
  ADD COLUMN allow_discovery BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN require_approval BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN category TEXT CHECK (category IS NULL OR category IN (
    'general', 'gaming', 'education', 'technology', 'creative', 'community', 'other'
  )),
  ADD COLUMN tags TEXT[],
  ADD COLUMN rules TEXT CHECK (rules IS NULL OR char_length(rules) <= 4000),
  ADD COLUMN welcome_message TEXT CHECK (welcome_message IS NULL OR char_length(welcome_message) <= 2000),
  ADD COLUMN max_members INTEGER NOT NULL DEFAULT 1000 CHECK (max_members > 0);

-- Index for discovery queries
CREATE INDEX idx_servers_discovery ON servers (allow_discovery) WHERE allow_discovery = TRUE;
CREATE INDEX idx_servers_category ON servers (category) WHERE category IS NOT NULL;
CREATE INDEX idx_servers_tags ON servers USING GIN (tags) WHERE tags IS NOT NULL;

-- ============================================================================
-- TABLE: server_join_requests
-- ============================================================================

CREATE TABLE server_join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT CHECK (message IS NULL OR char_length(message) <= 500),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  CONSTRAINT unique_join_request UNIQUE (server_id, user_id)
);

CREATE INDEX idx_join_requests_server ON server_join_requests (server_id, status);
CREATE INDEX idx_join_requests_user ON server_join_requests (user_id);
CREATE INDEX idx_join_requests_pending ON server_join_requests (server_id) WHERE status = 'pending';

-- ============================================================================
-- RLS POLICIES: server_join_requests
-- ============================================================================

ALTER TABLE server_join_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY join_requests_select_own ON server_join_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Server owner/admin/moderator can view requests for their servers
CREATE POLICY join_requests_select_admins ON server_join_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = server_join_requests.server_id
      AND server_members.user_id = auth.uid()
      AND server_members.role IN ('owner', 'admin', 'moderator')
    )
  );

-- Authenticated users can create join requests for themselves
CREATE POLICY join_requests_insert ON server_join_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Server owner/admin/moderator can update request status
CREATE POLICY join_requests_update ON server_join_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = server_join_requests.server_id
      AND server_members.user_id = auth.uid()
      AND server_members.role IN ('owner', 'admin', 'moderator')
    )
  );

-- Users can delete their own pending requests
CREATE POLICY join_requests_delete ON server_join_requests
  FOR DELETE USING (auth.uid() = user_id AND status = 'pending');

-- ============================================================================
-- UPDATE RLS: servers SELECT - allow viewing discoverable servers
-- ============================================================================

-- Drop existing policy and recreate with discovery support
DROP POLICY IF EXISTS servers_select ON servers;

CREATE POLICY servers_select ON servers
  FOR SELECT USING (
    -- Public servers visible to all
    is_public = TRUE
    -- Discoverable private servers visible to all authenticated users
    OR (allow_discovery = TRUE AND auth.uid() IS NOT NULL)
    -- Members can always see their servers
    OR EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = servers.id
      AND server_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- REALTIME
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE server_join_requests;

-- ============================================================================
-- Update server_invites: allow non-members to read valid invites (for joining)
-- ============================================================================

-- Allow any authenticated user to look up an invite by code
CREATE POLICY server_invites_select_by_code ON server_invites
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow incrementing uses when joining
CREATE POLICY server_invites_update_uses ON server_invites
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
