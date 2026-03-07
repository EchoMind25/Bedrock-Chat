-- Migration: Add activity sharing columns to user_presence
-- Supports game activity detection for Tauri desktop client.
--
-- Privacy model:
-- - activity_sharing_enabled defaults to false (opt-in)
-- - current_activity is the display name of a detected game (from allowlist)
-- - RLS ensures users can only write their own activity
-- - Mutual friends with sharing enabled can read each other's activity
-- - Parents can read teen's activity per monitoring level

-- Add activity columns to user_presence (create table if not exists)
CREATE TABLE IF NOT EXISTS user_presence (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'offline',
    last_seen TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_presence
ADD COLUMN IF NOT EXISTS current_activity TEXT,
ADD COLUMN IF NOT EXISTS activity_sharing_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS activity_updated_at TIMESTAMPTZ;

-- Index for querying active gamers
CREATE INDEX IF NOT EXISTS idx_user_presence_activity
ON user_presence (current_activity)
WHERE current_activity IS NOT NULL;

-- RLS policies
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own presence
CREATE POLICY IF NOT EXISTS "Users can manage own presence"
ON user_presence
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can read presence of others (status, activity for friends with sharing)
-- Activity is filtered in application code for mutual friendship + sharing check
CREATE POLICY IF NOT EXISTS "Users can read others presence"
ON user_presence
FOR SELECT
USING (true);

-- Activity sharing audit log (for COPPA/transparency compliance)
CREATE TABLE IF NOT EXISTS activity_sharing_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity TEXT NOT NULL,
    shared_at TIMESTAMPTZ DEFAULT now(),
    viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    context TEXT -- 'presence_update', 'parent_view', 'friend_view'
);

ALTER TABLE activity_sharing_log ENABLE ROW LEVEL SECURITY;

-- Users can insert their own log entries
CREATE POLICY IF NOT EXISTS "Users can log own activity shares"
ON activity_sharing_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can read their own log
CREATE POLICY IF NOT EXISTS "Users can read own activity log"
ON activity_sharing_log
FOR SELECT
USING (auth.uid() = user_id);

-- Parents can read teen's activity log (via family_accounts relationship)
CREATE POLICY IF NOT EXISTS "Parents can read teen activity log"
ON activity_sharing_log
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM family_accounts fa
        WHERE fa.parent_id = auth.uid()
        AND fa.teen_id = activity_sharing_log.user_id
    )
);

-- Parents can also read teen's presence (including activity)
CREATE POLICY IF NOT EXISTS "Parents can read teen presence"
ON user_presence
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM family_accounts fa
        WHERE fa.parent_id = auth.uid()
        AND fa.teen_id = user_presence.user_id
    )
);
