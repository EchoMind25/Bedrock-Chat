-- ============================================================================
-- MIGRATION: Platform Roles & Developer Portal
-- Generated: 2026-02-26
-- Description: Adds platform-wide role system with GDPR/COPPA-compliant
--   audit logging and developer bot registration infrastructure.
--
--   Tables added:
--   - platform_permissions (granular per-user permission booleans)
--   - platform_role_audit_log (GDPR Art. 5(1)(f) compliant audit trail)
--   - bot_applications (developer-registered bots for platform approval)
--
--   Columns added to profiles:
--   - platform_role (enum: user/developer/moderator/admin/super_admin)
--   - platform_role_granted_by (UUID of granting admin)
--   - platform_role_granted_at (timestamp of grant)
--
-- PRIVACY CRITICAL:
-- - platform_role defaults to 'user' — no auto-upgrades
-- - All privileged writes go through service role in server-side API routes
-- - Audit log records every role change and PII access
-- - COPPA: target_is_minor flag on audit entries for under-18 targets
-- - platform_permissions RLS blocks client-side writes entirely
-- ============================================================================

-- ============================================
-- STEP 1: Platform role enum
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_role') THEN
    CREATE TYPE platform_role AS ENUM (
      'user',         -- Default. No elevated access.
      'developer',    -- Can register bots, access developer portal
      'moderator',    -- Can review reports, moderate content
      'admin',        -- Can manage users, servers, bots
      'super_admin'   -- Full platform access
    );
  END IF;
END
$$;

-- ============================================
-- STEP 2: Add platform_role to profiles
-- ============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS platform_role platform_role NOT NULL DEFAULT 'user';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS platform_role_granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS platform_role_granted_at TIMESTAMPTZ;

-- Index for fast role checks (filtered — most users are 'user')
CREATE INDEX IF NOT EXISTS idx_profiles_platform_role
  ON profiles(platform_role)
  WHERE platform_role != 'user';

-- ============================================
-- STEP 3: Granular permissions table
-- ============================================

CREATE TABLE IF NOT EXISTS platform_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Developer permissions
  can_register_bots BOOLEAN NOT NULL DEFAULT false,
  can_publish_bots BOOLEAN NOT NULL DEFAULT false,
  can_view_bot_analytics BOOLEAN NOT NULL DEFAULT false,

  -- Moderation permissions
  can_review_reports BOOLEAN NOT NULL DEFAULT false,
  can_moderate_content BOOLEAN NOT NULL DEFAULT false,
  can_ban_users BOOLEAN NOT NULL DEFAULT false,
  can_view_flagged_messages BOOLEAN NOT NULL DEFAULT false,

  -- Admin permissions
  can_manage_servers BOOLEAN NOT NULL DEFAULT false,
  can_manage_users BOOLEAN NOT NULL DEFAULT false,
  can_view_user_pii BOOLEAN NOT NULL DEFAULT false,
  can_manage_bots BOOLEAN NOT NULL DEFAULT false,
  can_view_platform_analytics BOOLEAN NOT NULL DEFAULT false,

  -- Super admin only
  can_grant_roles BOOLEAN NOT NULL DEFAULT false,
  can_manage_admins BOOLEAN NOT NULL DEFAULT false,
  can_access_audit_logs BOOLEAN NOT NULL DEFAULT false,
  can_modify_platform_settings BOOLEAN NOT NULL DEFAULT false,

  granted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_platform_permissions_user UNIQUE(user_id)
);

-- ============================================
-- STEP 4: Audit log — GDPR compliance
-- ============================================

CREATE TABLE IF NOT EXISTS platform_role_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who did the action
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_role platform_role NOT NULL,

  -- What they did
  action TEXT NOT NULL,

  -- What they did it to (nullable — some actions have no target)
  target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_server_id UUID REFERENCES servers(id) ON DELETE SET NULL,
  target_bot_id UUID,
  target_report_id UUID,

  -- Context
  metadata JSONB NOT NULL DEFAULT '{}',
  ip_address INET,

  -- COPPA flag
  target_is_minor BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor
  ON platform_role_audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target
  ON platform_role_audit_log(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action
  ON platform_role_audit_log(action, created_at DESC);

-- ============================================
-- STEP 5: Bot applications table
-- ============================================

CREATE TABLE IF NOT EXISTS bot_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  avatar_url TEXT,
  webhook_url TEXT,
  webhook_secret TEXT DEFAULT encode(gen_random_bytes(32), 'hex'),
  webhook_verified BOOLEAN NOT NULL DEFAULT false,
  bot_type TEXT NOT NULL DEFAULT 'custom' CHECK (bot_type IN ('custom', 'claude', 'webhook')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  scopes TEXT[] DEFAULT '{}',
  privacy_policy_url TEXT,
  dpa_accepted_at TIMESTAMPTZ,
  dpa_version TEXT,
  install_count INTEGER NOT NULL DEFAULT 0,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT CHECK (char_length(review_notes) <= 1000),
  is_teen_safe BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_applications_owner
  ON bot_applications(owner_id);
CREATE INDEX IF NOT EXISTS idx_bot_applications_status
  ON bot_applications(status)
  WHERE status = 'pending';

-- ============================================
-- STEP 6: RLS Policies
-- ============================================

ALTER TABLE platform_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_role_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_applications ENABLE ROW LEVEL SECURITY;

-- platform_permissions: users can read their own row only
CREATE POLICY "Users read own permissions"
  ON platform_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- No client INSERT/UPDATE/DELETE policies — only service role can write

-- platform_role_audit_log: no client-side read policies
-- All reads go through service role in server-side API routes

-- bot_applications: owners can read their own rows
CREATE POLICY "Owners read own bot applications"
  ON bot_applications FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- No client INSERT/UPDATE/DELETE — service role handles writes via API

-- ============================================
-- STEP 7: Helper functions
-- ============================================

CREATE OR REPLACE FUNCTION get_platform_role(p_user_id UUID)
RETURNS platform_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT platform_role FROM profiles WHERE id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION is_platform_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND platform_role IN ('moderator', 'admin', 'super_admin')
  );
$$;

-- ============================================
-- STEP 8: Triggers
-- ============================================

CREATE TRIGGER trigger_platform_permissions_updated_at
  BEFORE UPDATE ON platform_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_bot_applications_updated_at
  BEFORE UPDATE ON bot_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- STEP 9: Seed super_admin (run manually)
-- ============================================

-- Replace <YOUR_USER_ID> with your actual profile UUID:
--
-- UPDATE profiles
--   SET platform_role = 'super_admin',
--       platform_role_granted_by = id,
--       platform_role_granted_at = NOW()
--   WHERE id = '<YOUR_USER_ID>';
--
-- INSERT INTO platform_permissions (
--   user_id, can_register_bots, can_publish_bots, can_view_bot_analytics,
--   can_review_reports, can_moderate_content, can_ban_users, can_view_flagged_messages,
--   can_manage_servers, can_manage_users, can_view_user_pii, can_manage_bots,
--   can_view_platform_analytics, can_grant_roles, can_manage_admins,
--   can_access_audit_logs, can_modify_platform_settings, granted_by
-- ) VALUES (
--   '<YOUR_USER_ID>', true, true, true, true, true, true, true,
--   true, true, true, true, true, true, true, true, true, '<YOUR_USER_ID>'
-- );
