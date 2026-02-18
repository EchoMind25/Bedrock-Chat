-- ============================================================================
-- Bedrock Chat - NSFW Channel Enforcement (COPPA/GDPR Compliance)
-- Created: 2026-02-19
--
-- Adds server-side enforcement for NSFW channel access:
-- 1. Helper function can_view_nsfw() checks age/account restrictions
-- 2. Updated channels_select RLS to hide NSFW channels from minors
-- 3. Updated messages_select/insert RLS to block NSFW message access
-- 4. Partial index for NSFW channel lookups
-- ============================================================================

-- ============================================================================
-- Helper function: determines if a user is allowed to view NSFW content
-- Returns FALSE for:
--   - Teen accounts (account_type = 'teen')
--   - Family child members with restricted/transparent monitoring
--   - Users with date_of_birth confirming under 18
-- Returns TRUE for all other users (adults, unknown DOB standard accounts)
-- Unknown DOB is handled client-side with an age gate modal.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_view_nsfw(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT CASE
    -- Teen accounts: always blocked
    WHEN EXISTS (
      SELECT 1 FROM profiles
      WHERE id = p_user_id
      AND account_type = 'teen'
    ) THEN FALSE

    -- Family child members with restricted or transparent monitoring: blocked
    WHEN EXISTS (
      SELECT 1 FROM family_members fm
      JOIN family_accounts fa ON fa.id = fm.family_id
      WHERE fm.user_id = p_user_id
      AND fm.role = 'child'
      AND fa.monitoring_level IN ('restricted', 'transparent')
    ) THEN FALSE

    -- Users with DOB confirming under 18: blocked
    WHEN EXISTS (
      SELECT 1 FROM profiles
      WHERE id = p_user_id
      AND date_of_birth IS NOT NULL
      AND date_of_birth > (CURRENT_DATE - INTERVAL '18 years')
    ) THEN FALSE

    -- Everyone else: allowed
    ELSE TRUE
  END;
$$;

-- ============================================================================
-- Update channels_select: hide NSFW channels from restricted users
-- Replaces the policy from 20260212000004_fix_rls_recursion.sql
-- ============================================================================

DROP POLICY IF EXISTS channels_select ON channels;

CREATE POLICY channels_select ON channels
  FOR SELECT USING (
    public.is_server_member(server_id, auth.uid())
    AND (
      is_nsfw = FALSE
      OR public.can_view_nsfw(auth.uid())
    )
  );

-- ============================================================================
-- Update messages_select: block access to messages in NSFW channels
-- Replaces the policy from 20260212000000_initial_schema.sql
-- ============================================================================

DROP POLICY IF EXISTS messages_select ON messages;

CREATE POLICY messages_select ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channels
      WHERE channels.id = messages.channel_id
      AND public.is_server_member(channels.server_id, auth.uid())
    )
    AND (
      NOT EXISTS (
        SELECT 1 FROM channels
        WHERE channels.id = messages.channel_id
        AND channels.is_nsfw = TRUE
      )
      OR public.can_view_nsfw(auth.uid())
    )
  );

-- ============================================================================
-- Update messages_insert: prevent posting in NSFW channels by minors
-- Replaces the policy from 20260212000000_initial_schema.sql
-- ============================================================================

DROP POLICY IF EXISTS messages_insert ON messages;

CREATE POLICY messages_insert ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM channels
      WHERE channels.id = messages.channel_id
      AND public.is_server_member(channels.server_id, auth.uid())
    )
    AND (
      NOT EXISTS (
        SELECT 1 FROM channels
        WHERE channels.id = messages.channel_id
        AND channels.is_nsfw = TRUE
      )
      OR public.can_view_nsfw(auth.uid())
    )
  );

-- ============================================================================
-- Partial index for efficient NSFW channel lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_channels_nsfw
  ON channels (server_id)
  WHERE is_nsfw = TRUE;
