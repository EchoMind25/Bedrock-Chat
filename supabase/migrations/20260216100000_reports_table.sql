CREATE TABLE IF NOT EXISTS reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid NOT NULL REFERENCES auth.users(id),
  message_id uuid NOT NULL,
  channel_id uuid NOT NULL,
  server_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN (
    'csam', 'harassment', 'spam', 'hate_speech',
    'violence', 'self_harm', 'impersonation', 'other'
  )),
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'reviewing', 'resolved', 'escalated'
  )),
  message_content_snapshot text NOT NULL,
  message_author_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  resolution text
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (reporter_id = auth.uid());

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reason ON reports(reason);
CREATE INDEX idx_reports_created ON reports(created_at DESC);
