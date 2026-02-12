-- ============================================================================
-- Bedrock Chat - Fix RLS Circular Dependency
-- Created: 2026-02-12
--
-- Fixes 500 errors caused by circular RLS evaluation between
-- servers_select and server_members_select policies.
--
-- Root cause: servers_select checks server_members, and
-- server_members_select self-references server_members.
-- PostgreSQL's RLS evaluator can fail on this chain.
--
-- Fix: Use a SECURITY DEFINER function that bypasses RLS
-- for the membership check, breaking the circular chain.
-- ============================================================================

-- Helper function: checks server membership without RLS overhead
CREATE OR REPLACE FUNCTION public.is_server_member(p_server_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM server_members
    WHERE server_id = p_server_id
    AND user_id = p_user_id
  );
$$;

-- Helper function: checks server membership role without RLS overhead
CREATE OR REPLACE FUNCTION public.is_server_admin(p_server_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM server_members
    WHERE server_id = p_server_id
    AND user_id = p_user_id
    AND role IN ('owner', 'admin')
  );
$$;

-- ============================================================================
-- Fix servers SELECT policy
-- ============================================================================

DROP POLICY IF EXISTS servers_select ON servers;

CREATE POLICY servers_select ON servers
  FOR SELECT USING (
    is_public = TRUE
    OR (allow_discovery = TRUE AND auth.uid() IS NOT NULL)
    OR public.is_server_member(id, auth.uid())
  );

-- ============================================================================
-- Fix server_members SELECT policy
-- ============================================================================

DROP POLICY IF EXISTS server_members_select ON server_members;

CREATE POLICY server_members_select ON server_members
  FOR SELECT USING (
    public.is_server_member(server_id, auth.uid())
  );

-- ============================================================================
-- Fix channels SELECT policy (also references server_members)
-- ============================================================================

DROP POLICY IF EXISTS channels_select ON channels;

CREATE POLICY channels_select ON channels
  FOR SELECT USING (
    public.is_server_member(server_id, auth.uid())
  );

-- ============================================================================
-- Fix channel_categories SELECT policy
-- ============================================================================

DROP POLICY IF EXISTS channel_categories_select ON channel_categories;

CREATE POLICY channel_categories_select ON channel_categories
  FOR SELECT USING (
    public.is_server_member(server_id, auth.uid())
  );
