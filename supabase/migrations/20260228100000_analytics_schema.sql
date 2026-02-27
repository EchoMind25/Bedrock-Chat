-- ============================================================
-- Analytics Schema
-- Privacy-first analytics for Bedrock Chat
-- 30-day raw event retention, indefinite aggregates
-- All data isolated in 'analytics' schema with RLS
-- Idempotent: safe to run multiple times
-- ============================================================

CREATE SCHEMA IF NOT EXISTS analytics;

-- ============================================================
-- RAW EVENTS TABLE (purged after 30 days)
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics.raw_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT NOT NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('page_view', 'feature_use', 'performance', 'session', 'error')),
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_path TEXT,
  referrer_path TEXT,
  device_category TEXT
    CHECK (device_category IS NULL OR device_category IN ('desktop', 'tablet', 'mobile')),
  viewport_bucket TEXT
    CHECK (viewport_bucket IS NULL OR viewport_bucket IN ('sm', 'md', 'lg', 'xl')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_raw_events_created ON analytics.raw_events (created_at);
CREATE INDEX IF NOT EXISTS idx_raw_events_type ON analytics.raw_events (event_type, event_name);
CREATE INDEX IF NOT EXISTS idx_raw_events_session ON analytics.raw_events (session_token);
CREATE INDEX IF NOT EXISTS idx_raw_events_page ON analytics.raw_events (page_path);

-- ============================================================
-- AGGREGATE TABLES (kept indefinitely)
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics.daily_page_flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  from_path TEXT,
  to_path TEXT NOT NULL,
  transition_count INTEGER DEFAULT 0,
  unique_sessions INTEGER DEFAULT 0,
  avg_time_on_from_seconds NUMERIC(10,2),
  UNIQUE(date, from_path, to_path)
);

CREATE TABLE IF NOT EXISTS analytics.daily_feature_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  feature_name TEXT NOT NULL,
  feature_category TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  unique_sessions INTEGER DEFAULT 0,
  device_category TEXT,
  UNIQUE(date, feature_name, device_category)
);

CREATE TABLE IF NOT EXISTS analytics.daily_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  page_path TEXT,
  p50_ms NUMERIC(10,2),
  p75_ms NUMERIC(10,2),
  p95_ms NUMERIC(10,2),
  p99_ms NUMERIC(10,2),
  sample_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  UNIQUE(date, metric_name, page_path)
);

CREATE TABLE IF NOT EXISTS analytics.daily_sessions (
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

CREATE TABLE IF NOT EXISTS analytics.hourly_active_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  hour_utc SMALLINT NOT NULL CHECK (hour_utc >= 0 AND hour_utc <= 23),
  active_sessions INTEGER DEFAULT 0,
  UNIQUE(date, hour_utc)
);

-- ============================================================
-- ERROR LOG (30-day retention)
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics.error_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT NOT NULL,
  error_type TEXT NOT NULL
    CHECK (error_type IN ('js_error', 'api_error', 'network_error', 'voice_error')),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  page_path TEXT,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_error_events_created ON analytics.error_events (created_at);
CREATE INDEX IF NOT EXISTS idx_error_events_session ON analytics.error_events (session_token);

