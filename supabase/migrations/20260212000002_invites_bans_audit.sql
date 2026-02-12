-- ============================================================================
-- Bedrock Chat - Add server_invites, server_bans, audit_log tables
-- Created: 2026-02-12
--
-- These tables back the server management features (invites, moderation,
-- audit logging) which were previously in-memory only.
-- ============================================================================

-- ============================================================================
-- TABLE: server_invites
-- ============================================================================

CREATE TABLE server_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL DEFAULT encode(gen_random_bytes(4), 'hex'),
  max_uses INTEGER NOT NULL DEFAULT 0, -- 0 = unlimited
  uses INTEGER NOT NULL DEFAULT 0 CHECK (uses >= 0),
  expires_at TIMESTAMPTZ,
  is_temporary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT invite_uses_check CHECK (max_uses = 0 OR uses <= max_uses)
);

CREATE UNIQUE INDEX idx_server_invites_code ON server_invites (code);
CREATE INDEX idx_server_invites_server ON server_invites (server_id);
CREATE INDEX idx_server_invites_inviter ON server_invites (inviter_id);

-- ============================================================================
-- TABLE: server_bans
-- ============================================================================

CREATE TABLE server_bans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT CHECK (char_length(reason) <= 500),
  banned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_server_ban UNIQUE (server_id, user_id)
);

CREATE INDEX idx_server_bans_server ON server_bans (server_id);
CREATE INDEX idx_server_bans_user ON server_bans (user_id);

-- ============================================================================
-- TABLE: audit_log
-- ============================================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'server_update', 'channel_create', 'channel_update', 'channel_delete',
    'role_create', 'role_update', 'role_delete',
    'member_kick', 'member_ban', 'member_unban', 'member_role_update',
    'invite_create', 'invite_delete',
    'message_pin', 'message_delete',
    'server_create'
  )),
  target_id TEXT,
  target_name TEXT,
  target_type TEXT CHECK (target_type IS NULL OR target_type IN ('channel', 'role', 'user', 'invite', 'server', 'message')),
  changes JSONB,
  reason TEXT CHECK (char_length(reason) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_server ON audit_log (server_id, created_at DESC);
CREATE INDEX idx_audit_log_actor ON audit_log (actor_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE server_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- server_invites: members can view, owner/admin can manage
CREATE POLICY server_invites_select ON server_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = server_invites.server_id
      AND server_members.user_id = auth.uid()
    )
  );

CREATE POLICY server_invites_insert ON server_invites
  FOR INSERT WITH CHECK (
    auth.uid() = inviter_id
    AND EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = server_invites.server_id
      AND server_members.user_id = auth.uid()
    )
  );

CREATE POLICY server_invites_delete ON server_invites
  FOR DELETE USING (
    auth.uid() = inviter_id
    OR EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = server_invites.server_id
      AND server_members.user_id = auth.uid()
      AND server_members.role IN ('owner', 'admin')
    )
  );

-- server_bans: members can view, owner/admin can manage
CREATE POLICY server_bans_select ON server_bans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = server_bans.server_id
      AND server_members.user_id = auth.uid()
    )
  );

CREATE POLICY server_bans_insert ON server_bans
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = server_bans.server_id
      AND server_members.user_id = auth.uid()
      AND server_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY server_bans_delete ON server_bans
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = server_bans.server_id
      AND server_members.user_id = auth.uid()
      AND server_members.role IN ('owner', 'admin')
    )
  );

-- audit_log: members can view, server members can insert (via actions)
CREATE POLICY audit_log_select ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = audit_log.server_id
      AND server_members.user_id = auth.uid()
    )
  );

CREATE POLICY audit_log_insert ON audit_log
  FOR INSERT WITH CHECK (
    auth.uid() = actor_id
    AND EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = audit_log.server_id
      AND server_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Also add missing INSERT policy for friendships (needed when accepting)
-- and INSERT policy for family_members
-- ============================================================================

CREATE POLICY friendships_insert ON friendships
  FOR INSERT WITH CHECK (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

CREATE POLICY family_members_insert ON family_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_accounts
      WHERE family_accounts.id = family_members.family_id
      AND family_accounts.created_by = auth.uid()
    )
    OR family_members.user_id = auth.uid()
  );

CREATE POLICY family_members_delete ON family_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM family_members AS fm
      WHERE fm.family_id = family_members.family_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'parent'
    )
  );

-- ============================================================================
-- Add blocked_users insert needs to also remove friendship
-- This is handled client-side, but we need an update policy for server_members
-- ============================================================================

CREATE POLICY server_members_update ON server_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM server_members AS sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );
