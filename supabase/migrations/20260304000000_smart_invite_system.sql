-- ============================================================================
-- Bedrock Chat - Smart Invite System
-- Created: 2026-03-04
-- Purpose: Extend server_invites for migration-based invite flow with role
--          mapping, usage tracking, and public invite previews.
--
-- PRIVACY NOTES:
-- - invite_uses tracks user_id only (already consented via account creation)
-- - click_count is aggregate only (no PII, no device fingerprints, no IPs)
-- - No tracking pixels, no cookies set by invite pages
-- - Right to erasure: deleting account cascades invite_uses rows
-- ============================================================================

-- ============================================================================
-- 1. ALTER server_invites: add smart invite columns
-- ============================================================================

ALTER TABLE server_invites
  ADD COLUMN IF NOT EXISTS mapped_role_id UUID REFERENCES server_roles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS label TEXT CHECK (char_length(label) <= 100),
  ADD COLUMN IF NOT EXISTS click_count INTEGER NOT NULL DEFAULT 0 CHECK (click_count >= 0),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS requires_family_account BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN server_invites.mapped_role_id IS 'Auto-assign this Bedrock role when user joins via this invite';
COMMENT ON COLUMN server_invites.label IS 'Human-readable label (e.g., "For Moderators", "General Access")';
COMMENT ON COLUMN server_invites.click_count IS 'Server-side aggregate click counter (no PII)';
COMMENT ON COLUMN server_invites.is_active IS 'Soft delete flag — false means deactivated';
COMMENT ON COLUMN server_invites.requires_family_account IS 'COPPA: require family account (parental consent) to redeem';

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_server_invites_active
  ON server_invites (server_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_server_invites_mapped_role
  ON server_invites (mapped_role_id) WHERE mapped_role_id IS NOT NULL;

-- ============================================================================
-- 2. CREATE invite_uses table
-- ============================================================================

CREATE TABLE invite_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID NOT NULL REFERENCES server_invites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- No IP logging, no device fingerprinting, no geolocation
  CONSTRAINT unique_invite_user UNIQUE (invite_id, user_id)
);

CREATE INDEX idx_invite_uses_invite ON invite_uses (invite_id);
CREATE INDEX idx_invite_uses_user ON invite_uses (user_id);
CREATE INDEX idx_invite_uses_joined_at ON invite_uses (joined_at);

COMMENT ON TABLE invite_uses IS 'Tracks which user joined via which invite. UNIQUE per invite+user. No PII beyond user_id.';

-- ============================================================================
-- 3. RLS for invite_uses
-- ============================================================================

ALTER TABLE invite_uses ENABLE ROW LEVEL SECURITY;

-- Users can see their own invite usage
CREATE POLICY invite_uses_select_own ON invite_uses
  FOR SELECT USING (user_id = auth.uid());

-- Server admins can see all uses for their server's invites
CREATE POLICY invite_uses_select_admin ON invite_uses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM server_invites si
      JOIN server_members sm ON sm.server_id = si.server_id
      WHERE si.id = invite_uses.invite_id
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin')
    )
  );

-- Users can insert their own usage record
CREATE POLICY invite_uses_insert ON invite_uses
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 4. ADD UPDATE policy for server_invites
-- (needed for click_count increment, is_active toggle, uses increment)
-- ============================================================================

CREATE POLICY server_invites_update ON server_invites
  FOR UPDATE USING (
    auth.uid() = inviter_id
    OR EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = server_invites.server_id
      AND server_members.user_id = auth.uid()
      AND server_members.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 5. Update audit_log CHECK constraint
-- Drop and recreate to include invite_deactivate and other new actions
-- ============================================================================

ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_action_check;
ALTER TABLE audit_log ADD CONSTRAINT audit_log_action_check CHECK (action IN (
  'server_update', 'server_create', 'server_delete',
  'channel_create', 'channel_update', 'channel_delete',
  'role_create', 'role_update', 'role_delete',
  'member_kick', 'member_ban', 'member_unban', 'member_role_update',
  'invite_create', 'invite_delete', 'invite_deactivate',
  'message_pin', 'message_delete', 'message_unpin',
  'emoji_create', 'emoji_delete',
  'sticker_create', 'sticker_delete',
  'sound_create', 'sound_delete',
  'event_create', 'event_update', 'event_cancel',
  'webhook_create', 'webhook_update', 'webhook_delete',
  'bot_create', 'bot_update', 'bot_delete',
  'theme_update', 'welcome_screen_update', 'template_create'
));
