-- ============================================================================
-- Bedrock Chat - Permission Override System
-- Created: 2026-02-14
-- Purpose: Discord-style hierarchical permission system with overrides
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
-- TABLE: server_permissions
-- Server-level base permissions for roles (default permissions)
-- ============================================================================

CREATE TABLE server_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permissions BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_server_role_permission UNIQUE(server_id, role_id)
);

CREATE INDEX idx_server_permissions_server ON server_permissions(server_id);
CREATE INDEX idx_server_permissions_role ON server_permissions(role_id);

COMMENT ON TABLE server_permissions IS 'Base permissions for roles within a server';
COMMENT ON COLUMN server_permissions.permissions IS 'Bitfield representing granted permissions (23 permission flags)';

-- ============================================================================
-- TABLE: category_permission_overrides
-- Category-level permission overrides (applies to all channels in category)
-- ============================================================================

CREATE TABLE category_permission_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES channel_categories(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('role', 'user')),
  target_id UUID NOT NULL,
  allow BIGINT NOT NULL DEFAULT 0,
  deny BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_category_override UNIQUE(category_id, target_type, target_id),
  CONSTRAINT allow_deny_mutually_exclusive CHECK ((allow & deny) = 0)
);

CREATE INDEX idx_category_overrides_category ON category_permission_overrides(category_id);
CREATE INDEX idx_category_overrides_target ON category_permission_overrides(target_type, target_id);

COMMENT ON TABLE category_permission_overrides IS 'Permission overrides at category level - inherits to all channels in category';
COMMENT ON COLUMN category_permission_overrides.allow IS 'Bitfield of explicitly allowed permissions';
COMMENT ON COLUMN category_permission_overrides.deny IS 'Bitfield of explicitly denied permissions';
COMMENT ON CONSTRAINT allow_deny_mutually_exclusive ON category_permission_overrides IS 'Same permission cannot be both allowed and denied';

-- ============================================================================
-- TABLE: channel_permission_overrides
-- Channel-level permission overrides (highest priority for channels)
-- ============================================================================

CREATE TABLE channel_permission_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('role', 'user')),
  target_id UUID NOT NULL,
  allow BIGINT NOT NULL DEFAULT 0,
  deny BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_channel_override UNIQUE(channel_id, target_type, target_id),
  CONSTRAINT allow_deny_mutually_exclusive CHECK ((allow & deny) = 0)
);

CREATE INDEX idx_channel_overrides_channel ON channel_permission_overrides(channel_id);
CREATE INDEX idx_channel_overrides_target ON channel_permission_overrides(target_type, target_id);

COMMENT ON TABLE channel_permission_overrides IS 'Permission overrides at channel level - highest priority for channel access';
COMMENT ON COLUMN channel_permission_overrides.allow IS 'Bitfield of explicitly allowed permissions';
COMMENT ON COLUMN channel_permission_overrides.deny IS 'Bitfield of explicitly denied permissions';

-- ============================================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================================

CREATE TRIGGER update_server_permissions_updated_at
  BEFORE UPDATE ON server_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_category_overrides_updated_at
  BEFORE UPDATE ON category_permission_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_channel_overrides_updated_at
  BEFORE UPDATE ON channel_permission_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- FUNCTION: Calculate effective permissions for a user in a channel
-- Implements Discord-style permission hierarchy
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
  v_role_id UUID;
  v_override RECORD;
