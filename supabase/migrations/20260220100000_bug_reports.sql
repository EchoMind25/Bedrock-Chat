-- Bug Reports: Centralized bug reporting for all Bedrock AI products
-- Products: bedrock-chat, quoteflow, echosafe (future)

-- ── Table ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product TEXT NOT NULL,                    -- 'bedrock-chat', 'quoteflow', 'echosafe', etc.
  description TEXT NOT NULL,
  steps_to_reproduce TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('blocker', 'major', 'minor')),
  console_errors TEXT,                      -- user-pasted console errors, nullable
  screenshot_url TEXT,                      -- Supabase Storage URL, nullable
  current_route TEXT,
  app_version TEXT,
  user_agent TEXT,
  viewport TEXT,
  user_id UUID,                             -- nullable for anonymous submissions
  username TEXT,                            -- nullable
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in-progress', 'resolved', 'wont-fix', 'duplicate')),
  resolution_notes TEXT,                    -- team can add notes when resolving
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────────────
CREATE INDEX idx_bug_reports_product ON bug_reports(product);
CREATE INDEX idx_bug_reports_status ON bug_reports(status);
CREATE INDEX idx_bug_reports_severity ON bug_reports(severity);
CREATE INDEX idx_bug_reports_created ON bug_reports(created_at DESC);

-- ── RLS ────────────────────────────────────────────────────────────────
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Anyone (authenticated OR anonymous) can submit a bug report.
-- The API route handles insertion via service role, so this policy is a safety net.
CREATE POLICY "Anyone can submit bug reports"
  ON bug_reports FOR INSERT
  WITH CHECK (true);

-- Only the Bedrock AI team can view all bug reports
CREATE POLICY "Team can view all bug reports"
  ON bug_reports FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'braxton@bedrockai.systems'
    )
  );

-- Only the Bedrock AI team can update bug reports (status, resolution, etc.)
CREATE POLICY "Team can update bug reports"
  ON bug_reports FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'braxton@bedrockai.systems'
    )
  );

-- ── Storage bucket ─────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bug-screenshots',
  'bug-screenshots',
  false,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Upload: authenticated users can upload screenshots
CREATE POLICY "Authenticated users can upload bug screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'bug-screenshots');

-- Download: only team can view screenshots
CREATE POLICY "Team can view bug screenshots"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'bug-screenshots'
    AND auth.jwt() ->> 'email' IN ('braxton@bedrockai.systems')
  );
