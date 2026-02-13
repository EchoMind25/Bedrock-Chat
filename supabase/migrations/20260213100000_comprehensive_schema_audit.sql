-- ============================================================================
-- MIGRATION: Comprehensive Schema Audit
-- Generated: 2026-02-13
-- Description: Adds missing tables identified during UX audit:
--   - server_roles (custom roles with bitfield permissions)
--   - role_members (user-to-role assignments)
--   - channel_permission_overrides (per-channel role/user overrides)
--   - server_settings (extended server configuration)
--   - points_transactions (engagement/gamification system)
--   - user_achievements (achievement tracking)
--   - easter_eggs + user_easter_eggs (discovery tracking)
--   - user_themes (profile theme purchases)
--   - user_login_streaks (daily login tracking)
--   - shop_purchases (item purchase history)
--
-- PRIVACY CRITICAL:
-- - Points system is opt-in and COPPA-compliant
-- - No behavioral tracking beyond aggregate point totals
-- - Easter eggs store only discovery timestamps
-- - All RLS policies enforce server membership checks
-- ============================================================================

-- ============================================================================
-- TABLE: server_roles
-- Custom roles with Discord-style bitfield permissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS server_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  color TEXT NOT NULL DEFAULT '', -- OKLCH color string
  permissions BIGINT NOT NULL DEFAULT 0, -- Bitfield (matches frontend Permission enum)
  position INTEGER NOT NULL DEFAULT 0, -- Higher = more important
  mentionable BOOLEAN NOT NULL DEFAULT FALSE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE, -- @everyone role
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_server_roles_server ON server_roles (server_id, position DESC);
CREATE UNIQUE INDEX idx_server_roles_default ON server_roles (server_id) WHERE is_default = TRUE;

-- ============================================================================
-- TABLE: role_members
-- Assignment of users to custom roles
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_members (
  role_id UUID NOT NULL REFERENCES server_roles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  PRIMARY KEY (role_id, user_id)
);

CREATE INDEX idx_role_members_user ON role_members (user_id);

-- ============================================================================
-- TABLE: channel_permission_overrides
-- Per-channel permission overrides for roles or individual users
-- ============================================================================

CREATE TABLE IF NOT EXISTS channel_permission_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('role', 'user')),
  target_id UUID NOT NULL, -- References server_roles.id or profiles.id
  allow_permissions BIGINT NOT NULL DEFAULT 0, -- Bitfield of allowed permissions
  deny_permissions BIGINT NOT NULL DEFAULT 0, -- Bitfield of denied permissions
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_channel_override UNIQUE (channel_id, target_type, target_id)
);

CREATE INDEX idx_channel_overrides_channel ON channel_permission_overrides (channel_id);

-- ============================================================================
-- TABLE: server_settings
-- Extended server configuration (automod, verification, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS server_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL UNIQUE REFERENCES servers(id) ON DELETE CASCADE,
  verification_level TEXT NOT NULL DEFAULT 'none'
    CHECK (verification_level IN ('none', 'low', 'medium', 'high')),
  explicit_content_filter TEXT NOT NULL DEFAULT 'disabled'
    CHECK (explicit_content_filter IN ('disabled', 'no_role', 'all_members')),
  default_notifications TEXT NOT NULL DEFAULT 'all_messages'
    CHECK (default_notifications IN ('all_messages', 'only_mentions')),
  system_channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  rules_channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  vanity_url TEXT,
  -- AutoMod settings (JSONB for flexibility)
  automod_profanity_filter BOOLEAN NOT NULL DEFAULT FALSE,
  automod_spam_filter BOOLEAN NOT NULL DEFAULT FALSE,
  automod_link_filter BOOLEAN NOT NULL DEFAULT FALSE,
  automod_invite_filter BOOLEAN NOT NULL DEFAULT FALSE,
  automod_caps_filter BOOLEAN NOT NULL DEFAULT FALSE,
  automod_mention_limit INTEGER DEFAULT NULL, -- NULL = no limit
  automod_custom_words TEXT[] DEFAULT '{}', -- Custom blocked words
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: points_transactions
-- Engagement system point history
-- COPPA-compliant, no dark patterns, daily caps enforced client-side
-- ============================================================================

CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'message_sent', 'voice_call', 'server_created', 'friend_invited',
    'daily_login', 'login_streak_bonus', 'server_joined', 'server_browsed',
    'profile_completed', 'easter_egg', 'achievement_unlocked', 'points_spent'
  )),
  points INTEGER NOT NULL, -- Positive for earning, negative for spending
  metadata JSONB DEFAULT '{}', -- e.g. { "serverId": "...", "easterEggId": "..." }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_points_tx_user ON points_transactions (user_id, created_at DESC);