BEGIN
  -- Get channel's server and category
  SELECT c.server_id, c.category_id
  INTO v_server_id, v_category_id
  FROM channels c
  WHERE c.id = p_channel_id;

  -- Get user's roles in this server
  SELECT ARRAY_AGG(sm.role_id)
  INTO v_user_roles
  FROM server_members sm
  WHERE sm.user_id = p_user_id AND sm.server_id = v_server_id;

  -- If no roles found, return 0 (no permissions)
  IF v_user_roles IS NULL THEN
    RETURN 0;
  END IF;

  -- Step 1: Apply server base permissions (role-based)
  FOR v_role_id IN SELECT UNNEST(v_user_roles)
  LOOP
    SELECT COALESCE(sp.permissions, 0)
    INTO v_permissions
    FROM server_permissions sp
    WHERE sp.server_id = v_server_id AND sp.role_id = v_role_id;

    -- Combine permissions with bitwise OR (accumulate all role permissions)
    v_permissions := v_permissions | COALESCE(v_permissions, 0);
  END LOOP;

  -- Step 2: Apply category overrides (if channel is in a category)
  IF v_category_id IS NOT NULL THEN
    FOR v_override IN
      SELECT allow, deny, target_type, target_id
      FROM category_permission_overrides
      WHERE category_id = v_category_id
    LOOP
      -- Check if override applies to user's roles
      IF v_override.target_type = 'role' AND v_override.target_id = ANY(v_user_roles) THEN
        v_permissions := (v_permissions & ~v_override.deny) | v_override.allow;
      END IF;
    END LOOP;
  END IF;

  -- Step 3: Apply channel overrides (role-based)
  FOR v_override IN
    SELECT allow, deny, target_type, target_id
    FROM channel_permission_overrides
    WHERE channel_id = p_channel_id AND target_type = 'role'
  LOOP
    IF v_override.target_id = ANY(v_user_roles) THEN
      v_permissions := (v_permissions & ~v_override.deny) | v_override.allow;
    END IF;
  END LOOP;

  -- Step 4: Apply user-specific overrides (highest priority)
  SELECT allow, deny
  INTO v_override
  FROM channel_permission_overrides
  WHERE channel_id = p_channel_id
    AND target_type = 'user'
    AND target_id = p_user_id;

  IF FOUND THEN
    v_permissions := (v_permissions & ~v_override.deny) | v_override.allow;
  END IF;

  RETURN v_permissions;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_effective_permissions IS 'Calculates effective permissions for a user in a channel using Discord-style hierarchy';

-- ============================================================================
-- RLS (Row Level Security) Policies
-- ============================================================================

-- Server Permissions: Only server members can read, only server owner/admins can modify
ALTER TABLE server_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Server members can read server permissions"
  ON server_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id = server_permissions.server_id
      AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Server owner/admins can manage server permissions"
  ON server_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id = server_permissions.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );

-- Category Permission Overrides: Only server members can read, only owner/admins can modify
ALTER TABLE category_permission_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Server members can read category overrides"
  ON category_permission_overrides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channel_categories cc
      JOIN channels c ON c.server_id = cc.server_id
      JOIN server_members sm ON sm.server_id = c.server_id
      WHERE cc.id = category_permission_overrides.category_id
      AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Server owner/admins can manage category overrides"
  ON category_permission_overrides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM channel_categories cc
      JOIN channels c ON c.server_id = cc.server_id
      JOIN server_members sm ON sm.server_id = c.server_id
      WHERE cc.id = category_permission_overrides.category_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );

-- Channel Permission Overrides: Only server members can read, only owner/admins can modify
ALTER TABLE channel_permission_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Server members can read channel overrides"
  ON channel_permission_overrides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channels ch
      JOIN server_members sm ON sm.server_id = ch.server_id
      WHERE ch.id = channel_permission_overrides.channel_id
      AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Server owner/admins can manage channel overrides"
  ON channel_permission_overrides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM channels ch
      JOIN server_members sm ON sm.server_id = ch.server_id
      WHERE ch.id = channel_permission_overrides.channel_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- SEED DATA: Default @everyone role permissions
-- Automatically create default server permissions when server is created
-- ============================================================================

-- Note: Actual seed data will be inserted via application logic when servers
-- and roles are created. Default permissions for @everyone role should include:
-- - VIEW_CHANNELS (basic read access)
-- - SEND_MESSAGES (basic write access)
-- - READ_MESSAGE_HISTORY (view past messages)
-- - CONNECT_VOICE (join voice channels)
-- - SPEAK (talk in voice channels)
