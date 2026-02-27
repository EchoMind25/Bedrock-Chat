-- ============================================================
-- Analytics Schema Migration
-- Privacy-first analytics for Bedrock Chat
-- 30-day raw event retention, indefinite aggregates
-- All data isolated in 'analytics' schema with RLS
-- ============================================================

CREATE SCHEMA IF NOT EXISTS analytics;

-- ============================================================
-- RAW EVENTS TABLE (purged after 30 days)
-- ============================================================
CREATE TABLE analytics.raw_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT NOT NULL,          -- anonymous, rotating per session
  event_type TEXT NOT NULL              -- 'page_view' | 'feature_use' | 'performance' | 'session' | 'error'
    CHECK (event_type IN ('page_view', 'feature_use', 'performance', 'session', 'error')),
  event_name TEXT NOT NULL,             -- e.g. 'voice_channel_join', 'message_send'
  event_data JSONB DEFAULT '{}',        -- structured payload (NEVER contains PII)
  page_path TEXT,                       -- current route, stripped of IDs/params
  referrer_path TEXT,                   -- previous internal route
  device_category TEXT                  -- 'desktop' | 'tablet' | 'mobile'
    CHECK (device_category IS NULL OR device_category IN ('desktop', 'tablet', 'mobile')),
  viewport_bucket TEXT                  -- 'sm' | 'md' | 'lg' | 'xl'
    CHECK (viewport_bucket IS NULL OR viewport_bucket IN ('sm', 'md', 'lg', 'xl')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_raw_events_created ON analytics.raw_events (created_at);
CREATE INDEX idx_raw_events_type ON analytics.raw_events (event_type, event_name);
CREATE INDEX idx_raw_events_session ON analytics.raw_events (session_token);
CREATE INDEX idx_raw_events_page ON analytics.raw_events (page_path);

-- ============================================================
-- AGGREGATE TABLES (kept indefinitely)
-- ============================================================

CREATE TABLE analytics.daily_page_flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  from_path TEXT,                        -- NULL = entry page
  to_path TEXT NOT NULL,
  transition_count INTEGER DEFAULT 0,
  unique_sessions INTEGER DEFAULT 0,
  avg_time_on_from_seconds NUMERIC(10,2),
  UNIQUE(date, from_path, to_path)
);

CREATE TABLE analytics.daily_feature_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  feature_name TEXT NOT NULL,
  feature_category TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  unique_sessions INTEGER DEFAULT 0,
  device_category TEXT,
  UNIQUE(date, feature_name, device_category)
);

CREATE TABLE analytics.daily_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  page_path TEXT,                        -- NULL = global metric
  p50_ms NUMERIC(10,2),
  p75_ms NUMERIC(10,2),
  p95_ms NUMERIC(10,2),
  p99_ms NUMERIC(10,2),
  sample_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  UNIQUE(date, metric_name, page_path)
);

CREATE TABLE analytics.daily_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  avg_duration_seconds NUMERIC(10,2),
  median_duration_seconds NUMERIC(10,2),
  avg_pages_per_session NUMERIC(10,2),
  bounce_rate NUMERIC(5,4),
  device_category TEXT,
  UNIQUE(date, device_category)
);

CREATE TABLE analytics.hourly_active_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  hour_utc SMALLINT NOT NULL CHECK (hour_utc >= 0 AND hour_utc <= 23),
  active_sessions INTEGER DEFAULT 0,
  UNIQUE(date, hour_utc)
);

-- ============================================================
-- ERROR LOG (30-day retention)
-- ============================================================
CREATE TABLE analytics.error_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT NOT NULL,
  error_type TEXT NOT NULL              -- 'js_error' | 'api_error' | 'network_error' | 'voice_error'
    CHECK (error_type IN ('js_error', 'api_error', 'network_error', 'voice_error')),
  error_message TEXT NOT NULL,          -- sanitized, no PII
  error_stack TEXT,                     -- sanitized stack trace
  page_path TEXT,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_error_events_created ON analytics.error_events (created_at);
CREATE INDEX idx_error_events_session ON analytics.error_events (session_token);

