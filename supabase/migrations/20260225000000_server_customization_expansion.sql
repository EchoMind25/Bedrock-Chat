-- ============================================================================
-- MIGRATION: Server Customization Expansion
-- Generated: 2026-02-25
-- Description: Makes each server feel like its own world with:
--   - server_themes (per-server OKLCH color palettes, effects, custom CSS)
--   - server_emojis (custom emoji per server)
--   - server_sticker_packs + server_stickers (custom sticker system)
--   - server_sounds (soundboard clips)
--   - server_welcome_screens (custom onboarding flows)
--   - server_onboarding_progress (per-user completion tracking)
--   - server_events + server_event_rsvps (scheduled events with RSVP)
--   - server_webhooks (incoming/outgoing webhook integrations)
--   - server_templates (shareable server configurations)
--   - server_widgets (embeddable server info)
--   - server_bots + bot_commands (AI bot framework prep for Claude API)
--
-- Also adds 4 storage buckets and extends audit_log actions.
--
-- PRIVACY: All tables enforce RLS with server membership checks.
-- ============================================================================

-- ============================================================================
-- TABLE: server_themes
-- Per-server visual identity with OKLCH color palette, effects, and layout
-- ============================================================================

CREATE TABLE IF NOT EXISTS server_themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL UNIQUE REFERENCES servers(id) ON DELETE CASCADE,

  -- Theme identity
  theme_preset_id TEXT, -- NULL = custom, or references a built-in preset
  name TEXT NOT NULL DEFAULT 'Custom Theme',

  -- OKLCH Color Palette (9 colors)
  color_primary TEXT NOT NULL DEFAULT 'oklch(0.65 0.25 265)',
  color_secondary TEXT NOT NULL DEFAULT 'oklch(0.55 0.25 265)',
  color_accent TEXT NOT NULL DEFAULT 'oklch(0.7 0.2 195)',
  color_background TEXT NOT NULL DEFAULT 'oklch(0.1 0.03 285)',
  color_surface TEXT NOT NULL DEFAULT 'oklch(0.15 0.04 290 / 0.7)',
  color_text TEXT NOT NULL DEFAULT 'oklch(0.93 0.01 285)',
  color_text_muted TEXT NOT NULL DEFAULT 'oklch(0.65 0.03 285)',
  color_border TEXT NOT NULL DEFAULT 'oklch(0.3 0.06 310 / 0.4)',
  color_atmosphere TEXT NOT NULL DEFAULT 'oklch(0.4 0.15 310 / 0.08)',

  -- Effects
  effect_parallax BOOLEAN NOT NULL DEFAULT FALSE,
  effect_particles BOOLEAN NOT NULL DEFAULT FALSE,
  effect_glass_blur BOOLEAN NOT NULL DEFAULT TRUE,
  effect_glow BOOLEAN NOT NULL DEFAULT FALSE,

  -- Layout
  layout TEXT NOT NULL DEFAULT 'spacious'
    CHECK (layout IN ('compact', 'spacious', 'minimal')),
  environment TEXT NOT NULL DEFAULT 'neon'
    CHECK (environment IN ('neon', 'industrial', 'organic', 'abstract')),

  -- Custom CSS (sanitized server-side, limited properties only)
  custom_css TEXT CHECK (custom_css IS NULL OR char_length(custom_css) <= 5000),

  -- Extended visuals
  animated_banner_url TEXT,
  splash_image_url TEXT, -- Server invite splash image

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_server_themes_updated_at
  BEFORE UPDATE ON server_themes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TABLE: server_emojis
-- Custom emoji uploaded per server
-- ============================================================================

CREATE TABLE IF NOT EXISTS server_emojis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 32),
  image_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  is_animated BOOLEAN NOT NULL DEFAULT FALSE,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_server_emoji_name UNIQUE (server_id, name)
);

CREATE INDEX idx_server_emojis_server ON server_emojis (server_id);

-- ============================================================================
-- TABLE: server_sticker_packs
-- Grouping for stickers
-- ============================================================================

CREATE TABLE IF NOT EXISTS server_sticker_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 50),
  description TEXT CHECK (char_length(description) <= 200),
  banner_image_url TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sticker_packs_server ON server_sticker_packs (server_id);

-- ============================================================================
-- TABLE: server_stickers
-- Individual stickers within packs
-- ============================================================================

