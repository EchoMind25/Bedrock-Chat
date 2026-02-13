-- ============================================================================
-- MIGRATION: Parent Dashboard
--
-- Adds tables for keyword alerts, blocked categories, time limits,
-- screen time tracking, and parent dashboard settings.
-- Extends family_activity_log CHECK constraint to support new action types.
--
-- PRIVACY CRITICAL:
-- - keyword_alerts stores PARENT-configured keywords only, NOT message content
-- - keyword_alert_matches stores snippets only when monitoring level permits
-- - screen_time_daily stores aggregate minutes only, NOT specific activities
-- - All parent actions remain transparent to teens via family_activity_log
-- ============================================================================

-- ============================================================================
-- TABLE: family_keyword_alerts
-- Parent-configured keyword monitoring
-- ============================================================================

CREATE TABLE family_keyword_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES family_accounts(id) ON DELETE CASCADE,
  teen_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL CHECK (char_length(keyword) >= 1 AND char_length(keyword) <= 100),
  is_regex BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  match_count INTEGER NOT NULL DEFAULT 0,
  last_match_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_keyword_alerts_family ON family_keyword_alerts (family_id);
CREATE INDEX idx_keyword_alerts_teen ON family_keyword_alerts (teen_user_id);
CREATE INDEX idx_keyword_alerts_active ON family_keyword_alerts (family_id, teen_user_id) WHERE is_active = TRUE;

-- ============================================================================
-- TABLE: family_keyword_matches
-- Records when a keyword alert is triggered
-- Stores snippet context only, NOT full message content
-- ============================================================================

CREATE TABLE family_keyword_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID NOT NULL REFERENCES family_keyword_alerts(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES family_accounts(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  channel_name TEXT NOT NULL,
  server_id UUID REFERENCES servers(id) ON DELETE SET NULL,
  server_name TEXT NOT NULL,
  snippet TEXT NOT NULL CHECK (char_length(snippet) <= 200),
  dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_keyword_matches_alert ON family_keyword_matches (alert_id, occurred_at DESC);
CREATE INDEX idx_keyword_matches_family ON family_keyword_matches (family_id, occurred_at DESC);
CREATE INDEX idx_keyword_matches_pending ON family_keyword_matches (family_id) WHERE dismissed = FALSE;

-- ============================================================================
-- TABLE: family_blocked_categories
-- Content categories that parent has opted to block
-- ============================================================================

CREATE TABLE family_blocked_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES family_accounts(id) ON DELETE CASCADE,
  teen_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL CHECK (char_length(category_name) >= 1 AND char_length(category_name) <= 100),
  category_description TEXT NOT NULL DEFAULT '',
  category_icon TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_blocked_category UNIQUE (family_id, teen_user_id, category_name)
);

CREATE INDEX idx_blocked_categories_family ON family_blocked_categories (family_id, teen_user_id);

-- ============================================================================
-- TABLE: family_time_limits
-- Time limit configuration per teen
-- ============================================================================

CREATE TABLE family_time_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES family_accounts(id) ON DELETE CASCADE,
  teen_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  daily_limit_minutes INTEGER NOT NULL DEFAULT 480 CHECK (daily_limit_minutes >= 0 AND daily_limit_minutes <= 1440),
  weekday_start TEXT, -- "HH:MM" format, NULL = no schedule
  weekday_end TEXT,
  weekend_start TEXT,
  weekend_end TEXT,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  override_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_time_limit UNIQUE (family_id, teen_user_id)
);

CREATE INDEX idx_time_limits_teen ON family_time_limits (teen_user_id);

-- ============================================================================
-- TABLE: family_screen_time
-- Daily aggregate screen time data per teen
-- Stores ONLY aggregate minutes, NOT specific activity details
-- ============================================================================

CREATE TABLE family_screen_time (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES family_accounts(id) ON DELETE CASCADE,
  teen_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  active_minutes INTEGER NOT NULL DEFAULT 0,
  idle_minutes INTEGER NOT NULL DEFAULT 0,
  voice_total_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_screen_time_entry UNIQUE (family_id, teen_user_id, date)
);

CREATE INDEX idx_screen_time_teen_date ON family_screen_time (teen_user_id, date DESC);
CREATE INDEX idx_screen_time_family_date ON family_screen_time (family_id, date DESC);

-- ============================================================================
-- TABLE: family_screen_time_servers
-- Server breakdown for screen time (linked to daily entry)
-- ============================================================================

CREATE TABLE family_screen_time_servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  screen_time_id UUID NOT NULL REFERENCES family_screen_time(id) ON DELETE CASCADE,
  server_id UUID REFERENCES servers(id) ON DELETE SET NULL,
  server_name TEXT NOT NULL,
  minutes INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_screen_time_servers_entry ON family_screen_time_servers (screen_time_id);

-- ============================================================================
-- TABLE: family_dashboard_settings
-- Parent's dashboard preferences
-- ============================================================================

CREATE TABLE family_dashboard_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES family_accounts(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  push_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  daily_digest BOOLEAN NOT NULL DEFAULT TRUE,
  alert_threshold TEXT NOT NULL DEFAULT 'all' CHECK (alert_threshold IN ('all', 'medium-high', 'high-only')),
  activity_log_retention_days INTEGER NOT NULL DEFAULT 90,
  message_access_retention_days INTEGER NOT NULL DEFAULT 30,
  voice_metadata_retention_days INTEGER NOT NULL DEFAULT 60,
  auto_delete_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_dashboard_settings UNIQUE (family_id, parent_user_id)
);

