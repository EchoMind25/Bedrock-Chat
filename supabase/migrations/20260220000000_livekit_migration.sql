-- ============================================================
-- Bedrock Chat: LiveKit Migration (replaces Daily.co)
-- All changes are metadata-only — gamer code compliant
-- ZERO audio recording, ZERO video recording, ZERO transcription
-- ============================================================

-- 1. Rename daily_room_name to livekit_room_name in voice_sessions
ALTER TABLE voice_sessions
  RENAME COLUMN daily_room_name TO livekit_room_name;

-- 2. Add capabilities_granted to voice_sessions if not present
ALTER TABLE voice_sessions
  ADD COLUMN IF NOT EXISTS capabilities_granted JSONB NOT NULL DEFAULT '{"audio":true,"video":false,"screen_share":false}';

-- 3. Add voice type tracking if not present
ALTER TABLE voice_sessions
  ADD COLUMN IF NOT EXISTS call_type TEXT DEFAULT 'voice' CHECK (call_type IN ('voice', 'video', 'voice_only'));

-- 4. Add voice_participant_log (granular event log for family monitoring)
CREATE TABLE IF NOT EXISTS voice_participant_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event TEXT NOT NULL CHECK (event IN ('join', 'leave')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  livekit_room_name TEXT NOT NULL,
  had_video BOOLEAN NOT NULL DEFAULT false,
  had_screen_share BOOLEAN NOT NULL DEFAULT false,
  participant_identity TEXT NOT NULL
);

-- 5. Create direct_calls table (net-new — DM voice/video calls)
CREATE TABLE IF NOT EXISTS direct_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  callee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ringing'
    CHECK (status IN ('ringing', 'active', 'ended', 'missed', 'declined')),
  livekit_room_name TEXT NOT NULL UNIQUE,
  call_type TEXT NOT NULL DEFAULT 'voice' CHECK (call_type IN ('voice', 'video')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN ended_at IS NOT NULL AND answered_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (ended_at - answered_at))::INTEGER
      ELSE NULL
    END
  ) STORED,
  caller_had_video BOOLEAN DEFAULT false,
  callee_had_video BOOLEAN DEFAULT false,
  -- No message_content, no media, no recordings — metadata only
  CONSTRAINT no_self_call CHECK (caller_id != callee_id)
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_voice_participant_log_channel
  ON voice_participant_log(channel_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_voice_participant_log_user
  ON voice_participant_log(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_direct_calls_callee_ringing
  ON direct_calls(callee_id, status) WHERE status = 'ringing';

CREATE INDEX IF NOT EXISTS idx_direct_calls_participants
  ON direct_calls(caller_id, callee_id);

-- 7. RLS on voice_participant_log
ALTER TABLE voice_participant_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_voice_logs" ON voice_participant_log
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "parents_view_family_voice_logs" ON voice_participant_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      JOIN family_accounts fa ON fa.id = fm.family_id
      WHERE fa.parent_id = auth.uid()
      AND fm.user_id = voice_participant_log.user_id
    )
  );

-- 8. RLS on direct_calls
ALTER TABLE direct_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "call_participants_access" ON direct_calls
  FOR ALL USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY "parents_view_teen_calls" ON direct_calls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      JOIN family_accounts fa ON fa.id = fm.family_id
      WHERE fa.parent_id = auth.uid()
      AND (fm.user_id = direct_calls.caller_id OR fm.user_id = direct_calls.callee_id)
    )
  );

-- 9. Enable Realtime on direct_calls for incoming call notifications
ALTER PUBLICATION supabase_realtime ADD TABLE direct_calls;

-- 10. Family voice activity view (used by parent dashboard)
CREATE OR REPLACE VIEW family_voice_activity AS
SELECT
  vpl.id,
  vpl.channel_id,
  vpl.user_id,
  p.display_name,
  p.avatar_url,
  vpl.event,
  vpl.timestamp,
  vpl.had_video,
  vpl.had_screen_share,
  c.name AS channel_name,
  s.name AS server_name
FROM voice_participant_log vpl
LEFT JOIN profiles p ON p.id = vpl.user_id
LEFT JOIN channels c ON c.id = vpl.channel_id
LEFT JOIN servers s ON s.id = c.server_id;
