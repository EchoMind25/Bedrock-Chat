-- ============================================================================
-- MIGRATION: Family System Completion
--
-- Adds the missing infrastructure to complete the parent/family system:
--   1. family_server_approvals  — server join approval queue
--   2. family_friend_approvals  — friend request approval queue
--   3. notifications            — in-app notification inbox
--   4. monitoring_level_override column on family_members
--   5. get_teen_monitoring_level() helper function
--   6. check_teen_server_approval() trigger (notify-after pattern)
--   7. Extends family_activity_log CHECK constraint with new action types
--   8. Enables Supabase Realtime on new tables
--
-- PRIVACY CRITICAL:
--   - family_server_approvals / family_friend_approvals are visible to the
--     teen whose record it is (they can see their own approval status)
--   - notifications are private to their recipient (user_id = auth.uid())
--   - The server join trigger uses AFTER INSERT (notify-after, not blocking)
-- ============================================================================

-- ============================================================================
-- 1. monitoring_level_override on family_members
--    Allows per-teen monitoring level that overrides the family default.
-- ============================================================================

ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS monitoring_level_override TEXT
  CHECK (monitoring_level_override IS NULL OR monitoring_level_override IN (
    'minimal', 'moderate', 'transparent', 'restricted'
  ));

-- ============================================================================
-- 2. TABLE: family_server_approvals
--    Created when a teen (at monitoring level 3+) attempts to join a server.
--    Parent must approve or deny before the teen is added to server_members.
-- ============================================================================

CREATE TABLE IF NOT EXISTS family_server_approvals (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id        UUID        NOT NULL REFERENCES family_accounts(id) ON DELETE CASCADE,
  teen_user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  server_id        UUID        NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  server_name      TEXT        NOT NULL,
  server_icon      TEXT,
  server_member_count INTEGER  NOT NULL DEFAULT 0,
  status           TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'denied')),
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ,
  resolved_by      UUID        REFERENCES profiles(id) ON DELETE SET NULL
);

-- One pending request per (family, teen, server) at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_server_approvals_pending_unique
  ON family_server_approvals (family_id, teen_user_id, server_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_server_approvals_family
  ON family_server_approvals (family_id, status);
CREATE INDEX IF NOT EXISTS idx_server_approvals_teen
  ON family_server_approvals (teen_user_id);

ALTER TABLE family_server_approvals ENABLE ROW LEVEL SECURITY;

-- Parents can manage approval rows for their family
CREATE POLICY server_approvals_parent_all ON family_server_approvals
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = family_server_approvals.family_id
        AND fm.user_id = auth.uid()
        AND fm.role = 'parent'
    )
  );

-- Teens can see their own approval rows (transparency)
CREATE POLICY server_approvals_teen_select ON family_server_approvals
  FOR SELECT TO authenticated
  USING (teen_user_id = auth.uid());

-- Super admins can see all
CREATE POLICY server_approvals_admin ON family_server_approvals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND platform_role = 'super_admin'
    )
  );

-- ============================================================================
-- 3. TABLE: family_friend_approvals
--    Created when a teen (at monitoring level 4) sends or receives a friend
--    request. Parent must approve or deny.
-- ============================================================================

CREATE TABLE IF NOT EXISTS family_friend_approvals (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id         UUID        NOT NULL REFERENCES family_accounts(id) ON DELETE CASCADE,
  teen_user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_username   TEXT        NOT NULL,
  friend_display_name TEXT      NOT NULL DEFAULT '',
  friend_avatar     TEXT,
  status            TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'denied')),
  requested_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at       TIMESTAMPTZ,
  resolved_by       UUID        REFERENCES profiles(id) ON DELETE SET NULL
);

-- One pending request per (family, teen, friend) at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_friend_approvals_pending_unique
  ON family_friend_approvals (family_id, teen_user_id, friend_user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_friend_approvals_family
  ON family_friend_approvals (family_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_approvals_teen
  ON family_friend_approvals (teen_user_id);

ALTER TABLE family_friend_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY friend_approvals_parent_all ON family_friend_approvals
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = family_friend_approvals.family_id
        AND fm.user_id = auth.uid()
        AND fm.role = 'parent'
    )
  );

CREATE POLICY friend_approvals_teen_select ON family_friend_approvals
  FOR SELECT TO authenticated
  USING (teen_user_id = auth.uid());

CREATE POLICY friend_approvals_admin ON family_friend_approvals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND platform_role = 'super_admin'
    )
  );

