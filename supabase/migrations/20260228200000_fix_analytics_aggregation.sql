-- Fix analytics.aggregate_and_purge: aggregation queries were accidentally
-- gated on `DATE(created_at) <= cutoff_date` (CURRENT_DATE - 30), which meant
-- only data OLDER than 30 days was ever aggregated. Recent events were
-- permanently skipped. The purge (DELETE) already used cutoff_date correctly.
--
-- Fix: remove the cutoff guard from all INSERT … SELECT queries so they
-- process everything up to yesterday. The purge step is unchanged.

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

  -- ===== PURGE RAW EVENTS (30-day retention) =====
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