CREATE INDEX idx_dashboard_settings_parent ON family_dashboard_settings (parent_user_id);

-- ============================================================================
-- TABLE: family_restricted_servers
-- Servers that parent has restricted for a teen
-- ============================================================================

CREATE TABLE family_restricted_servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES family_accounts(id) ON DELETE CASCADE,
  teen_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  restricted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  restricted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  CONSTRAINT unique_restricted_server UNIQUE (family_id, teen_user_id, server_id)
);

CREATE INDEX idx_restricted_servers_teen ON family_restricted_servers (teen_user_id);

-- ============================================================================
-- Update family_activity_log CHECK constraint to support new action types
-- ============================================================================

ALTER TABLE family_activity_log DROP CONSTRAINT IF EXISTS family_activity_log_activity_type_check;

ALTER TABLE family_activity_log ADD CONSTRAINT family_activity_log_activity_type_check
  CHECK (activity_type IN (
    'viewed_messages', 'viewed_friends', 'viewed_servers', 'viewed_flags',
    'changed_monitoring_level', 'approved_server', 'denied_server',
    'approved_friend', 'denied_friend',
    'added_keyword_alert', 'removed_keyword_alert',
    'changed_time_limit', 'blocked_category', 'unblocked_category',
    'viewed_voice_metadata', 'exported_activity_log',
    'changed_data_retention', 'restricted_server', 'unrestricted_server'
  ));

-- ============================================================================
-- Add updated_at triggers for new tables
-- ============================================================================

CREATE TRIGGER trigger_keyword_alerts_updated_at
  BEFORE UPDATE ON family_keyword_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_time_limits_updated_at
  BEFORE UPDATE ON family_time_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_dashboard_settings_updated_at
  BEFORE UPDATE ON family_dashboard_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- Parents can manage their family's data.
-- Teens can read their own restrictions (transparency).
-- ============================================================================

ALTER TABLE family_keyword_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_keyword_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_blocked_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_time_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_screen_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_screen_time_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_dashboard_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_restricted_servers ENABLE ROW LEVEL SECURITY;

-- Helper: Check if user is parent in a family
CREATE OR REPLACE FUNCTION is_family_parent(p_family_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = p_family_id
      AND user_id = p_user_id
      AND role = 'parent'
  );
$$;

-- Helper: Check if user is teen in a family
CREATE OR REPLACE FUNCTION is_family_teen(p_family_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = p_family_id
      AND user_id = p_user_id
      AND role = 'child'
  );
$$;

-- Keyword alerts: parents manage, teens can read (transparency)
CREATE POLICY keyword_alerts_parent_all ON family_keyword_alerts
  FOR ALL TO authenticated
  USING (is_family_parent(family_id, auth.uid()));

CREATE POLICY keyword_alerts_teen_select ON family_keyword_alerts
  FOR SELECT TO authenticated
  USING (teen_user_id = auth.uid());

-- Keyword matches: parents manage, teens can read
CREATE POLICY keyword_matches_parent_all ON family_keyword_matches
  FOR ALL TO authenticated
  USING (is_family_parent(family_id, auth.uid()));

CREATE POLICY keyword_matches_teen_select ON family_keyword_matches
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM family_keyword_alerts ka
    WHERE ka.id = family_keyword_matches.alert_id
      AND ka.teen_user_id = auth.uid()
  ));

-- Blocked categories: parents manage, teens can read
CREATE POLICY blocked_categories_parent_all ON family_blocked_categories
  FOR ALL TO authenticated
  USING (is_family_parent(family_id, auth.uid()));

CREATE POLICY blocked_categories_teen_select ON family_blocked_categories
  FOR SELECT TO authenticated
  USING (teen_user_id = auth.uid());

-- Time limits: parents manage, teens can read
CREATE POLICY time_limits_parent_all ON family_time_limits
  FOR ALL TO authenticated
  USING (is_family_parent(family_id, auth.uid()));

CREATE POLICY time_limits_teen_select ON family_time_limits
  FOR SELECT TO authenticated
  USING (teen_user_id = auth.uid());

-- Screen time: parents read, system inserts (via service role)
CREATE POLICY screen_time_parent_select ON family_screen_time
  FOR SELECT TO authenticated
  USING (is_family_parent(family_id, auth.uid()));

CREATE POLICY screen_time_teen_select ON family_screen_time
  FOR SELECT TO authenticated
  USING (teen_user_id = auth.uid());

-- Screen time servers: parents read
CREATE POLICY screen_time_servers_parent_select ON family_screen_time_servers
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM family_screen_time st
    WHERE st.id = family_screen_time_servers.screen_time_id
      AND is_family_parent(st.family_id, auth.uid())
  ));

-- Dashboard settings: parents only
CREATE POLICY dashboard_settings_parent_all ON family_dashboard_settings
  FOR ALL TO authenticated
  USING (parent_user_id = auth.uid());

-- Restricted servers: parents manage, teens can read
CREATE POLICY restricted_servers_parent_all ON family_restricted_servers
  FOR ALL TO authenticated
  USING (is_family_parent(family_id, auth.uid()));

CREATE POLICY restricted_servers_teen_select ON family_restricted_servers
  FOR SELECT TO authenticated
  USING (teen_user_id = auth.uid());