-- ============================================================
-- BUG REPORTS (separate from analytics events, user-initiated)
-- ============================================================
CREATE TABLE analytics.bug_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Anonymous by default
  session_token TEXT,
  -- Identity fields (populated ONLY if user explicitly toggles ON)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_display_name TEXT,
  -- Report content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN ('bug', 'ui_issue', 'performance', 'voice_issue', 'other')),
  severity TEXT DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  -- Automated context (always anonymous)
  page_path TEXT,
  device_category TEXT,
  viewport_bucket TEXT,
  browser_family TEXT,                  -- 'chrome' | 'firefox' | 'safari' | 'edge' | 'other'
  os_family TEXT,                       -- 'windows' | 'macos' | 'linux' | 'ios' | 'android'
  -- Recent error context (auto-attached from error_events)
  recent_errors JSONB DEFAULT '[]',
  -- Screenshots (paths in Supabase Storage, NOT stored here)
  screenshot_paths TEXT[] DEFAULT '{}',
  -- Admin workflow
  status TEXT DEFAULT 'new'
    CHECK (status IN ('new', 'triaging', 'investigating', 'resolved', 'wont_fix')),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_bug_reports_status ON analytics.bug_reports (status);
CREATE INDEX idx_bug_reports_created ON analytics.bug_reports (created_at);
CREATE INDEX idx_bug_reports_category ON analytics.bug_reports (category, severity);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE analytics.raw_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.daily_page_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.daily_feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.daily_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.daily_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.hourly_active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.error_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.bug_reports ENABLE ROW LEVEL SECURITY;

-- Super admin read-only access to all analytics tables
CREATE POLICY "super_admin_read_raw_events" ON analytics.raw_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_read_daily_page_flows" ON analytics.daily_page_flows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_read_daily_feature_usage" ON analytics.daily_feature_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_read_daily_performance" ON analytics.daily_performance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_read_daily_sessions" ON analytics.daily_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_read_hourly_active" ON analytics.hourly_active_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_read_error_events" ON analytics.error_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_read_bug_reports" ON analytics.bug_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

-- Any authenticated user can INSERT bug reports
CREATE POLICY "authenticated_insert_bug_reports" ON analytics.bug_reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Super admin can UPDATE bug reports (status, admin notes)
CREATE POLICY "super_admin_update_bug_reports" ON analytics.bug_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

-- Service role key bypasses RLS — used by ingestion API and edge function cron
-- No explicit INSERT policies needed for raw_events / error_events; service role handles inserts

