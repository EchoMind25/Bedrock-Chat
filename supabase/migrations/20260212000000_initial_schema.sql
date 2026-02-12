-- ============================================================================
-- Bedrock Chat - Initial Schema Migration
-- Created: 2026-02-12
-- Purpose: Complete database schema for privacy-first Discord alternative
--
-- PRIVACY NOTES:
-- - voice_sessions/voice_participants store METADATA ONLY (no audio data)
-- - family_activity_log.visible_to_child is ALWAYS TRUE (transparency)
-- - No behavioral tracking, no device fingerprinting columns
-- - Messages capped at 4000 chars per PRD
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_status AS ENUM ('online', 'idle', 'dnd', 'offline');
CREATE TYPE channel_type AS ENUM ('text', 'voice', 'announcement');
CREATE TYPE server_role AS ENUM ('owner', 'admin', 'moderator', 'member');
CREATE TYPE family_role AS ENUM ('parent', 'child');
CREATE TYPE monitoring_level AS ENUM ('minimal', 'moderate', 'transparent', 'restricted');
CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE account_type AS ENUM ('standard', 'parent', 'teen');

-- ============================================================================
-- FUNCTIONS (defined before tables that reference them)
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update server member_count
CREATE OR REPLACE FUNCTION update_server_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE servers SET member_count = member_count + 1 WHERE id = NEW.server_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE servers SET member_count = member_count - 1 WHERE id = OLD.server_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Auto-create user_settings when profile is created
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: profiles (extends auth.users)
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 500),
  status user_status NOT NULL DEFAULT 'offline',
  account_type account_type NOT NULL DEFAULT 'standard',
  date_of_birth DATE, -- For COPPA compliance
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 32),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$'),
  CONSTRAINT display_name_length CHECK (display_name IS NULL OR char_length(display_name) <= 64)
);

CREATE UNIQUE INDEX idx_profiles_username ON profiles (LOWER(username));
CREATE INDEX idx_profiles_status ON profiles (status) WHERE status != 'offline';
CREATE INDEX idx_profiles_account_type ON profiles (account_type) WHERE account_type != 'standard';

-- ============================================================================
-- TABLE: user_settings
-- ============================================================================

CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  show_online_status BOOLEAN NOT NULL DEFAULT TRUE,
  compact_mode BOOLEAN NOT NULL DEFAULT FALSE,
  allow_dms TEXT NOT NULL DEFAULT 'everyone' CHECK (allow_dms IN ('everyone', 'friends', 'none')),
  reduced_motion BOOLEAN NOT NULL DEFAULT FALSE,
  message_font_size TEXT NOT NULL DEFAULT 'medium' CHECK (message_font_size IN ('small', 'medium', 'large')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: servers
-- ============================================================================

CREATE TABLE servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 1000),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  icon_url TEXT,
  banner_url TEXT,
  invite_code TEXT NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  member_count INTEGER NOT NULL DEFAULT 0 CHECK (member_count >= 0),
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_servers_invite_code ON servers (invite_code);
CREATE INDEX idx_servers_owner ON servers (owner_id);
CREATE INDEX idx_servers_public ON servers (is_public) WHERE is_public = TRUE;

-- ============================================================================
-- TABLE: server_members
-- ============================================================================

CREATE TABLE server_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role server_role NOT NULL DEFAULT 'member',
  nickname TEXT CHECK (nickname IS NULL OR char_length(nickname) <= 32),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_server_member UNIQUE (server_id, user_id)
);

CREATE INDEX idx_server_members_server ON server_members (server_id);
CREATE INDEX idx_server_members_user ON server_members (user_id);

-- ============================================================================
-- TABLE: channel_categories
-- ============================================================================

CREATE TABLE channel_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 50),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_channel_categories_server ON channel_categories (server_id, position);

-- ============================================================================
-- TABLE: channels
-- ============================================================================

CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES channel_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  type channel_type NOT NULL DEFAULT 'text',
  position INTEGER NOT NULL DEFAULT 0,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  topic TEXT CHECK (char_length(topic) <= 1024),
  slow_mode_seconds INTEGER NOT NULL DEFAULT 0 CHECK (slow_mode_seconds >= 0),
  is_nsfw BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_channels_server ON channels (server_id, position);
CREATE INDEX idx_channels_category ON channels (category_id);

-- ============================================================================
-- TABLE: messages
-- Max 4000 chars per PRD specification
-- ============================================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 4000),
  type TEXT NOT NULL DEFAULT 'default' CHECK (type IN ('default', 'system', 'reply')),
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_channel ON messages (channel_id, created_at DESC);
CREATE INDEX idx_messages_user ON messages (user_id);
CREATE INDEX idx_messages_reply ON messages (reply_to) WHERE reply_to IS NOT NULL;
CREATE INDEX idx_messages_pinned ON messages (channel_id) WHERE is_pinned = TRUE;

-- ============================================================================
-- TABLE: message_attachments
-- ============================================================================

CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  filename TEXT NOT NULL CHECK (char_length(filename) <= 255),
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0),
  mime_type TEXT NOT NULL CHECK (char_length(mime_type) <= 127),
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_message_attachments_message ON message_attachments (message_id);

-- ============================================================================
-- TABLE: message_reactions
-- ============================================================================

CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (char_length(emoji) <= 32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_reaction UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX idx_message_reactions_message ON message_reactions (message_id);

-- ============================================================================
-- TABLE: voice_sessions
-- PRIVACY CRITICAL: Metadata ONLY. NO audio data. NO recordings.
-- This tracks session existence for presence indicators and analytics.
-- ============================================================================

CREATE TABLE voice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  daily_room_name TEXT NOT NULL, -- Daily.co room identifier
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  participant_count INTEGER NOT NULL DEFAULT 0,
  max_participants INTEGER NOT NULL DEFAULT 0
  -- NO audio_url, NO recording_url, NO transcript fields
  -- Voice data stays with Daily.co and is never stored
);

CREATE INDEX idx_voice_sessions_channel ON voice_sessions (channel_id);
CREATE INDEX idx_voice_sessions_active ON voice_sessions (channel_id) WHERE ended_at IS NULL;

-- ============================================================================
-- TABLE: voice_participants
-- PRIVACY CRITICAL: Metadata ONLY. Tracks join/leave for presence.
-- was_muted/was_deafened are USER PREFERENCES, not surveillance data.
-- ============================================================================

CREATE TABLE voice_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES voice_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  was_muted BOOLEAN NOT NULL DEFAULT FALSE,  -- User's own preference
  was_deafened BOOLEAN NOT NULL DEFAULT FALSE -- User's own preference
  -- NO audio data, NO speaking duration, NO content analysis
);

CREATE INDEX idx_voice_participants_session ON voice_participants (session_id);
CREATE INDEX idx_voice_participants_user ON voice_participants (user_id);
CREATE INDEX idx_voice_participants_active ON voice_participants (session_id) WHERE left_at IS NULL;

-- ============================================================================
-- TABLE: family_accounts
-- ============================================================================

CREATE TABLE family_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  monitoring_level monitoring_level NOT NULL DEFAULT 'minimal',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_family_accounts_creator ON family_accounts (created_by);

-- ============================================================================
-- TABLE: family_members
-- ============================================================================

CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES family_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role family_role NOT NULL,
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_family_member UNIQUE (family_id, user_id)
);

CREATE INDEX idx_family_members_family ON family_members (family_id);
CREATE INDEX idx_family_members_user ON family_members (user_id);

-- ============================================================================
-- TABLE: family_activity_log
-- PRIVACY CRITICAL: ALL entries are TRANSPARENT to teens.
-- visible_to_child is ALWAYS TRUE. This is by design, not by accident.
-- Hidden surveillance is UNACCEPTABLE per PRD "gamer code" and privacy policy.
-- ============================================================================