CREATE TABLE IF NOT EXISTS server_stickers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pack_id UUID NOT NULL REFERENCES server_sticker_packs(id) ON DELETE CASCADE,
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 32),
  description TEXT CHECK (char_length(description) <= 100),
  image_url TEXT NOT NULL,
  is_animated BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_server_sticker_name UNIQUE (server_id, name)
);

CREATE INDEX idx_server_stickers_server ON server_stickers (server_id);
CREATE INDEX idx_server_stickers_pack ON server_stickers (pack_id);

-- ============================================================================
-- TABLE: server_sounds
-- Soundboard clips per server (max 10 seconds, 1MB)
-- ============================================================================

CREATE TABLE IF NOT EXISTS server_sounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 50),
  audio_url TEXT NOT NULL,
  duration_ms INTEGER NOT NULL CHECK (duration_ms > 0 AND duration_ms <= 10000),
  volume REAL NOT NULL DEFAULT 1.0 CHECK (volume >= 0.0 AND volume <= 1.0),
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  use_count INTEGER NOT NULL DEFAULT 0,
  emoji TEXT, -- Optional visual indicator
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_server_sound_name UNIQUE (server_id, name)
);

CREATE INDEX idx_server_sounds_server ON server_sounds (server_id);

-- ============================================================================
-- TABLE: server_welcome_screens
-- Custom onboarding flow configuration per server
-- ============================================================================

CREATE TABLE IF NOT EXISTS server_welcome_screens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL UNIQUE REFERENCES servers(id) ON DELETE CASCADE,

  enabled BOOLEAN NOT NULL DEFAULT FALSE,

  -- Welcome content
  title TEXT NOT NULL DEFAULT 'Welcome!' CHECK (char_length(title) <= 100),
  description TEXT CHECK (char_length(description) <= 2000),

  -- Visual
  background_image_url TEXT,
  background_color TEXT, -- OKLCH

  -- Action buttons (up to 5 channels to highlight)
  featured_channels UUID[] DEFAULT '{}',

  -- Onboarding steps (JSONB array)
  -- Each step: { title, description, emoji, action?: { type: "role_select"|"channel_visit"|"rules_accept"|"info", data?: {} } }
  onboarding_steps JSONB DEFAULT '[]',

  -- Role selection on join
  selectable_roles UUID[] DEFAULT '{}',
  require_role_selection BOOLEAN NOT NULL DEFAULT FALSE,

  -- Rules acceptance
  require_rules_acceptance BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_welcome_screens_updated_at
  BEFORE UPDATE ON server_welcome_screens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TABLE: server_onboarding_progress
-- Track which users have completed onboarding per server
-- ============================================================================

CREATE TABLE IF NOT EXISTS server_onboarding_progress (
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  accepted_rules_at TIMESTAMPTZ,
  selected_roles UUID[] DEFAULT '{}',
  current_step INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (server_id, user_id)
);

-- ============================================================================
-- TABLE: server_events
-- Scheduled events with type, timing, and recurrence
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE event_entity_type AS ENUM ('voice', 'stage', 'external');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS server_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,

  -- Event info
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 4000),
  image_url TEXT,

  -- Type and location
  event_type event_entity_type NOT NULL DEFAULT 'voice',
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  external_location TEXT CHECK (char_length(external_location) <= 500),

  -- Timing
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,

  -- Status
  status event_status NOT NULL DEFAULT 'scheduled',

  -- Creator
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Denormalized RSVP count
  interested_count INTEGER NOT NULL DEFAULT 0,

  -- Recurrence (null = one-time, iCal RRULE format)
  recurrence_rule TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_server_events_server ON server_events (server_id, starts_at);
CREATE INDEX idx_server_events_upcoming ON server_events (starts_at)
  WHERE status = 'scheduled';

CREATE TRIGGER trigger_server_events_updated_at
  BEFORE UPDATE ON server_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TABLE: server_event_rsvps
-- RSVP tracking for events
-- ============================================================================

CREATE TABLE IF NOT EXISTS server_event_rsvps (
  event_id UUID NOT NULL REFERENCES server_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'going', 'not_going')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX idx_event_rsvps_user ON server_event_rsvps (user_id);

-- ============================================================================
-- TABLE: server_webhooks
-- Incoming/outgoing webhook integrations
-- ============================================================================

