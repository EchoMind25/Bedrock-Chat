-- OTP Verifications Table for COPPA-compliant Verifiable Parental Consent
-- COPPA 16 CFR §312.5(b)(2) — "Email plus" method
-- TTL: 15 minutes | Max attempts: 3 | Auto-cleanup: 1 hour
-- OTPs stored as SHA-256(salt + code) — never plaintext

CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- The parent's email being verified (may differ from account email)
  parent_email TEXT NOT NULL,

  -- The parent's user ID (must be authenticated to initiate)
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Hashed OTP: SHA-256(salt + otp_code), hex-encoded
  otp_hash TEXT NOT NULL,

  -- Per-OTP salt (prevents rainbow table attacks)
  otp_salt TEXT NOT NULL,

  -- Verification attempt counter — invalidate after 3
  attempt_count INTEGER NOT NULL DEFAULT 0,

  -- Status
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  is_invalidated BOOLEAN NOT NULL DEFAULT FALSE,

  -- Context for consent record (monitoring level, teen display name, etc.)
  consent_context JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
  verified_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT otp_not_expired CHECK (expires_at > created_at),
  CONSTRAINT attempt_count_valid CHECK (attempt_count >= 0 AND attempt_count <= 3)
);

-- Index for fast lookup by parent email + active status
CREATE INDEX idx_otp_verifications_parent_email
  ON public.otp_verifications(parent_email, is_used, is_invalidated, expires_at);

-- Index for parent user ID lookup (rate limiting checks)
CREATE INDEX idx_otp_verifications_parent_user
  ON public.otp_verifications(parent_user_id, created_at);

-- RLS: Parents can only read their own OTP records
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can read own OTP verifications"
  ON public.otp_verifications
  FOR SELECT
  USING (auth.uid() = parent_user_id);

-- Only service role can insert/update (via API routes)

-- Cleanup function: delete expired/used OTPs older than 1 hour
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.otp_verifications
  WHERE (expires_at < now() - INTERVAL '1 hour')
     OR (is_used = TRUE AND verified_at < now() - INTERVAL '1 hour');
END;
$$;

-- Add otp_verification_id column to parental_consent table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'parental_consent'
    AND column_name = 'otp_verification_id'
  ) THEN
    ALTER TABLE public.parental_consent
    ADD COLUMN otp_verification_id UUID REFERENCES public.otp_verifications(id);
  END IF;
END $$;

-- Add consent_version column to parental_consent table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'parental_consent'
    AND column_name = 'consent_version'
  ) THEN
    ALTER TABLE public.parental_consent
    ADD COLUMN consent_version TEXT DEFAULT '2.0.0';
  END IF;
END $$;

COMMENT ON TABLE public.otp_verifications IS
  'Stores hashed OTPs for COPPA-compliant verifiable parental consent (16 CFR §312.5).
   OTPs expire after 15 minutes and are invalidated after 3 failed attempts.
   Records are cleaned up after 1 hour per data minimization requirements.';
