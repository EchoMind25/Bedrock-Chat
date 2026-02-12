-- ============================================================================
-- Bedrock Chat - Auto-create profile on user signup
-- Created: 2026-02-12
-- Purpose: Ensures a profile row always exists when a user signs up,
--          even if the client-side insert fails (e.g., due to RLS timing)
--
-- This trigger fires on auth.users INSERT and creates a corresponding
-- profiles row using user_metadata provided during signUp().
-- ============================================================================

-- Function to auto-create a profile when a new user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    account_type
  )
  VALUES (
    NEW.id,
    -- Use username from metadata, fall back to email prefix, then generate one
    COALESCE(
      NEW.raw_user_meta_data ->> 'username',
      SPLIT_PART(NEW.email, '@', 1),
      'user_' || LEFT(NEW.id::TEXT, 8)
    ),
    COALESCE(
      NEW.raw_user_meta_data ->> 'username',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    COALESCE(
      (NEW.raw_user_meta_data ->> 'account_type')::account_type,
      'standard'
    )
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users to auto-create profile
-- SECURITY DEFINER allows this to bypass RLS
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
