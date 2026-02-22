-- Add adaptive_theme column for time-of-day theme adjustments
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS adaptive_theme BOOLEAN DEFAULT false;