CREATE TABLE family_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES family_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- who performed the action
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'viewed_messages', 'viewed_friends', 'viewed_servers', 'viewed_flags',
    'changed_monitoring_level', 'approved_server', 'denied_server',
    'approved_friend', 'denied_friend'
  )),
  details JSONB NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- ALWAYS TRUE: Teens must always see when parents access their data
  visible_to_child BOOLEAN NOT NULL DEFAULT TRUE CHECK (visible_to_child = TRUE)
);

CREATE INDEX idx_family_activity_family ON family_activity_log (family_id, occurred_at DESC);
CREATE INDEX idx_family_activity_user ON family_activity_log (user_id);

-- ============================================================================
-- TABLE: parental_consent (COPPA compliance)
-- ============================================================================

CREATE TABLE parental_consent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consent_given_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consent_method TEXT NOT NULL CHECK (consent_method IN ('email', 'credit_card', 'id_verification', 'signed_form')),
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_parental_consent UNIQUE (child_user_id, parent_user_id)
);

CREATE INDEX idx_parental_consent_child ON parental_consent (child_user_id);
CREATE INDEX idx_parental_consent_parent ON parental_consent (parent_user_id);

-- ============================================================================
-- TABLE: friendships
-- ============================================================================

CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure user1_id < user2_id to prevent duplicate friendships
  CONSTRAINT friendship_ordered CHECK (user1_id < user2_id),
  CONSTRAINT unique_friendship UNIQUE (user1_id, user2_id)
);

CREATE INDEX idx_friendships_user1 ON friendships (user1_id);
CREATE INDEX idx_friendships_user2 ON friendships (user2_id);

-- ============================================================================
-- TABLE: friend_requests
-- ============================================================================

CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status friend_request_status NOT NULL DEFAULT 'pending',
  message TEXT CHECK (char_length(message) <= 200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,

  CONSTRAINT no_self_request CHECK (sender_id != receiver_id),
  CONSTRAINT unique_pending_request UNIQUE (sender_id, receiver_id)
);

CREATE INDEX idx_friend_requests_receiver ON friend_requests (receiver_id) WHERE status = 'pending';
CREATE INDEX idx_friend_requests_sender ON friend_requests (sender_id);

-- ============================================================================
-- TABLE: blocked_users
-- ============================================================================

CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT CHECK (char_length(reason) <= 500),
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id),
  CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX idx_blocked_users_blocker ON blocked_users (blocker_id);
CREATE INDEX idx_blocked_users_blocked ON blocked_users (blocked_id);

-- ============================================================================
-- TABLE: direct_messages
-- ============================================================================

CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 4000),
  read_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT no_self_dm CHECK (sender_id != receiver_id)
);

CREATE INDEX idx_direct_messages_conversation ON direct_messages (
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC
);
CREATE INDEX idx_direct_messages_receiver_unread ON direct_messages (receiver_id) WHERE read_at IS NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- updated_at triggers
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_servers_updated_at
  BEFORE UPDATE ON servers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_channels_updated_at
  BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_family_accounts_updated_at
  BEFORE UPDATE ON family_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Server member count auto-update
CREATE TRIGGER trigger_server_member_count
  AFTER INSERT OR DELETE ON server_members
  FOR EACH ROW EXECUTE FUNCTION update_server_member_count();

-- Auto-create user_settings on profile creation
CREATE TRIGGER trigger_create_user_settings
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_user_settings();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE parental_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: profiles
-- ============================================================================

-- Anyone can view profiles (public data)
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (TRUE);

-- Users can only update their own profile
CREATE POLICY profiles_update ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY profiles_insert ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- RLS POLICIES: user_settings
-- ============================================================================

-- Users can only view their own settings
CREATE POLICY user_settings_select ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only update their own settings
CREATE POLICY user_settings_update ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES: servers
-- ============================================================================

