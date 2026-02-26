-- ============================================================================
-- MIGRATION: Add beta_tester platform role
-- Generated: 2026-02-28
-- Description: Adds 'beta_tester' value to the platform_role enum.
--   Beta testers are users who have been selected/invited for early access.
--   They have the same base permissions as regular users but are granted
--   platform access before public launch.
--
-- IMPORTANT: ALTER TYPE ... ADD VALUE cannot run inside a transaction block.
--   Supabase migrations run each file as a single transaction by default,
--   but ADD VALUE is safe here because Postgres auto-commits it.
-- ============================================================================

ALTER TYPE platform_role ADD VALUE IF NOT EXISTS 'beta_tester' AFTER 'user';