CREATE TABLE IF NOT EXISTS server_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,

  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  avatar_url TEXT,

  -- Webhook secret for HMAC verification
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),

  -- Webhook type
  type TEXT NOT NULL DEFAULT 'incoming' CHECK (type IN ('incoming', 'outgoing')),

  -- Outgoing webhook URL
  url TEXT CHECK (char_length(url) <= 2000),

  -- Event subscriptions (for outgoing)
  events TEXT[] DEFAULT '{}',

  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  last_used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_server_webhooks_server ON server_webhooks (server_id);
CREATE INDEX idx_server_webhooks_channel ON server_webhooks (channel_id);
CREATE UNIQUE INDEX idx_server_webhooks_token ON server_webhooks (token);

CREATE TRIGGER trigger_server_webhooks_updated_at
  BEFORE UPDATE ON server_webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TABLE: server_templates
-- Shareable server configuration snapshots
-- ============================================================================

CREATE TABLE IF NOT EXISTS server_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 1000),

  source_server_id UUID REFERENCES servers(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Full snapshot of server configuration
  template_data JSONB NOT NULL,

  -- Sharing
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  code TEXT NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  use_count INTEGER NOT NULL DEFAULT 0,

  preview_image_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_server_templates_code ON server_templates (code);
CREATE INDEX idx_server_templates_public ON server_templates (is_public) WHERE is_public = TRUE;
CREATE INDEX idx_server_templates_creator ON server_templates (created_by);

CREATE TRIGGER trigger_server_templates_updated_at
  BEFORE UPDATE ON server_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TABLE: server_widgets
-- Embeddable server information widgets
-- ============================================================================

CREATE TABLE IF NOT EXISTS server_widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL UNIQUE REFERENCES servers(id) ON DELETE CASCADE,

  enabled BOOLEAN NOT NULL DEFAULT FALSE,

  show_member_count BOOLEAN NOT NULL DEFAULT TRUE,
  show_online_count BOOLEAN NOT NULL DEFAULT TRUE,
  show_channels BOOLEAN NOT NULL DEFAULT TRUE,
  show_voice_channels BOOLEAN NOT NULL DEFAULT TRUE,
  invite_channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,

  accent_color TEXT DEFAULT 'oklch(0.65 0.25 265)',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_server_widgets_updated_at
  BEFORE UPDATE ON server_widgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TABLE: server_bots
-- Bot accounts (custom, webhook, or Claude-powered)
-- ============================================================================

CREATE TABLE IF NOT EXISTS server_bots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,

  -- Bot identity
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  avatar_url TEXT,
  description TEXT CHECK (char_length(description) <= 500),

  -- Bot type
  bot_type TEXT NOT NULL DEFAULT 'custom' CHECK (bot_type IN ('custom', 'claude', 'webhook')),

  -- Authentication
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),

  -- Claude-specific configuration (JSONB)
  -- { model, systemPrompt, triggerMode, prefix, allowedChannels, maxTokens, temperature, tools, personality, rateLimit }
  claude_config JSONB DEFAULT NULL,

  -- Permissions (bitfield, same as role permissions)
  permissions BIGINT NOT NULL DEFAULT 0,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Usage tracking
  messages_sent INTEGER NOT NULL DEFAULT 0,
  last_active_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_bot_name_per_server UNIQUE (server_id, name)
);

CREATE INDEX idx_server_bots_server ON server_bots (server_id);
CREATE UNIQUE INDEX idx_server_bots_token ON server_bots (token);

CREATE TRIGGER trigger_server_bots_updated_at
  BEFORE UPDATE ON server_bots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TABLE: bot_commands
-- Per-bot command definitions
-- ============================================================================

CREATE TABLE IF NOT EXISTS bot_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES server_bots(id) ON DELETE CASCADE,

  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 32),
  description TEXT CHECK (char_length(description) <= 200),

  trigger TEXT NOT NULL,
  response_type TEXT NOT NULL DEFAULT 'text' CHECK (response_type IN ('text', 'embed', 'action')),

  -- For claude bots: additional context per command
  system_prompt_override TEXT CHECK (char_length(system_prompt_override) <= 2000),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bot_commands_bot ON bot_commands (bot_id);

-- ============================================================================
-- Add bot_id column to messages for bot message attribution
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'bot_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN bot_id UUID REFERENCES server_bots(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE server_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_emojis ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_sticker_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_sounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_welcome_screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_commands ENABLE ROW LEVEL SECURITY;