-- ============================================================
-- BUG REPORTS (user-initiated, separate from analytics events)
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics.bug_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_display_name TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN ('bug', 'ui_issue', 'performance', 'voice_issue', 'other')),
  severity TEXT DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  page_path TEXT,
  device_category TEXT,
  viewport_bucket TEXT,
  browser_family TEXT,
  os_family TEXT,
  recent_errors JSONB DEFAULT '[]',
  screenshot_paths TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'new'
    CHECK (status IN ('new', 'triaging', 'investigating', 'resolved', 'wont_fix')),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON analytics.bug_reports (status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created ON analytics.bug_reports (created_at);
CREATE INDEX IF NOT EXISTS idx_bug_reports_category ON analytics.bug_reports (category, severity);

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

-- Drop and recreate policies so this file is safe to re-run
DROP POLICY IF EXISTS "super_admin_read_raw_events" ON analytics.raw_events;
CREATE POLICY "super_admin_read_raw_events" ON analytics.raw_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "super_admin_read_daily_page_flows" ON analytics.daily_page_flows;
CREATE POLICY "super_admin_read_daily_page_flows" ON analytics.daily_page_flows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "super_admin_read_daily_feature_usage" ON analytics.daily_feature_usage;
CREATE POLICY "super_admin_read_daily_feature_usage" ON analytics.daily_feature_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "super_admin_read_daily_performance" ON analytics.daily_performance;
CREATE POLICY "super_admin_read_daily_performance" ON analytics.daily_performance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "super_admin_read_daily_sessions" ON analytics.daily_sessions;
CREATE POLICY "super_admin_read_daily_sessions" ON analytics.daily_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "super_admin_read_hourly_active" ON analytics.hourly_active_sessions;
CREATE POLICY "super_admin_read_hourly_active" ON analytics.hourly_active_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "super_admin_read_error_events" ON analytics.error_events;
CREATE POLICY "super_admin_read_error_events" ON analytics.error_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "super_admin_read_bug_reports" ON analytics.bug_reports;
CREATE POLICY "super_admin_read_bug_reports" ON analytics.bug_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "authenticated_insert_bug_reports" ON analytics.bug_reports;
CREATE POLICY "authenticated_insert_bug_reports" ON analytics.bug_reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "super_admin_update_bug_reports" ON analytics.bug_reports;
CREATE POLICY "super_admin_update_bug_reports" ON analytics.bug_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

-- ============================================================
-- AGGREGATION FUNCTION
-- Aggregates raw events into daily tables, then purges raw data
-- older than retention_days. Runs nightly via edge function cron.
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
  GROUP BY DATE(created_at), EXTRACT(HOUR FROM created_at)
  ON CONFLICT (date, hour_utc)
  DO UPDATE SET active_sessions = EXCLUDED.active_sessions;

  -- ===== PURGE RAW EVENTS (retention_days cutoff) =====
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

-- ============================================================
-- PUBLIC SCHEMA ACCESSOR FUNCTIONS
-- Server-side API routes call these via service client .rpc()
-- without needing 'analytics' schema exposed in PostgREST.
-- SECURITY DEFINER: runs as function owner (postgres) so it
-- can access analytics schema tables regardless of exposure.
-- Each function verifies caller is service_role (server API)
-- or a verified super_admin before returning data.
-- ============================================================

CREATE OR REPLACE FUNCTION public.analytics_get_page_flows(p_start date, p_end date)
RETURNS TABLE (
  from_path TEXT,
  to_path TEXT,
  transition_count INTEGER,
  unique_sessions INTEGER,
  avg_time_on_from_seconds NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() != 'service_role' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND platform_role = 'super_admin'
    ) THEN
      RAISE EXCEPTION 'Permission denied';
    END IF;
  END IF;
  RETURN QUERY
    SELECT dpf.from_path, dpf.to_path, dpf.transition_count, dpf.unique_sessions, dpf.avg_time_on_from_seconds
    FROM analytics.daily_page_flows dpf
    WHERE dpf.date >= p_start AND dpf.date <= p_end
    ORDER BY dpf.transition_count DESC
    LIMIT 50;
END;
$$;

CREATE OR REPLACE FUNCTION public.analytics_get_feature_usage(p_start date, p_end date)
RETURNS TABLE (
  date DATE,
  feature_name TEXT,
  feature_category TEXT,
  usage_count INTEGER,
  unique_sessions INTEGER,
  device_category TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() != 'service_role' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND platform_role = 'super_admin'
    ) THEN
      RAISE EXCEPTION 'Permission denied';
    END IF;
  END IF;
  RETURN QUERY
    SELECT dfu.date, dfu.feature_name, dfu.feature_category, dfu.usage_count, dfu.unique_sessions, dfu.device_category
    FROM analytics.daily_feature_usage dfu
    WHERE dfu.date >= p_start AND dfu.date <= p_end;
END;
$$;

CREATE OR REPLACE FUNCTION public.analytics_get_performance(p_start date, p_end date)
RETURNS TABLE (
  date DATE,
  metric_name TEXT,
  page_path TEXT,
  p50_ms NUMERIC,
  p75_ms NUMERIC,
  p95_ms NUMERIC,
  p99_ms NUMERIC,
  sample_count INTEGER,
  error_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() != 'service_role' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND platform_role = 'super_admin'
    ) THEN
      RAISE EXCEPTION 'Permission denied';
    END IF;
  END IF;
  RETURN QUERY
    SELECT dp.date, dp.metric_name, dp.page_path, dp.p50_ms, dp.p75_ms, dp.p95_ms, dp.p99_ms, dp.sample_count, dp.error_count
    FROM analytics.daily_performance dp
    WHERE dp.date >= p_start AND dp.date <= p_end;
END;
$$;

CREATE OR REPLACE FUNCTION public.analytics_get_sessions(p_start date, p_end date)
RETURNS TABLE (
  date DATE,
  total_sessions INTEGER,
  avg_duration_seconds NUMERIC,
  median_duration_seconds NUMERIC,
  avg_pages_per_session NUMERIC,
  bounce_rate NUMERIC,
  device_category TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() != 'service_role' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND platform_role = 'super_admin'
    ) THEN
      RAISE EXCEPTION 'Permission denied';
    END IF;
  END IF;
  RETURN QUERY
    SELECT ds.date, ds.total_sessions, ds.avg_duration_seconds, ds.median_duration_seconds, ds.avg_pages_per_session, ds.bounce_rate, ds.device_category
    FROM analytics.daily_sessions ds
    WHERE ds.date >= p_start AND ds.date <= p_end
    ORDER BY ds.date ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.analytics_get_hourly_sessions(p_start date, p_end date)
RETURNS TABLE (
  date DATE,
  hour_utc SMALLINT,
  active_sessions INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() != 'service_role' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND platform_role = 'super_admin'
    ) THEN
      RAISE EXCEPTION 'Permission denied';
    END IF;
  END IF;
  RETURN QUERY
    SELECT has2.date, has2.hour_utc, has2.active_sessions
    FROM analytics.hourly_active_sessions has2
    WHERE has2.date >= p_start AND has2.date <= p_end;
END;
$$;

CREATE OR REPLACE FUNCTION public.analytics_get_bug_reports(
  p_severity text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  session_token TEXT,
  user_id UUID,
  user_display_name TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  severity TEXT,
  page_path TEXT,
  device_category TEXT,
  viewport_bucket TEXT,
  browser_family TEXT,
  os_family TEXT,
  recent_errors JSONB,
  screenshot_paths TEXT[],
  status TEXT,
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() != 'service_role' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND platform_role = 'super_admin'
    ) THEN
      RAISE EXCEPTION 'Permission denied';
    END IF;
  END IF;
  RETURN QUERY
    SELECT
      br.id, br.session_token, br.user_id, br.user_display_name,
      br.title, br.description, br.category, br.severity,
      br.page_path, br.device_category, br.viewport_bucket,
      br.browser_family, br.os_family, br.recent_errors,
      br.screenshot_paths, br.status, br.admin_notes,
      br.resolved_at, br.created_at
    FROM analytics.bug_reports br
    WHERE (p_severity IS NULL OR br.severity = p_severity)
      AND (p_category IS NULL OR br.category = p_category)
      AND (p_status IS NULL OR br.status = p_status)
    ORDER BY br.created_at DESC
    LIMIT 100;
END;
$$;

CREATE OR REPLACE FUNCTION public.analytics_update_bug_report(
  p_id uuid,
  p_status text DEFAULT NULL,
  p_admin_notes text DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() != 'service_role' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND platform_role = 'super_admin'
    ) THEN
      RAISE EXCEPTION 'Permission denied';
    END IF;
  END IF;
  UPDATE analytics.bug_reports
  SET
    status = COALESCE(p_status, status),
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    resolved_at = CASE
      WHEN p_status = 'resolved' THEN NOW()
      ELSE resolved_at
    END
  WHERE id = p_id;
END;
$$;
