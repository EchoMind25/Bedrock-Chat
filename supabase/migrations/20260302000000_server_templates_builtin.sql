-- ============================================================================
-- Bedrock Chat - Server Templates: Builtin Template Support
-- Created: 2026-03-02
--
-- PURPOSE:
-- Extends the existing server_templates table to support platform builtin
-- templates (Gaming, Family, Study Group, Community). Adds slug, category,
-- featured flag, and family-friendly flag columns. Makes created_by nullable
-- so builtin templates can exist without a user creator.
--
-- Also seeds the 4 default templates as JSONB definitions.
-- ============================================================================

-- 1. Make created_by nullable (builtin templates have no creator)
ALTER TABLE server_templates ALTER COLUMN created_by DROP NOT NULL;

-- 2. Add columns for builtin/featured template support
ALTER TABLE server_templates ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE server_templates ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general';
ALTER TABLE server_templates ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE server_templates ADD COLUMN IF NOT EXISTS icon_emoji TEXT;
ALTER TABLE server_templates ADD COLUMN IF NOT EXISTS is_family_friendly BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_server_templates_slug
  ON server_templates(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_server_templates_category
  ON server_templates(category);
CREATE INDEX IF NOT EXISTS idx_server_templates_featured
  ON server_templates(is_featured) WHERE is_featured = TRUE;

-- 4. RLS policy: builtin templates (no creator) are publicly readable
-- (Existing policies cover user-created templates; this adds builtin access)
CREATE POLICY server_templates_builtin_select ON server_templates
  FOR SELECT TO authenticated
  USING (created_by IS NULL);

-- 5. Seed the 4 builtin templates
INSERT INTO server_templates (slug, name, description, category, is_public, is_featured, is_family_friendly, icon_emoji, template_data)
VALUES
  (
    'gaming',
    'Gaming',
    'For gaming communities with LFG and voice channels',
    'gaming',
    TRUE,
    TRUE,
    FALSE,
    '🎮',
    '{
      "categories": [
        {"name": "INFORMATION", "position": 0},
        {"name": "TEXT CHANNELS", "position": 1},
        {"name": "VOICE CHANNELS", "position": 2}
      ],
      "channels": [
        {"name": "welcome", "type": "announcement", "categoryName": "INFORMATION", "position": 0},
        {"name": "rules", "type": "announcement", "categoryName": "INFORMATION", "position": 1},
        {"name": "general", "type": "text", "categoryName": "TEXT CHANNELS", "position": 0},
        {"name": "off-topic", "type": "text", "categoryName": "TEXT CHANNELS", "position": 1},
        {"name": "clips-and-highlights", "type": "text", "categoryName": "TEXT CHANNELS", "position": 2},
        {"name": "looking-for-group", "type": "text", "categoryName": "TEXT CHANNELS", "position": 3},
        {"name": "General Voice", "type": "voice", "categoryName": "VOICE CHANNELS", "position": 0},
        {"name": "Gaming Voice 1", "type": "voice", "categoryName": "VOICE CHANNELS", "position": 1},
        {"name": "Gaming Voice 2", "type": "voice", "categoryName": "VOICE CHANNELS", "position": 2},
        {"name": "AFK", "type": "voice", "categoryName": "VOICE CHANNELS", "position": 3}
      ],
      "roles": [
        {"name": "Admin", "color": "oklch(0.6 0.2 30)", "permissions": 4194304, "position": 2},
        {"name": "Moderator", "color": "oklch(0.65 0.25 265)", "permissions": 1216, "position": 1},
        {"name": "Member", "color": "oklch(0.5 0 0)", "permissions": 239104, "position": 0}
      ],
      "settings": {},
      "welcomeScreen": null,
      "theme": null
    }'::jsonb
  ),
  (
    'family',
    'Family',
    'A safe space for family communication',
    'community',
    TRUE,
    TRUE,
    TRUE,
    '👨‍👩‍👧‍👦',
    '{
      "categories": [
        {"name": "FAMILY HUB", "position": 0},
        {"name": "TEENS", "position": 1},
        {"name": "PARENTS ONLY", "position": 2}
      ],
      "channels": [
        {"name": "family-announcements", "type": "announcement", "categoryName": "FAMILY HUB", "position": 0},
        {"name": "general", "type": "text", "categoryName": "FAMILY HUB", "position": 1},
        {"name": "homework-help", "type": "text", "categoryName": "TEENS", "position": 0},
        {"name": "gaming", "type": "text", "categoryName": "TEENS", "position": 1},
        {"name": "parents-lounge", "type": "text", "categoryName": "PARENTS ONLY", "position": 0},
        {"name": "Family Voice", "type": "voice", "categoryName": "FAMILY HUB", "position": 2},
        {"name": "Teen Hangout", "type": "voice", "categoryName": "TEENS", "position": 2}
      ],
      "roles": [
        {"name": "Parent", "color": "oklch(0.7 0.25 150)", "permissions": 1028, "position": 2},
        {"name": "Teen", "color": "oklch(0.65 0.25 265)", "permissions": 238081, "position": 1},
        {"name": "Family Member", "color": "oklch(0.5 0 0)", "permissions": 41473, "position": 0}
      ],
      "settings": {},
      "welcomeScreen": null,
      "theme": null
    }'::jsonb
  ),
  (
    'study-group',
    'Study Group',
    'For study sessions and homework help',
    'education',
    TRUE,
    TRUE,
    TRUE,
    '📚',
    '{
      "categories": [
        {"name": "RESOURCES", "position": 0},
        {"name": "STUDY ROOMS", "position": 1},
        {"name": "VOICE STUDY", "position": 2}
      ],
      "channels": [
        {"name": "announcements", "type": "announcement", "categoryName": "RESOURCES", "position": 0},
        {"name": "general", "type": "text", "categoryName": "RESOURCES", "position": 1},
        {"name": "resources", "type": "text", "categoryName": "RESOURCES", "position": 2},
        {"name": "homework-help", "type": "text", "categoryName": "STUDY ROOMS", "position": 0},
        {"name": "exam-prep", "type": "text", "categoryName": "STUDY ROOMS", "position": 1},
        {"name": "off-topic", "type": "text", "categoryName": "STUDY ROOMS", "position": 2},
        {"name": "Quiet Study", "type": "voice", "categoryName": "VOICE STUDY", "position": 0},
        {"name": "Group Study", "type": "voice", "categoryName": "VOICE STUDY", "position": 1},
        {"name": "Office Hours", "type": "voice", "categoryName": "VOICE STUDY", "position": 2}
      ],
      "roles": [
        {"name": "Instructor", "color": "oklch(0.7 0.2 50)", "permissions": 1030, "position": 2},
        {"name": "Study Lead", "color": "oklch(0.65 0.25 265)", "permissions": 238592, "position": 1},
        {"name": "Student", "color": "oklch(0.5 0 0)", "permissions": 238080, "position": 0}
      ],
      "settings": {},
      "welcomeScreen": null,
      "theme": null
    }'::jsonb
  ),
  (
    'community',
    'Community',
    'A general-purpose community server',
    'community',
    TRUE,
    TRUE,
    FALSE,
    '🌐',
    '{
      "categories": [
        {"name": "WELCOME", "position": 0},
        {"name": "GENERAL", "position": 1},
        {"name": "TOPICS", "position": 2},
        {"name": "VOICE", "position": 3}
      ],
      "channels": [
        {"name": "welcome", "type": "announcement", "categoryName": "WELCOME", "position": 0},
        {"name": "rules", "type": "announcement", "categoryName": "WELCOME", "position": 1},
        {"name": "introductions", "type": "text", "categoryName": "GENERAL", "position": 0},
        {"name": "general", "type": "text", "categoryName": "GENERAL", "position": 1},
        {"name": "events", "type": "text", "categoryName": "TOPICS", "position": 0},
        {"name": "feedback", "type": "text", "categoryName": "TOPICS", "position": 1},
        {"name": "Hangout", "type": "voice", "categoryName": "VOICE", "position": 0},
        {"name": "Events", "type": "voice", "categoryName": "VOICE", "position": 1}
      ],
      "roles": [
        {"name": "Admin", "color": "oklch(0.6 0.2 30)", "permissions": 4194304, "position": 2},
        {"name": "Moderator", "color": "oklch(0.65 0.25 265)", "permissions": 1216, "position": 1},
        {"name": "Member", "color": "oklch(0.5 0 0)", "permissions": 239104, "position": 0}
      ],
      "settings": {},
      "welcomeScreen": null,
      "theme": null
    }'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;
