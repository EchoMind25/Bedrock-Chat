-- ============================================================================
-- Bedrock Chat - Auto-create profile on user signup
-- Created: 2026-02-12
-- Purpose: Ensures a profile row always exists when a user signs up,
--          even if the client-side insert fails (e.g., due to RLS timing)
--
-- This trigger fires on auth.users INSERT and creates a corresponding
-- profiles row using user_metadata provided during signUp().
--
-- CRITICAL: This function must NEVER raise an exception, or it will
-- abort the auth.users INSERT and return a 500 from Supabase auth.
-- ============================================================================

-- Function to auto-create a profile when a new user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _username TEXT;
  _display_name TEXT;
  _account_type account_type;
BEGIN
  -- Build username: metadata > email prefix > generated fallback
  -- NULLIF converts empty strings to NULL so COALESCE works correctly
  _username := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'username'), ''),
    NULLIF(SPLIT_PART(NEW.email, '@', 1), ''),
    'user_' || LEFT(REPLACE(NEW.id::TEXT, '-', ''), 8)
  );

  -- Ensure username meets length constraint (3-32 chars)
  IF char_length(_username) < 3 THEN
    _username := _username || '_' || LEFT(REPLACE(NEW.id::TEXT, '-', ''), 8);
  END IF;
  IF char_length(_username) > 32 THEN
    _username := LEFT(_username, 32);
  END IF;

  -- Strip invalid characters (only allow alphanumeric + underscore)
  _username := REGEXP_REPLACE(_username, '[^a-zA-Z0-9_]', '_', 'g');

  _display_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'username'), ''),
    NULLIF(SPLIT_PART(NEW.email, '@', 1), ''),
    _username
  );

  -- Safely parse account_type, default to 'standard' on any error
  BEGIN
    _account_type := COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'account_type', '')::account_type,
      'standard'
    );
  EXCEPTION WHEN OTHERS THEN
    _account_type := 'standard';
  END;

  -- Insert profile, handling all possible conflicts gracefully
  BEGIN
    INSERT INTO public.profiles (id, username, display_name, account_type)
    VALUES (NEW.id, _username, _display_name, _account_type)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN unique_violation THEN
      -- Username already taken: append a random suffix and retry once
      BEGIN
        INSERT INTO public.profiles (id, username, display_name, account_type)
        VALUES (
          NEW.id,
          LEFT(_username, 24) || '_' || LEFT(REPLACE(NEW.id::TEXT, '-', ''), 7),
          _display_name,
          _account_type
        )
        ON CONFLICT (id) DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        -- If even the fallback fails, do nothing.
        -- The client-side code will create the profile after OTP verification.
        NULL;
      END;
    WHEN OTHERS THEN
      -- Never let this trigger abort the signup transaction
      NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if present, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
