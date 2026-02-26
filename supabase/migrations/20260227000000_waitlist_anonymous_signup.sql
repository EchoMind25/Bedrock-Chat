-- Migration: Anonymous signup support + waitlist system
-- Adds has_email flag to profiles, waitlist_status column,
-- and a separate waitlist_signups table for landing page email collection.

-- ── 1. Add has_email column to profiles ─────────────────────────────────────
-- Distinguishes real emails from generated placeholders ({username}@anonymous.bedrock.local)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS has_email BOOLEAN NOT NULL DEFAULT true;

-- ── 2. Add waitlist_status column to profiles ───────────────────────────────
-- Gates access to the main app during beta period.
-- 'pending'  = default for new signups, waiting for approval
-- 'approved' = manually approved by super_admin
-- 'bypassed' = super_admin or special access
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS waitlist_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (waitlist_status IN ('pending', 'approved', 'bypassed'));

-- Index for admin queries: efficiently find all pending users
CREATE INDEX IF NOT EXISTS idx_profiles_waitlist_status
  ON profiles(waitlist_status)
  WHERE waitlist_status = 'pending';

-- ── 3. Set existing super_admin users to 'bypassed' ────────────────────────
UPDATE profiles
  SET waitlist_status = 'bypassed'
  WHERE platform_role = 'super_admin';

-- ── 4. Waitlist signups table (landing page email collection) ───────────────
-- Separate from auth users — these are people who haven't signed up yet.
-- They just gave their email on the landing page to be notified at launch.
-- Post-launch, these rows get deleted per the privacy promise.
CREATE TABLE IF NOT EXISTS waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Track if this email was later used for account creation
  converted BOOLEAN NOT NULL DEFAULT false,
  converted_at TIMESTAMPTZ,
  -- Case-insensitive unique constraint on email
  CONSTRAINT waitlist_signups_email_unique UNIQUE (email)
);

-- Create a unique index on lowercased email for case-insensitive lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_signups_email_lower
  ON waitlist_signups (LOWER(email));

-- RLS: No client-side access. All operations through API routes + service role.
ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;
-- No policies = no client access via anon/authenticated roles.
