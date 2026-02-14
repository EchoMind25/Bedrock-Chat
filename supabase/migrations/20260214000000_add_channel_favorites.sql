-- Migration: Add Channel Favorites
-- Description: Allows users to star/favorite channels for quick access
-- Date: 2026-02-14

-- Create channel_favorites table
CREATE TABLE IF NOT EXISTS channel_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure a user can only favorite a channel once
  UNIQUE(user_id, channel_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_channel_favorites_user_id
  ON channel_favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_channel_favorites_channel_id
  ON channel_favorites(channel_id);

CREATE INDEX IF NOT EXISTS idx_channel_favorites_server_id
  ON channel_favorites(server_id);

-- Composite index for common query pattern (user's favorites in a server)
CREATE INDEX IF NOT EXISTS idx_channel_favorites_user_server
  ON channel_favorites(user_id, server_id);

-- Enable Row Level Security
ALTER TABLE channel_favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own favorites" ON channel_favorites;
DROP POLICY IF EXISTS "Users can create their own favorites" ON channel_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON channel_favorites;

-- RLS Policies: Users can only manage their own favorites
CREATE POLICY "Users can view their own favorites"
  ON channel_favorites
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites"
  ON channel_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON channel_favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE channel_favorites IS 'Stores user-favorited channels for quick access';
COMMENT ON COLUMN channel_favorites.user_id IS 'User who favorited the channel';
COMMENT ON COLUMN channel_favorites.channel_id IS 'Channel that was favorited';
COMMENT ON COLUMN channel_favorites.server_id IS 'Server the channel belongs to (denormalized for query performance)';
