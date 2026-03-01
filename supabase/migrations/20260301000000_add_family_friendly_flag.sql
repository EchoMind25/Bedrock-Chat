-- ============================================================================
-- Bedrock Chat - Add is_family_friendly flag to servers
-- Created: 2026-03-01
--
-- PURPOSE:
-- Adds a boolean flag to servers indicating family-friendly status.
-- Server owners can toggle this during creation or in settings.
-- The community server is marked as family-friendly by default.
-- ============================================================================

-- Add the column with a safe default
ALTER TABLE servers
  ADD COLUMN is_family_friendly BOOLEAN NOT NULL DEFAULT FALSE;

-- Mark the community server as family-friendly
UPDATE servers
  SET is_family_friendly = TRUE
  WHERE id = 'a6591f32-b552-433a-a450-c38dbfa75271';

-- Partial index for efficient lookups of family-friendly servers
CREATE INDEX idx_servers_family_friendly
  ON servers (is_family_friendly)
  WHERE is_family_friendly = TRUE;
