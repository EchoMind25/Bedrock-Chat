-- ============================================================================
-- Bedrock Chat - Migration Funnel Analytics (Aggregate Only)
-- Created: 2026-03-05
-- Purpose: Privacy-first analytics for Discord→Bedrock migration funnel.
--          Uses daily aggregate counters — NO per-user tracking, NO cookies,
--          NO device fingerprints, NO PII. Referer header is categorized
--          server-side into source buckets, then discarded.
--
-- PRIVACY NOTES:
-- - Zero per-user records (only daily aggregate counters)
-- - No cookies set by analytics system
-- - No client-side tracking scripts
-- - Referer header categorized once, never stored
-- - 90-day retention (GDPR Art. 5(1)(e) — storage limitation)
-- - Marketing can truthfully say "zero tracking analytics"
-- ============================================================================

-- ============================================================================
-- 1. CREATE migration_funnel_stats table
-- ============================================================================

CREATE TABLE IF NOT EXISTS migration_funnel_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Funnel stages (daily aggregates)
  switch_page_views INTEGER NOT NULL DEFAULT 0,        -- /switch page loads
  import_started INTEGER NOT NULL DEFAULT 0,           -- Started import wizard
  import_completed INTEGER NOT NULL DEFAULT 0,         -- Finished server creation
  invite_links_generated INTEGER NOT NULL DEFAULT 0,   -- Invite links created
  invite_links_clicked INTEGER NOT NULL DEFAULT 0,     -- Invite page loads
  invite_signups INTEGER NOT NULL DEFAULT 0,           -- New accounts from invites
  invite_joins INTEGER NOT NULL DEFAULT 0,             -- Successfully joined server

  -- Source tracking (aggregated, not per-user)
  source_direct INTEGER NOT NULL DEFAULT 0,
  source_search INTEGER NOT NULL DEFAULT 0,
  source_discord_link INTEGER NOT NULL DEFAULT 0,
  source_qr_code INTEGER NOT NULL DEFAULT 0,
  source_other INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT migration_funnel_stats_date_unique UNIQUE (date)
);

COMMENT ON TABLE migration_funnel_stats IS
  'Daily aggregate counters for migration funnel. NO per-user data. 90-day retention.';

COMMENT ON COLUMN migration_funnel_stats.switch_page_views IS 'Incremented server-side on /switch page load';
COMMENT ON COLUMN migration_funnel_stats.source_discord_link IS 'Referer contains discord.com — header categorized then discarded';
COMMENT ON COLUMN migration_funnel_stats.source_qr_code IS 'URL has ?src=qr parameter (set by QR code generator)';

-- ============================================================================
-- 2. RLS — platform admins only
-- ============================================================================

ALTER TABLE migration_funnel_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins view migration stats"
  ON migration_funnel_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND platform_role IN ('admin', 'super_admin')
    )
  );

-- No INSERT/UPDATE/DELETE policies for regular users.
-- All writes go through SECURITY DEFINER functions.

-- ============================================================================
-- 3. Server-side increment function (SECURITY DEFINER)
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_migration_stat(
  stat_name TEXT,
  source_category TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Ensure today's row exists
  INSERT INTO migration_funnel_stats (date)
  VALUES (CURRENT_DATE)
  ON CONFLICT ON CONSTRAINT migration_funnel_stats_date_unique DO NOTHING;

  -- Increment the funnel stage counter
  IF stat_name IN (
    'switch_page_views', 'import_started', 'import_completed',
    'invite_links_generated', 'invite_links_clicked',
    'invite_signups', 'invite_joins'
  ) THEN
    EXECUTE format(
      'UPDATE migration_funnel_stats SET %I = %I + 1 WHERE date = CURRENT_DATE',
      stat_name, stat_name
    );
  END IF;

  -- Increment source counter (if provided)
  IF source_category IN (
    'source_direct', 'source_search', 'source_discord_link',
    'source_qr_code', 'source_other'
  ) THEN
    EXECUTE format(
      'UPDATE migration_funnel_stats SET %I = %I + 1 WHERE date = CURRENT_DATE',
      source_category, source_category
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_migration_stat IS
  'Atomically increment a migration funnel counter. SECURITY DEFINER — no RLS bypass needed by callers.';

-- ============================================================================
-- 4. Cleanup function for 90-day retention
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_migration_stats()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM migration_funnel_stats
  WHERE date < CURRENT_DATE - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_migration_stats IS
  'Delete migration stats older than 90 days. Call via pg_cron or app-level scheduler.';

-- ============================================================================
-- 5. Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_migration_funnel_stats_date
  ON migration_funnel_stats (date DESC);
