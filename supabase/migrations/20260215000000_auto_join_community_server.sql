-- ============================================================================
-- Bedrock Chat - Auto-join community server on signup
-- Created: 2026-02-15
--
-- PURPOSE:
-- Automatically adds every new user to the "Bedrock Chat: The Community" server
-- when they sign up. This server contains announcements, changelogs, events, etc.
--
-- Server ID: a6591f32-b552-433a-a450-c38dbfa75271
-- Server URL: https://bedrockchat.com/servers/a6591f32-b552-433a-a450-c38dbfa75271/5836f022-e006-42f6-b263-bfc35708c06d
-- ============================================================================

-- ============================================================================
-- Function: Add new user to community server
-- ============================================================================
CREATE OR REPLACE FUNCTION auto_join_community_server()
RETURNS TRIGGER
SECURITY DEFINER -- Bypass RLS to ensure this always works
SET search_path = public
AS $$
DECLARE
  community_server_id UUID := 'a6591f32-b552-433a-a450-c38dbfa75271';
  profile_exists BOOLEAN;
BEGIN
  -- First, ensure the user has a profile created
  -- (Profiles are created by the client after OTP verification)
  -- We'll check if the profile exists before adding to server

  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = NEW.id
  ) INTO profile_exists;

  -- Only proceed if profile exists
  IF profile_exists THEN
    -- Add user to community server as a member
    INSERT INTO server_members (
      server_id,
      user_id,
      role,
      joined_at
    )
    VALUES (
      community_server_id,
      NEW.id,
      'member',
      NOW()
    )
    ON CONFLICT (server_id, user_id) DO NOTHING; -- Avoid duplicate entries

    RAISE LOG 'User % auto-joined community server', NEW.id;
  ELSE
    RAISE LOG 'Profile not yet created for user %, skipping auto-join', NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE LOG 'Failed to auto-join user % to community server: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Trigger: Auto-join on profile creation (not auth.users)
-- ============================================================================
-- We trigger on profiles table instead of auth.users because:
-- 1. Profiles are created AFTER email verification
-- 2. This ensures the user has a valid session
-- 3. Avoids race conditions with profile creation

DROP TRIGGER IF EXISTS on_profile_created_join_community ON profiles;

CREATE TRIGGER on_profile_created_join_community
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_join_community_server();

-- ============================================================================
-- Backfill: Add existing users to community server (optional)
-- ============================================================================
-- Uncomment the following to add all existing users to the community server:

/*
INSERT INTO server_members (server_id, user_id, role, joined_at)
SELECT
  'a6591f32-b552-433a-a450-c38dbfa75271'::UUID,
  id,
  'member',
  NOW()
FROM profiles
WHERE NOT EXISTS (
  SELECT 1
  FROM server_members
  WHERE server_id = 'a6591f32-b552-433a-a450-c38dbfa75271'
    AND user_id = profiles.id
);
*/

-- ============================================================================
-- Grant permissions
-- ============================================================================
-- Ensure the trigger function can execute with elevated privileges
GRANT EXECUTE ON FUNCTION auto_join_community_server() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_join_community_server() TO service_role;

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON FUNCTION auto_join_community_server() IS
  'Automatically adds new users to the Bedrock Chat community server (a6591f32-b552-433a-a450-c38dbfa75271) when their profile is created';

COMMENT ON TRIGGER on_profile_created_join_community ON profiles IS
  'Triggers auto_join_community_server() to add new users to the community server';