-- ============================================================================
-- 4. TABLE: notifications
--    In-app notification inbox. One row per notification per recipient.
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL CHECK (type IN (
    'server_approval_request',
    'server_approval_resolved',
    'friend_approval_request',
    'friend_approval_resolved',
    'monitoring_level_changed',
    'family_alert',
    'friend_request',
    'server_invite',
    'mention',
    'system'
  )),
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  data        JSONB       NOT NULL DEFAULT '{}',
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup for unread badge count
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications (user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own notifications
CREATE POLICY notifications_owner ON notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 5. FUNCTION: get_teen_monitoring_level(p_teen_id UUID)
--    Returns the effective monitoring level for a teen (per-teen override
--    takes precedence over family-wide level).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_teen_monitoring_level(p_teen_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(fm.monitoring_level_override, fa.monitoring_level::TEXT)
  FROM family_members fm
  JOIN family_accounts fa ON fa.id = fm.family_id
  WHERE fm.user_id = p_teen_id
    AND fm.role = 'child'
  LIMIT 1;
$$;

-- ============================================================================
-- 6. TRIGGER: check_teen_server_approval
--    After a teen joins a server (INSERT on server_members), if their
--    monitoring level is 3 (transparent) or 4 (restricted), record an
--    approval request so the parent can see it.
--
--    IMPORTANT: This is notify-after, NOT blocking. The teen is already in
--    the server when this fires. The approval row gives the parent visibility
--    and the ability to remove the teen if they deny.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_teen_server_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_account_type     TEXT;
  v_monitoring_level TEXT;
  v_family_id        UUID;
  v_server_name      TEXT;
  v_member_count     INTEGER;
BEGIN
  -- Only process teen accounts
  SELECT account_type INTO v_account_type
  FROM profiles WHERE id = NEW.user_id;

  IF v_account_type IS DISTINCT FROM 'teen' THEN
    RETURN NEW;
  END IF;

  -- Get effective monitoring level and family ID
  SELECT
    COALESCE(fm.monitoring_level_override, fa.monitoring_level::TEXT),
    fa.id
  INTO v_monitoring_level, v_family_id
  FROM family_members fm
  JOIN family_accounts fa ON fa.id = fm.family_id
  WHERE fm.user_id = NEW.user_id
    AND fm.role = 'child'
  LIMIT 1;

  -- Only create approval record at level 3 (transparent) or 4 (restricted)
  IF v_monitoring_level NOT IN ('transparent', 'restricted') THEN
    RETURN NEW;
  END IF;

  -- Get server info
  SELECT name, member_count
  INTO v_server_name, v_member_count
  FROM servers WHERE id = NEW.server_id;

  -- Insert approval row (ignore duplicate pending requests)
  INSERT INTO family_server_approvals
    (family_id, teen_user_id, server_id, server_name, server_member_count)
  VALUES
    (v_family_id, NEW.user_id, NEW.server_id,
     COALESCE(v_server_name, 'Unknown Server'),
     COALESCE(v_member_count, 0))
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Only create trigger if server_members table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'server_members'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_teen_server_join ON server_members;
    CREATE TRIGGER trigger_teen_server_join
      AFTER INSERT ON server_members
      FOR EACH ROW
      EXECUTE FUNCTION public.check_teen_server_approval();
  END IF;
END;
$$;

-- ============================================================================
-- 7. Extend family_activity_log CHECK constraint
--    Adds new action types: teen_removed, family_dissolved, account_converted
-- ============================================================================

ALTER TABLE family_activity_log
  DROP CONSTRAINT IF EXISTS family_activity_log_activity_type_check;

ALTER TABLE family_activity_log
  ADD CONSTRAINT family_activity_log_activity_type_check
  CHECK (activity_type IN (
    -- Existing types (from 20260213000000 + 20260216000000)
    'viewed_messages', 'viewed_friends', 'viewed_servers', 'viewed_flags',
    'changed_monitoring_level', 'approved_server', 'denied_server',
    'approved_friend', 'denied_friend',
    'added_keyword_alert', 'removed_keyword_alert',
    'changed_time_limit', 'blocked_category', 'unblocked_category',
    'viewed_voice_metadata', 'exported_activity_log',
    'changed_data_retention', 'restricted_server', 'unrestricted_server',
    'viewed_presence',
    -- New types
    'teen_removed', 'family_dissolved', 'account_converted'
  ));

-- ============================================================================
-- 8. Enable Supabase Realtime for new tables
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE family_server_approvals;
ALTER PUBLICATION supabase_realtime ADD TABLE family_friend_approvals;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
