-- Import Audit Log
--
-- Tracks every import validation attempt for compliance (COPPA/GDPR/CCPA).
--
-- PRIVACY:
-- - Raw import JSON is NEVER stored (may contain PII if malformed)
-- - Only sanitized summary metadata is stored
-- - 90-day retention policy (GDPR Art. 5(1)(e) data minimization)
-- - RLS ensures users can only view their own import history

CREATE TABLE IF NOT EXISTS import_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  source TEXT NOT NULL,                  -- 'discord', 'manual', 'template', etc.
  validation_passed BOOLEAN NOT NULL,
  error_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  -- DO NOT store the actual import JSON (may contain PII if malformed)
  -- Only store sanitized summary (category/channel/role counts + source)
  summary JSONB NOT NULL,
  ip_address INET,                       -- For rate limiting abuse detection
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookups (own history)
CREATE INDEX IF NOT EXISTS idx_import_audit_log_user_id
  ON import_audit_log (user_id);

-- Index for cleanup job (retention policy)
CREATE INDEX IF NOT EXISTS idx_import_audit_log_created_at
  ON import_audit_log (created_at);

-- Index for abuse detection (rate limiting by IP)
CREATE INDEX IF NOT EXISTS idx_import_audit_log_ip_created
  ON import_audit_log (ip_address, created_at)
  WHERE ip_address IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE import_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own import history
CREATE POLICY "Users can view own import history"
  ON import_audit_log FOR SELECT
  USING (user_id = auth.uid());

-- System inserts audit records (authenticated users only)
CREATE POLICY "Authenticated users can insert audit records"
  ON import_audit_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Auto-delete records older than 90 days (GDPR data minimization)
-- This function should be called by pg_cron or application-level cleanup.
CREATE OR REPLACE FUNCTION cleanup_import_audit_log()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM import_audit_log
  WHERE created_at < NOW() - INTERVAL '90 days';
$$;

-- Comment for documentation
COMMENT ON TABLE import_audit_log IS
  'Tracks import validation attempts for compliance. Raw JSON is never stored. Auto-purge after 90 days.';
