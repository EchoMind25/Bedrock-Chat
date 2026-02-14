-- ============================================================================
-- Bedrock Chat - Seed Data
-- Purpose: Auto-create default "Bedrock Community" server when users sign up
-- ============================================================================

-- ============================================================================
-- Function: Create Bedrock Community server if it doesn't exist
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_bedrock_community_exists(first_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_server_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  v_server_exists BOOLEAN;
BEGIN
  -- Check if Bedrock Community server already exists
  SELECT EXISTS(SELECT 1 FROM servers WHERE id = v_server_id) INTO v_server_exists;

  IF NOT v_server_exists THEN
    -- Create the Bedrock Community server (owned by first user)
    INSERT INTO servers (id, name, description, owner_id, is_public, member_count)
    VALUES (
      v_server_id,
      'Bedrock Community',
      'Welcome to Bedrock Chat! Connect, chat, and have fun.',
      first_user_id,
      true,
      0
    );

    -- Create categories
    INSERT INTO channel_categories (id, server_id, name, position) VALUES
      ('550e8400-e29b-41d4-a716-446655440010', v_server_id, 'INFORMATION', 0),
      ('550e8400-e29b-41d4-a716-446655440011', v_server_id, 'TEXT CHANNELS', 1),
      ('550e8400-e29b-41d4-a716-446655440012', v_server_id, 'VOICE CHANNELS', 2);

    -- Create channels
    INSERT INTO channels (id, server_id, category_id, name, type, description, position, topic) VALUES
      -- INFORMATION category
      ('550e8400-e29b-41d4-a716-446655440020', v_server_id, '550e8400-e29b-41d4-a716-446655440010', 'welcome', 'text', 'Welcome to Bedrock Chat!', 0, 'Start here! Read the rules and say hi.'),
      ('550e8400-e29b-41d4-a716-446655440021', v_server_id, '550e8400-e29b-41d4-a716-446655440010', 'rules', 'announcement', 'Server rules and guidelines', 1, 'Please read and follow these rules.'),

      -- TEXT CHANNELS category
      ('550e8400-e29b-41d4-a716-446655440022', v_server_id, '550e8400-e29b-41d4-a716-446655440011', 'general', 'text', 'General discussion', 2, 'Chat about anything here!'),
      ('550e8400-e29b-41d4-a716-446655440023', v_server_id, '550e8400-e29b-41d4-a716-446655440011', 'random', 'text', 'Random chat', 3, 'Off-topic conversations'),
      ('550e8400-e29b-41d4-a716-446655440024', v_server_id, '550e8400-e29b-41d4-a716-446655440011', 'tech-talk', 'text', 'Technology discussions', 4, 'Talk about tech, coding, and development'),

      -- VOICE CHANNELS category
      ('550e8400-e29b-41d4-a716-446655440025', v_server_id, '550e8400-e29b-41d4-a716-446655440012', 'General Voice', 'voice', 'General voice chat', 5, null),
      ('550e8400-e29b-41d4-a716-446655440026', v_server_id, '550e8400-e29b-41d4-a716-446655440012', 'Gaming', 'voice', 'Voice chat for gaming', 6, null);

    -- Create default @everyone role
    INSERT INTO server_roles (id, server_id, name, color, permissions, position, mentionable, is_default)
    VALUES (
      '550e8400-e29b-41d4-a716-446655440030',
      v_server_id,
      '@everyone',
      '',
      31, -- Basic permissions: VIEW_CHANNELS (1) + SEND_MESSAGES (2) + READ_MESSAGE_HISTORY (4) + CONNECT_VOICE (8) + SPEAK (16) = 31
      0,
      false,
      true
    );
  END IF;

  RETURN v_server_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Auto-add users to Bedrock Community when they sign up
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_join_bedrock_community()
RETURNS TRIGGER AS $$
DECLARE
  v_server_id UUID;
BEGIN
  -- Ensure Bedrock Community exists (creates it if this is the first user)
  v_server_id := ensure_bedrock_community_exists(NEW.id);

  -- Add the new user to the Bedrock Community server
  INSERT INTO server_members (server_id, user_id, role)
  VALUES (v_server_id, NEW.id, 'member')
  ON CONFLICT (server_id, user_id) DO NOTHING;

  -- Add user to @everyone role
  INSERT INTO role_members (role_id, user_id, assigned_by)
  VALUES ('550e8400-e29b-41d4-a716-446655440030', NEW.id, NEW.id)
  ON CONFLICT (role_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-join new users to Bedrock Community
DROP TRIGGER IF EXISTS on_profile_created_join_community ON profiles;
CREATE TRIGGER on_profile_created_join_community
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_join_bedrock_community();

COMMENT ON FUNCTION ensure_bedrock_community_exists IS 'Creates the Bedrock Community server if it does not exist';
COMMENT ON FUNCTION auto_join_bedrock_community IS 'Automatically adds new users to the Bedrock Community server';
