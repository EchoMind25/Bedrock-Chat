-- Migration: Enhance Server Invites with Target Types
-- Created: 2026-02-14
-- Purpose: Add support for server-wide, text channel, and voice channel invites

-- Add target_type column to server_invites table
ALTER TABLE server_invites
  ADD COLUMN IF NOT EXISTS target_type TEXT NOT NULL DEFAULT 'channel'
  CHECK (target_type IN ('channel', 'server', 'voice'));

-- Make channel_id nullable to support server-wide invites
ALTER TABLE server_invites
  ALTER COLUMN channel_id DROP NOT NULL;

-- Add comment explaining the nullable channel_id
COMMENT ON COLUMN server_invites.channel_id IS
  'NULL for server-wide invites, channel ID for channel-specific or voice invites';

-- Create index on target_type for efficient filtering
CREATE INDEX IF NOT EXISTS idx_server_invites_target_type
  ON server_invites(target_type);

-- Update existing invites to have correct target_type based on channel type
-- This ensures backward compatibility with existing data
UPDATE server_invites si
SET target_type = CASE
  WHEN c.type = 'voice' THEN 'voice'
  WHEN si.channel_id IS NULL THEN 'server'
  ELSE 'channel'
END
FROM channels c
WHERE si.channel_id = c.id;

-- Add comment to document the new column
COMMENT ON COLUMN server_invites.target_type IS
  'Type of invite: "server" (full server access), "channel" (specific text channel), or "voice" (specific voice channel)';

-- Update audit log to support invite target types in metadata
COMMENT ON TABLE audit_log IS
  'Audit log now supports invite_create and invite_delete actions with target_type in the changes field';
