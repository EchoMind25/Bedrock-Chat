-- ============================================================================
-- Bedrock Chat - Fix auth flow & auto-create profile on signup
-- Created: 2026-02-12
--
-- FIXES:
-- 1. Missing INSERT policy on user_settings (blocks ALL profile creation)
-- 2. create_default_user_settings() needs SECURITY DEFINER to bypass RLS
--    when called from triggers
-- 3. Adds handle_new_user() trigger on auth.users to auto-create profiles
--
-- CRITICAL: Without fix #1, NO user can ever sign up because:
--   profiles INSERT → triggers create_default_user_settings()
--   → INSERT into user_settings → BLOCKED by RLS (no INSERT policy)
--   → exception cascades → profiles INSERT fails → 500 error
-- ============================================================================

-- ============================================================================
-- FIX 1: Add missing INSERT policy on user_settings
-- ============================================================================
DROP POLICY IF EXISTS user_settings_insert ON user_settings;
CREATE POLICY user_settings_insert ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FIX 2: Recreate create_default_user_settings as SECURITY DEFINER
-- ============================================================================
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FIX 3: Remove the auto-create profile trigger entirely.
-- The client-side code creates the profile after OTP verification
-- when a valid session exists, so this trigger is unnecessary.
-- Removing it eliminates the 500 risk from trigger failures.
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