-- ============================================================
-- AGGREGATION FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION analytics.aggregate_and_purge(retention_days INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cutoff_date DATE;
  purged_events_count INTEGER := 0;
  purged_errors_count INTEGER := 0;
  result JSONB;
BEGIN
  cutoff_date := CURRENT_DATE - retention_days;

  -- ===== AGGREGATE PAGE FLOWS =====
  INSERT INTO analytics.daily_page_flows (date, from_path, to_path, transition_count, unique_sessions, avg_time_on_from_seconds)
  SELECT
    DATE(e1.created_at) AS date,
    e1.page_path AS from_path,
    e2.page_path AS to_path,
    COUNT(*) AS transition_count,
    COUNT(DISTINCT e1.session_token) AS unique_sessions,
    AVG(EXTRACT(EPOCH FROM (e2.created_at - e1.created_at))) AS avg_time_on_from
  FROM analytics.raw_events e1
  INNER JOIN LATERAL (
    SELECT page_path, created_at
    FROM analytics.raw_events e2_inner
    WHERE e2_inner.session_token = e1.session_token
      AND e2_inner.event_type = 'page_view'
      AND e2_inner.created_at > e1.created_at
    ORDER BY e2_inner.created_at ASC
    LIMIT 1
  ) e2 ON TRUE
  WHERE e1.event_type = 'page_view'
    AND DATE(e1.created_at) < CURRENT_DATE
    AND DATE(e1.created_at) <= cutoff_date
  GROUP BY DATE(e1.created_at), e1.page_path, e2.page_path
  ON CONFLICT (date, from_path, to_path)
  DO UPDATE SET
    transition_count = EXCLUDED.transition_count,
    unique_sessions = EXCLUDED.unique_sessions,
    avg_time_on_from_seconds = EXCLUDED.avg_time_on_from_seconds;

  -- ===== AGGREGATE FEATURE USAGE =====
  INSERT INTO analytics.daily_feature_usage (date, feature_name, feature_category, usage_count, unique_sessions, device_category)
  SELECT
    DATE(created_at) AS date,
    event_name AS feature_name,
    COALESCE(event_data->>'category', 'uncategorized') AS feature_category,
    COUNT(*) AS usage_count,
    COUNT(DISTINCT session_token) AS unique_sessions,
    device_category
  FROM analytics.raw_events
  WHERE event_type = 'feature_use'
    AND DATE(created_at) < CURRENT_DATE
    AND DATE(created_at) <= cutoff_date
  GROUP BY DATE(created_at), event_name, event_data->>'category', device_category
  ON CONFLICT (date, feature_name, device_category)
  DO UPDATE SET
    usage_count = EXCLUDED.usage_count,
    unique_sessions = EXCLUDED.unique_sessions,
    feature_category = EXCLUDED.feature_category;

  -- ===== AGGREGATE PERFORMANCE =====
  INSERT INTO analytics.daily_performance (date, metric_name, page_path, p50_ms, p75_ms, p95_ms, p99_ms, sample_count, error_count)
  SELECT
    DATE(created_at) AS date,
    event_name AS metric_name,
    page_path,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY (event_data->>'duration_ms')::NUMERIC) AS p50,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (event_data->>'duration_ms')::NUMERIC) AS p75,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (event_data->>'duration_ms')::NUMERIC) AS p95,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY (event_data->>'duration_ms')::NUMERIC) AS p99,
    COUNT(*) AS sample_count,
    COUNT(*) FILTER (WHERE (event_data->>'is_error')::BOOLEAN = TRUE) AS error_count
  FROM analytics.raw_events
  WHERE event_type = 'performance'
    AND event_data->>'duration_ms' IS NOT NULL
    AND DATE(created_at) < CURRENT_DATE
    AND DATE(created_at) <= cutoff_date
  GROUP BY DATE(created_at), event_name, page_path
  ON CONFLICT (date, metric_name, page_path)
  DO UPDATE SET
    p50_ms = EXCLUDED.p50_ms,
    p75_ms = EXCLUDED.p75_ms,
    p95_ms = EXCLUDED.p95_ms,
    p99_ms = EXCLUDED.p99_ms,
    sample_count = EXCLUDED.sample_count,
    error_count = EXCLUDED.error_count;

  -- ===== AGGREGATE SESSIONS =====
  INSERT INTO analytics.daily_sessions (date, total_sessions, avg_duration_seconds, median_duration_seconds, avg_pages_per_session, bounce_rate, device_category)
  SELECT
    DATE(MIN(created_at)) AS date,
    COUNT(DISTINCT session_token) AS total_sessions,
    AVG(session_duration) AS avg_duration,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY session_duration) AS median_duration,
    AVG(page_count) AS avg_pages,
    COUNT(*) FILTER (WHERE page_count = 1)::NUMERIC / NULLIF(COUNT(*), 0) AS bounce_rate,
    device_category
  FROM (
    SELECT
      session_token,
      device_category,
      EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) AS session_duration,
      COUNT(*) FILTER (WHERE event_type = 'page_view') AS page_count
    FROM analytics.raw_events
    WHERE DATE(created_at) < CURRENT_DATE
      AND DATE(created_at) <= cutoff_date
    GROUP BY session_token, device_category
  ) session_stats
  GROUP BY DATE, device_category
  ON CONFLICT (date, device_category)
  DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    avg_duration_seconds = EXCLUDED.avg_duration_seconds,
    median_duration_seconds = EXCLUDED.median_duration_seconds,
    avg_pages_per_session = EXCLUDED.avg_pages_per_session,
    bounce_rate = EXCLUDED.bounce_rate;

  -- ===== AGGREGATE HOURLY ACTIVE SESSIONS =====
  INSERT INTO analytics.hourly_active_sessions (date, hour_utc, active_sessions)
  SELECT
    DATE(created_at) AS date,
    EXTRACT(HOUR FROM created_at)::SMALLINT AS hour_utc,
    COUNT(DISTINCT session_token) AS active_sessions
  FROM analytics.raw_events
  WHERE DATE(created_at) < CURRENT_DATE
    AND DATE(created_at) <= cutoff_date
  GROUP BY DATE(created_at), EXTRACT(HOUR FROM created_at)
  ON CONFLICT (date, hour_utc)
  DO UPDATE SET active_sessions = EXCLUDED.active_sessions;

  -- ===== PURGE RAW EVENTS =====
  DELETE FROM analytics.raw_events
  WHERE DATE(created_at) <= cutoff_date;
  GET DIAGNOSTICS purged_events_count = ROW_COUNT;

  -- ===== PURGE OLD ERROR EVENTS =====
  DELETE FROM analytics.error_events
  WHERE DATE(created_at) <= cutoff_date;
  GET DIAGNOSTICS purged_errors_count = ROW_COUNT;

  result := jsonb_build_object(
    'aggregated_through', cutoff_date,
    'raw_events_purged', purged_events_count,
    'error_events_purged', purged_errors_count,
    'timestamp', NOW()
  );

  RETURN result;
END;
$$;
