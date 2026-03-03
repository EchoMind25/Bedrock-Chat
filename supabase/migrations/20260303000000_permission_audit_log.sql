-- ============================================================================
-- Bedrock Chat - Permission Audit Log
-- Created: 2026-03-03
-- Purpose: GDPR Art. 30 compliance — Record of processing activities for
--          all permission changes. Provides transparency for teens and
--          accountability for server admins.
--
-- RETENTION: 90 days (GDPR data minimization)
-- ============================================================================

-- ============================================================================
-- TABLE: permission_audit_log
-- Records every permission change for compliance and transparency
-- ============================================================================

CREATE TABLE IF NOT EXISTS permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'role_created',
    'role_updated',
    'role_deleted',
    'role_assigned',
    'role_removed',
    'override_set',
    'override_removed',
    'member_permissions_changed'
  )),
  target_type TEXT NOT NULL CHECK (target_type IN ('role', 'channel_override', 'category_override', 'member')),
  target_id UUID NOT NULL,
  changes JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_perm_audit_server ON permission_audit_log(server_id);
CREATE INDEX idx_perm_audit_server_time ON permission_audit_log(server_id, created_at DESC);
CREATE INDEX idx_perm_audit_target ON permission_audit_log(target_type, target_id);
CREATE INDEX idx_perm_audit_changed_by ON permission_audit_log(changed_by);

-- Retention: auto-delete entries older than 90 days (GDPR data minimization)
-- This uses pg_cron if available, or can be triggered by application-level cleanup
CREATE OR REPLACE FUNCTION cleanup_permission_audit_log()
RETURNS void AS $$
BEGIN
  DELETE FROM permission_audit_log
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE permission_audit_log IS 'GDPR Art. 30 - Record of processing activities for permission changes. 90-day retention.';
COMMENT ON COLUMN permission_audit_log.changes IS 'JSON: { before: {...}, after: {...} } for diffing';
COMMENT ON COLUMN permission_audit_log.action IS 'Type of permission change: role_created, role_updated, role_deleted, role_assigned, role_removed, override_set, override_removed, member_permissions_changed';

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE permission_audit_log ENABLE ROW LEVEL SECURITY;

-- Server members can read audit log (transparency principle)
CREATE POLICY "Server members can read permission audit log"
  ON permission_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id = permission_audit_log.server_id
        AND sm.user_id = auth.uid()
    )
  );

-- Only server owner/admins can write audit entries
-- (in practice, entries are created by triggers or server-side functions)
CREATE POLICY "Server admins can insert permission audit log"
  ON permission_audit_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id = permission_audit_log.server_id
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- TRIGGERS: Auto-log permission changes
-- ============================================================================

-- Log role changes
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO permission_audit_log (server_id, changed_by, action, target_type, target_id, changes)
    VALUES (
      NEW.server_id,
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
      'role_created',
      'role',
      NEW.id,
      jsonb_build_object('after', jsonb_build_object(
        'name', NEW.name,
        'permissions', NEW.permissions,
        'position', NEW.position,
        'color', NEW.color
      ))
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if permissions or name actually changed
    IF OLD.permissions IS DISTINCT FROM NEW.permissions
       OR OLD.name IS DISTINCT FROM NEW.name
       OR OLD.position IS DISTINCT FROM NEW.position THEN
      INSERT INTO permission_audit_log (server_id, changed_by, action, target_type, target_id, changes)
      VALUES (
        NEW.server_id,
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
        'role_updated',
        'role',
        NEW.id,
        jsonb_build_object(
          'before', jsonb_build_object(
            'name', OLD.name,
            'permissions', OLD.permissions,
            'position', OLD.position
          ),
          'after', jsonb_build_object(
            'name', NEW.name,
            'permissions', NEW.permissions,
            'position', NEW.position
          )
        )
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO permission_audit_log (server_id, changed_by, action, target_type, target_id, changes)
    VALUES (
      OLD.server_id,
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
      'role_deleted',
      'role',
      OLD.id,
      jsonb_build_object('before', jsonb_build_object(
        'name', OLD.name,
        'permissions', OLD.permissions
      ))
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_role_change
  AFTER INSERT OR UPDATE OR DELETE ON server_roles
  FOR EACH ROW
  EXECUTE FUNCTION log_role_change();

-- Log channel override changes
CREATE OR REPLACE FUNCTION log_channel_override_change()
RETURNS TRIGGER AS $$
DECLARE
  v_server_id UUID;
BEGIN
  -- Get server_id from the channel
  SELECT c.server_id INTO v_server_id
  FROM channels c
  WHERE c.id = COALESCE(NEW.channel_id, OLD.channel_id);

  IF v_server_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO permission_audit_log (server_id, changed_by, action, target_type, target_id, changes)
    VALUES (
      v_server_id,
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
      'override_set',
      'channel_override',
      NEW.id,
      jsonb_build_object(
        'channel_id', NEW.channel_id,
        'target_type', NEW.target_type,
        'target_id', NEW.target_id,
        'allow_permissions', NEW.allow_permissions,
        'deny_permissions', NEW.deny_permissions
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO permission_audit_log (server_id, changed_by, action, target_type, target_id, changes)
    VALUES (
      v_server_id,
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
      'override_removed',
      'channel_override',
      OLD.id,
      jsonb_build_object(
        'channel_id', OLD.channel_id,
        'target_type', OLD.target_type,
        'target_id', OLD.target_id
      )
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_channel_override_change
  AFTER INSERT OR UPDATE OR DELETE ON channel_permission_overrides
  FOR EACH ROW
  EXECUTE FUNCTION log_channel_override_change();

-- Log role member changes
CREATE OR REPLACE FUNCTION log_role_member_change()
RETURNS TRIGGER AS $$
DECLARE
  v_server_id UUID;
BEGIN
  SELECT sr.server_id INTO v_server_id
  FROM server_roles sr
  WHERE sr.id = COALESCE(NEW.role_id, OLD.role_id);

  IF v_server_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO permission_audit_log (server_id, changed_by, action, target_type, target_id, changes)
    VALUES (
      v_server_id,
      COALESCE(NEW.assigned_by, auth.uid(), '00000000-0000-0000-0000-000000000000'),
      'role_assigned',
      'member',
      NEW.user_id,
      jsonb_build_object('role_id', NEW.role_id)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO permission_audit_log (server_id, changed_by, action, target_type, target_id, changes)
    VALUES (
      v_server_id,
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
      'role_removed',
      'member',
      OLD.user_id,
      jsonb_build_object('role_id', OLD.role_id)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_role_member_change
  AFTER INSERT OR DELETE ON role_members
  FOR EACH ROW
  EXECUTE FUNCTION log_role_member_change();