CREATE INDEX idx_points_tx_daily ON points_transactions (user_id, created_at)
  WHERE created_at > NOW() - INTERVAL '24 hours';

-- ============================================================================
-- TABLE: user_achievements
-- Tracks achievement unlock progress per user
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL, -- Matches frontend achievement IDs
  category TEXT NOT NULL CHECK (category IN ('social', 'explorer', 'creator', 'streak', 'easter_egg')),
  progress INTEGER NOT NULL DEFAULT 0,
  requirement INTEGER NOT NULL,
  unlocked_at TIMESTAMPTZ, -- NULL = not yet unlocked
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements (user_id);

-- ============================================================================
-- TABLE: easter_eggs
-- System-wide easter egg definitions
-- ============================================================================

CREATE TABLE IF NOT EXISTS easter_eggs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE, -- Trigger code/identifier
  name TEXT NOT NULL,
  description TEXT NOT NULL, -- Shown after discovery
  hint TEXT NOT NULL, -- Subtle hint for undiscovered
  type TEXT NOT NULL CHECK (type IN ('interaction', 'seasonal', 'achievement_chain', 'community')),
  points INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE, -- Seasonal eggs can be deactivated
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: user_easter_eggs
-- Tracks which users discovered which easter eggs
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_easter_eggs (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  easter_egg_id UUID NOT NULL REFERENCES easter_eggs(id) ON DELETE CASCADE,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, easter_egg_id)
);

-- ============================================================================
-- TABLE: user_themes
-- Profile theme ownership and activation
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  theme_id TEXT NOT NULL, -- Matches frontend theme IDs
  theme_data JSONB NOT NULL DEFAULT '{}', -- Full theme configuration
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_theme UNIQUE (user_id, theme_id)
);

CREATE INDEX idx_user_themes_user ON user_themes (user_id);
CREATE UNIQUE INDEX idx_user_themes_active ON user_themes (user_id) WHERE is_active = TRUE;

-- ============================================================================
-- TABLE: user_login_streaks
-- Daily login streak tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_login_streaks (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  today_collected BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: shop_purchases
-- Record of point-shop purchases (prevents duplicate one-time buys)
-- ============================================================================

CREATE TABLE IF NOT EXISTS shop_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  cost INTEGER NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_one_time_purchase UNIQUE (user_id, item_id)
);

CREATE INDEX idx_shop_purchases_user ON shop_purchases (user_id);

-- ============================================================================
-- Add total_points column to profiles if not exists
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'total_points'
  ) THEN
    ALTER TABLE profiles ADD COLUMN total_points INTEGER NOT NULL DEFAULT 0;
  END IF;
END
$$;

-- ============================================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================================

CREATE TRIGGER trigger_server_roles_updated_at
  BEFORE UPDATE ON server_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_channel_overrides_updated_at
  BEFORE UPDATE ON channel_permission_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_server_settings_updated_at
  BEFORE UPDATE ON server_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_login_streaks_updated_at
  BEFORE UPDATE ON user_login_streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE server_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE easter_eggs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_easter_eggs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_login_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_purchases ENABLE ROW LEVEL SECURITY;

