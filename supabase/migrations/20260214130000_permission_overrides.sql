-- ============================================================================
-- Bedrock Chat - Permission Override System (FIXED)
-- Created: 2026-02-14
-- Purpose: Discord-style hierarchical permission system with overrides
--
-- FIXES:
-- - Uses server_roles instead of non-existent "roles" table
-- - Doesn't recreate channel_permission_overrides (already exists)
-- - Uses role_members instead of server_members.role_id
-- - Aligns with existing comprehensive_schema_audit.sql
--
-- HIERARCHY:
-- 1. Server Base Permissions (lowest priority - applies to roles)
-- 2. Category Overrides (medium priority - inherits to channels in category)
-- 3. Channel Overrides (high priority - specific to channel)
-- 4. User-Specific Overrides (highest priority - overrides everything)
--
-- PERMISSION MODEL:
-- - Bitfield-based permissions (23 permission types)
-- - Allow/Deny three-state system
-- - Deny always wins over allow
-- ============================================================================

-- ============================================================================
-- NOTE: channel_permission_overrides already exists from comprehensive_schema_audit
-- We'll add category_permission_overrides as a new table
-- ============================================================================

-- ============================================================================
-- TABLE: category_permission_overrides
-- Category-level permission overrides (applies to all channels in category)
-- ============================================================================

CREATE TABLE IF NOT EXISTS category_permission_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES channel_categories(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('role', 'user')),
  target_id UUID NOT NULL, -- References server_roles.id or profiles.id
  allow_permissions BIGINT NOT NULL DEFAULT 0,
  deny_permissions BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_category_override UNIQUE(category_id, target_type, target_id),
  CONSTRAINT category_allow_deny_exclusive CHECK ((allow_permissions & deny_permissions) = 0)
);

CREATE INDEX idx_category_overrides_category ON category_permission_overrides(category_id);
CREATE INDEX idx_category_overrides_target ON category_permission_overrides(target_type, target_id);

COMMENT ON TABLE category_permission_overrides IS 'Permission overrides at category level - inherits to all channels in category';
COMMENT ON COLUMN category_permission_overrides.allow_permissions IS 'Bitfield of explicitly allowed permissions';
COMMENT ON COLUMN category_permission_overrides.deny_permissions IS 'Bitfield of explicitly denied permissions';

-- ============================================================================
-- TRIGGER: Auto-update timestamps
-- ============================================================================

CREATE TRIGGER update_category_overrides_updated_at
  BEFORE UPDATE ON category_permission_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- FUNCTION: Calculate effective permissions for a user in a channel
-- Implements Discord-style permission hierarchy
--
-- NOTE: This uses the custom role system (server_roles + role_members)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_effective_permissions(
  p_user_id UUID,
  p_channel_id UUID
) RETURNS BIGINT AS $$
DECLARE
  v_permissions BIGINT := 0;
  v_server_id UUID;
  v_category_id UUID;
  v_user_roles UUID[];
  v_role_record RECORD;
  v_override RECORD;
BEGIN
  -- Get channel's server and category
  SELECT c.server_id, c.category_id
  INTO v_server_id, v_category_id
  FROM channels c
  WHERE c.id = p_channel_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Get user's custom roles in this server (from role_members table)
  SELECT ARRAY_AGG(rm.role_id)
  INTO v_user_roles
  FROM role_members rm
  JOIN server_roles sr ON sr.id = rm.role_id
  WHERE rm.user_id = p_user_id
    AND sr.server_id = v_server_id;

  -- If no custom roles found, check for default @everyone role
  IF v_user_roles IS NULL OR array_length(v_user_roles, 1) IS NULL THEN
    SELECT ARRAY_AGG(id)
    INTO v_user_roles
    FROM server_roles
    WHERE server_id = v_server_id AND is_default = TRUE;
  END IF;

  -- If still no roles, user has no access
  IF v_user_roles IS NULL THEN
    RETURN 0;
  END IF;

  -- Step 1: Apply base role permissions (from server_roles.permissions)
  FOR v_role_record IN
    SELECT permissions
    FROM server_roles
    WHERE id = ANY(v_user_roles)
    ORDER BY position DESC -- Higher position = more important
  LOOP
    v_permissions := v_permissions | v_role_record.permissions;
  END LOOP;

  -- Step 2: Apply category overrides (if channel is in a category)
  IF v_category_id IS NOT NULL THEN
    -- Role-based category overrides
    FOR v_override IN
      SELECT allow_permissions, deny_permissions
      FROM category_permission_overrides
      WHERE category_id = v_category_id
        AND target_type = 'role'
        AND target_id = ANY(v_user_roles)
    LOOP
      v_permissions := (v_permissions & ~v_override.deny_permissions) | v_override.allow_permissions;
    END LOOP;

    -- User-specific category overrides
    SELECT allow_permissions, deny_permissions
    INTO v_override
    FROM category_permission_overrides
    WHERE category_id = v_category_id
      AND target_type = 'user'
      AND target_id = p_user_id;

    IF FOUND THEN
      v_permissions := (v_permissions & ~v_override.deny_permissions) | v_override.allow_permissions;
    END IF;
  END IF;

  -- Step 3: Apply channel overrides (role-based)
  FOR v_override IN
    SELECT allow_permissions, deny_permissions
    FROM channel_permission_overrides
    WHERE channel_id = p_channel_id
      AND target_type = 'role'
      AND target_id = ANY(v_user_roles)
  LOOP
    v_permissions := (v_permissions & ~v_override.deny_permissions) | v_override.allow_permissions;
  END LOOP;

  -- Step 4: Apply user-specific channel overrides (highest priority)
  SELECT allow_permissions, deny_permissions
  INTO v_override
  FROM channel_permission_overrides
  WHERE channel_id = p_channel_id
    AND target_type = 'user'
    AND target_id = p_user_id;

  IF FOUND THEN
    v_permissions := (v_permissions & ~v_override.deny_permissions) | v_override.allow_permissions;
  END IF;

  RETURN v_permissions;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_effective_permissions IS 'Calculates effective permissions for a user in a channel using Discord-style hierarchy with custom roles';

-- ============================================================================
-- RLS (Row Level Security) Policies
-- ============================================================================

-- Category Permission Overrides: Only server members can read, only owner/admins can modify
ALTER TABLE category_permission_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Server members can read category overrides"
  ON category_permission_overrides FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM channel_categories cc
      JOIN server_members sm ON sm.server_id = cc.server_id
      WHERE cc.id = category_permission_overrides.category_id
        AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Server owner/admins can manage category overrides"
  ON category_permission_overrides FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM channel_categories cc
      JOIN server_members sm ON sm.server_id = cc.server_id
      WHERE cc.id = category_permission_overrides.category_id
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- HELPER FUNCTION: Check if user has specific permission in channel
-- ============================================================================

CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_channel_id UUID,
  p_permission BIGINT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN (calculate_effective_permissions(p_user_id, p_channel_id) & p_permission) = p_permission;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION user_has_permission IS 'Check if user has a specific permission in a channel';