-- Members can view servers they belong to, public servers visible to all
CREATE POLICY servers_select ON servers
  FOR SELECT USING (
    is_public = TRUE
    OR EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = servers.id
      AND server_members.user_id = auth.uid()
    )
  );

-- Any authenticated user can create a server
CREATE POLICY servers_insert ON servers
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Only owner can update server
CREATE POLICY servers_update ON servers
  FOR UPDATE USING (auth.uid() = owner_id);

-- Only owner can delete server
CREATE POLICY servers_delete ON servers
  FOR DELETE USING (auth.uid() = owner_id);

-- ============================================================================
-- RLS POLICIES: server_members
-- ============================================================================

-- Members can see other members of the same server
CREATE POLICY server_members_select ON server_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM server_members AS sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
    )
  );

-- Server owner/admin can add members
CREATE POLICY server_members_insert ON server_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM server_members AS sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
    -- Or user is joining themselves (via invite)
    OR server_members.user_id = auth.uid()
  );

-- Members can leave (delete themselves), owner/admin can remove others
CREATE POLICY server_members_delete ON server_members
  FOR DELETE USING (
    server_members.user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM server_members AS sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES: channels
-- ============================================================================

-- Members can view channels in their servers
CREATE POLICY channels_select ON channels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = channels.server_id
      AND server_members.user_id = auth.uid()
    )
  );

-- Owner/admin can manage channels
CREATE POLICY channels_insert ON channels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = channels.server_id
      AND server_members.user_id = auth.uid()
      AND server_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY channels_update ON channels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = channels.server_id
      AND server_members.user_id = auth.uid()
      AND server_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY channels_delete ON channels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = channels.server_id
      AND server_members.user_id = auth.uid()
      AND server_members.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES: channel_categories
-- ============================================================================

CREATE POLICY channel_categories_select ON channel_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = channel_categories.server_id
      AND server_members.user_id = auth.uid()
    )
  );

CREATE POLICY channel_categories_manage ON channel_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = channel_categories.server_id
      AND server_members.user_id = auth.uid()
      AND server_members.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES: messages
-- ============================================================================

-- Members can view messages in channels they have access to
CREATE POLICY messages_select ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channels
      JOIN server_members ON server_members.server_id = channels.server_id
      WHERE channels.id = messages.channel_id
      AND server_members.user_id = auth.uid()
    )
  );

-- Authenticated members can send messages
CREATE POLICY messages_insert ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM channels
      JOIN server_members ON server_members.server_id = channels.server_id
      WHERE channels.id = messages.channel_id
      AND server_members.user_id = auth.uid()
    )
  );

-- Users can edit/delete their own messages
CREATE POLICY messages_update ON messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY messages_delete ON messages
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM channels
      JOIN server_members ON server_members.server_id = channels.server_id
      WHERE channels.id = messages.channel_id
      AND server_members.user_id = auth.uid()
      AND server_members.role IN ('owner', 'admin', 'moderator')
    )
  );

-- ============================================================================
-- RLS POLICIES: message_attachments
-- ============================================================================

CREATE POLICY message_attachments_select ON message_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages
      JOIN channels ON channels.id = messages.channel_id
      JOIN server_members ON server_members.server_id = channels.server_id
      WHERE messages.id = message_attachments.message_id
      AND server_members.user_id = auth.uid()
    )
  );

CREATE POLICY message_attachments_insert ON message_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages WHERE messages.id = message_attachments.message_id AND messages.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: message_reactions
-- ============================================================================

CREATE POLICY message_reactions_select ON message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages
      JOIN channels ON channels.id = messages.channel_id
      JOIN server_members ON server_members.server_id = channels.server_id
      WHERE messages.id = message_reactions.message_id
      AND server_members.user_id = auth.uid()
    )
  );