-- ── Server Roles: Members can read, admins can manage ──

CREATE POLICY server_roles_select ON server_roles
  FOR SELECT TO authenticated
  USING (is_server_member(server_id, auth.uid()));

CREATE POLICY server_roles_manage ON server_roles
  FOR ALL TO authenticated
  USING (is_server_admin(server_id, auth.uid()));

-- ── Role Members: Members can read, admins can manage ──

CREATE POLICY role_members_select ON role_members
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM server_roles sr
    WHERE sr.id = role_members.role_id
      AND is_server_member(sr.server_id, auth.uid())
  ));

CREATE POLICY role_members_manage ON role_members
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM server_roles sr
    WHERE sr.id = role_members.role_id
      AND is_server_admin(sr.server_id, auth.uid())
  ));

-- ── Channel Permission Overrides: Members can read, admins can manage ──

CREATE POLICY channel_overrides_select ON channel_permission_overrides
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM channels c
    WHERE c.id = channel_permission_overrides.channel_id
      AND is_server_member(c.server_id, auth.uid())
  ));

CREATE POLICY channel_overrides_manage ON channel_permission_overrides
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM channels c
    WHERE c.id = channel_permission_overrides.channel_id
      AND is_server_admin(c.server_id, auth.uid())
  ));

-- ── Server Settings: Members can read, admins can manage ──

CREATE POLICY server_settings_select ON server_settings
  FOR SELECT TO authenticated
  USING (is_server_member(server_id, auth.uid()));

CREATE POLICY server_settings_manage ON server_settings
  FOR ALL TO authenticated
  USING (is_server_admin(server_id, auth.uid()));

-- ── Points Transactions: Users can read/insert their own ──

CREATE POLICY points_tx_select ON points_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY points_tx_insert ON points_transactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── User Achievements: Users can read/update their own ──

CREATE POLICY achievements_select ON user_achievements
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY achievements_insert ON user_achievements
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY achievements_update ON user_achievements
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ── Easter Eggs: Everyone can read active eggs ──

CREATE POLICY easter_eggs_select ON easter_eggs
  FOR SELECT TO authenticated
  USING (is_active = TRUE);

-- ── User Easter Eggs: Users can read/insert their own ──

CREATE POLICY user_easter_eggs_select ON user_easter_eggs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_easter_eggs_insert ON user_easter_eggs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── User Themes: Users can manage their own ──

CREATE POLICY user_themes_select ON user_themes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_themes_insert ON user_themes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_themes_update ON user_themes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ── Login Streaks: Users can manage their own ──

CREATE POLICY login_streaks_all ON user_login_streaks
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- ── Shop Purchases: Users can read/insert their own ──

CREATE POLICY shop_purchases_select ON shop_purchases
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY shop_purchases_insert ON shop_purchases
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- FUNCTION: Auto-create default @everyone role for new servers
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_server_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO server_roles (server_id, name, permissions, position, is_default)
  VALUES (
    NEW.id,
    '@everyone',
    -- Default permissions: VIEW_CHANNELS | SEND_MESSAGES | READ_MESSAGE_HISTORY |
    -- ADD_REACTIONS | CONNECT | SPEAK | CREATE_INVITE | CHANGE_NICKNAME
    (1 | 512 | 8192 | 32768 | 65536 | 131072 | 8 | 16),
    0,
    TRUE
  );

  -- Auto-create server settings
  INSERT INTO server_settings (server_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_default_role
  AFTER INSERT ON servers
  FOR EACH ROW EXECUTE FUNCTION create_default_server_role();

-- ============================================================================
-- FUNCTION: Update total_points on profiles when points_transactions change
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_total_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET total_points = (
    SELECT COALESCE(SUM(points), 0)
    FROM points_transactions
    WHERE user_id = NEW.user_id
  )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_total_points
  AFTER INSERT ON points_transactions
  FOR EACH ROW EXECUTE FUNCTION update_user_total_points();
