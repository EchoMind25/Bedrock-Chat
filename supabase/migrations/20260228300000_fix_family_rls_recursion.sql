-- ============================================================================
-- Bedrock Chat - Fix Family RLS Circular Dependency
-- Created: 2026-02-28
--
-- Fixes silent empty results caused by circular RLS evaluation in the family
-- tables. The same pattern was previously fixed for server_members in
-- 20260212000004_fix_rls_recursion.sql.
--
-- Root cause:
--   family_members_select self-references family_members.
--   family_accounts_select references family_members (which has RLS).
--   PostgreSQL's RLS evaluator resolves to empty set, so init() always
--   gets no rows and parents never see their teens.
--
-- Fix: SECURITY DEFINER helper functions bypass RLS for membership checks,
-- breaking the circular chain exactly as done for server_members.
-- ============================================================================

-- Helper: checks if a user is ANY member of a family (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_family_member(p_family_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = p_family_id
    AND user_id = p_user_id
  );
$$;

-- Helper: checks if a user is a parent in a family (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_family_parent(p_family_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = p_family_id
    AND user_id = p_user_id
    AND role = 'parent'
  );
$$;

-- ============================================================================
-- Fix family_members SELECT policy (self-referential recursion)
-- ============================================================================

DROP POLICY IF EXISTS family_members_select ON family_members;

CREATE POLICY family_members_select ON family_members
  FOR SELECT USING (
    public.is_family_member(family_id, auth.uid())
  );

-- ============================================================================
-- Fix family_accounts policies (reference family_members with RLS)
-- ============================================================================

DROP POLICY IF EXISTS family_accounts_select ON family_accounts;

CREATE POLICY family_accounts_select ON family_accounts
  FOR SELECT USING (
    public.is_family_member(id, auth.uid())
  );

DROP POLICY IF EXISTS family_accounts_update ON family_accounts;

CREATE POLICY family_accounts_update ON family_accounts
  FOR UPDATE USING (
    public.is_family_parent(id, auth.uid())
  );

-- ============================================================================
-- Fix family_activity_log policies (reference family_members with RLS)
-- ============================================================================

DROP POLICY IF EXISTS family_activity_log_select ON family_activity_log;

CREATE POLICY family_activity_log_select ON family_activity_log
  FOR SELECT USING (
    public.is_family_member(family_id, auth.uid())
  );

DROP POLICY IF EXISTS family_activity_log_insert ON family_activity_log;

CREATE POLICY family_activity_log_insert ON family_activity_log
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.is_family_parent(family_id, auth.uid())
  );