CREATE POLICY message_reactions_insert ON message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY message_reactions_delete ON message_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES: voice_sessions
-- ============================================================================

CREATE POLICY voice_sessions_select ON voice_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channels
      JOIN server_members ON server_members.server_id = channels.server_id
      WHERE channels.id = voice_sessions.channel_id
      AND server_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: voice_participants
-- ============================================================================

CREATE POLICY voice_participants_select ON voice_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM voice_sessions
      JOIN channels ON channels.id = voice_sessions.channel_id
      JOIN server_members ON server_members.server_id = channels.server_id
      WHERE voice_sessions.id = voice_participants.session_id
      AND server_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: friendships
-- ============================================================================

CREATE POLICY friendships_select ON friendships
  FOR SELECT USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

CREATE POLICY friendships_delete ON friendships
  FOR DELETE USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- ============================================================================
-- RLS POLICIES: friend_requests
-- ============================================================================

CREATE POLICY friend_requests_select ON friend_requests
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY friend_requests_insert ON friend_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY friend_requests_update ON friend_requests
  FOR UPDATE USING (auth.uid() = receiver_id);

CREATE POLICY friend_requests_delete ON friend_requests
  FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ============================================================================
-- RLS POLICIES: blocked_users
-- ============================================================================

CREATE POLICY blocked_users_select ON blocked_users
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY blocked_users_insert ON blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY blocked_users_delete ON blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);

-- ============================================================================
-- RLS POLICIES: direct_messages
-- ============================================================================

CREATE POLICY direct_messages_select ON direct_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY direct_messages_insert ON direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY direct_messages_update ON direct_messages
  FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ============================================================================
-- RLS POLICIES: family_accounts
-- ============================================================================

CREATE POLICY family_accounts_select ON family_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = family_accounts.id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY family_accounts_insert ON family_accounts
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY family_accounts_update ON family_accounts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = family_accounts.id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'parent'
    )
  );

-- ============================================================================
-- RLS POLICIES: family_members
-- ============================================================================

CREATE POLICY family_members_select ON family_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members AS fm
      WHERE fm.family_id = family_members.family_id
      AND fm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: family_activity_log
-- BOTH parents AND teens can view (transparency requirement)
-- ============================================================================

CREATE POLICY family_activity_log_select ON family_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = family_activity_log.family_id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY family_activity_log_insert ON family_activity_log
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = family_activity_log.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'parent'
    )
  );

-- ============================================================================
-- RLS POLICIES: parental_consent
-- ============================================================================

CREATE POLICY parental_consent_select ON parental_consent
  FOR SELECT USING (
    auth.uid() = child_user_id OR auth.uid() = parent_user_id
  );

CREATE POLICY parental_consent_insert ON parental_consent
  FOR INSERT WITH CHECK (auth.uid() = parent_user_id);

CREATE POLICY parental_consent_update ON parental_consent
  FOR UPDATE USING (auth.uid() = parent_user_id);

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- Enable realtime for tables that need live updates
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE voice_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE voice_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE family_activity_log;

-- ============================================================================
-- COMMENTS (for documentation)
-- ============================================================================

COMMENT ON TABLE voice_sessions IS 'PRIVACY: Metadata only. No audio recordings stored. Daily.co handles all audio.';
COMMENT ON TABLE voice_participants IS 'PRIVACY: Metadata only. was_muted/was_deafened are user preferences, not surveillance.';
COMMENT ON TABLE family_activity_log IS 'PRIVACY: visible_to_child is always TRUE. Teens always see parent activity. No hidden monitoring.';
COMMENT ON COLUMN family_activity_log.visible_to_child IS 'CHECK constraint enforces TRUE. Hidden surveillance violates platform principles.';
COMMENT ON COLUMN messages.content IS 'Max 4000 characters per PRD specification.';
COMMENT ON COLUMN profiles.date_of_birth IS 'Used for COPPA compliance age verification. Stored securely.';