-- ── Server Themes: Members can read, admins can manage ──

CREATE POLICY server_themes_select ON server_themes
  FOR SELECT TO authenticated
  USING (is_server_member(server_id, auth.uid()));

CREATE POLICY server_themes_manage ON server_themes
  FOR ALL TO authenticated
  USING (is_server_admin(server_id, auth.uid()));

-- ── Server Emojis: Members can read, admins can manage ──

CREATE POLICY server_emojis_select ON server_emojis
  FOR SELECT TO authenticated
  USING (is_server_member(server_id, auth.uid()));

CREATE POLICY server_emojis_manage ON server_emojis
  FOR ALL TO authenticated
  USING (is_server_admin(server_id, auth.uid()));

-- ── Sticker Packs: Members can read, admins can manage ──

CREATE POLICY sticker_packs_select ON server_sticker_packs
  FOR SELECT TO authenticated
  USING (is_server_member(server_id, auth.uid()));

CREATE POLICY sticker_packs_manage ON server_sticker_packs
  FOR ALL TO authenticated
  USING (is_server_admin(server_id, auth.uid()));

-- ── Stickers: Members can read, admins can manage ──

CREATE POLICY stickers_select ON server_stickers
  FOR SELECT TO authenticated
  USING (is_server_member(server_id, auth.uid()));

CREATE POLICY stickers_manage ON server_stickers
  FOR ALL TO authenticated
  USING (is_server_admin(server_id, auth.uid()));

-- ── Server Sounds: Members can read, admins can manage ──

CREATE POLICY server_sounds_select ON server_sounds
  FOR SELECT TO authenticated
  USING (is_server_member(server_id, auth.uid()));

CREATE POLICY server_sounds_manage ON server_sounds
  FOR ALL TO authenticated
  USING (is_server_admin(server_id, auth.uid()));

-- ── Welcome Screens: Members can read, admins can manage ──

CREATE POLICY welcome_screens_select ON server_welcome_screens
  FOR SELECT TO authenticated
  USING (is_server_member(server_id, auth.uid()));

CREATE POLICY welcome_screens_manage ON server_welcome_screens
  FOR ALL TO authenticated
  USING (is_server_admin(server_id, auth.uid()));

-- ── Onboarding Progress: Users can manage their own ──

CREATE POLICY onboarding_progress_select ON server_onboarding_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY onboarding_progress_upsert ON server_onboarding_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- ── Server Events: Members can read, admins can manage ──

CREATE POLICY server_events_select ON server_events
  FOR SELECT TO authenticated
  USING (is_server_member(server_id, auth.uid()));

CREATE POLICY server_events_manage ON server_events
  FOR ALL TO authenticated
  USING (is_server_admin(server_id, auth.uid()));

-- ── Event RSVPs: Members can read, users manage their own ──

CREATE POLICY event_rsvps_select ON server_event_rsvps
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM server_events e
    WHERE e.id = server_event_rsvps.event_id
      AND is_server_member(e.server_id, auth.uid())
  ));

CREATE POLICY event_rsvps_own ON server_event_rsvps
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- ── Webhooks: Admins only ──

CREATE POLICY server_webhooks_select ON server_webhooks
  FOR SELECT TO authenticated
  USING (is_server_admin(server_id, auth.uid()));

CREATE POLICY server_webhooks_manage ON server_webhooks
  FOR ALL TO authenticated
  USING (is_server_admin(server_id, auth.uid()));

-- ── Templates: Public templates viewable by all, creators manage their own ──

CREATE POLICY server_templates_select ON server_templates
  FOR SELECT TO authenticated
  USING (is_public = TRUE OR created_by = auth.uid());

CREATE POLICY server_templates_manage ON server_templates
  FOR ALL TO authenticated
  USING (created_by = auth.uid());

-- ── Widgets: Public servers' widgets readable, admins manage ──

CREATE POLICY server_widgets_select ON server_widgets
  FOR SELECT TO authenticated
  USING (
    enabled = TRUE
    AND EXISTS (SELECT 1 FROM servers s WHERE s.id = server_id AND s.is_public = TRUE)
  );

CREATE POLICY server_widgets_manage ON server_widgets
  FOR ALL TO authenticated
  USING (is_server_admin(server_id, auth.uid()));

