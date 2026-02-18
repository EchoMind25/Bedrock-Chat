-- Migration: Add extended appearance columns to user_settings
-- Date: 2026-02-19
-- Purpose: Wire remaining appearance controls (larger_text, show_avatars,
--          show_timestamps, message_density) to the database so they persist
--          across devices and sessions instead of living only in localStorage.

-- Add columns (idempotent — safe to re-run)
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS larger_text BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_avatars BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_timestamps BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS message_density TEXT NOT NULL DEFAULT 'default';

-- Constrain message_density to known values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_settings_message_density_check'
  ) THEN
    ALTER TABLE user_settings
      ADD CONSTRAINT user_settings_message_density_check
      CHECK (message_density IN ('compact', 'default', 'spacious'));
  END IF;
END
$$;
