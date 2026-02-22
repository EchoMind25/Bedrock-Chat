-- Migration: Comprehensive user_settings upgrade for personalization system
-- Date: 2026-02-22
-- Purpose: Add missing columns (bug fix) + new appearance/personalization columns

-- ═══════════════════════════════════════════════════════════
-- PART 1: Add missing columns that the TypeScript interface expects
-- ═══════════════════════════════════════════════════════════

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT 'oklch(0.65 0.25 265)',
  ADD COLUMN IF NOT EXISTS animations_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS read_receipts BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS typing_indicators BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS desktop_notifications BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_sound TEXT NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS mention_notifications BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dm_notifications BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS high_contrast BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS screen_reader_mode BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS input_device TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS output_device TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS input_volume INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS output_volume INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS noise_suppression BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS echo_cancellation BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS developer_mode BOOLEAN NOT NULL DEFAULT false;

-- ═══════════════════════════════════════════════════════════
-- PART 2: New personalization columns
-- ═══════════════════════════════════════════════════════════

ALTER TABLE user_settings
  -- Typography
  ADD COLUMN IF NOT EXISTS font_family TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS ui_font_size TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS line_height TEXT NOT NULL DEFAULT 'normal',
  -- Chat visuals
  ADD COLUMN IF NOT EXISTS message_style TEXT NOT NULL DEFAULT 'flat',
  ADD COLUMN IF NOT EXISTS chat_background TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS timestamp_format TEXT NOT NULL DEFAULT 'relative',
  -- Accessibility
  ADD COLUMN IF NOT EXISTS color_blind_mode TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS animation_speed REAL NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS dyslexia_font BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS focus_indicator TEXT NOT NULL DEFAULT 'default',
  -- Theme sharing
  ADD COLUMN IF NOT EXISTS custom_theme_json JSONB DEFAULT NULL;

-- ═══════════════════════════════════════════════════════════
-- PART 3: Constraints
-- ═══════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_font_family_check') THEN
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_font_family_check
      CHECK (font_family IN ('system', 'inter', 'sf-pro', 'jetbrains-mono', 'merriweather', 'opendyslexic'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_ui_font_size_check') THEN
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_ui_font_size_check
      CHECK (ui_font_size IN ('small', 'medium', 'large'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_line_height_check') THEN
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_line_height_check
      CHECK (line_height IN ('tight', 'normal', 'relaxed'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_message_style_check') THEN
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_message_style_check
      CHECK (message_style IN ('flat', 'bubble', 'minimal'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_timestamp_format_check') THEN
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_timestamp_format_check
      CHECK (timestamp_format IN ('relative', '12h', '24h', 'full'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_color_blind_mode_check') THEN
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_color_blind_mode_check
      CHECK (color_blind_mode IN ('none', 'protanopia', 'deuteranopia', 'tritanopia'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_animation_speed_check') THEN
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_animation_speed_check
      CHECK (animation_speed >= 0 AND animation_speed <= 2.0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_focus_indicator_check') THEN
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_focus_indicator_check
      CHECK (focus_indicator IN ('default', 'high-visibility', 'outline-only'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_input_volume_check') THEN
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_input_volume_check
      CHECK (input_volume >= 0 AND input_volume <= 200);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_output_volume_check') THEN
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_output_volume_check
      CHECK (output_volume >= 0 AND output_volume <= 200);
  END IF;
END
$$;