-- ── Bots: Members can read, admins can manage ──

CREATE POLICY server_bots_select ON server_bots
  FOR SELECT TO authenticated
  USING (is_server_member(server_id, auth.uid()));

CREATE POLICY server_bots_manage ON server_bots
  FOR ALL TO authenticated
  USING (is_server_admin(server_id, auth.uid()));

-- ── Bot Commands: Members can read, admins can manage ──

CREATE POLICY bot_commands_select ON bot_commands
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM server_bots b
    WHERE b.id = bot_commands.bot_id
      AND is_server_member(b.server_id, auth.uid())
  ));

CREATE POLICY bot_commands_manage ON bot_commands
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM server_bots b
    WHERE b.id = bot_commands.bot_id
      AND is_server_admin(b.server_id, auth.uid())
  ));

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Server Emojis (256KB, png/gif/webp)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'server-emojis', 'server-emojis', true,
  262144,
  ARRAY['image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read for server emojis" ON storage.objects
  FOR SELECT USING (bucket_id = 'server-emojis');

CREATE POLICY "Server admins upload emojis" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'server-emojis'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id::text = (string_to_array(name, '/'))[1]
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Server admins delete emojis" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'server-emojis'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id::text = (string_to_array(name, '/'))[1]
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin')
    )
  );

-- Server Stickers (512KB, png/gif/webp/json for Lottie)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'server-stickers', 'server-stickers', true,
  524288,
  ARRAY['image/png', 'image/gif', 'image/webp', 'application/json']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read for server stickers" ON storage.objects
  FOR SELECT USING (bucket_id = 'server-stickers');

CREATE POLICY "Server admins upload stickers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'server-stickers'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id::text = (string_to_array(name, '/'))[1]
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Server admins delete stickers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'server-stickers'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id::text = (string_to_array(name, '/'))[1]
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin')
    )
  );

-- Server Sounds (1MB, audio formats)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'server-sounds', 'server-sounds', true,
  1048576,
  ARRAY['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read for server sounds" ON storage.objects
  FOR SELECT USING (bucket_id = 'server-sounds');

CREATE POLICY "Server admins upload sounds" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'server-sounds'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id::text = (string_to_array(name, '/'))[1]
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Server admins delete sounds" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'server-sounds'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id::text = (string_to_array(name, '/'))[1]
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin')
    )
  );

-- Server Event Images (5MB, image formats)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'server-event-images', 'server-event-images', true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read for event images" ON storage.objects
  FOR SELECT USING (bucket_id = 'server-event-images');

CREATE POLICY "Server admins upload event images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'server-event-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id::text = (string_to_array(name, '/'))[1]
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Server admins delete event images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'server-event-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id::text = (string_to_array(name, '/'))[1]
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- REALTIME: Enable for events (live updates)
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE server_events;

-- ============================================================================
-- FUNCTION: Auto-create theme and welcome screen for new servers
-- ============================================================================

CREATE OR REPLACE FUNCTION create_server_customization_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create default theme
  INSERT INTO server_themes (server_id) VALUES (NEW.id)
  ON CONFLICT (server_id) DO NOTHING;

  -- Create default welcome screen
  INSERT INTO server_welcome_screens (server_id) VALUES (NEW.id)
  ON CONFLICT (server_id) DO NOTHING;

  -- Create default widget config
  INSERT INTO server_widgets (server_id) VALUES (NEW.id)
  ON CONFLICT (server_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_server_customization
  AFTER INSERT ON servers
  FOR EACH ROW EXECUTE FUNCTION create_server_customization_defaults();

-- ============================================================================
-- FUNCTION: Update RSVP count on server_events
-- ============================================================================

CREATE OR REPLACE FUNCTION update_event_rsvp_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_event_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_event_id := OLD.event_id;
  ELSE
    target_event_id := NEW.event_id;
  END IF;

  UPDATE server_events
  SET interested_count = (
    SELECT COUNT(*) FROM server_event_rsvps
    WHERE event_id = target_event_id
      AND status IN ('interested', 'going')
  )
  WHERE id = target_event_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trigger_update_rsvp_count
  AFTER INSERT OR UPDATE OR DELETE ON server_event_rsvps
  FOR EACH ROW EXECUTE FUNCTION update_event_rsvp_count();
